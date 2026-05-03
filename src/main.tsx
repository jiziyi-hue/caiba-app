import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/tokens.css'
import App from './App.tsx'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; msg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, msg: '' };
  }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, msg: (e?.stack || e?.message || String(e)).slice(0, 1500) };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 18, color: '#3A3833', marginBottom: 12, fontWeight: 700 }}>出错了</div>
          <pre style={{ fontSize: 11, color: '#7C7770', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#F5F1EA', padding: 12, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
            {this.state.msg}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, msg: '' }); window.location.href = '/'; }}
            style={{ marginTop: 14, padding: '10px 20px', borderRadius: 8, background: '#1A73E8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            返回首页
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
