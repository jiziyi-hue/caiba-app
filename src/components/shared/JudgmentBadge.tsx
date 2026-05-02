import { TOKENS } from '../tokens';

interface JudgmentBadgeProps {
  accuracy: number;
  size?: 'md' | 'sm';
}

export function JudgmentBadge({ accuracy, size = 'md' }: JudgmentBadgeProps) {
  const tier =
    accuracy >= 70
      ? { bg: TOKENS.indigo50, fg: TOKENS.indigo700, dot: TOKENS.indigo500 }
      : accuracy >= 50
      ? { bg: TOKENS.warm50, fg: TOKENS.warm700, dot: TOKENS.warm500 }
      : { bg: '#F5E4E2', fg: '#8E3D38', dot: '#B85450' };
  const sz =
    size === 'sm'
      ? { padding: '2px 7px', fontSize: 10, gap: 4, dot: 5 }
      : { padding: '3px 9px', fontSize: 11, gap: 5, dot: 6 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sz.gap,
        background: tier.bg,
        color: tier.fg,
        padding: sz.padding,
        borderRadius: 6,
        fontSize: sz.fontSize,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: sz.dot,
          height: sz.dot,
          borderRadius: 999,
          background: tier.dot,
        }}
      />
      {accuracy}%
    </span>
  );
}
