// Design tokens — must mirror styles/tokens.css for inline-style usage
// Source of truth: d:\caiba\colors_and_type.css; this file mirrors a subset for JS access

export const TOKENS = {
  // Indigo brand
  indigo50: '#EAF2FE',
  indigo100: '#D2E3FC',
  indigo500: '#1A73E8',
  indigo600: '#1660C9',
  indigo700: '#114DA0',
  indigo900: '#0A2F62',

  // Warm neutrals
  warm0: '#FFFFFF',
  warm25: '#FBFAF8',
  warm50: '#F6F4F0',
  warm100: '#EFEDE8',
  warm200: '#E2DFD9',
  warm300: '#C9C5BD',
  warm400: '#A39E94',
  warm500: '#7C7770',
  warm600: '#5A5650',
  warm700: '#3A3833',
  warm800: '#232220',
  warm900: '#131210',

  // Semantic
  support: '#1A73E8',
  supportTint: '#EAF2FE',
  oppose: '#E0734A',
  opposeTint: '#FCEFE7',
  pending: '#C9A227',
  pendingTint: '#FAF3D9',
  pendingFg: '#8A6F11',
  correct: '#2E8857',
  correctTint: '#E4F2EA',
  wrong: '#B85450',
  wrongTint: '#F7E7E5',

  // Type
  fontSans: '"Inter", "Noto Sans SC", -apple-system, "PingFang SC", "HarmonyOS Sans SC", system-ui, sans-serif',
  fontMono: '"DM Mono", ui-monospace, "SF Mono", monospace',

  // Shadows
  shadowSm: '0 2px 6px rgba(35,34,32,0.05), 0 1px 2px rgba(35,34,32,0.04)',
  shadowMd: '0 6px 16px rgba(35,34,32,0.06), 0 2px 4px rgba(35,34,32,0.04)',
  shadowLg: '0 16px 40px rgba(35,34,32,0.08), 0 4px 12px rgba(35,34,32,0.05)',
} as const;

export type Tokens = typeof TOKENS;
export type AvatarTint = 'warm' | 'indigo' | 'sage' | 'rose';
