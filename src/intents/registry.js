/**
 * src/intents/registry.js — the ONE intent list + matcher (05-v1-spec §5.3,
 * prototype INTENTS restructured per build-plan G-1.3).
 *
 * Powers the graph prompt bar, ⌘K palette, and suggestion chips. Executors of
 * intents (pulse routing, ModeProvider wiring) live elsewhere; this module is
 * pure data + a pure matcher.
 *
 * run.type:
 *   node       → route a pulse root→run.id, then open its dossier
 *   copy-email → clipboard + toast
 *   tour       → guided tour
 *   fit        → fit the whole graph
 *   mode       → switch mode via ModeProvider (run.mode: 'terminal'|'graph')
 */

export const INTENTS = [
  { id: 'show-operator', label: 'Replay the week-long loop', kind: 'node',
    phrases: 'week loop operator replay autonomous seven days ran alone voice',
    run: { type: 'node', id: 'operator' }, suggest: true },
  { id: 'open-mac-agent', label: 'Open Mac-Agent', kind: 'node',
    phrases: 'mac agent toolbelt hands macos automation',
    run: { type: 'node', id: 'mac-agent' } },
  { id: 'show-mcp-tools', label: 'Show the MCP toolbelt', kind: 'node',
    phrases: 'tools mcp registry screenshot shell what runs on this mac',
    run: { type: 'node', id: 'mcp-tools' }, suggest: true },
  { id: 'open-scopecreep', label: 'Open ScopeCreep Notary', kind: 'node',
    phrases: 'scopecreep notary chrome extension lexicon zero llm',
    run: { type: 'node', id: 'scopecreep' } },
  { id: 'open-articlewriter', label: 'Open Articlewriter', kind: 'node',
    phrases: 'articlewriter writing pipeline content draft',
    run: { type: 'node', id: 'articlewriter' } },
  { id: 'show-robotics', label: 'Show robotics', kind: 'node',
    phrases: 'robotics techx mentor coach students worlds hardware',
    run: { type: 'node', id: 'robotics' }, suggest: true },
  { id: 'show-leadership', label: 'Show leadership', kind: 'node',
    phrases: 'leadership eagle scout virtual enterprise roles credentials',
    run: { type: 'node', id: 'leadership' } },
  { id: 'browse-pages', label: 'Browse the pages', kind: 'node',
    phrases: 'pages guides pull permit license sat utilities writing',
    run: { type: 'node', id: 'pages' } },
  { id: 'contact', label: 'Contact — open channel', kind: 'node',
    phrases: 'contact email say hi reach out channel talk',
    run: { type: 'node', id: 'email' } },
  { id: 'copy-email', label: 'Copy my email', kind: 'action',
    phrases: 'copy email clipboard address',
    run: { type: 'copy-email' }, suggest: true },
  { id: 'open-resume', label: 'Open resume', kind: 'node',
    phrases: 'resume cv pdf hire',
    run: { type: 'node', id: 'resume' } },
  { id: 'tour', label: 'Start the guided tour', kind: 'action',
    phrases: 'tour guide walkthrough show me around start intro',
    run: { type: 'tour' }, suggest: true },
  { id: 'fit', label: 'Fit the whole graph', kind: 'action',
    phrases: 'fit overview zoom out everything reset home center',
    run: { type: 'fit' } },
  { id: 'mode-terminal', label: 'Switch to terminal mode', kind: 'action',
    phrases: 'terminal term dark mode switch night',
    run: { type: 'mode', mode: 'terminal' } },
];

/**
 * Fuzzy intent matcher — reproduces prototype behavior exactly:
 *   - trailing punctuation is ignored (the rotating placeholder "what runs
 *     on this mac?" must match when typed verbatim — prototype bug fixed)
 *   - "day N" (N 1-7) synthesizes a top-ranked jump intent (score 200)
 *   - full-substring match over `label + phrases`: 100 - index * 0.05
 *     (earlier occurrence ranks higher)
 *   - multi-word queries: every word present (AND) → flat 60
 *   - results sorted by score desc; empty/no-match → []
 */
export function matchIntents(query, intents = INTENTS) {
  const q = (query || '').trim().toLowerCase().replace(/[?!.,;:]+$/, '').trimEnd();
  if (!q) return [];
  const out = [];
  const day = q.match(/day\s*([1-7])/);
  if (day) {
    out.push({
      id: 'day-jump', label: `Jump to day ${day[1]}`, kind: 'node',
      run: { type: 'node', id: `day-${day[1]}` }, score: 200,
    });
  }
  for (const it of intents) {
    const hay = `${it.label} ${it.phrases}`.toLowerCase();
    let score = -1;
    if (hay.includes(q)) {
      score = 100 - hay.indexOf(q) * 0.05;
    } else {
      const words = q.split(/\s+/);
      if (words.length > 1 && words.every((w) => hay.includes(w))) score = 60;
    }
    if (score > 0) out.push({ ...it, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Rotating typewriter placeholder phrases for the prompt bar. */
export const PROMPT_PLACEHOLDERS = [
  'replay the week-long loop',
  'show robotics',
  'what runs on this mac?',
  'day 4',
  'copy email',
  'start the guided tour',
];
