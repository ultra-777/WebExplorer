
insert into "security"."Roles" ("name")
select 'user'
where not exists (select null from "security"."Roles" where "name" = 'user');

insert into "security"."Roles" ("name")
select 'admin'
where not exists (select null from "security"."Roles" where "name" = 'admin');


