import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { Btn, PageHeader, Pill, StanceBar } from '../components/shared';
import { Comments } from '../components/Comments';
import { COPY } from '../lib/copy';
import { canCommit, getPhaseInfo } from '../lib/phase';
import type { Database } from '../types/db';

type Issue = Database['public']['Tables']['issues']['Row'];
type Judgment = Database['public']['Tables']['judgments']['Row'];

export function IssueDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [myJudgment, setMyJudgment] = useState<Judgment | null>(null);
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
  const decision = canCommit(issue, !!myJudgment);
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
                {!myJudgment.counts_toward_rank && ' · 围观'}
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
            {!decision.countsTowardRank && (
              <div
                style={{
                  fontSize: 12,
                  color: TOKENS.pendingFg,
                  background: TOKENS.pendingTint,
                  padding: '8px 12px',
                  borderRadius: 10,
                }}
              >
                {COPY.lateNotice}
              </div>
            )}
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

        <Comments target={{ type: 'issue', id: issue.id }} />
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: 999,
          background: '#fff',
          border: `1px solid ${TOKENS.warm200}`,
          color: TOKENS.warm700,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: TOKENS.fontSans,
        }}
      >
        ‹ 返回首页
      </button>
    </div>
  );
}
