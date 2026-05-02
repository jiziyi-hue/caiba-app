import type { ReactNode } from 'react';
import { TOKENS } from '../tokens';

export type PillKind =
  | 'neutral'
  | 'indigo'
  | 'support'
  | 'oppose'
  | 'supportSoft'
  | 'opposeSoft'
  | 'pending'
  | 'correct'
  | 'wrong';

interface PillProps {
  children: ReactNode;
  kind?: PillKind;
  size?: 'md' | 'sm';
}

const STYLES: Record<PillKind, { bg: string; fg: string }> = {
  neutral: { bg: TOKENS.warm50, fg: TOKENS.warm700 },
  indigo: { bg: TOKENS.indigo50, fg: TOKENS.indigo700 },
  support: { bg: TOKENS.support, fg: '#fff' },
  oppose: { bg: TOKENS.oppose, fg: '#fff' },
  supportSoft: { bg: TOKENS.supportTint, fg: TOKENS.support },
  opposeSoft: { bg: TOKENS.opposeTint, fg: TOKENS.oppose },
  pending: { bg: TOKENS.pendingTint, fg: TOKENS.pendingFg },
  correct: { bg: TOKENS.correctTint, fg: TOKENS.correct },
  wrong: { bg: TOKENS.wrongTint, fg: TOKENS.wrong },
};

export function Pill({ children, kind = 'neutral', size = 'md' }: PillProps) {
  const s = STYLES[kind];
  const sz =
    size === 'sm'
      ? { padding: '3px 9px', fontSize: 11 }
      : { padding: '4px 11px', fontSize: 12 };
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontWeight: 600,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...sz,
      }}
    >
      {children}
    </span>
  );
}
