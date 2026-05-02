-- Add '游戏' to category CHECK constraints on issues and topics tables

alter table issues
  drop constraint if exists issues_category_check,
  add constraint issues_category_check
    check (category in ('时事','科技','娱乐','体育','游戏'));

alter table topics
  drop constraint if exists topics_category_check,
  add constraint topics_category_check
    check (category in ('时事','科技','娱乐','体育','游戏'));
