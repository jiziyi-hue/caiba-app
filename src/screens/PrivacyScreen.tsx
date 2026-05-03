import { useNavigate } from 'react-router-dom';
import { TOKENS } from '../components/tokens';
import { PageHeader } from '../components/shared';
import { Footer } from '../components/Footer';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 18,
        boxShadow: TOKENS.shadowSm,
      }}
    >
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: TOKENS.warm800,
          margin: '0 0 10px',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 14,
          color: TOKENS.warm700,
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const ulStyle: React.CSSProperties = { margin: 0, paddingLeft: 20 };

export function PrivacyScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh' }}>
      <PageHeader title="隐私政策" sub="最后更新 2026-05" back onBack={() => navigate(-1)} />

      <div
        style={{
          padding: '14px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Section title="收集的数据">
          <ul style={ulStyle}>
            <li>邮箱（注册必需，用于登录与必要的服务通知）</li>
            <li>昵称、个人简介、头像（均可选，不填不影响使用）</li>
            <li>你在站内的表态、帖子、评论、关注关系、点赞记录</li>
          </ul>
        </Section>

        <Section title="怎么用">
          <ul style={ulStyle}>
            <li>提供服务：计算你的准确率与段位、显示判断履历</li>
            <li>站内通知：点赞、评论、关注、结算结果等活动通知</li>
            <li>反垃圾与安全：速率限制、防止账号盗用与刷量</li>
          </ul>
        </Section>

        <Section title="第三方">
          <ul style={ulStyle}>
            <li>
              <strong>Supabase</strong> —— 数据库、身份认证、文件存储
            </li>
            <li>
              <strong>Cloudflare</strong> —— CDN、DNS、Pages 静态托管
            </li>
          </ul>
          <p style={{ margin: '8px 0 0' }}>
            我们<strong>不向任何第三方出售你的数据</strong>，也不用作站外定向广告。
          </p>
        </Section>

        <Section title="Cookie">
          <p style={{ margin: 0 }}>
            我们仅使用维持登录状态所必需的认证 cookie，不使用第三方追踪 cookie，不做跨站行为画像。
          </p>
        </Section>

        <Section title="用户权利">
          <ul style={ulStyle}>
            <li>访问：随时查看自己的资料与历史记录</li>
            <li>修改：在「我」→「编辑」处更新昵称、简介、头像</li>
            <li>
              删除 / 注销账号：进入{' '}
              <code style={{ fontFamily: TOKENS.fontMono, background: TOKENS.warm50, padding: '1px 6px', borderRadius: 4 }}>
                /me/edit
              </code>{' '}
              页面，底部有「注销账号」入口
            </li>
          </ul>
        </Section>

        <Section title="数据保留">
          <ul style={ulStyle}>
            <li>账号注销后，个人资料与你发布的内容会立即删除</li>
            <li>站内通知记录在 30 天后会自动清理</li>
            <li>少量必要的服务日志（出于安全审计）保留时间不超过 90 天</li>
          </ul>
        </Section>

        <Section title="未成年人">
          <p style={{ margin: 0 }}>
            本平台不面向 14 岁以下未成年人。如果你未满 14 岁，请勿注册或使用本服务。
            如发现 14 岁以下用户已注册，我们会主动删除其账号与相关数据。
          </p>
        </Section>

        <Section title="变更通知">
          <p style={{ margin: 0 }}>
            本政策若发生重大变更，我们将在生效前 7 天通过站内通知和登录后顶部提示告知你；
            继续使用本服务视为接受变更后的政策。
          </p>
        </Section>

        <Section title="联系">
          <p style={{ margin: 0 }}>
            隐私相关问题、数据请求、政策建议，请联系{' '}
            <a
              href="mailto:jiziyi@graduate.utm.my"
              style={{ color: TOKENS.indigo600, textDecoration: 'none' }}
            >
              jiziyi@graduate.utm.my
            </a>
            。
          </p>
        </Section>

        <Footer />
      </div>
    </div>
  );
}
