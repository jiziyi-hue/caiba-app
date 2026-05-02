import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { Avatar, IssueBadge, PageHeader, Pill } from '../components/shared';
import { Comments } from '../components/Comments';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Post = Database['public']['Tables']['posts']['Row'];

interface JoinedPost extends Post {
  author: Database['public']['Tables']['profiles']['Row'];
  issue?: Database['public']['Tables']['issues']['Row'] | null;
}

interface Block {
  type: 'text' | 'image';
  value?: string;
  url?: string;
}

export function PostScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<JoinedPost | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles(*), issue:issues(*)')
        .eq('id', id)
        .single();
      setPost(data as JoinedPost);
    })();
  }, [id]);

  if (!post) {
    return <div style={{ padding: 40, color: TOKENS.warm500 }}>{COPY.loading}</div>;
  }

  const blocks: Block[] = Array.isArray(post.content) ? (post.content as unknown as Block[]) : [];

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="观点帖" back onBack={() => navigate(-1)} />

      <div style={{ padding: '14px 16px' }}>
        {post.issue && (
          <div style={{ marginBottom: 12 }}>
            <IssueBadge
              title={post.issue.title}
              stance={post.stance == null ? null : post.stance ? 'support' : 'oppose'}
              onOpen={() => navigate(`/issue/${post.issue!.id}`)}
            />
          </div>
        )}

        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 22,
            boxShadow: TOKENS.shadowSm,
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: TOKENS.warm900,
              letterSpacing: '-0.01em',
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {post.title}
          </h1>

          {post.verified_status && (
            <div style={{ marginTop: 10 }}>
              <Pill kind={post.verified_status === 'correct' ? 'correct' : 'wrong'} size="sm">
                {post.verified_status === 'correct' ? '✓ 已验证正确' : '✕ 看走眼了'}
              </Pill>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 14,
              fontSize: 13,
              color: TOKENS.warm600,
            }}
          >
            <Avatar
              name={post.author.name[0] ?? '判'}
              size={28}
              tint={(post.author.avatar_tint as 'indigo') ?? 'warm'}
            />
            <span>{post.author.name}</span>
            <span style={{ color: TOKENS.warm400 }}>·</span>
            <span style={{ fontFamily: TOKENS.fontMono }}>
              {new Date(post.created_at!).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {blocks.map((b, i) =>
              b.type === 'text' ? (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: TOKENS.warm800,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {b.value}
                </p>
              ) : (
                <img
                  key={i}
                  src={b.url}
                  alt=""
                  style={{ width: '100%', borderRadius: 14, display: 'block' }}
                />
              )
            )}
          </div>
        </div>

        <Comments target={{ type: 'post', id: post.id }} />
      </div>
    </div>
  );
}
