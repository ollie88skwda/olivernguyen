// Turns the flat `/api/vault/list` payload into the structure the vault actually
// has: school x prompt x version x document kind.
//
// School is the top-level directory (`UC/`, `MIT/`), per AGENTS.md's
// `[School_Name]/[Prompt_Name]/` rule. Its display name comes from the
// `school:` frontmatter field, which is the human-readable form.

const OVERVIEW = '00_Overview.md';
const NOTES = 'Counselor Notes.md';
const CHANGELOG = 'Changelog.md';
const ARCHIVE_SEGMENT = '_Unselected_Prompts';
const UNFILED = '_unfiled';

// "Draft v2 - 07.27" / "Final Draft v3 - 07.28" / "Draft v3 - 07.27 (Odyssey)"
const DRAFT_FOLDER_RE = /^(Final )?Draft v(\d+) - (\d{2}\.\d{2})(?:\s+\((.+)\))?$/;

const dirOf = (path) => path.slice(0, path.lastIndexOf('/'));
const baseOf = (path) => path.slice(path.lastIndexOf('/') + 1);

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// "1_Leadership" -> { number: 1, slug: "1-leadership" }. The number drives display
// order so prompt 6 sorts after 3, and the slug is the URL segment.
function identify(segment) {
  const match = segment.match(/^(\d+)[_\s-]*(.*)$/);
  return {
    number: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
    slug: slugify(segment),
  };
}

export function versionNumber(version) {
  const match = String(version || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function isFinalVersion(version) {
  return /final/i.test(String(version || ''));
}

// Every draft in a folder is the one .md that is not one of the two sidecars.
function isDraftFile(fileName) {
  return fileName !== NOTES && fileName !== CHANGELOG && fileName.endsWith('.md');
}

// The school something belongs to is its first path segment. Pass a *directory*
// for a prompt (`UC/1_Leadership` -> UC) and a *file path* for a loose guide
// (`UC/00_Guide.md` -> UC). Anything sitting at the repo root has no school
// directory, so it lands in a catch-all rather than naming a school after itself.
function schoolKeyOf(dirOrPath) {
  const slash = dirOrPath.indexOf('/');
  return slash === -1 ? UNFILED : dirOrPath.slice(0, slash);
}

export function buildVault(files) {
  const entries = (files || []).filter((file) => file && file.path && file.path.endsWith('.md'));

  // A directory is a prompt exactly when it holds a 00_Overview.md.
  const promptDirs = new Map();
  for (const entry of entries) {
    if (baseOf(entry.path) !== OVERVIEW) continue;
    const dir = dirOf(entry.path);
    const segment = baseOf(dir);
    const { number, slug } = identify(segment);
    const frontmatter = entry.frontmatter || {};
    promptDirs.set(dir, {
      dir,
      slug,
      number,
      schoolKey: schoolKeyOf(dir),
      archived: dir.split('/').includes(ARCHIVE_SEGMENT),
      overviewPath: entry.path,
      school: frontmatter.school || '',
      title: frontmatter.prompt || segment,
      wordLimit: frontmatter.word_limit || null,
      folders: new Map(),
    });
  }

  // Longest-prefix match, so a nested prompt dir wins over its parent.
  const dirsByDepth = [...promptDirs.keys()].sort((a, b) => b.length - a.length);
  const ownerOf = (path) => dirsByDepth.find((dir) => path.startsWith(`${dir}/`)) || null;

  const guides = [];

  for (const entry of entries) {
    const fileName = baseOf(entry.path);
    if (fileName === OVERVIEW) continue;

    const owner = ownerOf(entry.path);
    if (!owner) {
      // Loose .md outside any prompt dir. Keep the ones the vault authored
      // (they carry frontmatter); skip repo files like AGENTS.md.
      if (entry.frontmatter && entry.frontmatter.school) {
        guides.push({
          path: entry.path,
          sha: entry.sha,
          title: fileName.replace(/\.md$/, ''),
          schoolKey: schoolKeyOf(entry.path),
          school: entry.frontmatter.school,
        });
      }
      continue;
    }

    const prompt = promptDirs.get(owner);
    const relative = entry.path.slice(owner.length + 1);
    const slash = relative.indexOf('/');
    if (slash === -1) continue;

    const folderName = relative.slice(0, slash);
    const match = folderName.match(DRAFT_FOLDER_RE);
    if (!match) continue;

    if (!prompt.folders.has(folderName)) {
      prompt.folders.set(folderName, {
        folderPath: `${owner}/${folderName}`,
        n: Number(match[2]),
        date: match[3],
        isFinal: Boolean(match[1]),
        author: match[4] || null,
        isOdyssey: /odyssey/i.test(match[4] || ''),
        draft: null,
        notesPath: null,
        changelogPath: null,
      });
    }

    const folder = prompt.folders.get(folderName);
    if (fileName === NOTES) folder.notesPath = entry.path;
    else if (fileName === CHANGELOG) folder.changelogPath = entry.path;
    else if (isDraftFile(fileName)) folder.draft = entry;
  }

  // ── group into schools ────────────────────────────────────────────────────
  const schools = new Map();
  const ensureSchool = (key) => {
    if (!schools.has(key)) {
      schools.set(key, {
        key,
        slug: slugify(key) || UNFILED,
        name: '',
        prompts: [],
        archive: [],
        guides: [],
      });
    }
    return schools.get(key);
  };

  for (const prompt of promptDirs.values()) {
    const versions = [...prompt.folders.values()]
      // A folder with no draft file is a broken pass, not a version.
      .filter((folder) => folder.draft)
      .map((folder) => {
        const frontmatter = folder.draft.frontmatter || {};
        return {
          id: `${prompt.schoolKey}/${prompt.slug}/v${folder.n}${folder.isFinal ? '-final' : ''}`,
          label: frontmatter.version || `${folder.isFinal ? 'Final v' : 'v'}${folder.n}`,
          n: folder.n,
          isFinal: folder.isFinal,
          isOdyssey: folder.isOdyssey,
          author: folder.author,
          date: folder.date,
          folderPath: folder.folderPath,
          draftPath: folder.draft.path,
          sha: folder.draft.sha,
          frontmatter,
          notesPath: folder.notesPath,
          changelogPath: folder.changelogPath,
          wordCount: Number(frontmatter.word_count) || 0,
          wordLimit: Number(frontmatter.word_limit) || prompt.wordLimit || 0,
          status: frontmatter.status || 'Drafting',
        };
      })
      .sort((a, b) => a.n - b.n || Number(a.isFinal) - Number(b.isFinal));

    const school = ensureSchool(prompt.schoolKey);
    // First overview that names a school wins; the directory is the fallback.
    if (!school.name && prompt.school) school.name = prompt.school;

    const record = {
      slug: prompt.slug,
      number: prompt.number,
      schoolKey: prompt.schoolKey,
      schoolSlug: school.slug,
      school: prompt.school,
      title: prompt.title,
      dir: prompt.dir,
      overviewPath: prompt.overviewPath,
      wordLimit: prompt.wordLimit || (versions.length ? versions[versions.length - 1].wordLimit : 0),
      versions,
      latest: versions.length ? versions[versions.length - 1] : null,
    };

    if (prompt.archived) school.archive.push(record);
    else school.prompts.push(record);
  }

  for (const guide of guides) {
    const school = ensureSchool(guide.schoolKey);
    if (!school.name && guide.school) school.name = guide.school;
    school.guides.push(guide);
  }

  const byNumber = (a, b) => a.number - b.number || a.slug.localeCompare(b.slug);
  const list = [...schools.values()];
  for (const school of list) {
    if (!school.name) school.name = school.key === UNFILED ? 'Unfiled' : school.key;
    school.prompts.sort(byNumber);
    school.archive.sort(byNumber);
    school.guides.sort((a, b) => a.path.localeCompare(b.path));
  }

  // Most active school first, then alphabetically. Ordering by prompt count
  // rather than by name keeps the school you are actually writing for at the
  // top instead of letting a brand-new one outrank it on the alphabet.
  list.sort((a, b) => b.prompts.length - a.prompts.length || a.name.localeCompare(b.name));

  return {
    schools: list,
    // Flat views, so callers that do not care about grouping stay simple.
    prompts: list.flatMap((school) => school.prompts),
    archive: list.flatMap((school) => school.archive),
    guides: list.flatMap((school) => school.guides),
  };
}

export function findVersion(vault, schoolSlug, promptSlug, versionKey) {
  const school = vault.schools.find((entry) => entry.slug === schoolSlug);
  if (!school) return { school: null, prompt: null, version: null };

  const prompt =
    school.prompts.find((entry) => entry.slug === promptSlug) ||
    school.archive.find((entry) => entry.slug === promptSlug);
  if (!prompt) return { school, prompt: null, version: null };

  const wanted = versionNumber(versionKey);
  const version =
    prompt.versions.find(
      (entry) => entry.n === wanted && isFinalVersion(versionKey) === entry.isFinal
    ) ||
    prompt.versions.find((entry) => entry.n === wanted) ||
    null;
  return { school, prompt, version };
}

export function versionSlug(version) {
  return version.isFinal ? `final-v${version.n}` : `v${version.n}`;
}

export function versionPath(prompt, version) {
  return `/studio/${prompt.schoolSlug}/${prompt.slug}/${versionSlug(version)}`;
}

// Totals for the S0 status instrument. Takes any list of prompts, so it works
// for one school or for the whole vault.
export function summarize(prompts) {
  let over = 0;
  let pending = 0;
  let final = 0;
  for (const prompt of prompts) {
    const latest = prompt.latest;
    if (!latest) continue;
    if (latest.wordLimit && latest.wordCount > latest.wordLimit) over += 1;
    if (latest.status === 'Pending Counselor Review') pending += 1;
    if (latest.status === 'Final') final += 1;
  }
  return { active: prompts.length, over, pending, final };
}

export default buildVault;
