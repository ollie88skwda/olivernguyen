#!/usr/bin/env node
// CLI writer for the /major decision doc. Same Supabase row the browser store reads.
//
//   node scripts/decision.mjs get
//   node scripts/decision.mjs set '<json>'
//   node scripts/decision.mjs patch '{"deadline":"2026-11-30"}'
//   node scripts/decision.mjs add-criterion --id fun --label "Fun" [--direction max|min] [--blurb ...]
//   node scripts/decision.mjs add-alternative --id ce --label "Civil" [--tagline ...]
//   node scripts/decision.mjs add-evidence --source ... --note ... [--date --criterion --alternative --delta]
//   node scripts/decision.mjs add-unknown --question ... [--criteria a,b] [--effort ...]

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const TABLE = 'major_decision';
const ROW_ID = 'v1';
const PLACEHOLDER_SCORE = { lo: 4, mid: 5, hi: 6 };

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// CRA only injects REACT_APP_* into the browser bundle, so read the shell first and fall
// back to parsing .env by hand. It is a handful of KEY=VALUE lines, not worth a dependency.
function env(name) {
  if (process.env[name]) return process.env[name];
  let text;
  try {
    text = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  } catch {
    fail(`${name} is not set and .env could not be read`);
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() !== name) continue;
    return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return fail(`${name} is not set in the shell or in .env`);
}

const supabase = createClient(env('REACT_APP_SUPABASE_URL'), env('REACT_APP_SUPABASE_ANON_KEY'));

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) fail(`${token} needs a value`);
    flags[token.slice(2)] = next;
    i++;
  }
  return flags;
}

function require_(flags, name) {
  if (!flags[name]) fail(`--${name} is required`);
  return flags[name];
}

function parseJSON(raw, label) {
  if (!raw) fail(`${label} requires a JSON string argument`);
  let value;
  try {
    value = JSON.parse(raw);
  } catch (err) {
    fail(`${label}: invalid JSON (${err.message})`);
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label}: expected a JSON object, got ${Array.isArray(value) ? 'an array' : typeof value}`);
  }
  return value;
}

async function readDoc() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('doc')
    .eq('id', ROW_ID)
    .maybeSingle();
  if (error) fail(`could not read ${TABLE}: ${error.message}`);
  if (!data || !data.doc) {
    fail(`row '${ROW_ID}' does not exist yet. Load /major in a browser or run: decision.mjs set '<json>'`);
  }
  return data.doc;
}

async function writeDoc(doc) {
  const updatedAt = new Date().toISOString();
  const next = { ...doc, updatedAt };
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, doc: next, updated_at: updatedAt });
  if (error) fail(`could not write ${TABLE}: ${error.message}`);
  return next;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const commands = {
  async get() {
    console.log(JSON.stringify(await readDoc(), null, 2));
  },

  async set(args) {
    const doc = parseJSON(args[0], 'set');
    await writeDoc(doc);
    console.log(`set: replaced doc (${Object.keys(doc).length} top-level keys)`);
  },

  async patch(args) {
    const patch = parseJSON(args[0], 'patch');
    const doc = await readDoc();
    await writeDoc({ ...doc, ...patch });
    console.log(`patch: merged ${Object.keys(patch).join(', ')}`);
  },

  async 'add-criterion'(args) {
    const flags = parseFlags(args);
    const id = require_(flags, 'id');
    const label = require_(flags, 'label');
    const direction = flags.direction || 'max';
    if (direction !== 'max' && direction !== 'min') fail('--direction must be max or min');

    const doc = await readDoc();
    const criteria = doc.criteria || [];
    if (criteria.some((c) => c.id === id)) fail(`criterion '${id}' already exists`);

    // The newcomer takes an equal 1/n share and the existing weights are scaled by the
    // remainder, so their proportions to each other survive and the set still sums to 1.
    // Cosmetic either way: model.js reads weights from the AHP pairwise matrix, not here.
    const share = 1 / (criteria.length + 1);
    const scaled = criteria.map((c) => ({ ...c, weight: (c.weight || 0) * (1 - share) }));

    await writeDoc({
      ...doc,
      criteria: [
        ...scaled,
        { id, label, blurb: flags.blurb || 'TODO — Ollie', direction, weight: share, weightMode: 'manual' },
      ],
      alternatives: (doc.alternatives || []).map((a) => ({
        ...a,
        scores: { ...a.scores, [id]: { ...PLACEHOLDER_SCORE } },
      })),
    });
    console.log(
      `add-criterion: ${id} (${direction}), backfilled ${(doc.alternatives || []).length} alternatives with lo 4 / mid 5 / hi 6`
    );
  },

  async 'add-alternative'(args) {
    const flags = parseFlags(args);
    const id = require_(flags, 'id');
    const label = require_(flags, 'label');

    const doc = await readDoc();
    const alternatives = doc.alternatives || [];
    if (alternatives.some((a) => a.id === id)) fail(`alternative '${id}' already exists`);

    const scores = {};
    for (const criterion of doc.criteria || []) scores[criterion.id] = { ...PLACEHOLDER_SCORE };

    await writeDoc({
      ...doc,
      alternatives: [
        ...alternatives,
        { id, label, tagline: flags.tagline || 'TODO — Ollie', notes: 'TODO — Ollie', scores },
      ],
    });
    console.log(
      `add-alternative: ${id}, scored lo 4 / mid 5 / hi 6 on ${Object.keys(scores).length} criteria`
    );
  },

  async 'add-evidence'(args) {
    const flags = parseFlags(args);
    const source = require_(flags, 'source');
    const note = require_(flags, 'note');

    const doc = await readDoc();
    const entry = {
      date: flags.date || today(),
      source,
      url: flags.url || null,
      criterion: flags.criterion || null,
      alternative: flags.alternative || null,
      delta: flags.delta || null,
      note,
    };
    await writeDoc({ ...doc, evidence: [...(doc.evidence || []), entry] });
    console.log(`add-evidence: ${entry.date} ${source}`);
  },

  async 'add-unknown'(args) {
    const flags = parseFlags(args);
    const question = require_(flags, 'question');

    const doc = await readDoc();
    const unknowns = doc.unknowns || [];
    const base = `u-${slugify(question)}`;
    let id = base;
    let n = 2;
    while (unknowns.some((u) => u.id === id)) id = `${base}-${n++}`;

    const criteria = flags.criteria
      ? flags.criteria.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
    await writeDoc({
      ...doc,
      unknowns: [...unknowns, { id, question, criteria, effort: flags.effort || 'TODO — Ollie', answer: null }],
    });
    console.log(`add-unknown: ${id} (criteria: ${criteria.join(', ') || 'none'})`);
  },
};

const [command, ...args] = process.argv.slice(2);
if (!command || !commands[command]) {
  fail(`unknown command '${command || ''}'. Try: ${Object.keys(commands).join(', ')}`);
}
await commands[command](args);
