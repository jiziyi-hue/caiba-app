import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { fetchFollowingIds } from '../lib/follows';
import { ISSUE_CATEGORIES } from '../lib/categories';
import { TOKENS } from '../components/tokens';
import { PageHeader, PostCard, TabBar, type PostCardData } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Post = Database['public']['Tables']['posts']['Row'];
type Topic = Database['public']['Tables']['topics']['Row'];

interface JoinedPost extends Post {
  author: Database['public']['Tables']['profiles']['Row'];
  issue?: Database['public']['Tables']['issues']['Row'] | null;
}

const TABS = ['推荐', '关注', '热榜'] as const;
type Tab = (typeof TABS)[number];

const CATS = ['全部', ...ISSUE_CATEGORIES] as const;
type Cat = (typeof CATS)[number];

export function SquareScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('推荐');
  const [cat, setCat] = useState<Cat>('全部');
  const [posts, setPosts] = useState<JoinedPost[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const orderField = tab === '热榜' ? 'upvotes' : 'created_at';
      let query = supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(*), issue:issues(*)')
        .order(orderField, { ascending: false })
        .limit(30);

      if (tab === '关注') {
        if (!user) {
          setPosts([]);
          setLoading(false);
          return;
        }
        const followingIds = await fetchFollowingIds(user.id);
        if (followingIds.length === 0) {
          setPosts([]);
        } else {
          query = query.in('author_id', followingIds);
          const { data } = await query;
          setPosts((data ?? []) as JoinedPost[]);
        }
      } else {
        const { data } = await query;
        setPosts((data ?? []) as JoinedPost[]);
      }

      const { data: tps } = await supabase
        .from('topics')
        .select('*')
        .order('heat', { ascending: false })
        .limit(8);
      setTopics(tps ?? []);
      setLoading(false);
    })();
  }, [tab, user]);

  const visiblePosts = cat === '全部' ? posts : posts.filter((p) => p.issue?.category === cat);
  const visibleTopics = cat === '全部' ? topics : topics.filter((t) => t.category === cat);

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 120, position: 'relative' }}>
      <PageHeader title={COPY.squareTitle} sub={`共 ${posts.length} 条观点 · ${topics.length} 个热议话题`} />

      {/* Category chip row */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            style={{
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 999,
              border: 'none',
              background: cat === c ? TOKENS.warm800 : '#fff',
              color: cat === c ? '#fff' : TOKENS.warm700,
              boxShadow: cat === c ? 'none' : `inset 0 0 0 1px ${TOKENS.warm100}`,
              cursor: 'pointer',
              fontFamily: TOKENS.fontSans,
              whiteSpace: 'nowrap',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Topic hot list — horizontal scroll */}
      {visibleTopics.length > 0 && (
        <div style={{ padding: '14px 0 4px' }}>
          <div
            style={{
              padding: '0 16px 10px',
              fontSize: 13,
              fontWeight: 700,
              color: TOKENS.warm700,
              letterSpacing: '0.04em',
            }}
          >
            🔥 {cat === '全部' ? '话题热榜' : `${cat}热榜`}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              padding: '0 16px 4px',
              scrollbarWidth: 'none',
            }}
          >
            {visibleTopics.map((tp, i) => (
              <div
                key={tp.id}
                onClick={() => navigate(`/topic/${tp.id}`)}
                style={{
                  flexShrink: 0,
                  width: 180,
                  background: '#fff',
                  borderRadius: 16,
                  padding: 14,
                  boxShadow: TOKENS.shadowSm,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: TOKENS.indigo500,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span style={{ color: TOKENS.warm400 }}>#{i + 1}</span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: TOKENS.warm800,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  #{tp.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: TOKENS.warm500,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  热度 {(tp.heat ?? 0).toLocaleString()} · {(tp.participants ?? 0).toLocaleString()} 人
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          padding: '14px 16px 14px',
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
        ) : visiblePosts.length === 0 ? (
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
            {tab === '关注' && !user
              ? '登录后看你关注的人发的内容'
              : tab === '关注'
              ? '还没关注任何人 · 去别人主页点关注'
              : `暂无${cat === '全部' ? '' : cat}观点 · 写第一条 →`}
          </div>
        ) : (
          visiblePosts.map((p) => {
            const cardData: PostCardData = {
              id: p.id,
              title: p.title,
              excerpt: extractExcerpt(p.content),
              issue: p.issue ? { title: p.issue.title } : null,
              stance: p.stance == null ? null : p.stance ? 'support' : 'oppose',
              verified: (p.verified_status ?? null) as 'correct' | 'wrong' | null,
              author: {
                name: p.author.name,
                accuracy: 0,
                tint: (p.author.avatar_tint as 'indigo') ?? 'warm',
                avatarUrl: p.author.avatar_url,
              },
              upvotes: p.upvotes ?? 0,
              comments: p.comment_count ?? 0,
            };
            return <PostCard key={p.id} post={cardData} onOpen={() => navigate(`/post/${p.id}`)} />;
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(user ? '/compose' : '/login')}
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
        onTabChange={(t) =>
          navigate(t === '议题' ? '/' : t === '我' ? (user ? '/me' : '/login') : '/square')
        }
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
