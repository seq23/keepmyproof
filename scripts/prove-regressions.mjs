// Local-only fault injection: each mutation must make the relevant behavior test fail.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const cases=[
 ['item limit','src/core/vault.ts','plus || count < FREE_LIMIT','true','tests/vault.test.ts','free can add exactly 25'],
 ['vault encryption','src/core/vault.ts',"seal(utf8(JSON.stringify(next)), this.key, 'vault-v1', this.random)",'JSON.stringify(next)','tests/vault.test.ts','ciphertext hides'],
 ['integrity','src/core/model.ts','hash(unb64(i.bytes)) !== i.sha256','false','tests/vault.test.ts','wrong phrase, corrupt'],
 ['restore idempotency','src/core/vault.ts','if (!existing) s.items.push(item);','if (true) s.items.push(item);','tests/vault.test.ts','byte-identical backup'],
 ['atomic memory','src/core/vault.ts','await this.store.write(cipher);','this.state = next; await this.store.write(cipher);','tests/vault.test.ts','full disk or interrupted'],
 ['free export','src/core/vault.ts',"if (selection && !plus) throw Error('PLUS_REQUIRED');","if (!plus) throw Error('PLUS_REQUIRED');",'tests/vault.test.ts','viewing, full folder PDF'],
 ['confirmation','src/core/vault.ts',"if (!confirmed) throw Error('CONFIRM_REQUIRED');","if (false) throw Error('CONFIRM_REQUIRED');",'tests/vault.test.ts','edit and delete require'],
 ['passcode','src/core/lock.ts','if (!ok) {','if (false) {','tests/lock-billing-export.test.ts','passcode gate persists'],
 ['recovery reset','src/core/lock.ts','if (!valid) {','if (false) {','tests/lock-billing-export.test.ts','forgotten passcode resets'],
 ['biometric failure','src/core/lock.ts','!r.biometrics || !(await biometricCheck())','false','tests/lock-billing-export.test.ts','forgotten passcode resets'],
 ['offer expiration','src/billing/provider.ts','now < Date.parse(o.startsAt) || now >= Date.parse(o.endsAt)','false','tests/lock-billing-export.test.ts','launch offer requires'],
 ['approved list prices','src/billing/provider.ts',"product.amount === (product.plan === 'annual' ? 19.99 : 39.99)",'true','tests/lock-billing-export.test.ts','USD store list prices'],
 ['PDF pages','src/core/export.ts','out.addPage(page);','void page;','tests/lock-billing-export.test.ts','PDF includes full'],
 ['temporary exports','src/core/cleanup.ts','await remove(directory);','void directory;','tests/vault.test.ts','cold startup removes'],
 ['originals archive','src/core/export.ts',"if (!Object.keys(files).length) throw Error('NO_ORIGINALS');","if (false) throw Error('NO_ORIGINALS');",'tests/lock-billing-export.test.ts','originals ZIP preserves'],
 ['date validation','src/core/dates.ts','editableDate(date.toISOString()) !== value','false','tests/lock-billing-export.test.ts','user dates reject'],
];
for(const [name,path,before,after,test,pattern] of cases){
 const original=readFileSync(path,'utf8');if(!original.includes(before))throw Error(`MUTATION_STALE ${name}`);
 try {writeFileSync(path,original.replaceAll(before,after));const r=spawnSync(process.execPath,['--import','tsx','--test',`--test-name-pattern=${pattern}`,test],{encoding:'utf8'});
  if(r.status===0||!r.stdout.includes('✖'))throw Error(`NOT_PROVEN ${name}: ${r.stdout.slice(-500)} ${r.stderr.slice(-200)}`);
  console.log(`PROVEN: ${name} fails without its guard`);
 }finally{writeFileSync(path,original);}
}
