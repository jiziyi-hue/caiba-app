-- Drop legacy phase ordering CHECK on issues
-- Old constraint: created_at < opens_at < closes_at <= deadline (from 4-phase model)
-- New model uses is_open boolean, no time ordering required

alter table issues drop constraint if exists issues_check;
