import { TOKENS, type AvatarTint } from '../tokens';

interface AvatarProps {
  name: string;
  size?: number;
  tint?: AvatarTint;
  url?: string | null;
}

const TINTS: Record<AvatarTint, { bg: string; fg: string }> = {
  warm: { bg: TOKENS.warm100, fg: TOKENS.warm700 },
  indigo: { bg: TOKENS.indigo100, fg: TOKENS.indigo700 },
  sage: { bg: '#E0EBE5', fg: '#3F6F55' },
  rose: { bg: '#F2DDD9', fg: '#9A4C42' },
};

export function Avatar({ name, size = 32, tint = 'warm', url }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          objectFit: 'cover',
          flexShrink: 0,
          background: TINTS[tint].bg,
        }}
      />
    );
  }
  const { bg, fg } = TINTS[tint];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: size * 0.42,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {name}
    </div>
  );
}
