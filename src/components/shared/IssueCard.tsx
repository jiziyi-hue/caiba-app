import { TOKENS } from '../tokens';
import { Pill } from './Pill';
import { StanceBar } from './StanceBar';

export interface IssueCardData {
  id: string;
  category: string;
  title: string;
  supportPct: number;
  total: number;
  rankedCount?: number;
  friends?: number;
  status: 'pending' | 'correct' | 'wrong' | 'cancelled';
  daysLeft?: number;
  committed?: 'support' | 'oppose' | null;
}

interface IssueCardProps {
  issue: IssueCardData;
  onOpen?: () => void;
}

export function IssueCard({ issue, onOpen }: IssueCardProps) {
  const settle =
    issue.status === 'pending'
      ? { kind: 'pending' as const, label: issue.daysLeft != null ? `还差 ${issue.daysLeft} 天` : '进行中' }
      : issue.status === 'correct'
      ? { kind: 'correct' as const, label: '✓ 猜对' }
      : issue.status === 'wrong'
      ? { kind: 'wrong' as const, label: '看走眼' }
      : null;

  return (
    <div
      onClick={onOpen}
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: 20,
        boxShadow: TOKENS.shadowSm,
        cursor: onOpen ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Pill kind="indigo" size="sm">
          {issue.category}
        </Pill>
        {issue.committed && (
          <Pill kind={issue.committed === 'support' ? 'support' : 'oppose'} size="sm">
            已{issue.committed === 'support' ? '支持' : '反对'}
          </Pill>
        )}
        <div style={{ flex: 1 }} />
        {settle && (
          <Pill kind={settle.kind} size="sm">
            {settle.label}
          </Pill>
        )}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: TOKENS.warm800,
          lineHeight: 1.4,
          letterSpacing: '-0.005em',
        }}
      >
        {issue.title}
      </div>
      <StanceBar supportPct={issue.supportPct} total={issue.total} rankedCount={issue.rankedCount} />
      {issue.friends != null && issue.friends > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: TOKENS.warm500,
          }}
        >
          <div style={{ display: 'flex' }}>
            {['#D9CFC0', '#C4D9D5', '#E8C9C9'].slice(0, Math.min(3, issue.friends)).map((c, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: c,
                  boxShadow: '0 0 0 2px #fff',
                  marginLeft: i === 0 ? 0 : -6,
                }}
              />
            ))}
          </div>
          <span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: TOKENS.warm700, fontWeight: 600 }}>
              {issue.friends}
            </span>{' '}
            位朋友已表态
          </span>
        </div>
      )}
    </div>
  );
}
