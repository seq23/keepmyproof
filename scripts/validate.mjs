import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const registry=JSON.parse(readFileSync('validators.registry.json','utf8'));
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
if(!files.length)throw Error('NO_FILES');
const texts=files.filter(f=>!f.endsWith('package-lock.json')&&!f.startsWith('assets/')).map(f=>[f,readFileSync(f,'utf8')]);
const app=texts.filter(([f])=>/^(src|app)\//.test(f));
const sha=s=>createHash('sha256').update(s.toLowerCase()).digest('hex');
const privateHashes=JSON.parse(readFileSync('scripts/private-hashes.json','utf8'));
const checks={
  'public-data':()=>{
    const bad=[];
    for(const [f,s] of texts){
      if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_|gho_|github_pat_|sk_live_|sk_test_)[A-Za-z0-9_]{16,}|\bAKIA[A-Z0-9]{16}\b/.test(s))bad.push(f);
      const emails=s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[];
      if(emails.some(e=>!e.endsWith('@users.noreply.github.com')&&!e.endsWith('@example.invalid')))bad.push(f);
      if(/\(\d{3}\)\s*\d{3}[- ]\d{4}/.test(s))bad.push(f);
      if(s.split(/[^\p{L}\p{N}@._+-]+/u).some(w=>w.length>3&&privateHashes.includes(sha(w))))bad.push(f);
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
    // EN and ES: prohibited evidence/security claims (R-ADV-01/02), competitor names in app or store
    // copy (R-REPO-06; the website may compare, the store listing never), race-labelled branding.
    const claims=/court.admissible|admisibles? (?:en|ante) (?:el |la |un )?(?:tribunal|corte|juicio)|unhackable|imposible de hackear|inhackeable|military.grade|grado militar|proof that wins|pruebas? que gana|guaranteed (?:win|outcome)|black.owned|(?:de |con )?due(?:ñ|n)[oa]s? negr[oa]s?|vaultaire|proofnest/iu;
    for(const [f,s] of content)if(claims.test(s))throw Error(`UNSUPPORTED_CLAIM ${f}`);
  },
};
const seen=new Set();
for(const row of registry){if(seen.has(row.name)||!checks[row.name])throw Error('UNKNOWN_VALIDATOR');seen.add(row.name);checks[row.name]();console.log(`PASS ${row.name}`);}
if(Object.keys(checks).some(name=>!seen.has(name)))throw Error('UNREGISTERED_VALIDATOR');
