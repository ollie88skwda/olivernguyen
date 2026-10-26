// Exercise the actual host's header matching, including terminal slashes.
// Vercel preview's platform robots override is not production-header proof.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const host = (process.env.HANGR_HOST || 'http://127.0.0.1:4179').replace(/\/$/, '');
const results = [];
for (const route of ['', '/home', '/directions', '/directions/edit', '/directions/studio', '/directions/components']) {
  for (const suffix of ['', '/']) {
    const path = `/hangr${route}${suffix}`;
    const response = await fetch(host + path);
    assert.equal(response.status, 200, path);
    const robots = response.headers.get('x-robots-tag') || '';
    assert.match(robots, /\bnoindex\b/, `Missing noindex: ${path}`);
    assert.match(robots, /\bnofollow\b/, `Missing nofollow: ${path}`);
    results.push({ path, status: response.status, robots });
  }
}
for (const path of ['/hangr/directions/plan.html', '/hangr/directions/component-inventory.html', '/hangr/directions/wording-changes.html', '/hangr/brand/hangr-logo.svg']) {
  const response = await fetch(host + path);
  assert.equal(response.status, 200, path);
  const robots = response.headers.get('x-robots-tag') || '';
  assert.match(robots, /\bnoindex\b/, path);
  assert.match(robots, /\bnofollow\b/, path);
  results.push({ path, status: response.status, robots });
}
for (const path of ['/', '/assets/not-a-real-hangr-file.js', '/hangr-not-this-namespace']) {
  const response = await fetch(host + path);
  assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /\bnoindex\b/, `Header escaped Hangr namespace: ${path}`);
}
const out = `test-results/hangr/${process.env.HANGR_CHECK_LABEL || 'headers'}`;
await mkdir(out, { recursive: true });
await writeFile(`${out}/header-verification.json`, JSON.stringify({ host, at: new Date().toISOString(), results }, null, 2) + '\n');
console.log(`Scoped noindex,nofollow: ${results.length} Hangr route forms passed; adjacent personal paths unaffected.`);
