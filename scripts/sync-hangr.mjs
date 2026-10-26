// Hangr remains an independent static application. Only its generated namespace
// is mirrored here; the personal site's React tree, branding and routes stay put.
import { cp, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const required = ['index.html', 'home/index.html', 'directions/index.html',
  'directions/edit/index.html', 'directions/studio/index.html',
  'directions/components/index.html', 'brand/hangr-logo.svg'];
const marker = 'hangr-build.json';

export async function syncHangr(source, destination) {
  source = path.resolve(source);
  destination = path.resolve(destination);
  if (source === destination || source.startsWith(destination + path.sep) || destination.startsWith(source + path.sep)) {
    throw new Error('HANGR_OVERLAPPING_PATHS: source and destination must be separate directories');
  }
  for (const file of required) {
    let stat;
    try { stat = await lstat(path.join(source, file)); }
    catch (cause) { throw new Error(`HANGR_INCOMPLETE_EXPORT: missing ${file}`, { cause }); }
    if (!stat.isFile()) throw new Error(`HANGR_INCOMPLETE_EXPORT: missing ${file}`);
  }
  const files = [];
  async function inspect(directory, relative = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const name = path.posix.join(relative, entry.name);
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) throw new Error(`HANGR_UNSAFE_EXPORT: ${name}`);
      if (entry.isDirectory()) await inspect(path.join(directory, entry.name), name);
      else if (entry.isFile()) {
        const bytes = await readFile(path.join(directory, entry.name));
        files.push({ path: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
      } else throw new Error(`HANGR_UNSAFE_EXPORT: unsupported file ${name}`);
    }
  }
  await inspect(source);
  files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  if (files.some(f => f.path === marker)) throw new Error(`HANGR_RESERVED_FILE: ${marker}`);
  let existing = false;
  try { existing = Boolean(await lstat(destination)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing) {
    let owner, ownershipError;
    try { owner = JSON.parse(await readFile(path.join(destination, marker), 'utf8')); }
    catch (error) { ownershipError = error; }
    if (owner?.application !== 'hangr-static-mount' || owner?.basePath !== '/hangr') {
      throw new Error('HANGR_UNOWNED_DESTINATION: refusing to replace an unrecognised directory', { cause: ownershipError });
    }
  }
  const manifest = { schemaVersion: 1, application: 'hangr-static-mount', basePath: '/hangr',
    generatedAt: new Date().toISOString(),
    contentSha256: createHash('sha256').update(JSON.stringify(files)).digest('hex'), files };
  const staging = destination + `.staging-${process.pid}`;
  const backup = destination + `.previous-${process.pid}`;
  // Never remove an unrelated staging directory left by a different invocation.
  for (const candidate of [staging, backup]) {
    try { await lstat(candidate); throw new Error(`HANGR_STAGING_EXISTS: ${candidate}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    await cp(source, staging, { recursive: true, filter: file => path.basename(file) !== '.DS_Store' });
    await writeFile(path.join(staging, marker), JSON.stringify(manifest, null, 2) + '\n');
    if (existing) await rename(destination, backup);
    try { await rename(staging, destination); }
    catch (error) { if (existing) await rename(backup, destination); throw error; }
    if (existing) await rm(backup, { recursive: true });
  } finally { await rm(staging, { recursive: true, force: true }); }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    const manifest = await syncHangr(process.argv[2] || path.resolve(root, '../hangr/out-hosted'), path.join(root, 'public/hangr'));
    console.log(`Mirrored ${manifest.files.length} Hangr files under /hangr (${manifest.contentSha256}).`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
