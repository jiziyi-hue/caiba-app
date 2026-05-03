import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TOKENS } from '../components/tokens';
import { Btn } from '../components/shared';
import { COPY } from '../lib/copy';

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setError(COPY.errWeakPassword);
          return;
        }
        if (!name.trim()) {
          setError('给自己起个名字吧');
          return;
        }
        const { error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        });
        if (signErr) {
          setError(translateErr(signErr.message));
          return;
        }
        setConfirmSent(true);
      } else {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) {
          setError(translateErr(loginErr.message));
          return;
        }
        const raw = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
        const from = raw === '/login' ? '/' : raw;
        navigate(from, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmSent) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: TOKENS.warm800 }}>
            注册成功
          </h2>
          <p style={{ color: TOKENS.warm600, lineHeight: 1.6 }}>
            去 <strong>{email}</strong> 收件箱点确认链接，再回来登录。
          </p>
          <Btn
            kind="ghost"
            size="md"
            onClick={() => {
              setConfirmSent(false);
              setMode('login');
            }}
            style={{ marginTop: 24 }}
          >
            返回登录
          </Btn>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: TOKENS.warm900, letterSpacing: '-0.02em', margin: 0 }}>
        {COPY.brand}
      </h1>
      <p style={{ color: TOKENS.warm500, marginTop: 4, marginBottom: 28, fontSize: 13 }}>
        {COPY.tagline}
      </p>

      <div
        style={{
          display: 'flex',
          gap: 4,
          background: TOKENS.warm50,
          borderRadius: 10,
          padding: 3,
          marginBottom: 20,
        }}
      >
        {(['login', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: 14,
              fontWeight: mode === m ? 700 : 500,
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? TOKENS.warm900 : TOKENS.warm600,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontFamily: TOKENS.fontSans,
            }}
          >
            {m === 'login' ? COPY.loginTitle : COPY.signupTitle}
          </button>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'signup' && (
          <Field
            label={COPY.nameLabel}
            value={name}
            onChange={setName}
            placeholder="比如 判官-Y"
            maxLength={16}
          />
        )}
        <Field
          label={COPY.emailLabel}
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
        />
        <Field
          label={COPY.passwordLabel}
          value={password}
          onChange={setPassword}
          placeholder="至少 6 位"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />

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

        <Btn
          type="submit"
          kind="primary"
          size="lg"
          disabled={submitting || !email || !password}
          style={{ width: '100%', marginTop: 8 }}
        >
          {submitting ? '正在算账…' : mode === 'login' ? COPY.loginBtn : COPY.signupBtn}
        </Btn>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: TOKENS.warm25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: TOKENS.fontSans,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 400,
          boxShadow: TOKENS.shadowMd,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontSize: 11,
          color: TOKENS.warm500,
          fontFamily: TOKENS.fontMono,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${TOKENS.warm200}`,
          fontSize: 15,
          fontFamily: TOKENS.fontSans,
          color: TOKENS.warm900,
          background: TOKENS.warm25,
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = TOKENS.indigo500)}
        onBlur={(e) => (e.currentTarget.style.borderColor = TOKENS.warm200)}
      />
    </label>
  );
}

function translateErr(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('already registered')) return COPY.errEmailExists;
  if (m.includes('invalid login credentials') || m.includes('invalid')) return COPY.errWrongPassword;
  if (m.includes('email not confirmed')) return COPY.errEmailNotConfirmed;
  if (m.includes('password')) return COPY.errWeakPassword;
  return msg || COPY.errGeneric;
}
