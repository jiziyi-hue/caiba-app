// 9-tier bidirectional rank system around 50% baseline
// Light side (high accuracy) ← 50% baseline → Dark side (low accuracy = 反向先知)
// Source: ported from d:\caiba\ui_kits\miniprogram\Ranks.jsx

export type RankDir = -1 | 0 | 1;

export interface RankTier {
  id: string;
  name: string;
  dir: RankDir;
  level: 0 | 1 | 2 | 3 | 4;
  min: number;
  max: number;
  blurb: string;
  img: string;
}

export const RANK_TIERS: RankTier[] = [
  { id: 'feixian',    name: '飞仙',  dir: 1,  level: 4, min: 75, max: 100, blurb: '神级判官 · 洞若观火，几乎不会看走眼',   img: '/ranks/feixian.png' },
  { id: 'jindan',     name: '金丹',  dir: 1,  level: 3, min: 70, max: 75,  blurb: '顶尖判官 · 已成趋势',               img: '/ranks/jindan.png' },
  { id: 'zhuji',      name: '筑基',  dir: 1,  level: 2, min: 60, max: 70,  blurb: '稳定输出 · 远超平均',               img: '/ranks/zhuji.png' },
  { id: 'lianqi',     name: '练气',  dir: 1,  level: 1, min: 55, max: 60,  blurb: '初露锋芒 · 起步良好',               img: '/ranks/lianqi.png' },
  { id: 'baiyi',      name: '白衣',  dir: 0,  level: 0, min: 45, max: 55,  blurb: '基线 · 公正中立',                  img: '/ranks/baiyi.png' },
  { id: 'xiexiu',     name: '邪修',  dir: -1, level: 1, min: 40, max: 45,  blurb: '逆风开始 · 走上歧途',              img: '/ranks/xiexiu.png' },
  { id: 'xuanming',   name: '玄冥',  dir: -1, level: 2, min: 30, max: 40,  blurb: '稳定看反 · 逆向也有逆向的价值',    img: '/ranks/xuanming.png' },
  { id: 'kuangsheng', name: '狂圣',  dir: -1, level: 3, min: 25, max: 30,  blurb: '反向先知 · 反着押已成趋势',        img: '/ranks/kuangsheng.png' },
  { id: 'mozun',      name: '魔尊',  dir: -1, level: 4, min: 0,  max: 25,  blurb: '神人级 · 把它的判断反过来即可',    img: '/ranks/mozun.png' },
];

export type Board = '通用' | '时事' | '科技' | '娱乐' | '体育' | '游戏';

export const BOARD_TINTS: Record<Board, { hue: string; label: string }> = {
  通用: { hue: '#3A3833', label: '通用' },
  时事: { hue: '#475569', label: '时政' },
  科技: { hue: '#1A73E8', label: '科技' },
  娱乐: { hue: '#B85A7A', label: '娱乐' },
  体育: { hue: '#C9A961', label: '体育' },
  游戏: { hue: '#7C3AED', label: '游戏' },
};

export function getRank(accuracy: number | null | undefined): RankTier {
  if (accuracy == null) return RANK_TIERS.find((t) => t.id === 'baiyi')!;
  const found = RANK_TIERS.find((t) => accuracy >= t.min && accuracy < t.max);
  if (found) return found;
  return accuracy >= 75 ? RANK_TIERS[0] : RANK_TIERS[RANK_TIERS.length - 1];
}

export function getNextRank(
  accuracy: number | null | undefined,
  currentDir: RankDir
): { next: RankTier; gap: number } | null {
  if (accuracy == null) return null;
  const moveTowardLight = currentDir >= 0;
  if (moveTowardLight) {
    const next = RANK_TIERS.filter((t) => t.min > accuracy && t.dir >= 0).sort((a, b) => a.min - b.min)[0];
    return next ? { next, gap: next.min - accuracy } : null;
  } else {
    const next = RANK_TIERS.filter((t) => t.max <= accuracy && t.dir < 0).sort((a, b) => b.max - a.max)[0];
    return next ? { next, gap: accuracy - (next.max - 0.0001) } : null;
  }
}

export interface RankColors {
  fill: string;
  stroke: string;
  ink: string;
  accent: string;
}

export function resolveRankColors(rank: RankTier, board: Board = '通用'): RankColors {
  const tint = BOARD_TINTS[board] || BOARD_TINTS['通用'];
  if (rank.dir === 0) {
    return { fill: '#FFFFFF', stroke: '#D6D2C9', ink: '#5A5650', accent: tint.hue };
  }
  if (rank.dir === 1) {
    const lightFills: Record<number, string> = {
      1: '#F4F1EA',
      2: '#FBF3DF',
      3: '#FFE9B0',
      4: '#FFD86B',
    };
    const lightInks: Record<number, string> = {
      1: tint.hue,
      2: '#8C6914',
      3: '#6B4F0A',
      4: '#3A2A04',
    };
    return {
      fill: lightFills[rank.level],
      stroke: rank.level >= 3 ? '#D4A33A' : '#E8DCC0',
      ink: lightInks[rank.level],
      accent: tint.hue,
    };
  }
  const darkFills: Record<number, string> = {
    1: '#E8E2EC',
    2: '#5C4660',
    3: '#3A2238',
    4: '#1A0E1F',
  };
  const darkInks: Record<number, string> = {
    1: '#5C4660',
    2: '#F0E3F2',
    3: '#F0D6E8',
    4: '#E8B8D0',
  };
  return {
    fill: darkFills[rank.level],
    stroke: rank.level >= 3 ? '#1A0E1F' : '#7A6080',
    ink: darkInks[rank.level],
    accent: tint.hue,
  };
}
