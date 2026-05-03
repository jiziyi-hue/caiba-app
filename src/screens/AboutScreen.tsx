import { useNavigate } from 'react-router-dom';
import { TOKENS } from '../components/tokens';
import { PageHeader } from '../components/shared';
import { Footer } from '../components/Footer';
import { RANK_TIERS } from '../lib/ranks';

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


export function AboutScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh' }}>
      <PageHeader title="关于 灼见" sub="押注式判断力打分平台" back onBack={() => navigate(-1)} />

      <div
        style={{
          padding: '14px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Section title="「灼见」是什么">
          <p style={{ margin: 0 }}>
            一个押注式判断力打分平台。每个议题你押「支持」或「反对」，等结果出来后看你的准确率。
            不押钱、押眼力 —— 看谁能在迷雾里先看见火光。
          </p>
        </Section>

        <Section title="议题流程">
          <p style={{ margin: 0 }}>
            创建 → 开放表态期（任何登录用户可押注）→ 管理员关闭判断期 →
            管理员核验结果 → 结算（自动回填到所有押注用户的准确率）。
          </p>
        </Section>

        <Section title="段位系统">
          <p style={{ margin: '0 0 12px' }}>
            9 段双向。准确率越靠两端段位越极端 —— 高端是「神级判官」，低端是「反向先知」（持续看反，反着押反而更准）。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RANK_TIERS.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: TOKENS.warm25,
                  borderRadius: 10,
                  padding: '8px 10px',
                  border: `1px solid ${TOKENS.warm100}`,
                }}
              >
                <img
                  src={t.img}
                  width={40}
                  height={40}
                  style={{ borderRadius: 999, objectFit: 'cover', flexShrink: 0 }}
                  alt={t.name}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: TOKENS.warm900 }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: 12, color: TOKENS.warm500, fontVariantNumeric: 'tabular-nums' }}>
                      {t.max === 100 ? `≥ ${t.min}%` : t.min === 0 ? `< ${t.max}%` : `${t.min} – ${t.max}%`}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: TOKENS.warm600, lineHeight: 1.4 }}>
                    {t.blurb}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', color: TOKENS.warm500, fontSize: 13 }}>
            需要至少 5 条结算才显示段位，否则显示「积累中」。
          </p>
        </Section>

        <Section title="板块">
          <p style={{ margin: 0 }}>
            时事 / 科技 / 娱乐 / 体育 / 游戏 五大板块，外加一个跨板块合并的「通用」段位。
            每个板块独立计算段位，你可能在科技封神，也可能在娱乐反向先知。
          </p>
        </Section>

        <Section title="议题来源">
          <p style={{ margin: 0 }}>
            任何用户都能投稿议题（提交后等管理员审核）。管理员可直接发布，无需审核。
            审核标准：可量化、有明确结算来源、不引战。
          </p>
        </Section>

        <Section title="结算来源">
          <p style={{ margin: 0 }}>
            议题创建时会注明结算来源（如官方公告、权威媒体报道、官方榜单），
            管理员核验时附上具体 URL，任何人可点开复核。
          </p>
        </Section>

        <Section title="观点贴 vs 评论">
          <p style={{ margin: 0 }}>
            议题下能写「观点贴」（带立场，会算入站内观点统计）；
            观点贴和议题本身都能写评论（评论不带立场，纯讨论）。
          </p>
        </Section>

        <Section title="关注 + 通知">
          <p style={{ margin: 0 }}>
            关注用户后，他们的发帖会出现在你「广场」的「关注」tab。
            点赞、评论、关注、结算结果都会进通知页（铃铛入口）。
          </p>
        </Section>

        <Section title="管理规则">
          <p style={{ margin: 0 }}>
            议题作废：若结算来源消失或议题本身有歧义，管理员可作废，已押注用户不计入准确率。
            重新结算：若发现核验有误，管理员可重新结算，所有用户的准确率会自动重算。
          </p>
        </Section>

        <Footer />
      </div>
    </div>
  );
}
