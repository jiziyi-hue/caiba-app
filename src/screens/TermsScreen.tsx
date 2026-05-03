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

export function TermsScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ background: TOKENS.warm25, minHeight: '100vh' }}>
      <PageHeader title="用户协议" sub="最后更新 2026-05" back onBack={() => navigate(-1)} />

      <div
        style={{
          padding: '14px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Section title="服务范围">
          <p style={{ margin: 0 }}>
            灼见（以下简称「本平台」）是一个供用户对公开议题进行押注式预测、
            发布观点、参与讨论的内容社区。本协议适用于你访问、注册、使用本平台的所有行为。
          </p>
        </Section>

        <Section title="用户资格">
          <p style={{ margin: 0 }}>
            注册账号需年满 14 周岁，且过往无被本平台封禁的记录。
            未满 14 岁请在监护人陪同下使用，或暂时不要使用本平台。
          </p>
        </Section>

        <Section title="内容所有权">
          <p style={{ margin: 0 }}>
            你发布的议题、观点、评论等内容，版权归你所有；
            但你授予本平台在全球范围内非独家、免费的展示、存储、分发、为运营所需的处理权利，
            以便其他用户能正常浏览。
          </p>
        </Section>

        <Section title="禁止行为">
          <p style={{ margin: '0 0 6px' }}>请勿在本平台发布或参与以下内容：</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>色情、暴力、恐怖主义等违反公序良俗的内容</li>
            <li>政治敏感、煽动民族/地域对立的内容</li>
            <li>真实金钱押注、博彩、赌博相关行为</li>
            <li>恶意灌水、刷量、批量注册账号</li>
            <li>抄袭他人作品、侵犯他人著作权或人身权利</li>
            <li>诈骗、传销、虚假广告</li>
          </ul>
        </Section>

        <Section title="内容审核权">
          <p style={{ margin: 0 }}>
            本平台有权对违反本协议或法律法规的内容进行删除、屏蔽，
            对违规账号进行警告、临时禁言、永久封禁等处理，且无须事先通知。
          </p>
        </Section>

        <Section title="免责声明">
          <p style={{ margin: 0 }}>
            议题预测仅供娱乐，不构成任何投资、财务、法律或医疗建议。
            本平台不对议题结果做任何担保，不对用户根据议题内容做出的现实决策负责。
          </p>
        </Section>

        <Section title="终止条款">
          <p style={{ margin: 0 }}>
            你可以随时通过个人主页注销账号，终止与本平台的协议关系。
            本平台亦可在你违反本协议时，单方面终止向你提供服务。
          </p>
        </Section>

        <Section title="适用法律">
          <p style={{ margin: 0 }}>
            本协议适用中华人民共和国法律。如发生争议，双方应先友好协商；
            协商不成的，提交本平台运营方所在地有管辖权的人民法院解决。
          </p>
        </Section>

        <Section title="联系方式">
          <p style={{ margin: 0 }}>
            协议相关问题、内容投诉、账号问题，请联系{' '}
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
