import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { drift, FLOW, APP } from './lib/preview-flow.mjs';
const registry=JSON.parse(readFileSync('validators.registry.json','utf8'));
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
if(!files.length)throw Error('NO_FILES');
const texts=files.filter(f=>!f.endsWith('package-lock.json')&&!f.startsWith('assets/')).map(f=>[f,readFileSync(f,'utf8')]);
const app=texts.filter(([f])=>/^(src|app)\//.test(f));
// Public business addresses the website shows on purpose: the app's own domain, and the Spry Labs
// contact used until a keepmyproof.com mailbox exists (release gate SUPPORT_ADDRESS_NOT_ON_DOMAIN).
const PUBLIC_ADDRESS=e=>/@keepmyproof\.com$/i.test(e)||e.toLowerCase()==='hello@theindustryguides.com';
const sha=s=>createHash('sha256').update(s.toLowerCase()).digest('hex');
const privateHashes=JSON.parse(readFileSync('scripts/private-hashes.json','utf8'));
const checks={
  'public-data':()=>{
    const bad=[];
    for(const [f,s] of texts){
      if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_|gho_|github_pat_|sk_live_|sk_test_)[A-Za-z0-9_]{16,}|\bAKIA[A-Z0-9]{16}\b/.test(s))bad.push(f);
      const emails=s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[];
      if(emails.some(e=>!e.endsWith('@users.noreply.github.com')&&!e.endsWith('@example.invalid')&&!PUBLIC_ADDRESS(e)))bad.push(f);
      // Research facts quote official government pages verbatim (scripts/verify-facts.mjs checks every
      // quote on its .gov source), so their office phone numbers and street names are public record
      // (e.g. a VA office on a street that shares a private name). Secrets and emails are still checked.
      const officialRecord=f.startsWith('site/data/facts/')||f.startsWith('site/data/translations/');
      if(!officialRecord&&/\(\d{3}\)\s*\d{3}[- ]\d{4}/.test(s))bad.push(f);
      if(!officialRecord&&s.split(/[^\p{L}\p{N}@._+-]+/u).some(w=>w.length>3&&privateHashes.includes(sha(w))))bad.push(f);
    }
    if(bad.length)throw Error(`PRIVATE_DATA: ${[...new Set(bad)].join(', ')}`);
  },
  'local-only':()=>{
    const allowed=new Set(Object.keys(JSON.parse(readFileSync('package.json','utf8')).dependencies));
    for(const [f,s] of app){
      const ast=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true,f.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
      const visit=node=>{
        if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
          const name=node.moduleSpecifier.text,root=name.startsWith('@')?name.split('/').slice(0,2).join('/'):name.split('/')[0];
          if(!name.startsWith('.')&&!allowed.has(root)&&root!=='react-native')throw Error(`UNREVIEWED_IMPORT ${f}`);
          if(/analytics|sentry|bugsnag|firebase|supabase|axios|amplitude|segment|mixpanel/i.test(name))throw Error(`REMOTE_SDK ${f}`);
          if(name==='react-native-purchases'&&f!=='src/billing/revenuecat.ts')throw Error(`BILLING_BOUNDARY ${f}`);
        }
        if(ts.isIdentifier(node)&&['fetch','XMLHttpRequest','WebSocket','EventSource','sendBeacon'].includes(node.text))throw Error(`NETWORK_CALL ${f}`);
        if(ts.isStringLiteralLike(node)&&/^https?:\/\//.test(node.text)){
          const u=new URL(node.text);
          if(!['keepmyproof.com','www.va.gov'].includes(u.hostname))throw Error(`NETWORK_ENDPOINT ${f}`);
        }
        ts.forEachChild(node,visit);
      };visit(ast);
    }
  },
  'honest-claims':()=>{
    const content=texts.filter(([f])=>f==='src/strings.ts'||f.startsWith('store/'));
    if(!content.length)throw Error('NO_APP_CONTENT');
    const site=texts.filter(([f])=>f.startsWith('site/')&&f.endsWith('.mjs'));
    if(!site.length)throw Error('NO_SITE_CONTENT');
    // EN and ES: prohibited evidence/security claims (R-ADV-01/02) and race-labelled branding, in the
    // app, store and website copy. Competitor names (R-REPO-06): never in app or store copy; the
    // website may compare.
    const claims=/court.admissible|admisibles? (?:en|ante) (?:el |la |un )?(?:tribunal|corte|juicio)|unhackable|imposible de hackear|inhackeable|military.grade|grado militar|proof that wins|pruebas? que gana|guaranteed (?:win|outcome)|black.owned|(?:de |con )?due(?:ñ|n)[oa]s? negr[oa]s?/iu;
    // App and store copy in all four languages (ZH and KO added 2 Nov 2026): the same claims in Chinese and
    // Korean, plus "court-ready". The website has its own gate for these words (site/lib/gate.mjs), whose
    // source quotes them, so this list reads app and store copy only.
    const appClaims=/court.ready|listos? para (?:la )?corte|法庭(?:可)?(?:采纳|采信|认可)|可呈堂|法庭就绪|胜诉|打赢官司|无法(?:被)?(?:破解|入侵)|军用级|军事级|黑人(?:拥有|所有|创办)|법정(?:에서)?\s*(?:인정|채택|사용\s*가능)|법정용|증거\s*능력|승소|해킹\s*불가|군사\s*등급|군용\s*(?:등급|수준)|흑인\s*(?:소유|운영)/iu;
    const competitors=/vaultaire|proofnest/iu;
    for(const [f,s] of [...content,...site])if(claims.test(s))throw Error(`UNSUPPORTED_CLAIM ${f}`);
    for(const [f,s] of content)if(competitors.test(s))throw Error(`COMPETITOR_IN_STORE_COPY ${f}`);
    for(const [f,s] of content)if(appClaims.test(s))throw Error(`UNSUPPORTED_CLAIM ${f}`);
  },
  'verified-facts':async()=>{
    // The published site, offline: every state page carries 3+ facts from verified, official sources
    // (site/data/verified/<folder>.json, written by scripts/verify-facts.mjs), an answer block, the
    // not-legal-advice line and its US framing in each language; no page carries a banned claim word;
    // no search-loop question page fails the legal and VA gate. Hard-fails on zero state pages.
    const { renderAll } = await import('../site/build.mjs');
    const { bannedWord, htmlText, officialSource } = await import('../site/lib/gate.mjs');
    const { files, pages, stops } = renderAll();
    const states = pages.filter(p => p.state);
    if (!states.length) throw Error('NO_STATE_PAGES: the site publishes no state page (run scripts/verify-facts.mjs)');
    const ADVICE = { en: /Not legal advice/, es: /No es asesoría legal/, zh: /不构成法律建议/, ko: /법률 자문이 아닙니다/ }, US = { en: /./, es: /Estados Unidos/, zh: /美国/, ko: /미국/ };
    const bad = [];
    for (const p of pages.filter(x => !x.external)) {
      const body = files[p.file].replace(/<head>[\s\S]*?<\/head>/, ''), text = htmlText(body), b = bannedWord(text);
      if (b) bad.push(`${p.path}: banned word "${b}"`);
      if (!p.state) continue;
      const l = p.state.lang, facts = [...body.matchAll(/<ul class="facts">([\s\S]*?)<\/ul>/g)].flatMap(m => [...m[1].matchAll(/<li>[\s\S]*?href="([^"]+)"/g)].map(x => x[1]));
      if (facts.length < 3 || !facts.every(officialSource)) bad.push(`${p.path}: ${facts.length} sourced facts or a non-official source`);
      if (!/class="definition answer"/.test(body)) bad.push(`${p.path}: no answer block`);
      if (!ADVICE[l].test(text) || !US[l].test(text)) bad.push(`${p.path}: missing the not-legal-advice line or US framing`);
    }
    for (const s of stops.filter(x => x.includes('[QUESTION_GATE]'))) bad.push(s);
    if (bad.length) throw Error(`FACTS_GATE ${bad.length}:\n${bad.slice(0, 20).join('\n')}`);
    console.log(`  ${states.length} state pages, ${pages.length} pages checked`);
  },
  'preview-screens':()=>{
    // Every app screen has a screenshot step in the simulator preview (docs/preview.md), or a stated reason.
    const problems=drift(readFileSync(APP,'utf8'),readFileSync(FLOW,'utf8'));
    if(problems.length)throw Error(problems.join('\n'));
  },
};
const seen=new Set();
for(const row of registry){if(seen.has(row.name)||!checks[row.name])throw Error('UNKNOWN_VALIDATOR');seen.add(row.name);await checks[row.name]();console.log(`PASS ${row.name}`);}
if(Object.keys(checks).some(name=>!seen.has(name)))throw Error('UNREGISTERED_VALIDATOR');
