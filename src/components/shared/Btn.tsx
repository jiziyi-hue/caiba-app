import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { TOKENS } from '../tokens';

export type BtnKind =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'support'
  | 'oppose'
  | 'outline';

interface BtnProps {
  children: ReactNode;
  kind?: BtnKind;
  size?: 'md' | 'lg' | 'sm';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const KINDS: Record<BtnKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: TOKENS.indigo500, fg: '#fff' },
  secondary: { bg: TOKENS.warm50, fg: TOKENS.warm800 },
  ghost: { bg: 'transparent', fg: TOKENS.indigo600 },
  support: { bg: TOKENS.support, fg: '#fff' },
  oppose: { bg: TOKENS.oppose, fg: '#fff' },
  outline: { bg: '#fff', fg: TOKENS.warm700, border: `1px solid ${TOKENS.warm200}` },
};

const SIZES = {
  md: { padding: '12px 22px', fontSize: 15 },
  lg: { padding: '15px 28px', fontSize: 16 },
  sm: { padding: '8px 16px', fontSize: 13 },
} as const;

export function Btn({
  children,
  kind = 'primary',
  size = 'md',
  onClick,
  style = {},
  disabled,
  type = 'button',
}: BtnProps) {
  const k = KINDS[kind];
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: disabled ? TOKENS.warm100 : k.bg,
        color: disabled ? TOKENS.warm400 : k.fg,
        border: k.border || 'none',
        borderRadius: 999,
        fontWeight: 600,
        fontFamily: TOKENS.fontSans,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 200ms cubic-bezier(0.22,1,0.36,1)',
        ...SIZES[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
