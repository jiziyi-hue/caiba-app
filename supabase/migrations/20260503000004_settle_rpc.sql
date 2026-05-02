-- Settlement RPC: backfills judgments.is_correct + posts.verified_status
-- Called by Cloudflare Pages Function /api/settle (service-role key bypasses RLS)
-- Reference: GDD §6.3 + plan M4.3

create or replace function settle_judgments(p_issue_id uuid, p_result boolean)
returns void
language sql
security definer
as $$
  update judgments
    set is_correct = (stance = p_result)
    where issue_id = p_issue_id;

  update posts
    set verified_status = case when stance = p_result then 'correct' else 'wrong' end
    where issue_id = p_issue_id and stance is not null;
$$;

revoke all on function settle_judgments(uuid, boolean) from public;
revoke all on function settle_judgments(uuid, boolean) from anon;
revoke all on function settle_judgments(uuid, boolean) from authenticated;
-- only service_role can execute
