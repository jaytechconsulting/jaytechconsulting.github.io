import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../public/cms-bootstrap.js', import.meta.url), 'utf8');
function context(fetch) {
  return {
    window: { location: { pathname: "/" } }, fetch, AbortController, setTimeout, clearTimeout,
    performance: { now: () => 42 },
    document: { querySelector: () => ({ content: 'https://api.test/api/public-site' }) },
  };
}
test('starts before Angular, omits credentials, and does not start twice', async () => {
  let calls = 0;
  const sandbox = context(async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.test/api/public-site');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-cache');
    return { ok: true, status: 200, statusText: 'OK', json: async () => ({ data: 'cms' }) };
  });
  runInNewContext(source, sandbox);
  runInNewContext(source, sandbox);
  assert.equal(calls, 1);
  assert.equal((await sandbox.window.__publicSiteBootstrap.result).body.data, 'cms');
});
test('settles network and parsing failures without an unhandled rejection', async () => {
  for (const fetch of [async () => { throw Error('offline'); }, async () => ({ json: async () => { throw Error('invalid JSON'); } })]) {
    const sandbox = context(fetch);
    runInNewContext(source, sandbox);
    assert.equal((await sandbox.window.__publicSiteBootstrap.result).ok, false);
  }
});

test('skips the public request on direct admin entry', () => {
  const sandbox = context(() => assert.fail('unexpected public request'));
  sandbox.window.location.pathname = '/admin/usuarios';
  runInNewContext(source, sandbox);
  assert.equal(sandbox.window.__publicSiteBootstrap, undefined);
});
