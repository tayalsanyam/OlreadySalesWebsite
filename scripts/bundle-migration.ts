import {readFileSync,writeFileSync} from 'node:fs';import {initialState} from '../lib/seed';
const schema=readFileSync('supabase/bootstrap.sql','utf8').replace('commit;','');
const state=JSON.stringify(initialState()).replaceAll("'","''");
const sql=schema+`\n-- Initial website content. Re-running does not replace existing edits.\ninsert into public.partner_workspace (id,state)\nvalues ('main', '${state}'::jsonb)\non conflict (id) do nothing;\ncommit;\n`;
writeFileSync('supabase/migrations/20260921072554_olready_partner_workspace.sql',sql);
writeFileSync('OLREADY_Combined_Migration.sql',sql);
console.log('Combined schema + initial content migration generated. No credentials included.');
