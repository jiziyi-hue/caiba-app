// Issue phase utilities — computes which phase an issue is in and what's allowed
// Reference: GDD §6.1 / §6.2

import type { Database } from '../types/db';

export type Issue = Database['public']['Tables']['issues']['Row'];
export type Judgment = Database['public']['Tables']['judgments']['Row'];

export type Phase = 'warmup' | 'window' | 'late' | 'settled' | 'cancelled';

export interface PhaseInfo {
  phase: Phase;
  daysToOpens: number | null;
  daysToCloses: number | null;
  daysToDeadline: number | null;
  chipText: string;
  chipKind: 'neutral' | 'indigo' | 'pending' | 'correct' | 'wrong';
  subText: string;
}

const MS_DAY = 86400000;

function daysBetween(later: Date, earlier: Date): number {
  return Math.ceil((later.getTime() - earlier.getTime()) / MS_DAY);
}

export function getPhase(issue: Issue, now: Date = new Date()): Phase {
  if (issue.status === 'correct' || issue.status === 'wrong') return 'settled';
  if (issue.status === 'cancelled') return 'cancelled';

  const opensAt = new Date(issue.opens_at);
  const closesAt = new Date(issue.closes_at);
  const deadline = new Date(issue.deadline);

  if (now < opensAt) return 'warmup';
  if (now <= closesAt) return 'window';
  if (now <= deadline) return 'late';
  return 'settled'; // past deadline but not admin-settled — treat as awaiting settlement
}

export function getPhaseInfo(issue: Issue, now: Date = new Date()): PhaseInfo {
  const phase = getPhase(issue, now);
  const opensAt = new Date(issue.opens_at);
  const closesAt = new Date(issue.closes_at);
  const deadline = new Date(issue.deadline);

  switch (phase) {
    case 'warmup': {
      const d = daysBetween(opensAt, now);
      return {
        phase,
        daysToOpens: d,
        daysToCloses: daysBetween(closesAt, now),
        daysToDeadline: daysBetween(deadline, now),
        chipText: '预热中',
        chipKind: 'neutral',
        subText: `还有 ${d} 天开窗 · 你可以预先挂 title`,
      };
    }
    case 'window': {
      const d = daysBetween(closesAt, now);
      return {
        phase,
        daysToOpens: 0,
        daysToCloses: d,
        daysToDeadline: daysBetween(deadline, now),
        chipText: '判断窗口',
        chipKind: 'indigo',
        subText: `还有 ${d} 天闭窗 · 段位计入截止日`,
      };
    }
    case 'late': {
      const d = daysBetween(deadline, now);
      return {
        phase,
        daysToOpens: 0,
        daysToCloses: 0,
        daysToDeadline: d,
        chipText: '围观期',
        chipKind: 'pending',
        subText: `窗口已闭 · 现在表态不计段位`,
      };
    }
    case 'settled':
      return {
        phase,
        daysToOpens: 0,
        daysToCloses: 0,
        daysToDeadline: 0,
        chipText:
          issue.status === 'correct' ? '已结算 · 猜对' : issue.status === 'wrong' ? '已结算 · 看走眼' : '待结算',
        chipKind: issue.status === 'correct' ? 'correct' : issue.status === 'wrong' ? 'wrong' : 'pending',
        subText:
          issue.status === 'correct' || issue.status === 'wrong'
            ? `结算于 ${formatDate(issue.settled_at!)}`
            : '等管理员核验结果',
      };
    case 'cancelled':
      return {
        phase,
        daysToOpens: 0,
        daysToCloses: 0,
        daysToDeadline: 0,
        chipText: '已作废',
        chipKind: 'neutral',
        subText: '议题已作废 · 不计入准确率',
      };
  }
}

export interface CommitDecision {
  allowed: boolean;
  countsTowardRank: boolean;
  reason: string;
}

export function canCommit(issue: Issue, hasExistingJudgment: boolean, now: Date = new Date()): CommitDecision {
  const phase = getPhase(issue, now);

  if (phase === 'settled' || phase === 'cancelled') {
    return { allowed: false, countsTowardRank: false, reason: '议题已结算' };
  }
  if (phase === 'late' && hasExistingJudgment) {
    return { allowed: false, countsTowardRank: false, reason: '窗口已闭，立场已锁定' };
  }
  if (phase === 'late' && !hasExistingJudgment) {
    return { allowed: true, countsTowardRank: false, reason: '现在表态不计段位（围观）' };
  }
  return { allowed: true, countsTowardRank: true, reason: '' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysLeft(issue: Issue, now: Date = new Date()): number {
  return Math.max(0, daysBetween(new Date(issue.deadline), now));
}
