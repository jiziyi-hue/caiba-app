-- Accuracy views: per-scope user accuracy, only counts_toward_rank=true
-- Reference: GDD §4.2 + §6.4

-- Per-category accuracy
create view user_accuracy_by_category as
select
  j.user_id,
  i.category,
  count(*) filter (where j.is_correct is not null and j.counts_toward_rank) as settled_total,
  count(*) filter (where j.is_correct = true and j.counts_toward_rank) as correct_total,
  case
    when count(*) filter (where j.is_correct is not null and j.counts_toward_rank) >= 20
    then round(
      100.0 * count(*) filter (where j.is_correct = true and j.counts_toward_rank)
            / nullif(count(*) filter (where j.is_correct is not null and j.counts_toward_rank), 0)
    )
    else null
  end as accuracy_pct
from judgments j
join issues i on i.id = j.issue_id
where i.status in ('correct', 'wrong')  -- exclude cancelled
group by j.user_id, i.category;

-- Aggregated 'all' (通用) scope
create view user_accuracy_overall as
select
  user_id,
  'all'::text as category,
  sum(settled_total)::bigint as settled_total,
  sum(correct_total)::bigint as correct_total,
  case
    when sum(settled_total) >= 20
    then round(100.0 * sum(correct_total) / nullif(sum(settled_total), 0))
    else null
  end as accuracy_pct
from user_accuracy_by_category
group by user_id;

-- Unioned view for client convenience
create view user_accuracy as
select user_id, category, settled_total, correct_total, accuracy_pct
from user_accuracy_by_category
union all
select user_id, category, settled_total, correct_total, accuracy_pct
from user_accuracy_overall;

-- Streak: longest trailing run of consecutive is_correct=true ordered by issue.deadline desc
-- Considers only counts_toward_rank=true; nulls (cancelled / unsettled) are skipped.
create view user_streak as
with ordered as (
  select
    j.user_id,
    j.is_correct,
    i.deadline,
    row_number() over (partition by j.user_id order by i.deadline desc) as rn
  from judgments j
  join issues i on i.id = j.issue_id
  where j.counts_toward_rank
    and j.is_correct is not null
    and i.status in ('correct', 'wrong')
),
runs as (
  select
    user_id,
    rn,
    is_correct,
    -- Find the first false from top (rn=1 desc); current_streak = count of trues before it
    sum(case when not is_correct then 1 else 0 end) over (partition by user_id order by rn) as breaks
  from ordered
)
select
  user_id,
  count(*) filter (where breaks = 0 and is_correct) as current_streak
from runs
group by user_id;
