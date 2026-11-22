import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const probes=[
 ['credentials','src/safety-probe.ts',`export const probe = '${'gh'+'p_'+'0'.repeat(24)}';`,'PRIVATE_DATA'],
 ['private contact','src/safety-probe.ts',`export const probe = '${['fictional','invalid.test'].join('@')}';`,'PRIVATE_DATA'],
 ['remote endpoint','src/safety-probe.ts',"export const probe = 'https://example.invalid/collect';",'NETWORK_ENDPOINT'],
 ['network call','src/safety-probe.ts',"export const probe = fetch('/records');",'NETWORK_CALL'],
 // The review-code file is the one place fetch may run: only to its constant URL, and it may hold no other URL.
 ['network call in the app screen','app/index.tsx',"\nexport const probe = () => fetch('https://keepmyproof.com/api/review');",'NETWORK_CALL'],
 ['review file: fetch to another URL','src/billing/review.ts',"\nexport const probe = () => fetch('https://keepmyproof.com/records');",'NETWORK_CALL'],
 ['review file: fetch through a variable','src/billing/review.ts',"\nconst other = REVIEW_URL + '/x'; export const probe = () => fetch(other);",'NETWORK_CALL'],
 ['review file: a second URL','src/billing/review.ts',"\nexport const probe = 'https://example.invalid/collect';",'NETWORK_ENDPOINT'],
 ['review file: fetch passed along','src/billing/review.ts',"\nexport const probe = [fetch];",'NETWORK_CALL'],
 // preview-screens is a warning row ("blocking": false), so it runs only under VALIDATE_WARN=1, as in check.yml.
 ['preview drift','app/index.tsx',s=>s.replace("type Screen = '","type Screen = 'probe'|'"),'PREVIEW_SCREEN_MISSING',{VALIDATE_WARN:'1'}],
 ['prohibited claims','src/strings.ts',"\n// safety probe: "+['court','admissible'].join('-'),'UNSUPPORTED_CLAIM'],
];
for(const [name,path,content,code,env={}] of probes){
 let original=null;try{original=readFileSync(path,'utf8');}catch{}
 try{writeFileSync(path,typeof content==='function'?content(original):(original??'')+content);const r=spawnSync(process.execPath,['scripts/validate.mjs'],{encoding:'utf8',env:{...process.env,...env}});
  if(r.status===0||!r.stderr.includes(code))throw Error(`SAFETY_NOT_PROVEN ${name}: ${r.stderr.slice(-700)}`);console.log(`PROVEN: ${name} rejected`);
 }finally{if(original===null)unlinkSync(path);else writeFileSync(path,original);}
}
