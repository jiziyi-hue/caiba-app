import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { Btn, IssueBadge, PageHeader } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Issue = Database['public']['Tables']['issues']['Row'];

interface Block {
  id: string;
  type: 'text' | 'image';
  value?: string;
  url?: string;
}

const newId = () => 'b' + Math.random().toString(36).slice(2, 9);

export function ComposeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [linkedIssue, setLinkedIssue] = useState<Issue | null>(null);
  const [stance, setStance] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([{ id: 'b0', type: 'text', value: '' }]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('issues')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      setIssues(data ?? []);
    })();
  }, []);

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    setError('');
    try {
      const ext = f.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('posts').upload(path, f);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('posts').getPublicUrl(path);
      setBlocks((bs) => [
        ...bs,
        { id: newId(), type: 'image', url: data.publicUrl },
        { id: newId(), type: 'text', value: '' },
      ]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '上传失败');
    }
  }

  const totalChars = blocks.filter((b) => b.type === 'text').reduce((s, b) => s + (b.value?.length ?? 0), 0);
  const canPublish = title.trim().length > 0 && totalChars > 0 && !submitting;

  async function publish() {
    if (!user || !canPublish) return;
    setSubmitting(true);
    setError('');
    try {
      const cleanBlocks = blocks.filter(
        (b) => (b.type === 'text' && b.value?.trim()) || (b.type === 'image' && b.url)
      );
      const { error: e } = await supabase.from('posts').insert({
        author_id: user.id,
        title: title.trim(),
        content: cleanBlocks as never,
        issue_id: linkedIssue?.id ?? null,
        stance: stance,
      });
      if (e) throw e;
      navigate('/square');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader
        title={COPY.composeTitle}
        back
        onBack={() => navigate(-1)}
        action={
          <Btn kind="primary" size="sm" disabled={!canPublish} onClick={publish}>
            {submitting ? '发布中…' : COPY.composePublish}
          </Btn>
        }
      />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Issue picker */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 14,
            boxShadow: TOKENS.shadowSm,
            cursor: 'pointer',
          }}
          onClick={() => setPickerOpen((o) => !o)}
        >
          {linkedIssue ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IssueBadge
                title={linkedIssue.title}
                stance={stance == null ? null : stance ? 'support' : 'oppose'}
              />
              <div style={{ flex: 1 }} />
              <Btn
                kind="support"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setStance(true);
                }}
                style={{ opacity: stance === true ? 1 : 0.5 }}
              >
                支持
              </Btn>
              <Btn
                kind="oppose"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setStance(false);
                }}
                style={{ opacity: stance === false ? 1 : 0.5 }}
              >
                反对
              </Btn>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: TOKENS.warm600 }}>＋ 关联议题（可选）</div>
          )}
        </div>

        {pickerOpen && (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 8,
              boxShadow: TOKENS.shadowSm,
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {issues.map((i) => (
              <div
                key={i.id}
                onClick={() => {
                  setLinkedIssue(i);
                  setPickerOpen(false);
                }}
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: TOKENS.warm700,
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                {i.title}
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: TOKENS.shadowSm }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={COPY.composeTitlePlaceholder}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: 'none',
              outline: 'none',
              padding: 0,
              fontSize: 18,
              fontWeight: 700,
              color: TOKENS.warm900,
              background: 'transparent',
              fontFamily: TOKENS.fontSans,
            }}
          />
        </div>

        {/* Block editor */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: TOKENS.shadowSm,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {blocks.map((b) =>
            b.type === 'text' ? (
              <textarea
                key={b.id}
                value={b.value ?? ''}
                onChange={(e) => updateBlock(b.id, { value: e.target.value })}
                placeholder={COPY.composeBodyPlaceholder}
                rows={4}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: 'none',
                  outline: 'none',
                  padding: 0,
                  fontSize: 15,
                  color: TOKENS.warm800,
                  lineHeight: 1.7,
                  resize: 'vertical',
                  minHeight: 80,
                  background: 'transparent',
                  fontFamily: TOKENS.fontSans,
                }}
              />
            ) : (
              <div key={b.id} style={{ position: 'relative' }}>
                <img src={b.url} alt="" style={{ width: '100%', borderRadius: 12 }} />
              </div>
            )
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px dashed ${TOKENS.warm300}`,
              background: 'transparent',
              color: TOKENS.warm600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: TOKENS.fontSans,
            }}
          >
            ＋ 插入图片
          </button>
        </div>

        {error && (
          <div
            style={{
              fontSize: 13,
              color: TOKENS.wrong,
              background: TOKENS.wrongTint,
              padding: '10px 12px',
              borderRadius: 10,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
