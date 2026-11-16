import {PGlite} from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const db=new PGlite();await db.exec('create role anon; create role authenticated; create role service_role;');await db.exec(fs.readFileSync('supabase/schema.sql','utf8'));
const register=async key=>(await db.query('select public.register_participant($1) as result',[key])).rows[0].result;
const a=await register('one');assert.equal(a.response_id,(await register('one')).response_id);assert.notEqual(a.response_id,(await register('two')).response_id);
const submit=async (key,id)=>(await db.query('select public.submit_response($1,$2,$3::jsonb) as result',[key,id,JSON.stringify({id})])).rows[0].result;
assert.equal(await submit('two',a.response_id),'invalid_id');
assert.deepEqual((await Promise.all([submit('one',a.response_id),submit('one',a.response_id)])).sort(),['already_submitted','saved']);
assert.equal((await db.query('select count(*)::int as n from public.responses')).rows[0].n,1);
await db.query('update public.responses set deleted_at=now() where id=$1',[a.response_id]);assert.equal(await submit('one',a.response_id),'already_submitted');
for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(()=>db.query('select * from public.responses'));await assert.rejects(()=>db.query('select public.register_participant($1)',['forged']));await assert.rejects(()=>submit('one',a.response_id));await db.exec('reset role');}
await db.close();console.log('PASS: actual PostgreSQL schema and functions; stable IDs, wrong-ID rejection, duplicate/concurrent calls, deletion lock, public SQL access denied.');
