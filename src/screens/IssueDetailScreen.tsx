import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { Btn, PageHeader, Pill, PostCard, StanceBar, type PostCardData } from '../components/shared';
import { Comments } from '../components/Comments';
import { COPY } from '../lib/copy';
import { canCommit, getPhaseInfo } from '../lib/phase';
import type { Database } from '../types/db';

type Issue = Database['public']['Tables']['issues']['Row'];
type Judgment = Database['public']['Tables']['judgments']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface JoinedPost extends Post {
  author: Pick<Profile, 'name' | 'avatar_tint' | 'avatar_url' | 'is_admin'>;
}

export function IssueDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [myJudgment, setMyJudgment] = useState<Judgment | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<JoinedPost[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!id) return;
    const { data: iss } = await supabase.from('issues').select('*').eq('id', id).single();
    setIssue(iss);
    if (user && iss) {
      const { data: jdg } = await supabase
        .from('judgments')
        .select('*')
        .eq('issue_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      setMyJudgment(jdg);
    }
    const { data: posts } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(name,avatar_tint,avatar_url,is_admin)')
      .eq('issue_id', id)
      .order('upvotes', { ascending: false })
      .limit(5);
    setRelatedPosts((posts ?? []) as JoinedPost[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  async function commit(stance: boolean) {
    if (!issue) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (myJudgment) {
        const { error: e } = await supabase
          .from('judgments')
          .update({ stance })
          .eq('id', myJudgment.id);
        if (e) throw e;
      } else {
        // INSERT — counts_toward_rank set by trigger; first_committed_at by trigger
        const { error: e } = await supabase.from('judgments').insert({
          user_id: user.id,
          issue_id: issue.id,
          stance,
          counts_toward_rank: false, // overwritten by trigger
        });
        if (e) throw e;
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (!issue) {
    return (
      <div style={{ padding: 40, color: TOKENS.warm500, fontFamily: TOKENS.fontSans }}>
        {COPY.loading}
      </div>
    );
  }

  const phaseInfo = getPhaseInfo(issue);
  const decision = canCommit(issue);
  const settled = issue.status === 'correct' || issue.status === 'wrong';

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 80 }}>
      <PageHeader title="议题详情" back onBack={() => navigate(-1)} />

      <div style={{ padding: '8px 16px 0' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 20,
            boxShadow: TOKENS.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill kind="indigo" size="sm">
              {issue.category}
            </Pill>
            <Pill kind={phaseInfo.chipKind} size="sm">
              {phaseInfo.chipText}
            </Pill>
            {myJudgment && (
              <Pill kind={myJudgment.stance ? 'support' : 'oppose'} size="sm">
                你已{myJudgment.stance ? '支持' : '反对'}
              </Pill>
            )}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: TOKENS.warm900,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            {issue.title}
          </div>
          {issue.description && (
            <div style={{ fontSize: 14, color: TOKENS.warm700, lineHeight: 1.65 }}>
              {issue.description}
            </div>
          )}
          <div style={{ fontSize: 12, color: TOKENS.warm500 }}>{phaseInfo.subText}</div>
          <StanceBar
            supportPct={issue.total_pct_cache ?? 0}
            total={issue.total_count_cache ?? 0}
            rankedCount={issue.ranked_count_cache ?? 0}
          />
        </div>

        {/* Stance commit panel */}
        {!settled && decision.allowed && (
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 20,
              boxShadow: TOKENS.shadowSm,
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: TOKENS.warm800 }}>
              {COPY.yourTake}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn
                kind="support"
                size="lg"
                disabled={submitting}
                onClick={() => commit(true)}
                style={{ flex: 1 }}
              >
                {COPY.supportBtn}
              </Btn>
              <Btn
                kind="oppose"
                size="lg"
                disabled={submitting}
                onClick={() => commit(false)}
                style={{ flex: 1 }}
              >
                {COPY.opposeBtn}
              </Btn>
            </div>
            {myJudgment && (
              <div style={{ fontSize: 12, color: TOKENS.warm500, textAlign: 'center' }}>
                {COPY.stanceCommitNote} · 已改 {myJudgment.change_count} 次
              </div>
            )}
            {error && (
              <div
                style={{
                  fontSize: 13,
                  color: TOKENS.wrong,
                  background: TOKENS.wrongTint,
                  padding: '10px 12px',
                  borderRadius: 10,
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {!decision.allowed && !settled && (
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 16,
              boxShadow: TOKENS.shadowSm,
              marginTop: 14,
              fontSize: 14,
              color: TOKENS.warm600,
            }}
          >
            {decision.reason}
          </div>
        )}

        {settled && (
          <div
            style={{
              background:
                issue.status === 'correct' ? TOKENS.correctTint : TOKENS.wrongTint,
              borderRadius: 20,
              padding: 20,
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: issue.status === 'correct' ? TOKENS.correct : TOKENS.wrong,
              }}
            >
              {issue.status === 'correct' ? '✓ 支持方对' : '✕ 反对方对'}
            </div>
            {issue.settlement_source && (
              <div style={{ fontSize: 12, color: TOKENS.warm600, marginTop: 8 }}>
                来源：{issue.settlement_source}
              </div>
            )}
            {myJudgment && myJudgment.is_correct && myJudgment.counts_toward_rank && (
              <Btn
                kind="primary"
                size="md"
                onClick={() => navigate(`/share/${myJudgment.id}`)}
                style={{ marginTop: 14 }}
              >
                生成「我早就说过」分享卡
              </Btn>
            )}
          </div>
        )}

        {/* 相关观点 */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '0 4px 12px',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: TOKENS.warm800 }}>
                相关观点
              </div>
              <div style={{ fontSize: 12, color: TOKENS.warm500 }}>
                {relatedPosts.length} 条
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relatedPosts.map((p) => {
                const card: PostCardData = {
                  id: p.id,
                  title: p.title,
                  excerpt: extractExcerpt(p.content),
                  issue: null,
                  stance: p.stance == null ? null : p.stance ? 'support' : 'oppose',
                  verified: (p.verified_status ?? null) as 'correct' | 'wrong' | null,
                  author: {
                    name: p.author.name,
                    accuracy: 0,
                    tint: (p.author.avatar_tint as 'indigo') ?? 'warm',
                    avatarUrl: p.author.avatar_url,
                  },
                  upvotes: p.upvotes ?? 0,
                  comments: p.comment_count ?? 0,
                };
                return (
                  <PostCard key={p.id} post={card} onOpen={() => navigate(`/post/${p.id}`)} />
                );
              })}
            </div>
          </div>
        )}

        <Comments target={{ type: 'issue', id: issue.id }} />
      </div>

    </div>
  );
}

function extractExcerpt(content: unknown): string {
  if (typeof content === 'string') return content.slice(0, 140);
  if (Array.isArray(content)) {
    return content
      .filter((b: unknown) => (b as { type?: string }).type === 'text')
      .map((b: unknown) => (b as { value?: string }).value || '')
      .join(' ')
      .slice(0, 140);
  }
  return '';
}

