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
import { useUnreadCount } from '../lib/notifications';
import { ISSUE_CATEGORIES } from '../lib/categories';
import { COPY } from '../lib/copy';
import { daysLeft } from '../lib/phase';
import type { Database } from '../types/db';

type Issue = Database['public']['Tables']['issues']['Row'];
type Judgment = Database['public']['Tables']['judgments']['Row'];

const FILTERS = ['全部', ...ISSUE_CATEGORIES] as const;
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

  // 时事 hero data — most engaged + closest to deadline
  const newsIssues = issues.filter((i) => i.category === '时事' && i.status === 'pending');
  const hottest = [...newsIssues].sort((a, b) => (b.total_count_cache ?? 0) - (a.total_count_cache ?? 0))[0];
  const closest = [...newsIssues].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )[0];
  const showHero = filter === '时事' && (hottest || closest);
  const heroIds = new Set([hottest?.id, closest?.id].filter(Boolean));
  const listed = filter === '时事' ? visible.filter((i) => !heroIds.has(i.id)) : visible;
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
            : user
            ? `共 ${issues.length} 条 · 你已表态 ${myJudgments.size} 条`
            : `共 ${issues.length} 条 · 登录后即可表态`
        }
        action={
          user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BellButton onClick={() => navigate('/notifications')} userId={user.id} />
              <button
                type="button"
                onClick={() => navigate('/me')}
                style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                aria-label="去个人主页"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover' }}
                  />
                ) : (
                  <Avatar
                    name={profile?.name?.[0] ?? '你'}
                    size={36}
                    tint={(profile?.avatar_tint as 'indigo') ?? 'indigo'}
                  />
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                background: TOKENS.indigo500,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: TOKENS.fontSans,
              }}
            >
              登录
            </button>
          )
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

      {/* 时事 hero band */}
      {showHero && (
        <div style={{ padding: '0 16px 14px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1F2937 0%, #0F172A 100%)',
              borderRadius: 20,
              padding: 18,
              color: '#fff',
              boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: '#F87171',
                  boxShadow: '0 0 0 3px rgba(248,113,113,0.25)',
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#FCA5A5',
                  fontFamily: TOKENS.fontMono,
                  textTransform: 'uppercase',
                }}
              >
                时事 · 实时关注
              </div>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  fontSize: 10,
                  color: '#94A3B8',
                  fontFamily: TOKENS.fontMono,
                }}
              >
                {newsIssues.length} 条议题
              </div>
            </div>
            {hottest && (
              <div
                onClick={() => navigate(`/issue/${hottest.id}`)}
                style={{
                  cursor: 'pointer',
                  paddingBottom: closest && closest.id !== hottest.id ? 14 : 0,
                  borderBottom:
                    closest && closest.id !== hottest.id ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: '#94A3B8',
                    fontWeight: 600,
                    fontFamily: TOKENS.fontMono,
                    marginBottom: 6,
                  }}
                >
                  🔥 最热
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.4,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {hottest.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 10,
                    fontSize: 12,
                    color: '#CBD5E1',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    支持{' '}
                    <span style={{ color: '#60A5FA' }}>{hottest.total_pct_cache ?? 0}%</span>
                  </span>
                  <span style={{ color: '#475569' }}>·</span>
                  <span>{(hottest.total_count_cache ?? 0).toLocaleString()} 人参与</span>
                  <span style={{ color: '#475569' }}>·</span>
                  <span>
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(hottest.deadline).getTime() - Date.now()) / 86400000
                      )
                    )}{' '}
                    天后结算
                  </span>
                </div>
              </div>
            )}
            {closest && closest.id !== hottest?.id && (
              <div onClick={() => navigate(`/issue/${closest.id}`)} style={{ cursor: 'pointer', paddingTop: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#94A3B8',
                    fontWeight: 600,
                    fontFamily: TOKENS.fontMono,
                    marginBottom: 6,
                  }}
                >
                  ⏱ 距结算最近
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', lineHeight: 1.4 }}>
                  {closest.title}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? null : listed.length === 0 && !showHero ? (
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
          listed.map((i) => (
            <IssueCard key={i.id} issue={cardData(i)} onOpen={() => navigate(`/issue/${i.id}`)} />
          ))
        )}
      </div>

      <TabBar
        active="议题"
        onTabChange={(t) =>
          navigate(t === '广场' ? '/square' : t === '我' ? (user ? '/me' : '/login') : '/')
        }
      />
    </div>
  );
}

function BellButton({ onClick, userId }: { onClick: () => void; userId: string }) {
  const count = useUnreadCount(userId);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="消息"
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        borderRadius: 999,
        background: TOKENS.warm50,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
      }}
    >
      🔔
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: TOKENS.wrong,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
