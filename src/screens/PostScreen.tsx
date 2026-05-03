import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
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
  const { user, profile } = useAuth();
  const [post, setPost] = useState<JoinedPost | null>(null);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  async function load() {
    if (!id) return;
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*), issue:issues(*)')
      .eq('id', id)
      .single();
    setPost(data as JoinedPost);
    if (user && id) {
      const { data: uv } = await supabase
        .from('post_upvotes')
        .select('user_id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      setUpvoted(!!uv);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  async function toggleUpvote() {
    if (!post || !id) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setUpvoting(true);
    try {
      const { data, error: e } = await supabase.rpc('toggle_upvote', { p_post_id: id });
      if (e) throw e;
      const row = (Array.isArray(data) ? data[0] : data) as { upvoted: boolean; count: number } | null;
      if (row) {
        setUpvoted(row.upvoted);
        setPost({ ...post, upvotes: row.count });
      }
    } catch (err) {
      console.error('upvote failed', err);
    } finally {
      setUpvoting(false);
    }
  }

  async function deletePost() {
    if (!post || !id) return;
    if (!confirm(`删除观点：「${post.title.slice(0, 30)}」？\n\n该操作不可撤销，连带评论也会清空。`)) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    navigate(-1);
  }

  if (!post) {
    return <div style={{ padding: 40, color: TOKENS.warm500 }}>{COPY.loading}</div>;
  }

  const blocks: Block[] = Array.isArray(post.content) ? (post.content as unknown as Block[]) : [];
  const canDelete = !!profile?.is_admin || (!!user && user.id === post.author_id);

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader
        title="观点帖"
        back
        onBack={() => navigate(-1)}
        action={
          canDelete ? (
            <button
              type="button"
              onClick={deletePost}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                color: TOKENS.wrong,
                background: 'transparent',
                border: `1px solid ${TOKENS.warm200}`,
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: TOKENS.fontSans,
              }}
            >
              删除
            </button>
          ) : undefined
        }
      />

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
              url={post.author.avatar_url}
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

        {/* Upvote bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 14,
            background: '#fff',
            borderRadius: 16,
            padding: '14px 18px',
            boxShadow: TOKENS.shadowSm,
          }}
        >
          <button
            type="button"
            onClick={toggleUpvote}
            disabled={upvoting}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1.5px solid ${upvoted ? TOKENS.indigo500 : TOKENS.warm200}`,
              background: upvoted ? TOKENS.indigo50 : '#fff',
              color: upvoted ? TOKENS.indigo700 : TOKENS.warm700,
              fontSize: 14,
              fontWeight: 600,
              cursor: upvoting ? 'wait' : 'pointer',
              fontFamily: TOKENS.fontSans,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>▲</span>
            {upvoted ? '已赞' : '点赞'}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{post.upvotes ?? 0}</span>
          </button>
          <span style={{ fontSize: 13, color: TOKENS.warm500 }}>
            💬 {post.comment_count ?? 0} 评论
          </span>
        </div>

        <Comments target={{ type: 'post', id: post.id }} />
      </div>
    </div>
  );
}
