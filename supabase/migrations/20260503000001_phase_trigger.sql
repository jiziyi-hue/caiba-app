-- Enforce phase rules on judgments
-- Reference: GDD §6.2 + Appendix B

create function public.enforce_judgment_phase()
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
    -- INSERT: 首次表态。判 counts_toward_rank。
    new.first_committed_at := now();
    new.committed_at := now();
    new.change_count := 0;
    -- 在 closes_at 之前首次表态 → 进段位；否则围观
    new.counts_toward_rank := (now() <= iss.closes_at);
    -- deadline 后禁止新表态
    if now() > iss.deadline then
      raise exception '议题已结束，无法表态';
    end if;
    -- issue 已结算
    if iss.status <> 'pending' then
      raise exception '议题已结算，无法表态';
    end if;

  elsif (tg_op = 'UPDATE') then
    -- UPDATE: 改主意。规则按 counts_toward_rank 区分。
    if iss.status <> 'pending' then
      raise exception '议题已结算，无法修改';
    end if;
    if now() > iss.deadline then
      raise exception '议题已结束，无法修改';
    end if;
    -- 锁定字段：first_committed_at, counts_toward_rank, is_correct
    new.first_committed_at := old.first_committed_at;
    new.counts_toward_rank := old.counts_toward_rank;
    -- is_correct 仅 service-role 可改（RLS 策略层兜底；这里 trigger 不强制还原以便结算 trigger 能写）
    -- 已计段位用户：closes_at 之后立场冻结
    if old.counts_toward_rank and now() > iss.closes_at then
      raise exception '窗口已闭，立场已锁定';
    end if;
    -- 仅 stance 改变才计 change_count
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

create trigger judgments_phase_check
  before insert or update on judgments
  for each row execute function public.enforce_judgment_phase();

-- Update issue caches when judgment INSERT/UPDATE
create function public.update_issue_caches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total int;
  ranked int;
  support int;
begin
  select count(*), count(*) filter (where counts_toward_rank), count(*) filter (where stance = true)
  into total, ranked, support
  from judgments where issue_id = coalesce(new.issue_id, old.issue_id);

  update issues set
    total_count_cache = total,
    ranked_count_cache = ranked,
    total_pct_cache = case when total > 0 then round(100.0 * support / total) else 0 end
  where id = coalesce(new.issue_id, old.issue_id);

  return null;
end;
$$;

create trigger judgments_update_caches
  after insert or update or delete on judgments
  for each row execute function public.update_issue_caches();
