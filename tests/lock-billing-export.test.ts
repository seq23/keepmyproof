import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { AppLock, createLock, type LockRecord, type LockStore } from '../src/core/lock';
import { phrase, recoveryKey, equal, unb64 } from '../src/core/crypto';
import { activeLaunch, acceptedKey, MockPurchases, purchaseId, renewalDue, withLaunch, type Product } from '../src/billing/provider';
import { assemblePdf, exportHtml } from '../src/core/export';
import { draft, fixture, fileDraft, random } from './helpers';

test('passcode gate persists increasing delay across sessions; never deletes vault; correct code works after wait',async()=>{
  const words=phrase(random);let r=await createLock('182736',words,false,random),now=100;
  const store:LockStore={read:async()=>structuredClone(r),write:async next=>{r=next;}};
  const lock=new AppLock(store,()=>now);await assert.rejects(lock.unlock('000000'),/PASSCODE_WRONG/);assert.equal(r.attempts,1);assert.equal(r.nextTry,1100);
  await assert.rejects(new AppLock(store,()=>now).unlock('182736'),/WAIT/);now=1100;
  await assert.rejects(lock.unlock('000000'),/PASSCODE_WRONG/);assert.equal(r.nextTry,3100);now=3100;
  await lock.unlock('182736');assert.equal(r.attempts,0);assert.equal(r.nextTry,0);
});

test('forgotten passcode resets with phrase or enabled verified biometrics, never a false biometric result',async()=>{
  const words=phrase(random);let r=await createLock('182736',words,true,random);let now=0;
  const store:LockStore={read:async()=>structuredClone(r),write:async next=>{r=next;}};
  const lock=new AppLock(store,()=>now);const before=structuredClone(r);
  await assert.rejects(lock.reset('736281',{biometric:true},async()=>false,random),/BIOMETRIC_FAILED/);assert.deepEqual(r,before);
  await assert.rejects(lock.reset('736281',{words:phrase(random)},async()=>true,random),/RECOVERY_INVALID/);
  now=r.nextTry;await lock.reset('736281',{words},async()=>false,random);await lock.unlock('736281');
  assert.ok(equal(r.recovery, before.recovery));await lock.reset('928173',{biometric:true},async()=>true,random);await lock.unlock('928173');
  r.biometrics=false;await assert.rejects(lock.reset('182736',{biometric:true},async()=>true,random),/BIOMETRIC_FAILED/);
});

test('recovery uses all twelve checksum-valid words, accepts whitespace/case, rejects wrong order and invalid lengths',()=>{
  const words=phrase(random);assert.deepEqual(recoveryKey(words),recoveryKey('  '+words.toUpperCase().replaceAll(' ','  ')+'  '));
  assert.throws(()=>recoveryKey(words.split(' ').slice(0,11).join(' ')));assert.throws(()=>recoveryKey(words+' impossible'));
  let other=phrase(random);assert.notDeepEqual(recoveryKey(words),recoveryKey(other));
});

test('mock purchases never grant Plus or charge; restore cannot manufacture purchases',async()=>{
  const mock=new MockPurchases();assert.equal((await mock.entitlement()).plus,false);assert.equal((await mock.restore()).plus,false);
  for(const p of await mock.products())await assert.rejects(mock.purchase(p.id),/REVENUECAT_KEY_MISSING/);
});

test('launch offer requires eligible store verification and active store dates; no stale, fake or undercut price',()=>{
  const now=Date.parse('2026-01-02T00:00:00Z');
  const product:Product={id:'fictional',plan:'lifetime',price:'$39.99',amount:39.99,currency:'USD',launch:{id:'fictional-launch',price:'$29.99',amount:29.99,normalPrice:'$39.99',normalAmount:39.99,startsAt:'2026-01-01T00:00:00Z',endsAt:'2026-01-08T00:00:00Z',eligible:true,storeVerified:true}};
  assert.equal(activeLaunch(product,now)?.amount,29.99);
  assert.equal(activeLaunch(product,Date.parse('2026-01-08T00:00:00Z')),null);assert.equal(activeLaunch(product,Date.parse('2025-12-30T00:00:00Z')),null);
  for(const patch of [{eligible:false},{storeVerified:false},{amount:19.99},{endsAt:'2026-02-01T00:00:00Z'},{startsAt:'bad'}])assert.equal(activeLaunch({...product,launch:{...product.launch!,...patch}},now),null);
  assert.equal(activeLaunch({...product,plan:'annual'},now),null);assert.equal(activeLaunch({...product,launch:undefined},now),null);
});

test('in-app renewal reminder applies only to active renewing annual entitlement within seven days',()=>{
  const now=Date.parse('2026-01-01T00:00:00Z'),e={plus:true,renewsOn:'2026-01-08T00:00:00Z',managementURL:null};
  assert.equal(renewalDue(e,now),true);assert.equal(renewalDue({...e,plus:false},now),false);assert.equal(renewalDue({...e,renewsOn:null},now),false);
  assert.equal(renewalDue(e,now-1),false);assert.equal(renewalDue(e,Date.parse(e.renewsOn)),false);
});

test('PDF includes full multipage original, photo, index metadata and dates above free cap; escapes user HTML',async()=>{
  const {vault}=await fixture();const source=await PDFDocument.create();for(let i=0;i<32;i++)source.addPage();
  const id=await vault.add(fileDraft(await source.save(),'long-fictional.pdf'),true);
  for(let i=0;i<26;i++)await vault.add(draft({title:`Fictional ${i}`,note:'<script>fictional & safe</script>'}),true);
  await vault.add({...fileDraft(unb64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII='),'fictional.png'),kind:'photo',mime:'image/png'},true);
  const items=vault.items('divorce-prep');assert.equal(items.length,28);
  const html=exportHtml(items,{title:'<unsafe>',madeOn:'2026-01-01T00:00:00Z',lang:'es',cover:'<cover>'});
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<unsafe>'));assert.equal((html.match(/<section>/g)||[]).length,28);
  const metadata=await PDFDocument.create();metadata.addPage();const result=await PDFDocument.load(await assemblePdf(await metadata.save(),items));
  assert.equal(result.getPageCount(),34);assert.deepEqual(vault.original(id),await source.save());
});

test('user dates reject impossible days; filters honor local-day boundaries and exclude uncertain dates',async()=>{
  const {userDate,dateBoundary,editableDate}=await import('../src/core/dates');
  assert.throws(()=>userDate('2026-02-30'));assert.throws(()=>userDate('03/01/2026'));
  assert.equal(editableDate(userDate('2026-03-01').toISOString()),'2026-03-01');
  const {vault}=await fixture();await vault.add(draft({happenedOn:dateBoundary('2026-03-01',false)}),true);
  await vault.add(draft({happenedOn:dateBoundary('2026-03-01',true)}),true);await vault.add(draft(),true);
  assert.equal(vault.items('divorce-prep',{from:dateBoundary('2026-03-01',false),to:dateBoundary('2026-03-01',true)},true).length,2);
});

test('USD store list prices cannot silently undercut the approved catalog; other currencies use store-localized prices',async()=>{
  const {approvedListPrice}=await import('../src/billing/provider');
  const p:Product={id:'fictional',plan:'lifetime',price:'$39.99',amount:39.99,currency:'USD'};
  assert.equal(approvedListPrice(p),true);assert.equal(approvedListPrice({...p,amount:29.99}),false);
  assert.equal(approvedListPrice({...p,plan:'annual',amount:19.99}),true);
  assert.equal(approvedListPrice({...p,plan:'annual',amount:39.99}),false);
  assert.equal(approvedListPrice({...p,currency:'EUR',amount:44.99}),true);assert.equal(approvedListPrice({...p,amount:NaN}),false);
});

test('originals ZIP preserves bytes and safe paths, including empty files; notes-only selection reports no originals',async()=>{
  const {originalArchive}=await import('../src/core/export'),{unzipSync}=await import('fflate');
  const {vault}=await fixture();const bytes=random(200);await vault.add(fileDraft(bytes,'../../fictional.bin'),false);
  await vault.add(fileDraft(new Uint8Array(),'empty.bin'),false);await vault.add(draft(),false);
  const originals=unzipSync(originalArchive(vault.snapshot().items));const names=Object.keys(originals);
  assert.equal(names.length,2);assert.ok(names.every(n=>!n.includes('/')));assert.deepEqual(Object.values(originals)[0],bytes);assert.equal(Object.values(originals)[1].length,0);
  assert.throws(()=>originalArchive(vault.snapshot().items.filter(i=>i.kind==='note')),/NO_ORIGINALS/);
});

test('launch-week lifetime comes only from a store product plus RevenueCat dates; outside the week the list product is shown and sold',()=>{
  const list:Product={id:'fictional-lifetime',plan:'lifetime',price:'$39.99',amount:39.99,currency:'USD'};
  const launch={id:'fictional-lifetime-launch',price:'$29.99',amount:29.99,currency:'USD'};
  const meta={launchStartsAt:'2026-01-01T00:00:00Z',launchEndsAt:'2026-01-08T00:00:00Z'};
  const p=withLaunch(list,launch,meta),during=Date.parse('2026-01-03T00:00:00Z'),after=Date.parse('2026-01-08T00:00:00Z');
  assert.equal(activeLaunch(p,during)?.price,'$29.99');assert.equal(purchaseId(p,during),'fictional-lifetime-launch');
  assert.equal(activeLaunch(p,after),null);assert.equal(purchaseId(p,after),'fictional-lifetime');
  assert.equal(purchaseId(p,Date.parse('2025-12-31T00:00:00Z')),'fictional-lifetime');
  assert.equal(withLaunch(list,launch,{}).launch,undefined);assert.equal(withLaunch(list,null,meta).launch,undefined);
  assert.equal(withLaunch(list,{...launch,currency:'EUR'},meta).launch,undefined);
  assert.equal(withLaunch({...list,plan:'annual'},launch,meta).launch,undefined);
  assert.equal(purchaseId(withLaunch(list,{...launch,amount:9.99},meta),during),'fictional-lifetime');
  assert.equal(purchaseId(withLaunch(list,launch,{...meta,launchEndsAt:'2026-01-20T00:00:00Z'}),during),'fictional-lifetime');
});

test('store keys unlock real purchases only on their own platform; anything else stays on the non-selling mock',()=>{
  assert.equal(acceptedKey('ios','test_x'),true);assert.equal(acceptedKey('ios','appl_x'),true);assert.equal(acceptedKey('android','goog_x'),true);
  assert.equal(acceptedKey('ios','goog_x'),false);assert.equal(acceptedKey('android','appl_x'),false);
  assert.equal(acceptedKey('ios',undefined),false);assert.equal(acceptedKey('ios','sk_x'),false);
});

test('release gate stops a store build until keys, device test, price recheck and legal pages are real; clears when all are',async()=>{
  const {stops,DEVICE_CHECKS}=await import('../scripts/release-gate.mjs');const now=Date.parse('2026-12-01T00:00:00Z');
  const files:Record<string,unknown>={'release/device-gate.json':{version:'1.0.0',checks:Object.fromEntries(DEVICE_CHECKS.map(c=>[c,true]))},
    'release/price-check.json':{checkedOn:'2026-11-28',incumbentLifetimeUSD:39.99}};
  const ready={env:{EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY:'appl_x',EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY:'goog_x'},version:'1.0.0',readJson:(p:string)=>files[p]??null,probe:async()=>200,supportEmail:'support@keepmyproof.com',mx:async()=>1,now};
  assert.deepEqual(await stops(ready),[]);
  const codes=async(patch:object)=>(await stops({...ready,...patch})).map(s=>s.code);
  assert.deepEqual(await codes({env:{EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY:'test_x'}}),['REVENUECAT_KEY_MISSING']);
  assert.deepEqual(await codes({version:'1.0.1'}),['DEVICE_RELEASE_GATE_PENDING']);
  assert.deepEqual(await codes({readJson:(p:string)=>p.includes('device')?{version:'1.0.0',checks:{}}:files[p]}),['DEVICE_RELEASE_GATE_PENDING']);
  assert.deepEqual(await codes({now:now+30*86400_000}),['PRICE_RECHECK_PENDING']);
  assert.deepEqual(await codes({readJson:(p:string)=>p.includes('price')?{checkedOn:'2026-11-28',incumbentLifetimeUSD:49.99}:files[p]}),['PRICED_BELOW_INCUMBENT']);
  assert.deepEqual(await codes({probe:async()=>0}),['LEGAL_URLS_UNREACHABLE','LEGAL_URLS_UNREACHABLE']);
  assert.deepEqual(await codes({supportEmail:'help@example.invalid'}),['SUPPORT_ADDRESS_NOT_ON_DOMAIN']);
  assert.deepEqual(await codes({mx:async()=>0}),['SUPPORT_ADDRESS_NOT_ON_DOMAIN']);
  assert.deepEqual(await codes({env:{...ready.env,EXPO_PUBLIC_KMP_PREVIEW:'1'}}),['PREVIEW_BUILD']);
  assert.equal((await stops({...ready,env:{},readJson:()=>null,probe:async()=>404,supportEmail:undefined})).length,6);
});
