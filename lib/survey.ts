export const MEALS=['Sushi','Mongolian','Salad','Deli sandwich','Pizza','The Grill','Latino bar'];
export const YEARS=['First-year','Sophomore','Junior','Senior','Super Senior'];
export const HOUSES=['Avery','Blacker','Dabney','Ricketts','Fleming','Page','Venerable','Bechtel','Marks/Braun','Unaffiliated'];
export const WAITS=[2,4,7,10,14,17,22,27,32];
export const LABELS=['Favorite vs. least favorite','Favorite vs. middle','Middle vs. middle','Middle vs. least favorite'];
export type Pair={kind:number,a:string,b:string,inc:string,choices:string[]};
export type Survey={id:string,version?:number,ratings:Record<string,string>,ranking:string[],pairs:Pair[],skipped:number[],year:string,house:string};
export function shuffle<T>(a:T[]){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function roles(r:string[]){return [r[0],r.length>1?r.at(-1):undefined,r[3],r[4]]}
export function makePairs(r:string[],ratings:Record<string,string>){const [f,l,a,b]=roles(r);const pairs:Pair[]=[];const skipped:number[]=[];[[f,l],[f,a],[a,b],[a,l]].forEach(([x,y],kind)=>{if(!x||!y||x===y){skipped.push(kind);return}pairs.push({kind,a:x,b:y,inc:ratings[x]===ratings[y]?(Math.random()<.5?x:y):x,choices:[]})});return {pairs:shuffle(pairs),skipped}}
export function group(p:Pair,s:Survey){const gap=Math.abs(+s.ratings[p.a]-+s.ratings[p.b]);return gap===0?'Equally rated':gap<=3?'Moderate preference':'Strong preference'}
export function waits(s?:Survey){return s?.version===2?WAITS:[2,4,7,10,14,17]}
export function longest(p:Pair,s?:Survey){return Math.max(0,...p.choices.map((c,i)=>c===p.inc?waits(s)[i]-2:0))}
export function reversal(p:Pair){return p.choices.some((c,i)=>c!==p.inc&&p.choices.slice(i+1).includes(p.inc))}
export function valid(s:Survey){if(!s||s.version!==2||!/^[-\w]{36}$/.test(s.id)||!YEARS.includes(s.year)||!HOUSES.includes(s.house))return false;if(!s.ratings||Object.keys(s.ratings).length!==7||!MEALS.every(m=>['1','2','3','4','5','6','7','untried','cannot'].includes(s.ratings[m])))return false;const eligible=MEALS.filter(m=>Number(s.ratings[m]));if(!Array.isArray(s.ranking)||s.ranking.length!==eligible.length||new Set(s.ranking).size!==eligible.length||s.ranking.some((m,i)=>!eligible.includes(m)||+s.ratings[m]!==i+1))return false;const expected=makePairs(s.ranking,s.ratings);if(!Array.isArray(s.pairs)||s.pairs.length!==expected.pairs.length||new Set(s.pairs.map(p=>p.kind)).size!==s.pairs.length||JSON.stringify(s.skipped)!==JSON.stringify(expected.skipped))return false;return s.pairs.every(p=>{const e=expected.pairs.find(e=>e.kind===p.kind);return e&&p.a===e.a&&p.b===e.b&&[p.a,p.b].includes(p.inc)&&(+s.ratings[p.a]===+s.ratings[p.b]||p.inc===p.a)&&Array.isArray(p.choices)&&p.choices.length===9&&p.choices.every(c=>[p.a,p.b].includes(c))})}
