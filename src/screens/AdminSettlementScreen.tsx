import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { Btn, PageHeader, Pill } from '../components/shared';
import { COPY } from '../lib/copy';
import type { Database } from '../types/db';

type Issue = Database['public']['Tables']['issues']['Row'];

type Mode = 'pending' | 'create';

export function AdminSettlementScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get('new') === '1' ? 'create' : 'pending');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('issues')
      .select('*')
      .order('deadline', { ascending: true })
      .limit(100);
    setIssues(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader
        title="管理员后台"
        back
        onBack={() => navigate('/')}
        action={
          <Btn
            kind="primary"
            size="sm"
            onClick={() => setMode(mode === 'create' ? 'pending' : 'create')}
          >
            {mode === 'create' ? '取消' : '新议题'}
          </Btn>
        }
      />

      {mode === 'create' ? (
        <CreateIssueForm onDone={() => { setMode('pending'); load(); }} />
      ) : (
        <PendingList issues={issues} loading={loading} onRefresh={load} />
      )}
    </div>
  );
}

function PendingList({
  issues,
  loading,
  onRefresh,
}: {
  issues: Issue[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const open = issues.filter((i) => i.status === 'pending' && i.is_open);
  const closed = issues.filter((i) => i.status === 'pending' && !i.is_open);
  const settled = issues.filter((i) => i.status !== 'pending');

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {loading ? <div style={{ color: TOKENS.warm500 }}>{COPY.loading}</div> : null}
      {!loading && (
        <>
          <Section title={`待结算（${closed.length}）`}>
            {closed.length === 0 ? (
              <Empty />
            ) : (
              closed.map((i) => <SettleRow key={i.id} issue={i} onDone={onRefresh} />)
            )}
          </Section>

          <Section title={`判断中（${open.length}）`}>
            {open.length === 0 ? (
              <Empty />
            ) : (
              open.map((i) => <IssueRow key={i.id} issue={i} onRefresh={onRefresh} />)
            )}
          </Section>

          <Section title={`已结算 / 作废（${settled.length}）`}>
            {settled.length === 0 ? (
              <Empty />
            ) : (
              settled.slice(0, 20).map((i) => (
                <SettledRow key={i.id} issue={i} onRefresh={onRefresh} />
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: TOKENS.warm600,
          marginBottom: 8,
          padding: '0 4px',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 18,
        textAlign: 'center',
        color: TOKENS.warm500,
        fontSize: 13,
        boxShadow: TOKENS.shadowSm,
      }}
    >
      （无）
    </div>
  );
}

function IssueRow({ issue, onRefresh }: { issue: Issue; onRefresh: () => void }) {
  const days = Math.ceil((new Date(issue.deadline).getTime() - Date.now()) / 86400000);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  async function closeJudging() {
    setBusy(true);
    await supabase.from('issues').update({ is_open: false }).eq('id', issue.id);
    setBusy(false);
    onRefresh();
  }

  async function cancelIssue() {
    if (!confirm(`作废该议题？已表态用户的判断不计入段位。\n\n${issue.title}`)) return;
    setBusy(true);
    await supabase
      .from('issues')
      .update({
        status: 'cancelled',
        is_open: false,
        settled_at: new Date().toISOString(),
        settlement_note: '管理员作废',
      })
      .eq('id', issue.id);
    setBusy(false);
    onRefresh();
  }

  if (editing) {
    return <EditIssueForm issue={issue} onCancel={() => setEditing(false)} onDone={() => { setEditing(false); onRefresh(); }} />;
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 14,
        boxShadow: TOKENS.shadowSm,
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Pill kind="indigo" size="sm">{issue.category}</Pill>
        <Pill kind="indigo" size="sm">截止 {days} 天后</Pill>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.warm800, lineHeight: 1.4 }}>
        {issue.title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: TOKENS.warm500,
          fontFamily: TOKENS.fontMono,
          marginTop: 6,
        }}
      >
        参与 {issue.total_count_cache ?? 0} · 计段位 {issue.ranked_count_cache ?? 0}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <Btn kind="secondary" size="sm" disabled={busy} onClick={closeJudging}>
          {busy ? '…' : '关闭判断期'}
        </Btn>
        <Btn kind="ghost" size="sm" disabled={busy} onClick={() => setEditing(true)}>
          编辑
        </Btn>
        <Btn kind="ghost" size="sm" disabled={busy} onClick={cancelIssue}>
          作废
        </Btn>
      </div>
    </div>
  );
}

function SettledRow({ issue, onRefresh }: { issue: Issue; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);

  async function unsettle() {
    if (!confirm(`重新结算该议题？\n用户准确率会回退；之后需重新走结算流程。\n\n${issue.title}`)) return;
    setBusy(true);
    const { error } = await supabase.rpc('unsettle_issue', { p_issue_id: issue.id });
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    onRefresh();
  }

  const statusLabel =
    issue.status === 'correct'
      ? { text: '✓ 支持方对', kind: 'correct' as const }
      : issue.status === 'wrong'
      ? { text: '✕ 反对方对', kind: 'wrong' as const }
      : { text: '已作废', kind: 'neutral' as const };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 14,
        boxShadow: TOKENS.shadowSm,
        opacity: 0.8,
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Pill kind="indigo" size="sm">{issue.category}</Pill>
        <Pill kind={statusLabel.kind} size="sm">{statusLabel.text}</Pill>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: TOKENS.warm800, lineHeight: 1.4 }}>
        {issue.title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: TOKENS.warm500,
          fontFamily: TOKENS.fontMono,
          marginTop: 6,
        }}
      >
        参与 {issue.total_count_cache ?? 0} · 结算于 {issue.settled_at ? new Date(issue.settled_at).toLocaleDateString('zh-CN') : '?'}
      </div>
      {issue.settlement_source && (
        <div style={{ fontSize: 11, color: TOKENS.warm500, marginTop: 4, wordBreak: 'break-all' }}>
          来源：{issue.settlement_source}
        </div>
      )}
      {issue.status !== 'cancelled' && (
        <Btn kind="ghost" size="sm" disabled={busy} onClick={unsettle} style={{ marginTop: 10 }}>
          {busy ? '…' : '重新结算'}
        </Btn>
      )}
    </div>
  );
}

function EditIssueForm({
  issue,
  onCancel,
  onDone,
}: {
  issue: Issue;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? '');
  const [deadline, setDeadline] = useState(issue.deadline.slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    const { error: e } = await supabase
      .from('issues')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        deadline: new Date(deadline + 'T23:59:59+08:00').toISOString(),
      })
      .eq('id', issue.id);
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    onDone();
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 14,
        boxShadow: TOKENS.shadowSm,
        border: `2px solid ${TOKENS.indigo500}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: TOKENS.warm700 }}>编辑议题</div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        style={inputStyle}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="描述"
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        style={inputStyle}
      />
      {error && <div style={{ fontSize: 12, color: TOKENS.wrong }}>{error}</div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn kind="primary" size="sm" disabled={busy || !title.trim()} onClick={save}>
          {busy ? '保存中…' : '保存'}
        </Btn>
        <Btn kind="ghost" size="sm" onClick={onCancel}>
          取消
        </Btn>
      </div>
    </div>
  );
}

function SettleRow({ issue, onDone }: { issue: Issue; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<'correct' | 'wrong' | 'cancelled'>('correct');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function settle() {
    setBusy(true);
    setError('');
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch('/api/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ issueId: issue.id, result, source, note }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '结算失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 14,
        boxShadow: TOKENS.shadowSm,
        border: `1px solid ${TOKENS.pending}`,
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Pill kind="indigo" size="sm">{issue.category}</Pill>
        <Pill kind="pending" size="sm">待结算</Pill>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.warm800 }}>{issue.title}</div>
      <div
        style={{
          fontSize: 11,
          color: TOKENS.warm500,
          fontFamily: TOKENS.fontMono,
          marginTop: 6,
        }}
      >
        参与 {issue.total_count_cache ?? 0} · 计段位 {issue.ranked_count_cache ?? 0}
      </div>
      {!open ? (
        <Btn kind="primary" size="sm" onClick={() => setOpen(true)} style={{ marginTop: 10 }}>
          结算
        </Btn>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['correct', 'wrong', 'cancelled'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResult(r)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: result === r ? TOKENS.indigo500 : TOKENS.warm50,
                  color: result === r ? '#fff' : TOKENS.warm700,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: TOKENS.fontSans,
                }}
              >
                {r === 'correct' ? '支持方对' : r === 'wrong' ? '反对方对' : '作废'}
              </button>
            ))}
          </div>
          <input
            type="url"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="结算来源 URL"
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${TOKENS.warm200}`,
              fontSize: 13,
              fontFamily: TOKENS.fontSans,
            }}
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="说明（可选）"
            rows={2}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${TOKENS.warm200}`,
              fontSize: 13,
              fontFamily: TOKENS.fontSans,
              resize: 'vertical',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: TOKENS.wrong }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn kind="primary" size="sm" disabled={busy || !source} onClick={settle}>
              {busy ? '提交中…' : '确认结算'}
            </Btn>
            <Btn kind="ghost" size="sm" onClick={() => setOpen(false)}>
              取消
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateIssueForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState<'时事' | '科技' | '娱乐' | '体育' | '游戏'>('科技');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const deadline = new Date(Date.now() + deadlineDays * 86400000).toISOString();
      const { error: e } = await supabase.from('issues').insert({
        category,
        title: title.trim(),
        description: description.trim() || null,
        deadline,
        is_open: true,
      });
      if (e) throw e;
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: TOKENS.shadowSm }}>
        <Lbl>分类</Lbl>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['时事', '科技', '娱乐', '体育', '游戏'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: 'none',
                background: category === c ? TOKENS.indigo500 : TOKENS.warm50,
                color: category === c ? '#fff' : TOKENS.warm700,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: TOKENS.fontSans,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: TOKENS.shadowSm }}>
        <Lbl>标题</Lbl>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：苹果今年会不会发布折叠屏 iPhone？"
          style={inputStyle}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: TOKENS.shadowSm }}>
        <Lbl>描述</Lbl>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="结算来源、关键变量等"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: TOKENS.shadowSm }}>
        <Lbl>结算 deadline（从现在起的天数）</Lbl>
        <NumField label="天后" value={deadlineDays} onChange={setDeadlineDays} />
      </div>

      {error && <div style={{ color: TOKENS.wrong, fontSize: 13 }}>{error}</div>}

      <Btn
        kind="primary"
        size="lg"
        disabled={busy || !title.trim()}
        onClick={submit}
        style={{ alignSelf: 'flex-start' }}
      >
        {busy ? '创建中…' : '创建议题'}
      </Btn>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${TOKENS.warm200}`,
  fontSize: 14,
  fontFamily: TOKENS.fontSans,
  outline: 'none',
};

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: TOKENS.warm500,
        fontFamily: TOKENS.fontMono,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: TOKENS.warm400, marginBottom: 4 }}>{label}</div>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || '0'))}
        style={inputStyle}
      />
    </label>
  );
}
