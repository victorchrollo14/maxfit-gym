-- Plans now live in code (src/plans.ts) and their terms are copied onto each
-- membership at sale, so the table has nothing left to answer.
alter table memberships drop column plan_id;

-- Takes its RLS policies with it.
drop table plans;
