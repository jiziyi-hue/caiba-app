import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { PageHeader } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Stats = Database['public']['Views']['admin_stats']['Row'];

export function AdminStatsScreen() {
  const navigate = useNavigate();
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_admin_stats').single();
      if (!error) setS(data as Stats);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 40, color: TOKENS.warm500 }}>{COPY.loading}</div>;
  if (!s) return <div style={{ padding: 40, color: TOKENS.warm500 }}>无法读取数据</div>;

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="数据面板" back onBack={() => navigate('/me')} />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Section title="用户">
          <Stat label="总用户" value={s.total_users ?? 0} />
          <Stat label="今日新增" value={s.new_users_24h ?? 0} accent={TOKENS.indigo500} />
          <Stat label="近7日" value={s.new_users_7d ?? 0} />
          <Stat label="封禁" value={s.banned_users ?? 0} accent={(s.banned_users ?? 0) > 0 ? TOKENS.wrong : undefined} />
        </Section>

        <Section title="议题">
          <Stat label="总议题（已上架）" value={s.total_issues ?? 0} />
          <Stat label="开放中" value={s.open_issues ?? 0} accent={TOKENS.indigo500} />
          <Stat label="待审核" value={s.pending_review ?? 0} accent={(s.pending_review ?? 0) > 0 ? TOKENS.pendingFg : undefined} />
          <Stat label="已结算" value={s.settled_issues ?? 0} />
        </Section>

        <Section title="活跃（今日）">
          <Stat label="表态" value={s.judgments_24h ?? 0} accent={TOKENS.indigo500} />
          <Stat label="计段位" value={s.ranked_judgments_24h ?? 0} />
          <Stat label="发帖" value={s.posts_24h ?? 0} />
          <Stat label="评论" value={s.comments_24h ?? 0} />
        </Section>

        <Section title="累计">
          <Stat label="总表态" value={(s.total_judgments ?? 0).toLocaleString()} />
          <Stat label="总帖子" value={(s.total_posts ?? 0).toLocaleString()} />
          <Stat label="总评论" value={(s.total_comments ?? 0).toLocaleString()} />
          <Stat
            label="平台准确率"
            value={s.overall_accuracy_pct != null ? `${s.overall_accuracy_pct}%` : '—'}
            accent={TOKENS.correct}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: TOKENS.warm600,
          marginBottom: 8,
          padding: '0 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 14,
          boxShadow: TOKENS.shadowSm,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div style={{ padding: '8px 4px' }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: accent ?? TOKENS.warm900,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: TOKENS.warm500, marginTop: 2 }}>{label}</div>
    </div>
  );
}
