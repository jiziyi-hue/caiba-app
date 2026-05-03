import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { Avatar, Btn, PageHeader, Pill, TabBar } from '../components/shared';
import { RankBadge } from '../components/RankBadge';
import { getRank, BOARD_TINTS, type Board } from '../lib/ranks';
import { useFollowCounts, useIsFollowing } from '../lib/follows';
import { useUnreadCount } from '../lib/notifications';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Judgment = Database['public']['Tables']['judgments']['Row'];
type Issue = Database['public']['Tables']['issues']['Row'];

interface AccuracyRow {
  user_id: string;
  category: string;
  settled_total: number | null;
  correct_total: number | null;
  accuracy_pct: number | null;
}

const SCOPES: Board[] = ['通用', '时事', '科技', '娱乐', '体育', '游戏'];
const SETTLEMENT_THRESHOLD = 5;

const HISTORY_FILTERS = [
  { id: 'all' as const, label: '全部' },
  { id: 'correct' as const, label: '✓ 猜对' },
  { id: 'wrong' as const, label: '✕ 看走眼' },
  { id: 'pending' as const, label: '待结算' },
];

const HISTORY_PREDICATES: Record<string, (h: { is_correct: boolean | null }) => boolean> = {
  all: () => true,
  pending: (h) => h.is_correct == null,
  correct: (h) => h.is_correct === true,
  wrong: (h) => h.is_correct === false,
};

export function ProfileScreen() {
  const { handle: handleParam } = useParams<{ handle?: string }>();
  const { profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accuracyMap, setAccuracyMap] = useState<Map<string, AccuracyRow>>(new Map());
  const [history, setHistory] = useState<Array<Judgment & { issue: Issue }>>([]);
  const [scope, setScope] = useState<Board>('通用');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'correct' | 'wrong' | 'pending'>('all');
  const [loading, setLoading] = useState(true);

  const isOwn = !handleParam || handleParam === myProfile?.handle;
  const { counts } = useFollowCounts(profile?.id ?? null);
  const { following, toggle: toggleFollow } = useIsFollowing(
    profile?.id ?? null,
    myProfile?.id ?? null
  );

  useEffect(() => {
    (async () => {
      const targetProfile = isOwn
        ? myProfile
        : (
            await supabase.from('profiles').select('*').eq('handle', handleParam!).maybeSingle()
          ).data;
      if (!targetProfile) {
        setLoading(false);
        return;
      }
      setProfile(targetProfile);

      const { data: accs } = await supabase
        .from('user_accuracy')
        .select('*')
        .eq('user_id', targetProfile.id);
      const m = new Map<string, AccuracyRow>();
      (accs ?? []).forEach((a) => m.set((a.category ?? 'all') as string, a as AccuracyRow));
      setAccuracyMap(m);

      const { data: jdgs } = await supabase
        .from('judgments')
        .select('*, issue:issues(*)')
        .eq('user_id', targetProfile.id)
        .order('committed_at', { ascending: false })
        .limit(50);
      setHistory((jdgs ?? []) as Array<Judgment & { issue: Issue }>);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleParam, myProfile?.id]);

  if (loading) {
    return (
      <div style={{ padding: 40, color: TOKENS.warm500, fontFamily: TOKENS.fontSans }}>
        {COPY.loading}
      </div>
    );
  }
  if (!profile) {
    return (
      <div style={{ padding: 40, color: TOKENS.warm500, fontFamily: TOKENS.fontSans }}>
        用户不存在
      </div>
    );
  }

  const scopeKey = scope === '通用' ? 'all' : scope;
  const acc = accuracyMap.get(scopeKey);
  const accuracyPct = acc?.accuracy_pct ?? null;
  const settledTotal = Number(acc?.settled_total ?? 0);
  const correctTotal = Number(acc?.correct_total ?? 0);
  const rank = getRank(accuracyPct);

  const filteredHistory = useMemo(
    () => history.filter(HISTORY_PREDICATES[historyFilter] ?? (() => true)),
    [history, historyFilter]
  );

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 120 }}>
      <PageHeader
        title={isOwn ? '我的判断力' : profile.name}
        back={!isOwn}
        onBack={() => navigate(-1)}
        action={
          isOwn ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {myProfile && <ProfileBell userId={myProfile.id} onOpen={() => navigate('/notifications')} />}
              {myProfile?.is_admin && (
                <>
                  <Btn kind="primary" size="sm" onClick={() => navigate('/admin/settle?new=1')}>
                    新议题
                  </Btn>
                  <Btn kind="ghost" size="sm" onClick={() => navigate('/admin/settle')}>
                    结算
                  </Btn>
                  <Btn kind="ghost" size="sm" onClick={() => navigate('/admin/moderation')}>
                    审核
                  </Btn>
                  <Btn kind="ghost" size="sm" onClick={() => navigate('/admin/stats')}>
                    数据
                  </Btn>
                </>
              )}
              {!myProfile?.is_admin && (
                <Btn kind="secondary" size="sm" onClick={() => navigate('/issue/new')}>
                  投稿
                </Btn>
              )}
              <Btn kind="secondary" size="sm" onClick={() => navigate('/me/edit')}>
                编辑
              </Btn>
            </div>
          ) : myProfile ? (
            <Btn
              kind={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={toggleFollow}
            >
              {following ? '已关注' : '关注'}
            </Btn>
          ) : (
            <Btn kind="primary" size="sm" onClick={() => navigate('/login')}>
              登录后关注
            </Btn>
          )
        }
      />

      <div style={{ padding: '14px 16px 0' }}>
        {/* Identity */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 18,
            boxShadow: TOKENS.shadowSm,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={{ width: 60, height: 60, borderRadius: 999, objectFit: 'cover' }}
            />
          ) : (
            <Avatar
              name={profile.name[0] ?? '判'}
              size={60}
              tint={(profile.avatar_tint as 'indigo') ?? 'indigo'}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: TOKENS.warm900,
                letterSpacing: '-0.01em',
              }}
            >
              {profile.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: TOKENS.warm500,
                fontFamily: TOKENS.fontMono,
                marginTop: 3,
              }}
            >
              @{profile.handle}
            </div>
            {profile.bio && (
              <div style={{ fontSize: 13, color: TOKENS.warm600, marginTop: 6 }}>
                {profile.bio}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: 14,
                marginTop: 8,
                fontSize: 12,
                color: TOKENS.warm600,
              }}
            >
              <span>
                <strong style={{ color: TOKENS.warm900, fontVariantNumeric: 'tabular-nums' }}>
                  {counts.following}
                </strong>{' '}
                关注
              </span>
              <span>
                <strong style={{ color: TOKENS.warm900, fontVariantNumeric: 'tabular-nums' }}>
                  {counts.followers}
                </strong>{' '}
                粉丝
              </span>
            </div>
          </div>
        </div>

        {/* Scope selector */}
        <div
          style={{
            background: TOKENS.warm50,
            borderRadius: 10,
            padding: 3,
            display: 'flex',
            gap: 2,
            marginTop: 14,
          }}
        >
          {SCOPES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: 12.5,
                fontWeight: scope === s ? 700 : 500,
                color: scope === s ? TOKENS.warm900 : TOKENS.warm600,
                background: scope === s ? '#fff' : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: TOKENS.fontSans,
                boxShadow: scope === s ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Onboarding card for new users */}
        {isOwn && settledTotal < SETTLEMENT_THRESHOLD && (
          <div
            onClick={() => navigate('/')}
            style={{
              marginTop: 12,
              padding: '18px 20px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1A73E8 0%, #4A90E2 100%)',
              color: '#fff',
              boxShadow: TOKENS.shadowSm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 32 }}>🎯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                还差 {Math.max(0, SETTLEMENT_THRESHOLD - settledTotal)} 条进段位
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                押 5 条结算后，准确率才显示。去首页出第一招 →
              </div>
            </div>
          </div>
        )}

        {/* Accuracy ring */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '32px 20px 24px',
            boxShadow: TOKENS.shadowSm,
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', width: 220, height: 220 }}>
            <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="110" cy="110" r="92" stroke={TOKENS.warm100} strokeWidth="12" fill="none" />
              {accuracyPct != null && (
                <circle
                  cx="110"
                  cy="110"
                  r="92"
                  stroke={BOARD_TINTS[scope].hue}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 92}
                  strokeDashoffset={2 * Math.PI * 92 * (1 - accuracyPct / 100)}
                />
              )}
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 12, color: TOKENS.warm500 }}>
                {scope === '通用' ? COPY.accuracyHero : `${scope}准确率`}
              </div>
              {accuracyPct != null ? (
                <div
                  style={{
                    fontSize: 76,
                    fontWeight: 800,
                    color: TOKENS.warm900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 4,
                  }}
                >
                  {accuracyPct}
                  <span style={{ fontSize: 30, color: TOKENS.warm500, fontWeight: 600 }}>%</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: TOKENS.warm500,
                    }}
                  >
                    {COPY.accumulating} {settledTotal}/{SETTLEMENT_THRESHOLD}
                  </div>
                  <div
                    style={{
                      width: 140,
                      height: 6,
                      borderRadius: 999,
                      background: TOKENS.warm100,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (settledTotal / SETTLEMENT_THRESHOLD) * 100)}%`,
                        height: '100%',
                        background: TOKENS.indigo500,
                        transition: 'width 300ms ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <RankBadge rank={rank} board={scope} size={32} />
            <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.warm800 }}>
              {scope} · {rank.name}
            </div>
          </div>
          <div style={{ fontSize: 12, color: TOKENS.warm500, marginTop: 4, textAlign: 'center' }}>
            {rank.blurb}
          </div>

          <div
            style={{
              display: 'flex',
              width: '100%',
              marginTop: 22,
              paddingTop: 18,
              borderTop: `1px solid ${TOKENS.warm100}`,
            }}
          >
            {[
              { l: '猜对', v: correctTotal, c: TOKENS.warm800 },
              { l: '总计', v: settledTotal, c: TOKENS.warm800 },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: s.c,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.v}
                </div>
                <div style={{ fontSize: 11, color: TOKENS.warm500, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* History list */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 10,
              padding: '0 4px',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.warm700 }}>判断履历</div>
            <div style={{ fontSize: 11, color: TOKENS.warm500 }}>{filteredHistory.length} 条</div>
          </div>
          {history.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', padding: '0 4px 4px' }}>
              {HISTORY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setHistoryFilter(f.id)}
                  style={{
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 999,
                    border: 'none',
                    background: historyFilter === f.id ? TOKENS.warm800 : '#fff',
                    color: historyFilter === f.id ? '#fff' : TOKENS.warm700,
                    boxShadow: historyFilter === f.id ? 'none' : `inset 0 0 0 1px ${TOKENS.warm100}`,
                    cursor: 'pointer',
                    fontFamily: TOKENS.fontSans,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          {filteredHistory.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 36,
                textAlign: 'center',
                color: TOKENS.warm500,
                boxShadow: TOKENS.shadowSm,
              }}
            >
              {COPY.emptyHistory}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 20, boxShadow: TOKENS.shadowSm, padding: '4px 0' }}>
              {filteredHistory.map((h, i) => {
                const stat = h.is_correct == null ? 'pending' : h.is_correct ? 'correct' : 'wrong';
                const cfg =
                  stat === 'correct'
                    ? { bg: TOKENS.correctTint, fg: TOKENS.correct, sym: '✓', label: '猜对', kind: 'correct' as const }
                    : stat === 'wrong'
                    ? { bg: TOKENS.wrongTint, fg: TOKENS.wrong, sym: '✕', label: '看走眼', kind: 'wrong' as const }
                    : { bg: TOKENS.pendingTint, fg: TOKENS.pendingFg, sym: '…', label: '待结算', kind: 'pending' as const };
                const isLate = !h.counts_toward_rank;
                return (
                  <div
                    key={h.id}
                    onClick={() => stat === 'correct' && h.counts_toward_rank && navigate(`/share/${h.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      cursor: stat === 'correct' && h.counts_toward_rank ? 'pointer' : 'default',
                      borderBottom: i < filteredHistory.length - 1 ? `1px solid ${TOKENS.warm100}` : 'none',
                      opacity: isLate ? 0.6 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: isLate ? TOKENS.warm100 : cfg.bg,
                        color: isLate ? TOKENS.warm500 : cfg.fg,
                        fontSize: 16,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {cfg.sym}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: TOKENS.warm800,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h.issue.title}
                      </div>
                      <div style={{ fontSize: 12, color: TOKENS.warm500, marginTop: 2 }}>
                        你{h.stance ? '支持' : '反对'}
                        {isLate && ' · 围观'}
                      </div>
                    </div>
                    <Pill kind={isLate ? 'neutral' : cfg.kind} size="sm">
                      {isLate ? `围观 ${cfg.sym}` : cfg.label}
                    </Pill>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isOwn && (
        <TabBar
          active="我"
          onTabChange={(t) => navigate(t === '议题' ? '/' : t === '广场' ? '/square' : '/me')}
        />
      )}
    </div>
  );
}

function ProfileBell({ userId, onOpen }: { userId: string; onOpen: () => void }) {
  const count = useUnreadCount(userId);
  return (
    <button
      type="button"
      onClick={onOpen}
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
        fontSize: 16,
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
