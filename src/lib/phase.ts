// Issue phase utilities — simplified model: open → closed (admin) → settled
// No more warmup/window/late distinction; all judgments while open count toward rank

import type { Database } from '../types/db';

export type Issue = Database['public']['Tables']['issues']['Row'];
export type Judgment = Database['public']['Tables']['judgments']['Row'];

export type Phase = 'open' | 'closed' | 'settled' | 'cancelled';

export interface PhaseInfo {
  phase: Phase;
  chipText: string;
  chipKind: 'neutral' | 'indigo' | 'pending' | 'correct' | 'wrong';
  subText: string;
}

export function getPhase(issue: Issue): Phase {
  if (issue.status === 'cancelled') return 'cancelled';
  if (issue.status === 'correct' || issue.status === 'wrong') return 'settled';
  if (!issue.is_open) return 'closed';
  return 'open';
}

export function getPhaseInfo(issue: Issue): PhaseInfo {
  const phase = getPhase(issue);

  switch (phase) {
    case 'open':
      return {
        phase,
        chipText: '判断中',
        chipKind: 'indigo',
        subText: '判断期开放中 · 表态计入段位',
      };
    case 'closed':
      return {
        phase,
        chipText: '等待结算',
        chipKind: 'pending',
        subText: '判断期已关闭 · 等管理员核验结果',
      };
    case 'settled':
      return {
        phase,
        chipText: issue.status === 'correct' ? '已结算 · 支持方对' : '已结算 · 反对方对',
        chipKind: issue.status === 'correct' ? 'correct' : 'wrong',
        subText: issue.settled_at ? `结算于 ${formatDate(issue.settled_at)}` : '',
      };
    case 'cancelled':
      return {
        phase,
        chipText: '已作废',
        chipKind: 'neutral',
        subText: '议题已作废 · 不计入准确率',
      };
  }
}

export interface CommitDecision {
  allowed: boolean;
  reason: string;
}

export function canCommit(issue: Issue): CommitDecision {
  const phase = getPhase(issue);
  if (phase === 'open') return { allowed: true, reason: '' };
  if (phase === 'closed') return { allowed: false, reason: '判断期已关闭，立场已锁定' };
  if (phase === 'settled') return { allowed: false, reason: '议题已结算' };
  return { allowed: false, reason: '议题已作废' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysLeft(issue: Issue, now: Date = new Date()): number {
  const MS_DAY = 86400000;
  return Math.max(0, Math.ceil((new Date(issue.deadline).getTime() - now.getTime()) / MS_DAY));
}
