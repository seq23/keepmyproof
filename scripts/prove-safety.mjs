import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const probes=[
 ['credentials','src/safety-probe.ts',`export const probe = '${'gh'+'p_'+'0'.repeat(24)}';`,'PRIVATE_DATA'],
 ['private contact','src/safety-probe.ts',`export const probe = '${['fictional','invalid.test'].join('@')}';`,'PRIVATE_DATA'],
 ['remote endpoint','src/safety-probe.ts',"export const probe = 'https://example.invalid/collect';",'NETWORK_ENDPOINT'],
 ['network call','src/safety-probe.ts',"export const probe = fetch('/records');",'NETWORK_CALL'],
 ['preview drift','app/index.tsx',s=>s.replace("type Screen = '","type Screen = 'probe'|'"),'PREVIEW_SCREEN_MISSING'],
 ['prohibited claims','src/strings.ts',"\n// safety probe: "+['court','admissible'].join('-'),'UNSUPPORTED_CLAIM'],
];
for(const [name,path,content,code] of probes){
 let original=null;try{original=readFileSync(path,'utf8');}catch{}
 try{writeFileSync(path,typeof content==='function'?content(original):(original??'')+content);const r=spawnSync(process.execPath,['scripts/validate.mjs'],{encoding:'utf8'});
  if(r.status===0||!r.stderr.includes(code))throw Error(`SAFETY_NOT_PROVEN ${name}: ${r.stderr.slice(-700)}`);console.log(`PROVEN: ${name} rejected`);
 }finally{if(original===null)unlinkSync(path);else writeFileSync(path,original);}
}
