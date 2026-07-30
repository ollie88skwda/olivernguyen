#!/usr/bin/env node
// Turns the Phase A research JSON into src/pages/apply/data.generated.js.
//
// Generated rather than hand-written because the research is re-runnable: a counselor
// suggests a school in October, one agent researches that row, and this regenerates the
// module without anyone retyping 34 records. The generated file is the OFFLINE FALLBACK
// and first-run bootstrap only. Once the Supabase row exists, that row is the truth and
// this file stops being read.
//
//   node scripts/build-apply-seed.mjs <research-dir>
//
// Scoring policy, which is the part worth arguing about:
//
//   Criteria that are FACTS get derived from the research and marked with the rule that
//   produced them. Whether a kinesiology department exists is not an opinion, and seeding
//   34 identical rows when the answer is already known would be pretending to know less
//   than we do.
//
//   Criteria that are JUDGEMENTS stay 'TODO — Ollie'. Whether Georgia Tech's ISyE beats
//   Purdue's IE is his call, not a fact this script can look up, and /major's seed.js sets
//   the precedent: encode stated answers, leave everything else an explicit placeholder
//   rather than a plausible guess.
//
//   Anything unresearched gets a WIDE range, never a middling one, so the Monte Carlo
//   reports it as uncertain rather than quietly mediocre.

import fs from 'node:fs';
import path from 'node:path';

const BATCHES = ['uc', 'ca', 'bigten', 'south', 'eastpub', 'ivy', 'tech', 'small'];
const UNKNOWN = { lo: 1, mid: 5, hi: 10, basis: 'unresearched' };

const researchDir = process.argv[2];
if (!researchDir) {
  console.error('usage: node scripts/build-apply-seed.mjs <research-dir>');
  process.exit(1);
}

function readJson(file) {
  const full = path.join(researchDir, file);
  if (!fs.existsSync(full)) return null;
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    console.error(`  !! ${file} is not valid JSON: ${err.message}`);
    return null;
  }
}

function fieldValue(field) {
  if (field == null) return null;
  if (typeof field === 'object') return field.value ?? field.name ?? null;
  return field;
}

const score = (lo, mid, hi, basis) => ({ lo, mid, hi, basis });

// ── Derivations from researched fact ────────────────────────────────────────────

// A major beats a minor beats nothing. Unknown stays wide rather than scoring as absent,
// because "we did not check" and "it is not there" are different answers.
function kinesScore(school) {
  const k = school.kines;
  if (!k || k.exists == null) return UNKNOWN;
  if (!k.exists) return score(1, 1, 2, 'no kinesiology or exercise science found');
  if (k.majorName) return score(8, 9, 10, `major: ${k.majorName}`);
  if (k.minorName) return score(6, 7, 8, `minor: ${k.minorName}`);
  return score(5, 6, 8, 'kinesiology present, level unclear');
}

// Being undecided is the stated situation, so this criterion is about structure: can you
// enter without declaring, and can you move once you are in.
function undecidedScore(school) {
  const undeclared = school.undeclaredEntry && school.undeclaredEntry.value;
  const difficulty = school.switchPolicy && school.switchPolicy.difficulty;
  if (undeclared == null && !difficulty) return UNKNOWN;

  const switchPoints = { easy: 5, medium: 3, hard: 1 }[difficulty] ?? 2;
  const entryPoints = undeclared === true ? 5 : undeclared === false ? 1 : 3;
  const total = switchPoints + entryPoints;
  return score(
    Math.max(1, total - 1),
    total,
    Math.min(10, total + 1),
    `entry ${undeclared === true ? 'undeclared' : 'by major'}, switching ${difficulty || 'unknown'}`
  );
}

// Only programs whose door genuinely closes count for much here. A program you can join
// as a sophomore is nice to have, not a reason to pick a school as a senior.
function programsScore(school, programs) {
  const mine = programs.filter((p) => p.schoolId === school.id || p.school === school.name);
  if (mine.length === 0) return score(1, 2, 4, 'no senior-only programs found');

  const closing = mine.filter((p) => p.seniorOnly === true && p.canJoinLater !== true);
  const later = mine.length - closing.length;
  const base = Math.min(10, 2 + closing.length * 2.5);
  return score(
    Math.max(1, base - 1.5),
    base,
    Math.min(10, base + 1.5),
    `${closing.length} door-closing, ${later} joinable later`
  );
}

// ── Build ───────────────────────────────────────────────────────────────────────

const programs = readJson('programs.json') || [];
const admitRates = readJson('admitrates.json') || [];
const byId = new Map(admitRates.map((r) => [r.id, r]));

const schools = [];
const missing = [];
for (const batch of BATCHES) {
  const data = readJson(`${batch}.json`);
  if (!data) {
    missing.push(batch);
    continue;
  }
  schools.push(...data);
}

for (const school of schools) {
  // A dedicated pass looked for engineering-specific rates; fold them in where it found
  // one, and leave the campus number clearly labelled as a fallback where it did not.
  const extra = byId.get(school.id);
  if (extra && extra.engineering && extra.engineering.published) {
    school.admitRate = { ...(school.admitRate || {}), engineering: extra.engineering };
  }
  if (extra && extra.profile) school.admittedProfile = extra.profile;

  school.programs = programs
    .filter((p) => p.schoolId === school.id || p.school === school.name)
    .map((p) => p.id);

  school.scores = {
    programs: programsScore(school, programs),
    strength: { lo: 1, mid: 5, hi: 10, basis: 'TODO — Ollie: your read on this program' },
    undecided: undecidedScore(school),
    kines: kinesScore(school),
  };

  const gaps = new Set(school.needsResearch || []);
  if (!fieldValue((school.admitRate || {}).engineering)) gaps.add('admitRate.engineering');
  school.needsResearch = [...gaps];
}

const stamp = new Date().toISOString().slice(0, 10);
const banner = `// GENERATED by scripts/build-apply-seed.mjs on ${stamp}. Do not edit by hand.
//
// Source: Phase A research. Every non-null field carries the URL it came from and the
// date it was fetched; anything that could not be verified against a real page is null
// and named in that school's needsResearch list.
//
// Scores: criteria that are facts (kinesiology, switching structure, senior-only program
// count) are derived here and carry the rule under \`basis\`. Program strength is a
// judgement and stays a TODO placeholder for Ollie to fill in EDIT mode.
`;

const out = `${banner}
export const SCHOOLS = ${JSON.stringify(schools, null, 2)};

export const PROGRAMS = ${JSON.stringify(programs, null, 2)};

export const GENERATED_AT = ${JSON.stringify(stamp)};
`;

// Resolved from this file, not from cwd: the research directory lives outside the repo,
// so it is natural to run this after cd-ing there, and cwd-relative output silently wrote
// the generated module into the research folder instead of the app.
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const target = path.join(repoRoot, 'src/pages/apply/data.generated.js');
fs.writeFileSync(target, out);

const closing = programs.filter((p) => p.seniorOnly === true && p.canJoinLater !== true);
const withEngRate = schools.filter((s) => fieldValue((s.admitRate || {}).engineering));
console.log(`wrote ${target}`);
console.log(`  schools:            ${schools.length}`);
console.log(`  programs:           ${programs.length} (${closing.length} genuinely door-closing)`);
console.log(`  engineering rates:  ${withEngRate.length}/${schools.length}`);
console.log(`  open gaps:          ${schools.reduce((n, s) => n + s.needsResearch.length, 0)}`);
if (missing.length) console.log(`  !! batches missing: ${missing.join(', ')}`);
