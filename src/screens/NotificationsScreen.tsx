import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { PageHeader } from '../components/shared';
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

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<NotifData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const { data: row } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setData(row as NotifData | null);
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

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="消息" back onBack={() => navigate('/me')} />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
