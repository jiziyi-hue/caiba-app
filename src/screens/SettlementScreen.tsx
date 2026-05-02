import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { Avatar, Btn, PageHeader } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Judgment = Database['public']['Tables']['judgments']['Row'];
type Issue = Database['public']['Tables']['issues']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface JoinedJudgment extends Judgment {
  issue: Issue;
  user: Profile;
}

export function SettlementScreen() {
  const { judgmentId } = useParams<{ judgmentId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<JoinedJudgment | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!judgmentId) return;
    (async () => {
      const { data: j } = await supabase
        .from('judgments')
        .select('*, issue:issues(*), user:profiles(*)')
        .eq('id', judgmentId)
        .single();
      setData(j as JoinedJudgment);
    })();
  }, [judgmentId]);

  async function download() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const png = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#fff' });
      const a = document.createElement('a');
      a.href = png;
      a.download = `caiba-${data?.issue.id ?? 'card'}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div style={{ padding: 40, color: TOKENS.warm500, fontFamily: TOKENS.fontSans }}>
        {COPY.loading}
      </div>
    );
  }

  const isCorrect = data.is_correct === true;
  const stanceLabel = data.stance ? '支持' : '反对';

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="我早就说过" back onBack={() => navigate(-1)} />

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div
          ref={cardRef}
          style={{
            width: '100%',
            maxWidth: 380,
            background: 'linear-gradient(160deg, #fff 0%, #FBFAF8 100%)',
            borderRadius: 28,
            padding: 36,
            boxShadow: TOKENS.shadowLg,
            border: `1px solid ${TOKENS.warm100}`,
            fontFamily: TOKENS.fontSans,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dotted backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(${TOKENS.warm200} 1px, transparent 1px)`,
              backgroundSize: '14px 14px',
              opacity: 0.04,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              fontSize: 11,
              color: TOKENS.warm500,
              fontFamily: TOKENS.fontMono,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {COPY.brand} · {isCorrect ? 'I CALLED IT' : ''}
          </div>

          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: TOKENS.warm900,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: 18,
            }}
          >
            我早就说过 {isCorrect ? '🎯' : ''}
          </div>

          <div
            style={{
              fontSize: 13,
              color: TOKENS.warm500,
              fontFamily: TOKENS.fontMono,
              letterSpacing: '0.04em',
              marginBottom: 4,
            }}
          >
            {new Date(data.first_committed_at).toLocaleDateString('zh-CN')} · 我押 {stanceLabel}
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: TOKENS.warm800,
              lineHeight: 1.4,
              marginTop: 14,
              marginBottom: 24,
            }}
          >
            {data.issue.title}
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: isCorrect ? TOKENS.correctTint : TOKENS.wrongTint,
              color: isCorrect ? TOKENS.correct : TOKENS.wrong,
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 24,
            }}
          >
            {isCorrect ? '✓ 已验证 · 进入履历' : '✕ 看走眼 · 留作教训'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {data.user.avatar_url ? (
              <img
                src={data.user.avatar_url}
                alt=""
                style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover' }}
              />
            ) : (
              <Avatar name={data.user.name[0] ?? '判'} size={36} tint={(data.user.avatar_tint as 'indigo') ?? 'indigo'} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.warm800 }}>{data.user.name}</div>
              <div style={{ fontSize: 11, color: TOKENS.warm500, fontFamily: TOKENS.fontMono }}>
                @{data.user.handle}
              </div>
            </div>
          </div>
        </div>

        <Btn kind="primary" size="lg" disabled={busy} onClick={download}>
          {busy ? '正在生成…' : COPY.downloadCard}
        </Btn>
      </div>
    </div>
  );
}
