import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Every local Expo module ships the native code its config declares, COMMITTED (13 Nov 2026).
// The fast-kdf branch declared KmpKdfModule for iOS and Android, but `.gitignore`'s `ios/` and
// `android/` (meant for the prebuild output at the root) also ignored modules/kmp-kdf/ios and
// modules/kmp-kdf/android. The sources existed only on one disk; the JS tests passed; the app would
// have thrown at start-up in requireNativeModule('KmpKdf'). So this reads what git tracks.
const tracked = execFileSync('git', ['ls-files', 'modules'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const configs = tracked.filter(f => /^modules\/[^/]+\/expo-module\.config\.json$/.test(f));

test('every local Expo module has committed native sources for each platform it declares', () => {
  assert.ok(configs.length > 0, 'no modules/*/expo-module.config.json is tracked: nothing was checked');
  let checked = 0;
  for (const cfgPath of configs) {
    const dir = cfgPath.replace(/expo-module\.config\.json$/, '');
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
    const files = tracked.filter(f => f.startsWith(dir));
    for (const name of cfg.apple?.modules ?? []) {
      const swift = files.filter(f => f.startsWith(`${dir}ios/`) && f.endsWith('.swift'));
      assert.ok(swift.some(f => new RegExp(`class\\s+${name}\\b`).test(readFileSync(f, 'utf8'))), `${dir}: no committed Swift class ${name}`);
      assert.ok(files.some(f => f.startsWith(`${dir}ios/`) && f.endsWith('.podspec')), `${dir}: no committed podspec`);
      checked++;
    }
    for (const fqn of cfg.android?.modules ?? []) {
      const rel = `${dir}android/src/main/java/${fqn.replace(/\./g, '/')}`;
      assert.ok(files.includes(`${rel}.kt`) || files.includes(`${rel}.java`), `${dir}: no committed Android source for ${fqn}`);
      assert.ok(files.includes(`${dir}android/build.gradle`), `${dir}: no committed android/build.gradle`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'the module configs declared no native modules: nothing was checked');
});

test('the prebuild ignore rules cover only the root ios/ and android/ folders', () => {
  const ignored = (p: string) => { try { execFileSync('git', ['check-ignore', '-q', p]); return true; } catch { return false; } };
  assert.ok(ignored('ios/Podfile') && ignored('android/build.gradle'), 'prebuild output must stay ignored');
  assert.ok(!ignored('modules/x/ios/X.swift') && !ignored('modules/x/android/build.gradle'), 'module native sources must not be ignored');
});
