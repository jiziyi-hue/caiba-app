// Comments — load + render + post/delete for a single post or issue
// Reference: GDD §15.2 (now MVP, was v2)

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from './tokens';
import { Avatar, Btn } from './shared';
import type { Database } from '../types/db';

type Comment = Database['public']['Tables']['comments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface JoinedComment extends Comment {
  author: Pick<Profile, 'id' | 'name' | 'handle' | 'avatar_url' | 'avatar_tint' | 'is_admin'>;
}

interface CommentsProps {
  target: { type: 'post' | 'issue'; id: string };
}

export function Comments({ target }: CommentsProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<JoinedComment[]>([]);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const filterCol = target.type === 'post' ? 'post_id' : 'issue_id';

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(id,name,handle,avatar_url,avatar_tint,is_admin)')
      .eq(filterCol, target.id)
      .order('created_at', { ascending: true })
      .limit(200);
    setComments((data ?? []) as JoinedComment[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id, target.type]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!body.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const insertRow: Record<string, unknown> = {
        author_id: user.id,
        body: body.trim(),
      };
      insertRow[filterCol] = target.id;
      const { error: e } = await supabase.from('comments').insert(insertRow as never);
      if (e) throw e;
      setBody('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('确定删除？')) return;
    const { error: e } = await supabase.from('comments').delete().eq('id', id);
    if (e) {
      alert('删除失败：' + e.message);
      return;
    }
    await load();
  }

  return (
    <div
      style={{
        marginTop: 18,
        background: '#fff',
        borderRadius: 20,
        padding: 18,
        boxShadow: TOKENS.shadowSm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.warm800 }}>
          评论 · {comments.length}
        </div>
      </div>

      {/* Composer */}
      {user ? (
        <form
          onSubmit={submit}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            marginBottom: 16,
            paddingBottom: 14,
            borderBottom: `1px solid ${TOKENS.warm100}`,
          }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <Avatar
              name={profile?.name?.[0] ?? '你'}
              size={32}
              tint={(profile?.avatar_tint as 'indigo') ?? 'indigo'}
            />
          )}
          <div style={{ flex: 1 }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="说点什么…"
              maxLength={1000}
              rows={2}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: 12,
                border: `1px solid ${TOKENS.warm200}`,
                fontSize: 14,
                color: TOKENS.warm800,
                lineHeight: 1.5,
                resize: 'vertical',
                fontFamily: TOKENS.fontSans,
                outline: 'none',
                background: TOKENS.warm25,
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 11, color: TOKENS.warm400, fontFamily: TOKENS.fontMono }}>
                {body.length}/1000
              </span>
              <Btn
                type="submit"
                kind="primary"
                size="sm"
                disabled={submitting || !body.trim()}
              >
                {submitting ? '发送中…' : '发送'}
              </Btn>
            </div>
            {error && (
              <div style={{ fontSize: 12, color: TOKENS.wrong, marginTop: 6 }}>{error}</div>
            )}
          </div>
        </form>
      ) : (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: TOKENS.warm50,
            color: TOKENS.warm600,
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span>登录后即可评论</span>
          <Link
            to="/login"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: TOKENS.indigo500,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            登录
          </Link>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: TOKENS.warm500, fontSize: 13, textAlign: 'center', padding: 20 }}>
          加载中…
        </div>
      ) : comments.length === 0 ? (
        <div style={{ color: TOKENS.warm500, fontSize: 13, textAlign: 'center', padding: 20 }}>
          还没有评论 · 来当沙发？
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {comments.map((c) => {
            const canDelete = user && (user.id === c.author_id || profile?.is_admin);
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {c.author.avatar_url ? (
                  <img
                    src={c.author.avatar_url}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Avatar
                    name={c.author.name[0] ?? '判'}
                    size={32}
                    tint={(c.author.avatar_tint as 'indigo') ?? 'warm'}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 3,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: TOKENS.warm800 }}>
                      {c.author.name}
                    </span>
                    {c.author.is_admin && (
                      <span
                        style={{
                          fontSize: 9,
                          background: TOKENS.indigo50,
                          color: TOKENS.indigo700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        color: TOKENS.warm500,
                        fontFamily: TOKENS.fontMono,
                      }}
                    >
                      {formatTime(c.created_at!)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          color: TOKENS.warm400,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: TOKENS.warm800,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {c.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const t = new Date(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - t.getTime()) / 1000);
  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} 天前`;
  return `${t.getMonth() + 1}-${String(t.getDate()).padStart(2, '0')}`;
}
