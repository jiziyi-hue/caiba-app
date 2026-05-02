import { TOKENS } from '../tokens';

interface StanceBarProps {
  supportPct: number;
  total?: number;
  rankedCount?: number;
}

export function StanceBar({ supportPct, total, rankedCount }: StanceBarProps) {
  const lateCount = total != null && rankedCount != null ? Math.max(0, total - rankedCount) : null;

  return (
    <div>
      <div
        style={{
          position: 'relative',
          height: 8,
          borderRadius: 999,
          background: TOKENS.warm50,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(35,34,32,0.06)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${supportPct}%`,
            background: TOKENS.support,
            borderRadius: 999,
            transition: 'width 360ms cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontSize: 12,
          fontFamily: TOKENS.fontSans,
        }}
      >
        <span style={{ color: TOKENS.support, fontWeight: 600 }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{supportPct}%</span> 支持
        </span>
        {total != null && (
          <span style={{ color: TOKENS.warm500 }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()}</span> 人表态
            {lateCount != null && lateCount > 0 && (
              <span style={{ color: TOKENS.warm400 }}>
                {' '}（围观 {lateCount}）
              </span>
            )}
          </span>
        )}
        <span style={{ color: TOKENS.oppose, fontWeight: 600 }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{100 - supportPct}%</span> 反对
        </span>
      </div>
    </div>
  );
}
