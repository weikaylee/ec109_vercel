import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {valid,MEALS,makePairs} from '../lib/survey.ts';
let who=null,calls=0;const identity=async()=>who;const database=()=>{calls++;return {rpc:async()=>({data:'saved',error:null}),from:()=>({update:()=>({eq:()=>({is:async()=>({error:null})})})})}};const sameOrigin=r=>r.headers.get('origin')===new URL(r.url).origin;const noStore={};
const code=ts.transpileModule(fs.readFileSync('app/api/responses/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import .*?;\s*$/gm,'').replace(/export /g,'');
const api=new Function('database','identity','sameOrigin','noStore','valid','MEALS',code+';return {GET,POST,DELETE}')(database,identity,sameOrigin,noStore,valid,MEALS);
const req=(method,body)=>new Request('https://survey.test/api/responses',{method,headers:{origin:'https://survey.test','content-type':'application/json'},body:JSON.stringify(body)});
assert.equal((await api.GET()).status,401);assert.equal((await api.DELETE(req('DELETE',{id:crypto.randomUUID()}))).status,401);assert.equal((await api.POST(req('POST',{}))).status,401);assert.equal(calls,0);
who={admin:false,key:'student'};assert.equal((await api.GET()).status,403);assert.equal((await api.DELETE(req('DELETE',{id:crypto.randomUUID()}))).status,403);assert.equal(calls,0);
who={admin:true,key:'admin'};assert.equal((await api.DELETE(req('DELETE',{id:crypto.randomUUID()}))).status,200);assert.equal(calls,1);
console.log('PASS: actual API route authorization rejects anonymous/non-admin reads and deletes before touching database.');
