import { buildVault, findVersion, summarize, versionPath, versionSlug } from './vaultModel';

// Mirrors the real College_Apps listing, plus a second school so the grouping and
// the slug-collision case are covered before MIT actually exists.
const UC = 'University of California (UC)';
const MIT = 'Massachusetts Institute of Technology';

const fm = (school, prompt, version, count, limit, status) => ({
  school,
  prompt,
  version,
  date: '07/27',
  time: '05:25 PM',
  word_count: count,
  word_limit: limit,
  status,
});

const file = (path, frontmatter = {}) => ({ path, sha: `sha-${path}`, frontmatter });

const FILES = [
  file('AGENTS.md'),
  file('future.md'),
  file('UC/00_UC_Master_Guide_&_Samples.md', fm(UC, 'Master Guide & Samples', 'v1', 0, 0, 'Drafting')),

  file('UC/1_Leadership/00_Overview.md', fm(UC, '1. Leadership', 'v1', 246, 350, 'Drafting')),
  file('UC/1_Leadership/Draft v1 - 07.27/Leadership v1 - 07.27.md', fm(UC, '1. Leadership', 'v1', 393, 350, 'Drafting')),
  file('UC/1_Leadership/Draft v1 - 07.27/Counselor Notes.md', fm(UC, '1. Leadership', 'v1', 60, 350, 'Drafting')),
  file('UC/1_Leadership/Draft v2 - 07.27/Leadership v2 - 07.27.md', fm(UC, '1. Leadership', 'v2', 367, 350, 'Pending Counselor Review')),
  file('UC/1_Leadership/Draft v2 - 07.27/Counselor Notes.md', fm(UC, '1. Leadership', 'v2', 77, 350, 'Pending Counselor Review')),
  file('UC/1_Leadership/Draft v2 - 07.27/Changelog.md', fm(UC, '1. Leadership', 'v2', 40, 350, 'Pending Counselor Review')),
  file('UC/1_Leadership/Draft v3 - 07.28/Leadership v3 - 07.28.md', fm(UC, '1. Leadership', 'v3', 367, 350, 'Pending Counselor Review')),
  file('UC/1_Leadership/Draft v3 - 07.28/Changelog.md', fm(UC, '1. Leadership', 'v3', 10, 350, 'Pending Counselor Review')),

  file('UC/3_Greatest_Talent/00_Overview.md', fm(UC, '3. Greatest Talent or Skill', 'v1', 200, 350, 'Drafting')),
  file('UC/3_Greatest_Talent/Draft v1 - 07.27/Greatest Talent v1 - 07.27.md', fm(UC, '3. Greatest Talent or Skill', 'v1', 548, 350, 'Drafting')),
  file('UC/3_Greatest_Talent/Draft v3 - 07.27 (Odyssey)/Greatest Talent v3 - 07.27 (Odyssey).md', fm(UC, '3. Greatest Talent or Skill', 'v3', 370, 350, 'Pending Counselor Review')),
  file('UC/3_Greatest_Talent/Draft v3 - 07.27 (Odyssey)/Counselor Notes.md', fm(UC, '3. Greatest Talent or Skill', 'v3', 55, 350, 'Pending Counselor Review')),

  file('UC/6_Academic_Subject/00_Overview.md', fm(UC, '6. Academic Subject', 'v1', 180, 350, 'Drafting')),
  file('UC/6_Academic_Subject/Draft v1 - 07.27/Academic Subject v1 - 07.27.md', fm(UC, '6. Academic Subject', 'v1', 743, 350, 'Drafting')),

  file('UC/_Unselected_Prompts/4_Educational_Opportunity/00_Overview.md', fm(UC, '4. Educational Opportunity', 'v1', 0, 350, 'Drafting')),

  // Second school. Note prompt 1 collides with UC's prompt 1 on slug.
  file('MIT/1_Leadership/00_Overview.md', fm(MIT, '1. Leadership', 'v1', 0, 200, 'Drafting')),
  file('MIT/1_Leadership/Draft v1 - 08.02/Leadership v1 - 08.02.md', fm(MIT, '1. Leadership', 'v1', 150, 200, 'Drafting')),
  file('MIT/2_Pleasure/00_Overview.md', fm(MIT, '2. What You Do For Pleasure', 'v1', 0, 200, 'Drafting')),
  file('MIT/2_Pleasure/Draft v1 - 08.02/Pleasure v1 - 08.02.md', fm(MIT, '2. What You Do For Pleasure', 'v1', 260, 200, 'Drafting')),
  file('MIT/2_Pleasure/Draft v2 - 08.03/Pleasure v2 - 08.03.md', fm(MIT, '2. What You Do For Pleasure', 'v2', 198, 200, 'Final')),
];

describe('buildVault — schools', () => {
  const vault = buildVault(FILES);

  it('groups prompts under their top-level school directory', () => {
    expect(vault.schools.map((s) => s.key).sort()).toEqual(['MIT', 'UC']);
  });

  it('names each school from its frontmatter, not the directory', () => {
    const uc = vault.schools.find((s) => s.key === 'UC');
    const mit = vault.schools.find((s) => s.key === 'MIT');
    expect(uc.name).toBe(UC);
    expect(mit.name).toBe(MIT);
  });

  it('keeps colliding prompt slugs apart across schools', () => {
    const uc = vault.schools.find((s) => s.key === 'UC');
    const mit = vault.schools.find((s) => s.key === 'MIT');
    const ucLeadership = uc.prompts.find((p) => p.slug === '1-leadership');
    const mitLeadership = mit.prompts.find((p) => p.slug === '1-leadership');

    expect(ucLeadership).toBeDefined();
    expect(mitLeadership).toBeDefined();
    expect(ucLeadership.dir).toBe('UC/1_Leadership');
    expect(mitLeadership.dir).toBe('MIT/1_Leadership');
    // Same prompt slug, different URLs.
    expect(versionPath(ucLeadership, ucLeadership.latest)).toBe('/studio/uc/1-leadership/v3');
    expect(versionPath(mitLeadership, mitLeadership.latest)).toBe('/studio/mit/1-leadership/v1');
  });

  it('gives each version a globally unique id', () => {
    const ids = vault.prompts.flatMap((p) => p.versions.map((v) => v.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scopes the archive and guides to their own school', () => {
    const uc = vault.schools.find((s) => s.key === 'UC');
    const mit = vault.schools.find((s) => s.key === 'MIT');
    expect(uc.archive.map((p) => p.slug)).toEqual(['4-educational-opportunity']);
    expect(uc.guides.map((g) => g.path)).toEqual(['UC/00_UC_Master_Guide_&_Samples.md']);
    expect(mit.archive).toEqual([]);
    expect(mit.guides).toEqual([]);
  });

  it('sorts the school with the most active prompts first, archive-only last', () => {
    const withStanford = buildVault([
      ...FILES,
      file('Stanford/_Unselected_Prompts/9_Roommate/00_Overview.md', fm('Stanford', '9. Roommate', 'v1', 0, 250, 'Drafting')),
    ]);
    // UC has 3 active prompts, MIT 2, Stanford 0.
    expect(withStanford.schools.map((s) => s.key)).toEqual(['UC', 'MIT', 'Stanford']);
  });

  it('still exposes flat lists for callers that do not group', () => {
    expect(vault.prompts.length).toBe(5);
    expect(vault.archive.length).toBe(1);
    expect(vault.guides.length).toBe(1);
  });

  it('does not name a school after a prompt sitting at the repo root', () => {
    const rootPrompt = buildVault([
      file('1_Loose/00_Overview.md', fm('', '1. Loose', 'v1', 0, 300, 'Drafting')),
      file('1_Loose/Draft v1 - 08.01/Loose v1 - 08.01.md', fm('', '1. Loose', 'v1', 10, 300, 'Drafting')),
    ]);
    expect(rootPrompt.schools).toHaveLength(1);
    expect(rootPrompt.schools[0].name).toBe('Unfiled');
    expect(rootPrompt.schools[0].prompts[0].slug).toBe('1-loose');
  });
});

describe('buildVault — prompts and versions', () => {
  const vault = buildVault(FILES);
  const uc = () => vault.schools.find((s) => s.key === 'UC');

  it('sorts prompts by their vault number, not alphabetically', () => {
    expect(uc().prompts.map((p) => p.number)).toEqual([1, 3, 6]);
  });

  it('ignores repo files with no frontmatter', () => {
    expect(vault.guides.some((g) => g.path === 'AGENTS.md')).toBe(false);
  });

  it('attaches counselor notes and changelog to the version that owns them', () => {
    const v2 = uc().prompts.find((p) => p.slug === '1-leadership').versions.find((v) => v.n === 2);
    expect(v2.notesPath).toBe('UC/1_Leadership/Draft v2 - 07.27/Counselor Notes.md');
    expect(v2.changelogPath).toBe('UC/1_Leadership/Draft v2 - 07.27/Changelog.md');

    const v3 = uc().prompts.find((p) => p.slug === '1-leadership').versions.find((v) => v.n === 3);
    expect(v3.changelogPath).toBe('UC/1_Leadership/Draft v3 - 07.28/Changelog.md');
    expect(v3.notesPath).toBeNull();
  });

  it('never mistakes a sidecar for the draft itself', () => {
    for (const version of uc().prompts.find((p) => p.slug === '1-leadership').versions) {
      expect(version.draftPath).toMatch(/Leadership v\d+ - \d{2}\.\d{2}\.md$/);
    }
  });

  it('orders versions and picks the latest as current', () => {
    const leadership = uc().prompts.find((p) => p.slug === '1-leadership');
    expect(leadership.versions.map((v) => v.n)).toEqual([1, 2, 3]);
    expect(leadership.latest.n).toBe(3);
  });

  it('flags an (Odyssey) folder as a counselor-authored pass', () => {
    const talent = uc().prompts.find((p) => p.slug === '3-greatest-talent');
    expect(talent.versions.find((v) => v.n === 3).isOdyssey).toBe(true);
    expect(talent.versions.find((v) => v.n === 3).author).toBe('Odyssey');
    expect(talent.versions.find((v) => v.n === 1).isOdyssey).toBe(false);
  });

  it('carries a per-school word limit rather than a global one', () => {
    const ucLimit = uc().prompts.find((p) => p.slug === '1-leadership').wordLimit;
    const mitLimit = vault.schools
      .find((s) => s.key === 'MIT')
      .prompts.find((p) => p.slug === '1-leadership').wordLimit;
    expect(ucLimit).toBe(350);
    expect(mitLimit).toBe(200);
  });

  it('survives a prompt whose versions are not contiguous', () => {
    const talent = uc().prompts.find((p) => p.slug === '3-greatest-talent');
    expect(talent.versions.map((v) => v.n)).toEqual([1, 3]);
    expect(talent.latest.n).toBe(3);
  });

  it('returns empty structures rather than throwing on an empty listing', () => {
    const empty = { schools: [], prompts: [], archive: [], guides: [] };
    expect(buildVault([])).toEqual(empty);
    expect(buildVault(undefined)).toEqual(empty);
  });
});

describe('findVersion', () => {
  const vault = buildVault(FILES);

  it('resolves school + prompt + version to the right draft', () => {
    const { school, prompt, version } = findVersion(vault, 'uc', '1-leadership', 'v2');
    expect(school.key).toBe('UC');
    expect(prompt.title).toBe('1. Leadership');
    expect(version.draftPath).toBe('UC/1_Leadership/Draft v2 - 07.27/Leadership v2 - 07.27.md');
  });

  it('does not leak one school’s prompt into another', () => {
    const { version } = findVersion(vault, 'mit', '1-leadership', 'v1');
    expect(version.draftPath).toBe('MIT/1_Leadership/Draft v1 - 08.02/Leadership v1 - 08.02.md');
    // UC has a v3; MIT must not resolve it.
    expect(findVersion(vault, 'mit', '1-leadership', 'v3').version).toBeNull();
  });

  it('reaches archived prompts too', () => {
    expect(findVersion(vault, 'uc', '4-educational-opportunity', 'v1').prompt.title).toBe(
      '4. Educational Opportunity'
    );
  });

  it('returns nulls for an unknown school or prompt', () => {
    expect(findVersion(vault, 'nope', '1-leadership', 'v1')).toEqual({
      school: null,
      prompt: null,
      version: null,
    });
    expect(findVersion(vault, 'uc', 'nope', 'v1').prompt).toBeNull();
  });
});

describe('summarize', () => {
  const vault = buildVault(FILES);

  it('counts a single school', () => {
    const uc = vault.schools.find((s) => s.key === 'UC');
    expect(summarize(uc.prompts)).toEqual({ active: 3, over: 3, pending: 2, final: 0 });
  });

  it('counts the whole vault', () => {
    expect(summarize(vault.prompts)).toEqual({ active: 5, over: 3, pending: 2, final: 1 });
  });
});

describe('versionSlug', () => {
  it('round-trips through findVersion', () => {
    const vault = buildVault(FILES);
    const mit = vault.schools.find((s) => s.key === 'MIT');
    const pleasure = mit.prompts.find((p) => p.slug === '2-pleasure');
    const slug = versionSlug(pleasure.latest);
    expect(slug).toBe('v2');
    expect(findVersion(vault, 'mit', pleasure.slug, slug).version.draftPath).toBe(
      pleasure.latest.draftPath
    );
  });
});
