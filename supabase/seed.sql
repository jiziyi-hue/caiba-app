-- Seed: 12 demo issues + admin promotion sql
-- Run via Supabase SQL Editor or `supabase db reset` (latter wipes data)

-- After admin user (jiziyi@graduate.utm.my) registers via app, run:
--   update profiles set is_admin = true
--   where id = (select id from auth.users where email = 'jiziyi@graduate.utm.my');

-- 12 demo issues
-- Time line: opens_at = now()+1d, closes_at = now()+90d, deadline = 2026-12-31
do $$
declare
  iss text;
begin
  for iss in
    select unnest(array[
      '科技|苹果今年会不会发布折叠屏 iPhone？|2025 年 12 月起多家供应链消息称苹果折叠屏方案进入小批量验证。能否在 2026 春发布会亮相？|苹果官方发布会',
      '科技|DeepSeek 今年会不会发布 V5 版本？|国内 AI 用户高度关注，前几代发布节奏稳定。今年 V5 是否如期登场？|DeepSeek 官网公告',
      '科技|小米今年会不会发布人形机器人消费版？|雷军今年力推机器人赛道，是否能拿出 C 端可买的形态？|小米官方发布会',
      '时事|伊朗今年会不会重启与西方的核谈判？|中东局势持续发酵，谈判的窗口和阻力都在扩大。|伊朗外交部官方声明 / 主流媒体多源确认',
      '时事|特朗普今年会不会对中国加征新一轮关税？|每周都在讨论。是否有明确联邦公报落地？|美国联邦公报官方公告',
      '时事|今年会不会有 G20 峰会以外的中美元首会晤？|外交观察人士高度关注。|中美双方政府官方声明',
      '体育|今年 NBA 总冠军会不会是西部球队？|季后赛期间全网讨论。|NBA 官方赛季结果',
      '体育|2026 世界杯巴西会不会进入四强？|世界杯年流量最大体育话题。|FIFA 官方赛事结果',
      '体育|CBA 今年总冠军会不会是广东队？|篮球圈核心话题。|CBA 官方赛季结果',
      '娱乐|东方甄选今年会不会彻底和董宇辉切割？|这个话题到现在还在发酵，每隔一段时间就上热搜。|双方官方声明 / 主流媒体多源确认',
      '娱乐|今年会不会有新的带货主播单场 GMV 超过李佳琦？|直播电商用户高度关注，每次大促都在讨论。|平台官方公布数据 / 主播团队官方声明',
      '娱乐|今年会不会有小红书博主粉丝破 5000 万？|小红书生态近两年爆发，用户对平台头部格局很感兴趣。|小红书官方粉丝数据'
    ])
  loop
    insert into issues (creator_id, category, title, description, settlement_source, opens_at, closes_at, deadline)
    values (
      null,
      split_part(iss, '|', 1),
      split_part(iss, '|', 2),
      split_part(iss, '|', 3),
      split_part(iss, '|', 4),
      now() + interval '1 day',
      '2026-12-01 23:59:59+08'::timestamptz,
      '2026-12-31 23:59:59+08'::timestamptz
    )
    on conflict do nothing;
  end loop;
end $$;
