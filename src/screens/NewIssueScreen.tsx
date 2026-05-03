import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { TOKENS } from '../components/tokens';
import { Btn, PageHeader } from '../components/shared';
import { ISSUE_CATEGORIES, type IssueCategory } from '../lib/categories';
import { inputStyle } from '../lib/form-styles';

type Category = IssueCategory;

export function NewIssueScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [category, setCategory] = useState<Category>(ISSUE_CATEGORIES[1]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!user) return navigate('/login');
    setBusy(true);
    setError('');
    try {
      const deadline = new Date(Date.now() + deadlineDays * 86400000).toISOString();
      const { error: e } = await supabase.from('issues').insert({
        creator_id: user.id,
        category,
        title: title.trim(),
        description: description.trim() || null,
        deadline,
        is_open: true,
        review_status: profile?.is_admin ? 'approved' : 'pending',
      });
      if (e) throw e;
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div style={{ background: TOKENS.warm25, minHeight: '100vh' }}>
        <PageHeader title="提交成功" back onBack={() => navigate('/')} />
        <div
          style={{
            margin: 20,
            padding: 28,
            background: '#fff',
            borderRadius: 16,
            textAlign: 'center',
            boxShadow: TOKENS.shadowSm,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TOKENS.warm900, marginBottom: 8 }}>
            {profile?.is_admin ? '议题已发布' : '已提交，等管理员审核'}
          </div>
          <div style={{ fontSize: 13, color: TOKENS.warm600, lineHeight: 1.6 }}>
            {profile?.is_admin
              ? '已直接上架，去首页看看。'
              : '通过审核后会出现在首页，结果会通过通知告诉你。'}
          </div>
          <Btn
            kind="primary"
            size="md"
            onClick={() => navigate('/')}
            style={{ marginTop: 18 }}
          >
            回首页
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="新议题" back onBack={() => navigate(-1)} />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!profile?.is_admin && (
          <div
            style={{
              padding: '12px 14px',
              background: TOKENS.indigo50,
              color: TOKENS.indigo700,
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            议题需通过管理员审核才会公开。审核标准：可量化、有结算来源、不引战。
          </div>
        )}

        <Card>
          <Lbl>分类</Lbl>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ISSUE_CATEGORIES.map((c) => (
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
        </Card>

        <Card>
          <Lbl>标题</Lbl>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：苹果今年会不会发布折叠屏 iPhone？"
            maxLength={80}
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: TOKENS.warm500, marginTop: 4, textAlign: 'right' }}>
            {title.length}/80
          </div>
        </Card>

        <Card>
          <Lbl>描述</Lbl>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="结算来源、关键变量、定义边界等。例如：结算来自苹果官方发布会"
            maxLength={500}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          />
        </Card>

        <Card>
          <Lbl>结算 deadline</Lbl>
          <input
            type="number"
            min={1}
            max={365}
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(parseInt(e.target.value || '0'))}
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: TOKENS.warm500, marginTop: 6 }}>
            从今天起 {deadlineDays} 天后到期 ·{' '}
            {new Date(Date.now() + deadlineDays * 86400000).toLocaleDateString('zh-CN')}
          </div>
        </Card>

        {error && (
          <div style={{ color: TOKENS.wrong, fontSize: 13, padding: '0 4px' }}>{error}</div>
        )}

        <Btn
          kind="primary"
          size="lg"
          disabled={busy || !title.trim()}
          onClick={submit}
          style={{ alignSelf: 'flex-start' }}
        >
          {busy ? '提交中…' : profile?.is_admin ? '直接发布' : '提交审核'}
        </Btn>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: TOKENS.shadowSm }}>
      {children}
    </div>
  );
}

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
