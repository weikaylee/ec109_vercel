import assert from 'node:assert/strict';
import {waitStatistics,percentile} from '../lib/statistics.ts';
import {MEALS,WAITS,longest,valid,makePairs} from '../lib/survey.ts';
import {participantKey,isAdminEmail,emailAllowed} from '../lib/auth-policy.ts';
const s={id:crypto.randomUUID(),version:2,ratings:Object.fromEntries(MEALS.map((m,i)=>[m,String(i+1)])),ranking:MEALS,pairs:[],skipped:[],year:'Senior',house:'Avery'};
function pair(extra){return {kind:0,a:'Sushi',b:'Pizza',inc:'Sushi',choices:WAITS.map(w=>w-2<=extra?'Sushi':'Pizza')}}
assert.equal(longest(pair(5),s),5); // posted 7 min minus 2 min baseline
assert.equal(longest({...pair(0),choices:Array(9).fill('Pizza')},s),0);
const nonmonotonic=pair(0);nonmonotonic.choices[8]='Sushi';assert.equal(longest(nonmonotonic,s),30);
const values=[0,2,5,8,12,15,20,25,30];const rows=values.map(x=>({s,p:pair(x)}));const result=waitStatistics(rows);
assert.deepEqual(result.values,values);assert.equal(result.students,1);assert.equal(result.pairs,9);assert.equal(result.mean,13);assert.equal(result.median,12);assert.equal(result.p05,.8);assert.equal(result.p95,28);
assert.equal(percentile([30,0,10],.5),10);assert.equal(waitStatistics([]).p05,null);assert.equal(waitStatistics([{s,p:pair(5)}]).p95,5);
const grouped=[...rows,...values.map(x=>({s:{...s,id:crypto.randomUUID(),house:'Page'},p:pair(x)}))];assert.equal(waitStatistics(grouped.filter(r=>r.s.house==='Avery')).mean,13);
for(let n=0;n<=7;n++){const ranking=MEALS.slice(0,n),ratings=Object.fromEntries(MEALS.map((m,i)=>[m,i<n?String(i+1):'untried'])),r={...s,ranking,ratings,...makePairs(ranking,ratings)};r.pairs=r.pairs.map(p=>({...p,choices:Array(9).fill(p.inc)}));assert(valid(r));assert.equal(r.pairs.length,[0,0,1,1,2,4,4,4][n]);}
const secret='x'.repeat(32);assert.equal(participantKey('Student@caltech.edu',secret),participantKey('student@caltech.edu',secret));assert.notEqual(participantKey('another@caltech.edu',secret),participantKey('student@caltech.edu',secret));assert.throws(()=>participantKey('x@y.edu',''));
assert(isAdminEmail('SECOND@EXAMPLE.EDU','first@example.edu, second@example.edu'));assert(!isAdminEmail('attacker@example.edu','first@example.edu,second@example.edu'));assert(!isAdminEmail('first@example.edu',''));assert(!emailAllowed('a@notcaltech.edu','caltech.edu',''));assert(emailAllowed('a@caltech.edu','caltech.edu',''));
console.log('PASS: longest EXTRA wait, mean=13, median=12, p05=0.8, p95=28, grouping, empty/singleton/nonmonotonic cases, ranking, stable identities and multiple admin allowlist.');
