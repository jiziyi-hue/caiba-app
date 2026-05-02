import { TOKENS, type AvatarTint } from '../tokens';
import { Avatar } from './Avatar';
import { IssueBadge } from './IssueBadge';
import { JudgmentBadge } from './JudgmentBadge';

export interface PostCardData {
  id: string;
  title: string;
  excerpt: string;
  issue?: { title: string } | null;
  stance?: 'support' | 'oppose' | null;
  verified?: 'correct' | 'wrong' | null;
  author: {
    name: string;
    accuracy: number;
    tint?: AvatarTint;
    avatarUrl?: string | null;
  };
  upvotes: number;
  comments: number;
}

interface PostCardProps {
  post: PostCardData;
  onOpen?: () => void;
}

export function PostCard({ post, onOpen }: PostCardProps) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: 18,
        cursor: onOpen ? 'pointer' : 'default',
        boxShadow: TOKENS.shadowSm,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {post.issue && <IssueBadge title={post.issue.title} stance={post.stance ?? null} />}
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: TOKENS.warm900,
          lineHeight: 1.35,
          letterSpacing: '-0.005em',
        }}
      >
        {post.title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: TOKENS.warm600,
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.excerpt}
      </div>
      {post.verified && (
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 6,
            background: post.verified === 'correct' ? TOKENS.correctTint : TOKENS.wrongTint,
            color: post.verified === 'correct' ? TOKENS.correct : TOKENS.wrong,
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 6,
          }}
        >
          {post.verified === 'correct' ? '✓ 已验证正确' : '✕ 看走眼了'}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <Avatar
          name={post.author.name[0]}
          size={24}
          tint={post.author.tint || 'warm'}
          url={post.author.avatarUrl}
        />
        <span style={{ fontSize: 13, color: TOKENS.warm700, fontWeight: 500 }}>
          {post.author.name}
        </span>
        <JudgmentBadge accuracy={post.author.accuracy} size="sm" />
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            gap: 14,
            fontSize: 12,
            color: TOKENS.warm500,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>▲ {post.upvotes}</span>
          <span>💬 {post.comments}</span>
        </div>
      </div>
    </div>
  );
}
