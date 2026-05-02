import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import {
  Avatar,
  PageHeader,
  IssueCard,
  TabBar,
  type IssueCardData,
} from '../components/shared';
import { useAuth } from '../lib/auth';
import { COPY } from '../lib/copy';
import { daysLeft } from '../lib/phase';
import type { Database } from '../types/db';

type Issue = Database['public']['Tables']['issues']['Row'];
type Judgment = Database['public']['Tables']['judgments']['Row'];

const FILTERS = ['全部', '科技', '时事', '娱乐', '体育'] as const;
type Filter = (typeof FILTERS)[number];

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState<Filter>('全部');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [myJudgments, setMyJudgments] = useState<Map<string, Judgment>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: iss } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setIssues(iss ?? []);
      if (user) {
        const { data: jdg } = await supabase
          .from('judgments')
          .select('*')
          .eq('user_id', user.id);
        const m = new Map<string, Judgment>();
        (jdg ?? []).forEach((j) => m.set(j.issue_id, j));
        setMyJudgments(m);
      }
      setLoading(false);
    })();
  }, [user]);

  const visible = filter === '全部' ? issues : issues.filter((i) => i.category === filter);
  const cardData = (i: Issue): IssueCardData => {
    const j = myJudgments.get(i.id);
    return {
      id: i.id,
      category: i.category,
      title: i.title,
      supportPct: i.total_pct_cache ?? 0,
      total: i.total_count_cache ?? 0,
      rankedCount: i.ranked_count_cache ?? 0,
      friends: 0,
      status: i.status as IssueCardData['status'],
      daysLeft: i.status === 'pending' ? daysLeft(i) : undefined,
      committed: j ? (j.stance ? 'support' : 'oppose') : null,
    };
  };

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 120 }}>
      <PageHeader
        title={COPY.homeTitle}
        sub={
          loading
            ? COPY.loading
            : `共 ${issues.length} 条 · 你已表态 ${myJudgments.size} 条`
        }
        action={
          <button
            type="button"
            onClick={() => navigate('/me')}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
            }}
            aria-label="去个人主页"
          >
            <Avatar
              name={profile?.name?.[0] ?? '你'}
              size={36}
              tint={(profile?.avatar_tint as 'indigo') ?? 'indigo'}
            />
          </button>
        }
      />

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: TOKENS.warm25,
          padding: '10px 16px 14px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 999,
              border: 'none',
              background: filter === f ? TOKENS.warm800 : '#fff',
              color: filter === f ? '#fff' : TOKENS.warm700,
              boxShadow: filter === f ? 'none' : `inset 0 0 0 1px ${TOKENS.warm100}`,
              cursor: 'pointer',
              fontFamily: TOKENS.fontSans,
              whiteSpace: 'nowrap',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? null : visible.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              color: TOKENS.warm500,
              boxShadow: TOKENS.shadowSm,
            }}
          >
            {COPY.emptyHome}
          </div>
        ) : (
          visible.map((i) => (
            <IssueCard key={i.id} issue={cardData(i)} onOpen={() => navigate(`/issue/${i.id}`)} />
          ))
        )}
      </div>

      <TabBar active="议题" onTabChange={(t) => navigate(t === '广场' ? '/square' : t === '我' ? '/me' : '/')} />
    </div>
  );
}
