// Seed 11 五一档/五一收尾/科技/游戏 issues + admin posts on each
// Uses service-role key. One-shot script.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
);

const supa = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find admin profile id
const { data: admin, error: aErr } = await supa
  .from('profiles')
  .select('id, name')
  .eq('is_admin', true)
  .limit(1)
  .single();
if (aErr || !admin) {
  console.error('admin lookup failed', aErr);
  process.exit(1);
}
console.log('admin:', admin.id, admin.name);

const D = (days) => new Date(Date.now() + days * 86400000).toISOString();

const issues = [
  {
    category: '娱乐',
    title: '五一档总票房能否突破4亿元？',
    description:
      '五一黄金周院线大考。截至5月3日累计票房已超2.3亿元。《寒战1994》头部位置但口碑能否带动后劲尚未明朗；外加全国出行高位运行挤压观影需求。结算来源：5月6日0时猫眼实时票房。',
    deadline: D(4),
    stance: true,
    post_title: '4亿能破，但要看周末两天单日冲击',
    post_content:
      '我押支持。截至5月3日累票破2.3亿，照《寒战1994》当前的口碑发酵速度，5月4日单日冲到8000万以上不算离谱。五一档周末通常贡献60%以上票仓，加上下沉市场对话题片的高敏感度，4亿是可达门槛。',
  },
  {
    category: '娱乐',
    title: '《你好星期六》能否在5月10日前公开道歉？',
    description:
      '张婧仪工作室声明节目组侵权，要求道歉。微博话题热度超8万。结算清晰：节目组官方微博或湖南卫视渠道发出致歉即成立。',
    deadline: D(8),
    stance: false,
    post_title: '不会道歉，平台冷处理是惯例',
    post_content:
      '押反对。正式道歉等于承认过错，后续索赔风险打开。湖南卫视和节目组的标准动作是冷处理拖延、等热度散去再无声了结。除非舆论失控到广告主撤资，他们不会主动开口。',
  },
  {
    category: '科技',
    title: 'DeepSeek v4 Pro 2.5折优惠5月31日后还会延续吗？',
    description:
      'DeepSeek宣布v4 Pro 2.5折延长至2026年5月31日，已是第二次续期。知乎讨论热度超111万。结算：6月1日查官网定价页或公众号公告。',
    deadline: D(30),
    stance: true,
    post_title: '续期路径已成依赖，6月还会延',
    post_content:
      '押会续。两次续期已经把用户的低价预期锚定，撤回的流失成本远高于继续补贴。叠加阿里腾讯字节的价格战白热化，DeepSeek单方面恢复原价等于主动让位市场份额，从商业算盘看动力不足。',
  },
  {
    category: '科技',
    title: '小米汽车5月交付量能否超越4月？',
    description:
      '4月小米汽车交付超3万台。5月能否持续增长？SU7产能爬坡、SU7 Ultra拉升关注度，但理想问界同期发力。结算：6月初官方月度交付公告。',
    deadline: D(32),
    stance: true,
    post_title: 'SU7 Ultra 把均价拉上去，5月能赢',
    post_content:
      '押会超越。五一展厅客流叠加SU7 Ultra拉升订单，产能端SU7爬坡已稳。关键是「超3万」的实际数字若是3.1万，5月做到3.5万并不困难。理想问界确实在挤压但小米的品牌势能仍然在加速期。',
  },
  {
    category: '游戏',
    title: '鸣潮2周年庆（5月23日）新版本会不会登上iOS畅销榜Top10？',
    description: '鸣潮2周年庆+新版本同步上线。结算：5月23日当天 App Store中国区畅销榜Top10。',
    deadline: D(20),
    stance: true,
    post_title: '周年庆叠新角色，进Top10是常规动作',
    post_content:
      '押进Top10。库洛对周年庆的资源投放是历来最重，叠加新主角色卡池+大版本更新，5月23日单日流水冲榜不是难事。鸣潮过去几次大版本都做到过Top5，2周年这种节点更不会差。',
  },
  {
    category: '游戏',
    title: '原神今年会不会在鸣潮周年前推出重大更新来「截流」？',
    description: '鸣潮5月23日2周年庆。米哈游是否在此之前推出原神重大更新争夺玩家注意力？结算：5月22日前原神官方公告。',
    deadline: D(19),
    stance: false,
    post_title: '原神不靠时间点截流，按版本节奏来',
    post_content:
      '押不会。原神的更新节奏一直按6周一版本走，不会因为友商节点临时调整。米哈游过去对竞品的态度是「我们做我们的」，4.x到5.x切换的节点有自己的内容编排，强行插队反而打乱长期规划。',
  },
  {
    category: '时事',
    title: '今年五一假期全国旅游总收入会不会超过去年同期？',
    description: '去年五一国内出游3.14亿人次。结算：5月5日 文化和旅游部官方数据。',
    deadline: D(2),
    stance: true,
    post_title: '出行高位+消费回暖，破纪录可期',
    post_content:
      '押会超。今年五一全国路网持续高位运行、铁路客流连创新高，旅游消费数据通常滞后但同向。文旅部去年披露了3.14亿人次，今年中端目的地涨价、夜经济活跃度更高，总收入超去年是高概率事件。',
  },
  {
    category: '时事',
    title: '五一结束后第一天（5月6日）微博热搜会不会出现「上班」相关话题？',
    description: '每年五一结束后打工人归来必上热搜。结算：5月6日早9点微博热搜榜。',
    deadline: D(3),
    stance: true,
    post_title: '这是年度铁律，不需要押',
    post_content:
      '押会出现。这是年年验证的微博铁律：长假最后一天晚上和首个工作日早上，「上班」「不想上班」「打工人」相关词条几乎必占热搜前30。今年还叠加5月9日补班的双重心理打击，热搜出现概率几乎100%。',
  },
  {
    category: '时事',
    title: '今年五一「特种兵旅游」还是「佛系躺平游」哪个更火？',
    description: '判断维度：主流媒体报道关键词频率+微博话题讨论量。结算：5月5日数据对比。支持=佛系躺平更火，反对=特种兵更火。',
    deadline: D(2),
    stance: true,
    post_title: '佛系反超，今年消费心态在变',
    post_content:
      '押佛系躺平更火。今年五一第二天就有大批博主发「在民宿躺三天」内容，明显比往年「打卡10景点」的特种兵叙事更受欢迎。Z世代旅游消费心态正从「值不值」转向「累不累」，主流媒体已经在跟进这个叙事。',
  },
  {
    category: '时事',
    title: '五一期间会不会有景区因为人太多登上热搜被骂？',
    description: '每年五一必有景区上热搜投诉话题。结算：5月5日微博热搜记录。',
    deadline: D(2),
    stance: true,
    post_title: '重庆洪崖洞或泰山候选',
    post_content:
      '押会有。每年五一这个赛道竞争激烈：重庆洪崖洞每平方米四人、泰山台阶上动弹不得、淄博烧烤烟火气过载、长城西八楼挤成沙丁鱼。今年又是出行峰值年，景区投诉热搜不出现才是异常。',
  },
  {
    category: '时事',
    title: '今年五一之后「节后综合症」话题会不会比去年更热？',
    description: '判断维度：微博话题阅读量同比。结算：5月7日微博话题数据。',
    deadline: D(4),
    stance: true,
    post_title: '5月9日补班是叠加buff',
    post_content:
      '押更热。今年「节后综合症」赶上5月9日（周六）补班这个特殊节点，等于五一假期+补班双重打击，社交媒体情绪输出渠道被点燃。去年只有节后两天工作就到周末，缓冲足；今年没有缓冲、直接补班，话题热度大概率创新高。',
  },
];

const created = [];
for (const it of issues) {
  const { data: ins, error: e } = await supa
    .from('issues')
    .insert({
      creator_id: admin.id,
      category: it.category,
      title: it.title,
      description: it.description,
      opens_at: new Date().toISOString(),
      deadline: it.deadline,
      is_open: true,
    })
    .select()
    .single();
  if (e) {
    console.error('issue insert failed', it.title, e);
    continue;
  }
  console.log('+ issue', ins.id, it.title);
  created.push({ ...it, issue_id: ins.id });
}

// Insert posts
for (const it of created) {
  const { error: e } = await supa.from('posts').insert({
    author_id: admin.id,
    issue_id: it.issue_id,
    title: it.post_title,
    content: [{ type: 'text', value: it.post_content }],
    stance: it.stance,
  });
  if (e) {
    console.error('post insert failed', it.post_title, e);
    continue;
  }
  console.log('+ post', it.post_title);
}

// Also insert a judgment under admin (since they're committing the take)
for (const it of created) {
  const { error: e } = await supa.from('judgments').insert({
    user_id: admin.id,
    issue_id: it.issue_id,
    stance: it.stance,
    counts_toward_rank: true,
  });
  if (e) console.error('judgment insert failed', it.post_title, e.message);
}

console.log('done. created', created.length, 'issues');
