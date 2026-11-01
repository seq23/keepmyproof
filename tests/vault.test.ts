import { test } from 'node:test';
import assert from 'node:assert/strict';
import { b64, decode, hash, open, phrase, recoveryKey, seal, unb64, utf8 } from '../src/core/crypto';
import { empty, validate } from '../src/core/model';
import { Vault, FREE_LIMIT } from '../src/core/vault';
import { MemoryStore, draft, fixture, fileDraft, random } from './helpers';

test('ciphertext hides metadata and bytes; correct key reloads; wrong key, purpose and tampering fail', async () => {
  const { store,key,vault } = await fixture();
  const bytes = utf8('fictional original byte content'); await vault.add(fileDraft(bytes),false);
  assert.ok(store.value); assert.ok(!store.value.includes('Invented record')); assert.ok(!store.value.includes(b64(bytes)));
  const reloaded = new Vault(store,key,random); await reloaded.load(); assert.deepEqual(reloaded.snapshot(),vault.snapshot());
  await assert.rejects(new Vault(store,random(32),random).load());
  assert.throws(() => open(store.value!,key,'backup-v1'));
  const box = JSON.parse(store.value); const cipher=unb64(box.c);cipher[0]^=1;box.c=b64(cipher);store.value=JSON.stringify(box);
  await assert.rejects(new Vault(store,key,random).load());
});

test('free can add exactly 25; simultaneous adds cannot pass limit; deletion makes room; Plus can add more',async () => {
  const { vault } = await fixture();
  for (let i=0;i<24;i++) await vault.add(draft(),false);
  const attempts = await Promise.allSettled([vault.add(draft(),false),vault.add(draft(),false)]);
  assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);assert.equal(vault.snapshot().items.length,FREE_LIMIT);
  await assert.rejects(vault.add(draft(),false),/ITEM_LIMIT/);
  await vault.add(draft(),true);assert.equal(vault.snapshot().items.length,26);
  await vault.remove(vault.snapshot().items[0].id,true);await assert.rejects(vault.add(draft(),false),/ITEM_LIMIT/);
  await vault.remove(vault.snapshot().items[0].id,true);await vault.add(draft(),false);assert.equal(vault.snapshot().items.length,25);
});

test('viewing, full folder PDF inputs, originals and backup remain available above limit after Plus expires',async () => {
  const {vault}=await fixture();const bytes=random(512);const id=await vault.add(fileDraft(bytes),true);
  for(let i=0;i<26;i++)await vault.add(draft(),true);
  assert.equal(vault.items('divorce-prep').length,27);assert.deepEqual(vault.original(id),bytes);
  assert.equal(vault.snapshot().items.length,27);assert.ok(vault.backup(random(32)));
  await assert.rejects(vault.add(draft(),false),/ITEM_LIMIT/);
  assert.throws(()=>vault.items('divorce-prep',{ids:[id]},false),/PLUS_REQUIRED/);
  assert.deepEqual(vault.items('divorce-prep',{ids:[id]},true).map(i=>i.id),[id]);
});

test('byte-identical backup → wipe → restore using only recovery phrase; a second restore has no duplicates',async () => {
  const {vault}=await fixture();const words=phrase(random);assert.equal(words.split(' ').length,12);
  const originals=[random(4096),random(180_000),new Uint8Array([0,255,0,1,2])];
  await vault.add(fileDraft(originals[0],'odd / name 資料.png'),false);
  await vault.add(fileDraft(originals[1],'long-document.pdf'),false);
  await vault.add(fileDraft(originals[2],'zero-byte-markers.bin'),false);
  await vault.add(draft({note:'A very long fictional note. '.repeat(600),happenedOn:'2020-01-01T00:00:00.000Z'}),false);
  const before=vault.snapshot();const backup=vault.backup(recoveryKey(words));vault.lock();
  const restored=new Vault(new MemoryStore(),random(32),random);await restored.load();await restored.restore(backup,words);await restored.restore(backup,words);
  assert.equal(restored.snapshot().items.length,4);
  for(let n=0;n<3;n++) {assert.deepEqual(restored.original(before.items[n].id),originals[n]);assert.equal(hash(restored.original(before.items[n].id)),hash(originals[n]));}
  assert.deepEqual(restored.snapshot().items,before.items);
});

test('wrong phrase, corrupt ciphertext, missing bytes and mismatched hashes leave live data and previous backup untouched',async () => {
  const {vault,store}=await fixture();const words=phrase(random),key=recoveryKey(words);
  await vault.add(fileDraft(random(64)),false);const backup=vault.backup(key);const before=store.value;
  await assert.rejects(vault.restore(backup,phrase(random)));assert.equal(store.value,before);
  const corrupted=JSON.parse(backup);corrupted.c=corrupted.c.slice(0,-4)+'AAAA';await assert.rejects(vault.restore(JSON.stringify(corrupted),words));assert.equal(store.value,before);
  for(const [change,reason] of [[{bytes:null},/FILE_CORRUPT/],[{sha256:'bad'},/FILE_CORRUPT/],[{folder:'missing-folder'},/FORMAT_INVALID/]] as const){
    const broken=vault.snapshot();Object.assign(broken.items[0],change);
    const target=await fixture();await target.vault.add(draft(),false);const live=target.store.value;
    await assert.rejects(target.vault.restore(seal(utf8(JSON.stringify(broken)),key,'backup-v1',random),words),reason);assert.equal(target.store.value,live);
  }
  await vault.restore(backup,words);assert.equal(vault.snapshot().items.length,1);assert.ok(backup.length>0);
});

test('full disk or interrupted atomic commit leaves memory, encrypted live vault and previous backup intact',async () => {
  const source=await fixture(),target=await fixture(),words=phrase(random),key=recoveryKey(words);
  await source.vault.add(fileDraft(random(200)),false);await target.vault.add(draft({title:'Unrelated fictional record'}),false);
  const backup=source.vault.backup(key),priorBackup=target.vault.backup(key),prior=target.vault.snapshot(),raw=target.store.value;
  for(const fail of ['disk','interruption'] as const){target.store.fail=fail;await assert.rejects(target.vault.restore(backup,words));assert.deepEqual(target.vault.snapshot(),prior);assert.equal(target.store.value,raw);assert.doesNotThrow(()=>open(priorBackup,key,'backup-v1'));}
  target.store.fail=null;await target.vault.restore(backup,words);assert.equal(target.vault.snapshot().items.length,2);
});

test('portable old data upgrades and invalid schema is rejected',async()=>{
  const {vault}=await fixture();await vault.add(draft(),false);const legacy=JSON.parse(JSON.stringify(vault.snapshot()));legacy.version=0;delete legacy.items[0].history;delete legacy.items[0].tags;
  assert.deepEqual(validate(legacy).items[0],vault.snapshot().items[0]);assert.throws(()=>validate({...empty(),version:999}));
});

test('edit and delete require confirmation; saved date and original bytes stay; earlier note retained',async()=>{
  const {vault}=await fixture();const original=random(80);const id=await vault.add(fileDraft(original),false),saved=vault.snapshot().items[0].savedOn;
  const changes={title:'Edited fictional record',note:'New fictional note',happenedOn:null,checklist:null,tags:[]};
  await assert.rejects(vault.edit(id,changes,false,false),/CONFIRM_REQUIRED/);await assert.rejects(vault.remove(id,false),/CONFIRM_REQUIRED/);
  await vault.edit(id,changes,true,false);const item=vault.snapshot().items[0];assert.equal(item.savedOn,saved);assert.equal(item.history.length,1);assert.equal(item.history[0].note,draft().note);assert.deepEqual(vault.original(id),original);
  await vault.remove(id,true);assert.equal(vault.snapshot().items.length,0);
});

test('backup checked time changes only after verifying saved backup, and any new change makes it stale',async()=>{
  const {vault}=await fixture();const key=random(32);await vault.add(draft(),false);const backup=vault.backup(key);
  assert.equal(vault.snapshot().backup,null);await vault.checkBackup(backup,key);assert.ok(vault.snapshot().backup?.checkedOn);
  await vault.add(draft(),false);await assert.rejects(vault.checkBackup(backup,key),/BACKUP_OUTDATED/);
});

test('conflicting restore is atomic, custom folders and tags require Plus, existing ones remain readable',async()=>{
  const {vault,store}=await fixture();await assert.rejects(vault.addFolder('Fictional folder',false),/PLUS_REQUIRED/);
  const folder=await vault.addFolder('Fictional folder',true);await vault.add(draft({folder,tags:['fictional']}),true);assert.equal(vault.items(folder).length,1);
  const words=phrase(random),backup=vault.backup(recoveryKey(words));const item=vault.snapshot().items[0];await vault.edit(item.id,{title:'Changed',note:'Different',happenedOn:null,checklist:null,tags:item.tags},true,false);
  const before=store.value;await assert.rejects(vault.restore(backup,words),/RESTORE_CONFLICT/);assert.equal(store.value,before);
});

test('locking destroys the active session and prevents queued reads/writes without touching persisted papers',async()=>{
  const {vault,store}=await fixture();await vault.add(draft(),false);const before=store.value;vault.lock();
  assert.throws(()=>vault.snapshot(),/LOCKED/);await assert.rejects(vault.add(draft(),true),/LOCKED/);assert.equal(store.value,before);
});

test('cold startup removes interrupted plaintext SDK exports/imports while retaining encrypted documents',async()=>{
  const fs=await import('node:fs/promises'),os=await import('node:os'),path=await import('node:path');
  const {clearTemporary}=await import('../src/core/cleanup');const root=await fs.mkdtemp(path.join(os.tmpdir(),'kmp-cleanup-'));
  try {
    const cache=path.join(root,'cache'),docs=path.join(root,'documents');await fs.mkdir(cache);await fs.mkdir(docs);
    await fs.writeFile(path.join(docs,'vault.sqlite'),'fictional ciphertext');
    for(const name of ['Print','ImagePicker','DocumentPicker','ImageManipulator','outgoing']){
      await fs.mkdir(path.join(cache,name));await fs.writeFile(path.join(cache,name,'interrupted.tmp'),'fictional private content');
    }
    await clearTemporary(async name=>{await fs.rm(path.join(cache,name),{recursive:true,force:true});});
    assert.deepEqual(await fs.readdir(cache),[]);assert.equal(await fs.readFile(path.join(docs,'vault.sqlite'),'utf8'),'fictional ciphertext');
  }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('a device-restored vault without its this-phone key is set aside, never erased, so setup or restore can proceed',async()=>{
  const {prepareInstall}=await import('../src/core/vault');
  const {store,vault}=await fixture();await vault.add(draft(),false);const cipher=store.value;const archived:string[]=[];
  const install=Object.assign(store,{archive:async()=>{archived.push(store.value!);store.value=null;}});
  assert.equal(await prepareInstall(install,true),true);assert.equal(store.value,cipher);assert.deepEqual(archived,[]);
  assert.equal(await prepareInstall(install,false),false);assert.equal(store.value,null);assert.deepEqual(archived,[cipher]);
  assert.equal(await prepareInstall(install,false),false);assert.deepEqual(archived,[cipher]);
});
