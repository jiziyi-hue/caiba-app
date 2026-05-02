-- Simplify phase model: merge warmup + window, admin controls open/close
-- Before: warmup → window → late → settled (time-driven by opens_at/closes_at/deadline)
-- After:  open (admin) → closed (admin) → settled (admin)

-- 1. Add is_open column (true = users can judge)
alter table issues add column if not exists is_open boolean not null default true;

-- 2. Make opens_at / closes_at nullable (no longer phase gates, kept for display only)
alter table issues alter column opens_at drop not null;
alter table issues alter column closes_at drop not null;

-- 3. Replace enforce_judgment_phase trigger
create or replace function public.enforce_judgment_phase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  iss issues%rowtype;
begin
  select * into iss from issues where id = new.issue_id;
  if not found then
    raise exception '议题不存在';
  end if;

  if (tg_op = 'INSERT') then
    new.first_committed_at := now();
    new.committed_at := now();
    new.change_count := 0;
    if iss.status <> 'pending' then
      raise exception '议题已结算，无法表态';
    end if;
    if not iss.is_open then
      raise exception '判断期已关闭';
    end if;
    -- All open-period judgments count toward rank
    new.counts_toward_rank := true;

  elsif (tg_op = 'UPDATE') then
    if iss.status <> 'pending' then
      raise exception '议题已结算，无法修改';
    end if;
    if not iss.is_open then
      raise exception '判断期已关闭，立场已锁定';
    end if;
    -- Lock immutable fields
    new.first_committed_at := old.first_committed_at;
    new.counts_toward_rank := old.counts_toward_rank;
    if new.stance is distinct from old.stance then
      new.change_count := old.change_count + 1;
      new.committed_at := now();
    else
      new.committed_at := old.committed_at;
      new.change_count := old.change_count;
    end if;
  end if;

  return new;
end;
$$;
