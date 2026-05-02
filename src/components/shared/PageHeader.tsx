import type { ReactNode } from 'react';
import { TOKENS } from '../tokens';

interface PageHeaderProps {
  title: string;
  sub?: string;
  action?: ReactNode;
  back?: boolean;
  onBack?: () => void;
}

export function PageHeader({ title, sub, action, back, onBack }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: '24px 20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: TOKENS.warm25,
        borderBottom: `1px solid ${TOKENS.warm100}`,
      }}
    >
      {back && (
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: '#fff',
            border: `1px solid ${TOKENS.warm100}`,
            fontSize: 18,
            color: TOKENS.warm700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ‹
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: TOKENS.warm800,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: TOKENS.warm500, marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {action}
    </div>
  );
}
