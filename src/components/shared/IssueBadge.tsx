import { TOKENS } from '../tokens';

interface IssueBadgeProps {
  title: string;
  stance?: 'support' | 'oppose' | null;
  onOpen?: () => void;
}

export function IssueBadge({ title, stance, onOpen }: IssueBadgeProps) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px 6px 10px',
        background: TOKENS.indigo50,
        borderRadius: 999,
        cursor: onOpen ? 'pointer' : 'default',
        maxWidth: '100%',
      }}
    >
      <span style={{ color: TOKENS.indigo500, fontWeight: 700, fontSize: 13 }}>#</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: TOKENS.indigo700,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 200,
        }}
      >
        {title}
      </span>
      {stance && (
        <span
          style={{
            background: stance === 'support' ? TOKENS.support : TOKENS.oppose,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 999,
          }}
        >
          {stance === 'support' ? '支持方' : '反对方'}
        </span>
      )}
    </div>
  );
}
