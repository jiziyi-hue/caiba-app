import { Link } from 'react-router-dom';
import { TOKENS } from './tokens';

const linkStyle: React.CSSProperties = {
  color: TOKENS.warm500,
  textDecoration: 'none',
};

/**
 * Tiny footer: legal links + contact email.
 * Centered, gray, intentionally low-key. Place above TabBar where needed.
 */
export function Footer() {
  return (
    <footer
      style={{
        padding: '24px 16px 12px',
        textAlign: 'center',
        fontSize: 11,
        color: TOKENS.warm400,
        lineHeight: 1.8,
        fontFamily: TOKENS.fontSans,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Link to="/about" style={linkStyle}>
          关于
        </Link>
        <span style={{ color: TOKENS.warm200 }}>·</span>
        <Link to="/terms" style={linkStyle}>
          用户协议
        </Link>
        <span style={{ color: TOKENS.warm200 }}>·</span>
        <Link to="/privacy" style={linkStyle}>
          隐私政策
        </Link>
      </div>
      <div style={{ marginTop: 6 }}>
        <a href="mailto:jiziyi@graduate.utm.my" style={linkStyle}>
          jiziyi@graduate.utm.my
        </a>
      </div>
    </footer>
  );
}
