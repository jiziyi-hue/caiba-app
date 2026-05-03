export const ISSUE_CATEGORIES = ['时事', '科技', '娱乐', '体育', '游戏'] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];
