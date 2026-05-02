import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { PageHeader, PostCard, TabBar, type PostCardData } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Post = Database['public']['Tables']['posts']['Row'];

interface JoinedPost extends Post {
  author: Database['public']['Tables']['profiles']['Row'];
  issue?: Database['public']['Tables']['issues']['Row'] | null;
}

const TABS = ['推荐', '关注', '热榜'] as const;
type Tab = (typeof TABS)[number];

export function SquareScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('推荐');
  const [posts, setPosts] = useState<JoinedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const orderField = tab === '热榜' ? 'upvotes' : 'created_at';
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles(*), issue:issues(*)')
        .order(orderField, { ascending: false })
        .limit(30);
      setPosts((data ?? []) as JoinedPost[]);
      setLoading(false);
    })();
  }, [tab]);

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 120, position: 'relative' }}>
      <PageHeader title={COPY.squareTitle} sub={`共 ${posts.length} 条观点`} />

      <div
        style={{
          padding: '12px 16px 14px',
          display: 'flex',
          gap: 18,
          borderBottom: `1px solid ${TOKENS.warm100}`,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '4px 0',
              fontSize: 15,
              fontWeight: tab === t ? 700 : 500,
              color: tab === t ? TOKENS.warm900 : TOKENS.warm500,
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? TOKENS.indigo500 : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ color: TOKENS.warm500, padding: 20 }}>{COPY.loading}</div>
        ) : posts.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              textAlign: 'center',
              color: TOKENS.warm500,
              boxShadow: TOKENS.shadowSm,
            }}
          >
            还没有观点 · 写第一条 →
          </div>
        ) : (
          posts.map((p) => {
            const cardData: PostCardData = {
              id: p.id,
              title: p.title,
              excerpt: extractExcerpt(p.content),
              issue: p.issue ? { title: p.issue.title } : null,
              stance: p.stance == null ? null : p.stance ? 'support' : 'oppose',
              verified: (p.verified_status ?? null) as 'correct' | 'wrong' | null,
              author: { name: p.author.name, accuracy: 0, tint: (p.author.avatar_tint as 'indigo') ?? 'warm' },
              upvotes: p.upvotes ?? 0,
              comments: p.comment_count ?? 0,
            };
            return <PostCard key={p.id} post={cardData} onOpen={() => navigate(`/post/${p.id}`)} />;
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/compose')}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 100,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: TOKENS.indigo500,
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 20px rgba(26,115,232,0.4)',
          cursor: 'pointer',
          fontSize: 18,
          zIndex: 25,
        }}
        aria-label="写观点"
      >
        ✎
      </button>

      <TabBar
        active="广场"
        onTabChange={(t) => navigate(t === '议题' ? '/' : t === '我' ? '/me' : '/square')}
      />
    </div>
  );
}

function extractExcerpt(content: unknown): string {
  if (typeof content === 'string') return content.slice(0, 140);
  if (Array.isArray(content)) {
    const text = content
      .filter((b: unknown) => (b as { type?: string }).type === 'text')
      .map((b: unknown) => (b as { value?: string }).value || '')
      .join(' ');
    return text.slice(0, 140);
  }
  return '';
}
