import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { PageHeader, Pill, PostCard, type PostCardData } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Topic = Database['public']['Tables']['topics']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

interface JoinedPost extends Post {
  author: Database['public']['Tables']['profiles']['Row'];
  issue?: Database['public']['Tables']['issues']['Row'] | null;
}

export function TopicScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<JoinedPost[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: t } = await supabase.from('topics').select('*').eq('id', id).single();
      setTopic(t);
      const { data: p } = await supabase
        .from('posts')
        .select('*, author:profiles(*), issue:issues(*)')
        .eq('topic_id', id)
        .order('upvotes', { ascending: false })
        .limit(30);
      setPosts((p ?? []) as JoinedPost[]);
    })();
  }, [id]);

  if (!topic) {
    return <div style={{ padding: 40, color: TOKENS.warm500 }}>{COPY.loading}</div>;
  }

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title={`#${topic.name}`} back onBack={() => navigate(-1)} />

      <div style={{ padding: '14px 16px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 18,
            boxShadow: TOKENS.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {topic.category && <Pill kind="indigo" size="sm">{topic.category}</Pill>}
          {topic.description && (
            <div style={{ fontSize: 14, color: TOKENS.warm700, lineHeight: 1.6 }}>
              {topic.description}
            </div>
          )}
          <div
            style={{
              fontSize: 12,
              color: TOKENS.warm500,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            热度 {topic.heat ?? 0} · {topic.participants ?? 0} 人参与
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.length === 0 ? (
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
              这个话题下暂无观点
            </div>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={
                  {
                    id: p.id,
                    title: p.title,
                    excerpt: '',
                    issue: p.issue ? { title: p.issue.title } : null,
                    stance: p.stance == null ? null : p.stance ? 'support' : 'oppose',
                    verified: (p.verified_status ?? null) as 'correct' | 'wrong' | null,
                    author: {
                      name: p.author.name,
                      accuracy: 0,
                      tint: (p.author.avatar_tint as 'indigo') ?? 'warm',
                    },
                    upvotes: p.upvotes ?? 0,
                    comments: p.comment_count ?? 0,
                  } as PostCardData
                }
                onOpen={() => navigate(`/post/${p.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
