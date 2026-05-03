import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { PageHeader, Avatar } from '../components/shared';
import { COPY } from '../lib/copy';

interface NotifData {
  user_id: string;
  notifications_seen_at: string;
  new_likes: number;
  new_comments: number;
  new_followers: number;
  new_settlements: number;
  total_likes: number;
  total_post_comments: number;
  total_followers: number;
  total_correct: number;
}

interface ActivityRow {
  id: string;
  kind: string;
  actor_id: string | null;
  is_correct: boolean | null;
  created_at: string;
  actor?: { name: string; avatar_url: string | null; avatar_tint: string | null } | null;
  post?: { title: string } | null;
  issue?: { title: string } | null;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return '刚刚';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小时前`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

function trunc(s: string | undefined | null, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function activityText(row: ActivityRow): string {
  const actorName = row.actor?.name ?? '有人';
  switch (row.kind) {
    case 'like':
      return `${actorName} 赞了你的观点「${trunc(row.post?.title, 20)}」`;
    case 'comment':
      return `${actorName} 评论了你的「${trunc(row.post?.title ?? row.issue?.title, 20)}」`;
    case 'follow':
      return `${actorName} 关注了你`;
    case 'settle':
      return `议题「${trunc(row.issue?.title, 20)}」已结算 · ${row.is_correct ? '✓ 猜对了' : '✕ 看走眼'}`;
    case 'issue_approved':
      return `你的议题「${row.issue?.title ?? ''}」已通过审核`;
    case 'issue_rejected':
      return `你的议题「${row.issue?.title ?? ''}」未通过审核`;
    default:
      return `${actorName} 有新动态`;
  }
}

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<NotifData | null>(null);
  const [feed, setFeed] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const [{ data: row }, { data: logs }] = await Promise.all([
        supabase
          .from('user_notifications')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('activity_log')
          .select(
            '*, actor:profiles!activity_log_actor_id_fkey(name,avatar_url,avatar_tint), post:posts(title), issue:issues(title)'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);
      setData(row as NotifData | null);
      setFeed((logs as ActivityRow[]) ?? []);
      setLoading(false);
      // Mark seen
      await supabase.rpc('mark_notifications_seen');
    })();
  }, [user, navigate]);

  if (loading) {
    return <div style={{ padding: 40, color: TOKENS.warm500 }}>{COPY.loading}</div>;
  }
  if (!data) {
    return <div style={{ padding: 40, color: TOKENS.warm500 }}>暂无数据</div>;
  }

  const totalNew =
    data.new_likes + data.new_comments + data.new_followers + data.new_settlements;

  const showActor = (kind: string) => !['settle', 'issue_approved', 'issue_rejected'].includes(kind);

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="消息" back onBack={() => navigate('/me')} />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1A73E8 0%, #4A90E2 100%)',
            borderRadius: 20,
            padding: 22,
            color: '#fff',
            boxShadow: TOKENS.shadowMd,
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.9 }}>自上次查看</div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              marginTop: 4,
            }}
          >
            {totalNew}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>条新动静</div>
        </div>

        {/* Activity feed */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: TOKENS.shadowSm,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: TOKENS.warm700,
              padding: '14px 16px 10px',
              borderBottom: `1px solid ${TOKENS.warm100}`,
            }}
          >
            最新动态
          </div>

          {feed.length === 0 ? (
            <div
              style={{
                padding: '28px 16px',
                fontSize: 13,
                color: TOKENS.warm500,
                textAlign: 'center',
              }}
            >
              还没有新动态 · 去押题或发帖吧
            </div>
          ) : (
            feed.map((row, i) => (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '11px 16px',
                  borderBottom:
                    i < feed.length - 1 ? `1px solid ${TOKENS.warm100}` : undefined,
                }}
              >
                {/* Avatar — only for actor-based kinds */}
                {showActor(row.kind) && row.actor ? (
                  <Avatar
                    name={row.actor.name.slice(0, 1)}
                    size={28}
                    tint={(row.actor.avatar_tint as any) ?? 'warm'}
                    url={row.actor.avatar_url}
                  />
                ) : (
                  /* placeholder to keep text alignment consistent */
                  <div style={{ width: 28, height: 28, flexShrink: 0 }} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: TOKENS.warm900,
                      lineHeight: 1.45,
                      wordBreak: 'break-all',
                    }}
                  >
                    {activityText(row)}
                  </div>
                  <div style={{ fontSize: 11, color: TOKENS.warm400, marginTop: 3 }}>
                    {relativeTime(row.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stat cards */}
        <Card
          icon="❤️"
          label="收到的赞"
          delta={data.new_likes}
          total={data.total_likes}
          accent={TOKENS.wrong}
        />
        <Card
          icon="💬"
          label="收到的评论"
          delta={data.new_comments}
          total={data.total_post_comments}
          accent={TOKENS.indigo500}
        />
        <Card
          icon="👥"
          label="新增粉丝"
          delta={data.new_followers}
          total={data.total_followers}
          accent={TOKENS.warm700}
        />
        <Card
          icon="🎯"
          label="判断已被验证正确"
          delta={data.new_settlements}
          total={data.total_correct}
          accent={TOKENS.correct}
        />

        <div
          style={{
            fontSize: 12,
            color: TOKENS.warm500,
            textAlign: 'center',
            padding: '14px 8px 0',
          }}
        >
          展示数据为汇总，不显示具体用户，避免互相比较带来的压力。
        </div>
      </div>
    </div>
  );
}

function Card({
  icon,
  label,
  delta,
  total,
  accent,
}: {
  icon: string;
  label: string;
  delta: number;
  total: number;
  accent: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 18,
        boxShadow: TOKENS.shadowSm,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 30 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: TOKENS.warm600 }}>{label}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 2,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: TOKENS.warm900,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {total.toLocaleString()}
          </div>
          {delta > 0 && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: accent,
                background: '#fff',
                padding: '2px 8px',
                borderRadius: 999,
                border: `1px solid ${accent}`,
              }}
            >
              +{delta} 新
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
