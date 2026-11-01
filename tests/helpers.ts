import { randomBytes } from 'node:crypto';
import { b64, hash, type Random } from '../src/core/crypto';
import { Vault, type AtomicStore, type Draft } from '../src/core/vault';
export const random: Random = n => new Uint8Array(randomBytes(n));
export class MemoryStore implements AtomicStore {
  value: string | null = null; fail: 'disk'|'interruption'|null = null;
  async read() { return this.value; }
  async write(value: string) { if (this.fail) throw Error(this.fail); this.value = value; }
}
export const draft = (override: Partial<Draft> = {}): Draft => ({ folder:'divorce-prep',checklist:null,kind:'note',title:'Invented record',note:'A fictional note',happenedOn:null,filename:null,mime:null,bytes:null,tags:[], ...override });
export async function fixture() { const store = new MemoryStore(), key = random(32), vault = new Vault(store,key,random); await vault.load(); return { store,key,vault }; }
export const fileDraft = (bytes: Uint8Array, filename = 'fictional-資料.pdf') => draft({kind:'file',filename,mime:'application/pdf',bytes:b64(bytes)});
