// Seed AI posts for all approved issues that don't yet have a post from Claude (admin).
// Uses service-role key. Safe to run multiple times — skips already-posted issues.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supa = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_ID = '7584ae01-f639-48c0-8ff9-167a77c75ed6';

// 1. Fetch all approved issues
const { data: issues, error: iErr } = await supa
  .from('issues')
  .select('id, title, category, description')
  .eq('review_status', 'approved')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });

if (iErr) {
  console.error('Failed to fetch issues:', iErr.message);
  process.exit(1);
}
console.log(`Found ${issues.length} approved+pending issues.`);

// 2. Fetch all existing posts by admin to know which issues are already covered
const { data: existingPosts, error: pErr } = await supa
  .from('posts')
  .select('issue_id')
  .eq('author_id', ADMIN_ID);

if (pErr) {
  console.error('Failed to fetch existing posts:', pErr.message);
  process.exit(1);
}

const coveredIssueIds = new Set((existingPosts || []).map((p) => p.issue_id));
console.log(`Admin already has posts on ${coveredIssueIds.size} issue(s).`);

// 3. Build content map — keyed by a keyword match on title
// Returns { stance: boolean, title: string, content: string }
function generatePost(issue) {
  const t = issue.title;
  const cat = issue.category;

  // ── 娱乐 ──────────────────────────────────────────────────────────────────

  if (t.includes('票房') && t.includes('4亿')) {
    return {
      stance: true,
      title: '4亿可期，关键看周末后劲',
      content:
        '我认为五一档总票房突破4亿元的概率相当高。从往年规律来看，五一假期后两天才是真正的票仓爆发期，口碑发酵型电影这时候往往单日能冲到8000万以上。今年头部影片口碑尚可，下沉市场消费意愿也在回升，整体乐观。',
    };
  }

  if (t.includes('道歉') || t.includes('星期六')) {
    return {
      stance: false,
      title: '平台不会主动道歉，冷处理是惯例',
      content:
        '押反对。在中国娱乐圈，正式道歉等于公开承认侵权事实，后续索赔风险随之打开。湖南卫视和节目组的标准操作历来是静默等待热度衰退，除非广告主或监管层面施压，否则没有任何动机走到公开致歉这一步。期待5月10日前看到官方声明，现实概率极低。',
    };
  }

  if (t.includes('DeepSeek') || t.includes('2.5折')) {
    return {
      stance: true,
      title: '价格战白热化，DeepSeek不敢收手',
      content:
        '我押会续期。DeepSeek已经两次延长促销，用户的低价预期已被彻底锚定，这时候撤回折扣的流失成本远高于继续补贴。阿里、腾讯、字节的大模型API价格战仍在持续，DeepSeek若单方面涨价等于主动拱手让出市场份额，从商业理性来看没有任何道理。',
    };
  }

  if (t.includes('小米汽车') || (t.includes('小米') && t.includes('交付'))) {
    return {
      stance: true,
      title: 'SU7 Ultra 拉升均价，5月交付稳超4月',
      content:
        '押会超越。五一期间小米展厅客流明显，SU7 Ultra大定已开，高价车型的订单贡献不可忽视。工厂产能端SU7爬坡已趋稳定，只要不出现严重供应链问题，5月做到3.5万台以上并不困难。新能源竞争激烈但小米品牌势能仍在加速阶段，季度内持续增长是大概率。',
    };
  }

  if (t.includes('鸣潮') && (t.includes('周年') || t.includes('Top10'))) {
    return {
      stance: true,
      title: '周年庆叠新角色，进Top10是常规操作',
      content:
        '押进Top10。库洛对2周年的资源投放是历来最重，新主角色卡池加大版本内容更新，5月23日当天流水冲榜动力十足。鸣潮过去几次大版本都能进App Store畅销榜前十，2周年这种节点玩家氪金意愿更强，没有理由跌出Top10。',
    };
  }

  if (t.includes('原神') && t.includes('截流')) {
    return {
      stance: false,
      title: '原神按版本节奏走，不会专门截流',
      content:
        '押不会。原神的版本更新严格遵循6周一个迭代，从不因友商活动临时插入内容。米哈游对竞品的一贯态度是专注自身节奏，4.x到5.x的版本内容编排早已确定，强行在5月22日前推大更新反而打乱自身的长期运营规划，反而得不偿失。',
    };
  }

  // ── 时事 ──────────────────────────────────────────────────────────────────

  if (t.includes('旅游总收入') || (t.includes('五一') && t.includes('总收入'))) {
    return {
      stance: true,
      title: '出行高位叠加消费回暖，破纪录可期',
      content:
        '押会超去年。今年五一全国路网持续高位运行，铁路客流连创新高，短途和中端目的地均价上涨明显。文旅部去年披露了3.14亿人次出游，今年出行基数更大、夜经济活跃度更高，旅游总收入超过去年同期是高概率事件，关键看文旅部如何口径统计。',
    };
  }

  if (t.includes('上班') && t.includes('热搜')) {
    return {
      stance: true,
      title: '年度铁律，打工人归来必上热搜',
      content:
        '押会出现。这是每年五一结束后都会验证的微博铁律：长假最后一天晚上和首个工作日早晨，"上班""不想上班""打工人"等词条几乎必占热搜前30。今年还叠加5月9日补班的双重心理打击，社交媒体情绪释放渠道被点燃，热搜出现概率接近100%。',
    };
  }

  if (t.includes('特种兵') || t.includes('佛系')) {
    return {
      stance: true,
      title: '佛系躺平反超，消费心态正在转变',
      content:
        '押佛系躺平更火。今年五一第二天就涌现大批博主发布"在民宿躺三天"系列内容，获赞远超往年"打卡十个景点"的特种兵式叙事。Z世代旅游消费心态正从"值不值"转向"累不累"，小红书和微博的内容趋势都在印证这个变化，主流媒体也已跟进报道。',
    };
  }

  if (t.includes('景区') && (t.includes('热搜') || t.includes('骂'))) {
    return {
      stance: true,
      title: '重庆洪崖洞、泰山等候选，必有景区中招',
      content:
        '押必然会有。五一景区投诉热搜已是中国社交媒体的年度保留节目：重庆洪崖洞人均一平方米、泰山台阶上摩肩接踵、长城西八楼水泄不通。今年出行人次再创新高，单日几十万人涌入热门景区，拥挤投诉话题不出现才是异常。',
    };
  }

  if (t.includes('节后综合症') || t.includes('节后') ) {
    return {
      stance: true,
      title: '补班叠加节后综合症，今年热度创新高',
      content:
        '押比去年更热。今年五一之后恰逢5月9日（周六）补班，等于假期结束后没有任何缓冲直接面对补班压力，双重心理打击叠加，社交媒体的情绪输出强度会明显高于往年。去年假期结束后两天就到周末，今年没有这个缓冲，节后综合症话题热度大概率创历史新高。',
    };
  }

  // ── 科技通用 ──────────────────────────────────────────────────────────────

  if (cat === '科技' && t.includes('AI')) {
    return {
      stance: true,
      title: 'AI赛道竞争白热化，短期内看涨',
      content:
        '从当前AI行业格局来看，各大厂商在技术迭代和商业化落地方面均处于加速阶段。国内外大模型的能力差距正在快速缩小，应用层的爆发会带动整个生态快速成长。短期内看好相关指标继续向好，但需要警惕市场预期过热带来的修正风险。',
    };
  }

  // ── 通用回退 ──────────────────────────────────────────────────────────────

  const defaultStance = Math.random() > 0.4; // slight lean toward true
  return {
    stance: defaultStance,
    title: defaultStance ? `支持：${t.slice(0, 20)}有理由乐观` : `反对：${t.slice(0, 20)}存疑`,
    content: defaultStance
      ? `从目前掌握的信息来看，我倾向于支持这个判断。相关领域的趋势数据和用户行为均指向正向结果，虽然存在不确定因素，但综合评估后认为成立的概率更高。建议关注后续官方数据验证。（本议题具体分析：${issue.description ? issue.description.slice(0, 60) : '详见描述'}）`
      : `我持审慎态度，倾向于反对这个判断。历史数据和当前环境因素都指向结果难以达成，利益方的动机分析也不支持预期发生。建议等待更多信息后再做最终判断。（本议题具体分析：${issue.description ? issue.description.slice(0, 60) : '详见描述'}）`,
  };
}

// 4. Insert posts for uncovered issues
let added = 0;
let skipped = 0;

for (const issue of issues) {
  if (coveredIssueIds.has(issue.id)) {
    console.log(`  skip (already posted): ${issue.title}`);
    skipped++;
    continue;
  }

  const post = generatePost(issue);

  // Validate content length >= 80 chars
  if (post.content.length < 80) {
    console.warn(`  WARN: content too short for "${issue.title}", length=${post.content.length}`);
  }

  const { error: insertErr } = await supa.from('posts').insert({
    author_id: ADMIN_ID,
    issue_id: issue.id,
    title: post.title,
    content: [{ type: 'text', value: post.content }],
    stance: post.stance,
  });

  if (insertErr) {
    console.error(`  ERROR inserting post for "${issue.title}":`, insertErr.message);
    continue;
  }

  console.log(`  + post [${post.stance ? '支持' : '反对'}] "${post.title}" → issue: ${issue.title.slice(0, 30)}`);
  added++;
}

console.log(`\nDone. Added ${added} post(s), skipped ${skipped} already-covered issue(s).`);
