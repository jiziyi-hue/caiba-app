import type { CSSProperties } from 'react';
import { TOKENS } from './tokens';
import { resolveRankColors, type Board, type RankTier } from '../lib/ranks';

interface RankBadgeProps {
  rank: RankTier;
  board?: Board;
  size?: number;
  showRing?: boolean;
  style?: CSSProperties;
}

export function RankBadge({ rank, board = '通用', size = 36, showRing = true, style }: RankBadgeProps) {
  const c = resolveRankColors(rank, board);
  const r = size / 2;
  const ornaments = [];

  if (rank.dir === 1 && rank.level >= 1) {
    const rays = rank.level * 2 + 4;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * 2 * Math.PI - Math.PI / 2;
      const inner = r * (rank.level >= 3 ? 0.92 : 0.85);
      const outer = r * (1.08 + rank.level * 0.04);
      const wide = r * 0.04;
      const px = r + Math.cos(angle) * inner;
      const py = r + Math.sin(angle) * inner;
      const ox = r + Math.cos(angle) * outer;
      const oy = r + Math.sin(angle) * outer;
      const perpX = -Math.sin(angle) * wide;
      const perpY = Math.cos(angle) * wide;
      ornaments.push(
        <polygon
          key={i}
          points={`${px - perpX},${py - perpY} ${px + perpX},${py + perpY} ${ox},${oy}`}
          fill={c.stroke}
          opacity={0.9}
        />
      );
    }
  } else if (rank.dir === -1 && rank.level >= 2) {
    const shards = rank.level + 2;
    for (let i = 0; i < shards; i++) {
      const angle = (i / shards) * 2 * Math.PI - Math.PI / 2 + 0.18;
      const len = r * 0.32;
      const px = r + Math.cos(angle) * r;
      const py = r + Math.sin(angle) * r;
      const tip: [number, number] = [r + Math.cos(angle) * (r + len), r + Math.sin(angle) * (r + len)];
      const wide = r * 0.07;
      const a: [number, number] = [px + Math.cos(angle + Math.PI / 2) * wide, py + Math.sin(angle + Math.PI / 2) * wide];
      const b: [number, number] = [px + Math.cos(angle - Math.PI / 2) * wide, py + Math.sin(angle - Math.PI / 2) * wide];
      ornaments.push(
        <polygon
          key={i}
          points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${tip[0]},${tip[1]}`}
          fill={c.fill}
          stroke={c.stroke}
          strokeWidth={size * 0.025}
        />
      );
    }
  }

  const glyph =
    rank.dir === 1 ? (
      <circle cx={r} cy={r} r={r * 0.35} fill={c.ink} opacity={rank.level >= 3 ? 0.9 : 0.4} />
    ) : rank.dir === -1 ? (
      <polygon
        points={`${r},${r - r * 0.45} ${r + r * 0.4},${r} ${r},${r + r * 0.45} ${r - r * 0.4},${r}`}
        fill={c.ink}
        opacity={rank.level >= 3 ? 0.85 : 0.5}
      />
    ) : (
      <circle cx={r} cy={r} r={r * 0.18} fill="none" stroke={c.ink} strokeWidth={size * 0.04} />
    );

  const totalSize = size * 1.32;

  if (rank.img) {
    return (
      <div
        style={{
          position: 'relative',
          width: totalSize,
          height: totalSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <img
          src={rank.img}
          width={size}
          height={size}
          style={{ borderRadius: 999, objectFit: 'cover' }}
          alt={rank.name}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: totalSize,
        height: totalSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg width={totalSize} height={totalSize} viewBox={`0 0 ${totalSize} ${totalSize}`}>
        <g transform={`translate(${(totalSize - size) / 2}, ${(totalSize - size) / 2})`}>
          {ornaments}
          {showRing && rank.dir !== 0 && (
            <circle cx={r} cy={r} r={r - 0.5} fill="none" stroke={c.accent} strokeWidth={size * 0.04} opacity={0.9} />
          )}
          <circle
            cx={r}
            cy={r}
            r={r - (showRing ? size * 0.06 : 1)}
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth={size * 0.025}
          />
          {glyph}
        </g>
      </svg>
    </div>
  );
}

interface RankInlineProps {
  rank: RankTier;
  board?: Board;
  size?: number;
}

export function RankInline({ rank, board = '通用', size = 34 }: RankInlineProps) {
  const c = resolveRankColors(rank, board);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#fff',
        borderRadius: 999,
        padding: '3px 10px 3px 3px',
        boxShadow: TOKENS.shadowSm,
      }}
    >
      <RankBadge rank={rank} board={board} size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: 9,
            color: TOKENS.warm500,
            letterSpacing: '0.06em',
            fontFamily: TOKENS.fontMono,
            textTransform: 'uppercase',
          }}
        >
          {board === '通用' ? 'rank' : board}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: c.ink === '#FFFFFF' ? TOKENS.warm900 : TOKENS.warm800,
            letterSpacing: '-0.01em',
          }}
        >
          {rank.name}
        </span>
      </div>
    </div>
  );
}
