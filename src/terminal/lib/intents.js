/**
 * src/terminal/lib/intents.js — terminal wrapper over the ONE intent registry
 * (C-2.2, P4: src/intents/registry.js is READ-ONLY; the graph's ⌘K must not
 * grow terminal rows, so the swap happens here, not there).
 *
 * Transform:
 *   · `mode-terminal` → a mode-graph intent (we're already in the terminal)
 *   · `tour`/`fit` dropped — graph-canvas verbs with no honest terminal
 *     equivalent (L7: every palette row must do something real; logged in
 *     the plan status header)
 *   · terminal-only entries appended: clear, help
 *   · day jumps ride matchIntents' built-in `day N` synthesis
 *   · every result resolves to { cmd } (a real prompt command string) or
 *     { act: 'help' } — the palette runs intents BY running commands.
 */
import { INTENTS, matchIntents } from '../../intents/registry.js';

/** graph node-intents whose terminal-native command is a section print */
const NODE_CMDS = {
  agents: 'cat tools.txt',
  robotics: 'cat robotics.log',
  leadership: 'cat whoami.txt',
  contact: 'cat contact.txt',
  email: 'cat contact.txt',
};

const EXCLUDED = new Set(['tour', 'fit', 'mode-terminal']);

const MODE_GRAPH_INTENT = {
  id: 'mode-graph',
  label: 'Switch to graph mode',
  kind: 'action',
  phrases: 'graph mode light canvas nodes switch back flagship',
  run: { type: 'mode', mode: 'graph' },
  suggest: true,
};

const TERMINAL_ONLY = [
  {
    id: 'clear',
    label: 'Clear screen',
    kind: 'action',
    phrases: 'clear cls wipe empty screen',
    run: { type: 'term-cmd', cmd: 'clear' },
  },
  {
    id: 'help',
    label: 'Keyboard help',
    kind: 'action',
    phrases: 'help keys shortcuts vim bindings',
    run: { type: 'help' },
    suggest: true,
  },
];

export const TERMINAL_INTENTS = [
  ...INTENTS.filter((it) => !EXCLUDED.has(it.id)),
  MODE_GRAPH_INTENT,
  ...TERMINAL_ONLY,
];

const cmdForRun = (run) => {
  if (!run) return null;
  if (run.type === 'node') {
    const day = run.id.match(/^day-([1-9])$/);
    if (day) return `day ${day[1]}`;
    return NODE_CMDS[run.id] || `open ${run.id}`;
  }
  if (run.type === 'copy-email') return 'email';
  if (run.type === 'mode') return `mode ${run.mode}`;
  if (run.type === 'term-cmd') return run.cmd;
  return null;
};

/** normalize an intent → executable shape for the palette */
export const resolveIntent = (it) =>
  it.run?.type === 'help'
    ? { ...it, act: 'help', cmd: null }
    : { ...it, cmd: cmdForRun(it.run) };

/** fuzzy match (shared matcher) → resolved, executable intents */
export const matchTerminalIntents = (query) =>
  matchIntents(query, TERMINAL_INTENTS).map(resolveIntent);

/** empty-query suggestions (§6 C2: suggestions on empty query) */
export const suggestedIntents = () =>
  TERMINAL_INTENTS.filter((it) => it.suggest).map(resolveIntent);
