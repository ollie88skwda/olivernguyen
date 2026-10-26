import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { syncHangr } from '../scripts/sync-hangr.mjs';

const work = [];
afterEach(async () => { await Promise.all(work.splice(0).map(p => rm(p, { recursive: true, force: true }))); });
async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), 'hangr-mirror-test-')); work.push(directory);
  const source = path.join(directory, 'source'), destination = path.join(directory, 'destination');
  const pages = ['index.html','home/index.html','directions/index.html','directions/edit/index.html',
    'directions/studio/index.html','directions/components/index.html','brand/hangr-logo.svg'];
  for (const file of pages) {
    await mkdir(path.dirname(path.join(source, file)), { recursive: true });
    await writeFile(path.join(source, file), `fixture:${file}`);
  }
  return { source, destination, directory };
}

describe('Hangr static mirror filesystem contract', () => {
  it('keeps host build/dependencies ignored without dropping deployed nested vendor chunks', () => {
    // Execute Git, the actual consumer. --no-index prevents already-staged files
    // from hiding an accidental ignore rule. Oracle: host outputs stay local,
    // but every Hangr static chunk must survive a fresh checkout and deployment.
    const ignored = execFileSync('git', ['check-ignore', '--no-index', '--stdin'], {
      encoding: 'utf8', input: 'dist/index.html\nnode_modules/dependency/index.js\npublic/hangr/_next/static/chunks/next/dist/client/components/builtin/app-error.js\n',
    }).trim().split('\n');
    expect(ignored).toEqual(['dist/index.html', 'node_modules/dependency/index.js']);
  });
  it('copies complete file bytes, records hashes and removes obsolete generated files on refresh', async () => {
    const { source, destination } = await fixture();
    await writeFile(path.join(source, 'texture.glb'), Buffer.from([0, 1, 127, 255]));
    const manifest = await syncHangr(source, destination);
    expect(await readFile(path.join(destination, 'texture.glb'))).toEqual(Buffer.from([0, 1, 127, 255]));
    expect(manifest.files.find(f => f.path === 'texture.glb')).toMatchObject({ bytes: 4, sha256: '9beb9b4fbb3161c1c60d01c253b504f0dd2ea909f764fd3d7c8213fa1580ae94' });
    expect(JSON.parse(await readFile(path.join(destination, 'hangr-build.json'), 'utf8')).application).toBe('hangr-static-mount');
    await rm(path.join(source, 'texture.glb'));
    await syncHangr(source, destination);
    await expect(readFile(path.join(destination, 'texture.glb'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('preserves unknown destination content rather than silently replacing it', async () => {
    const { source, destination } = await fixture();
    await mkdir(destination); await writeFile(path.join(destination, 'human.txt'), 'keep this');
    await expect(syncHangr(source, destination)).rejects.toThrow('HANGR_UNOWNED_DESTINATION');
    expect(await readFile(path.join(destination, 'human.txt'), 'utf8')).toBe('keep this');
  });
  it('refuses linked files before publishing anything outside the export', async () => {
    const { source, destination, directory } = await fixture();
    await writeFile(path.join(directory, 'private.txt'), 'do not copy');
    await symlink(path.join(directory, 'private.txt'), path.join(source, 'linked.txt'));
    await expect(syncHangr(source, destination)).rejects.toThrow('HANGR_UNSAFE_EXPORT');
    await expect(readFile(path.join(destination, 'linked.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
