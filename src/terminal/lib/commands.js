/**
 * src/terminal/lib/commands.js — command parser/dispatcher + completion +
 * history (C-1.3, pure — no DOM, no React). All side effects go through the
 * ctx verbs TerminalHome injects, so the table is unit-testable with a mock:
 *
 *   ctx = {
 *     echo(cmd) · print(lines,{stagger}) · printLine(cls,text) · printErr(t)
 *     clear()                            // buffer api pass-throughs
 *     autotype(cmd) · clearPrompt()      // prompt handle
 *     printBoot(day) · printSection(file) · printLs() · printHelp()
 *     printDay(n) · openArtifact(id)     // section printers (sections.jsx)
 *     copyEmail() · dispatchMode('graph'|'terminal') · quitLine()
 *   }
 *
 * Queueing (§5, two layers on purpose): the runner owns its OWN serializer
 * so commands never interleave; each ctx printer awaits api.print, which
 * rides the BUFFER's queue. A command task awaiting a print task therefore
 * never waits on its own queue (the C-1 deadlock this replaced).
 * `:`-prefixed input is the same table (§3.1.3); the E492 error is the one
 * L7-sanctioned vim joke (it is real vim grammar).
 */
import { createQueue } from './cadence.js';
import { BOOT_DAY, DAY_COUNT, FILE_NAMES, entityIds, windowByN } from './terminalModel.js';

/** Completion vocabulary (C-1.1 Tab). Trailing-space entries take an arg. */
export const COMMAND_WORDS = [
  'help',
  'ls',
  'cat ',
  'clear',
  'day ',
  'open ',
  'mode graph',
  'mode terminal',
  'email',
  'whoami',
  'contact',
  `operator --replay --day ${BOOT_DAY}`,
  'quit',
];

/** Pure Tab-completion: first match wins; preserves a `:` prefix; returns
 * null when nothing (or nothing new) matches. */
export function complete(value, ids = entityIds) {
  if (!value) return null;
  const colon = value.startsWith(':') ? ':' : '';
  const bare = colon ? value.slice(1) : value;
  let m;
  let out = null;
  if ((m = bare.match(/^cat\s+(\S*)$/))) {
    const hit = FILE_NAMES.find((f) => f.startsWith(m[1]));
    if (hit) out = `cat ${hit}`;
  } else if ((m = bare.match(/^open\s+(\S*)$/))) {
    const hit = ids().find((id) => id.startsWith(m[1]));
    if (hit) out = `open ${hit}`;
  } else {
    out = COMMAND_WORDS.find((c) => c.startsWith(bare)) || null;
  }
  if (out == null) return null;
  const full = colon + out;
  return full === value ? null : full;
}

/** Execute one command against ctx. Digits re-enter the table via the
 * window's bound command (no double echo — prototype behavior). */
export async function execute(raw, ctx) {
  let cmd = raw.trim();
  const colon = cmd.startsWith(':');
  if (colon) cmd = cmd.slice(1).trim();
  if (!cmd) return;
  let m;

  if (cmd === 'clear' || cmd === 'cls') return ctx.clear();

  if ((m = cmd.match(/^cat\s+(\S+)$/))) {
    if (!FILE_NAMES.includes(m[1]))
      return ctx.printErr(`cat: ${m[1]}: No such file`);
    return ctx.printSection(m[1]);
  }

  if (/^operator\b/.test(cmd)) {
    const dm = cmd.match(/--day\s+(\d+)/);
    return ctx.printBoot(dm ? Number(dm[1]) : BOOT_DAY);
  }

  if (cmd === 'ls' || cmd === 'ls -la') return ctx.printLs();

  if ((m = cmd.match(/^day\s+(\d+)$/))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= DAY_COUNT) return ctx.printDay(n);
    return ctx.printErr(`day: expected 1-${DAY_COUNT}`);
  }

  if ((m = cmd.match(/^open\s+(\S+)$/))) {
    if (!entityIds().includes(m[1]))
      return ctx.printErr(`open: ${m[1]}: no such node (try Tab, or ls)`);
    return ctx.openArtifact(m[1]);
  }

  if (cmd === 'mode graph') return ctx.dispatchMode('graph');
  if (cmd === 'mode term' || cmd === 'mode terminal')
    return ctx.printLine('mut', 'already in terminal mode');

  if (cmd === 'email') return ctx.copyEmail();
  if (cmd === 'help') return ctx.printHelp();
  if (cmd === 'whoami') return ctx.printSection('whoami.txt');
  if (cmd === 'contact') return ctx.printSection('contact.txt');

  if ((m = cmd.match(/^([1-5])$/))) return execute(windowByN(m[1]).cmd, ctx);

  if (cmd === 'q' || cmd === 'quit' || cmd === 'exit') return ctx.quitLine();

  return ctx.printErr(
    colon
      ? `E492: not a command: ${cmd}`
      : `command not found: ${cmd.split(/\s+/)[0]}`,
  );
}

/**
 * createRunner(ctx) → { run, history }.
 * run(cmdText, {autotype}) — the site visibly TYPES commands it runs for you
 * (§3.1.5); output only prints. History records every executed command.
 */
export function createRunner(ctx) {
  const hist = [];
  const queue = createQueue(); // command serializer — NOT the buffer queue
  const run = (cmdText, opts = {}) =>
    queue.enqueue(async () => {
      if (opts.autotype) await ctx.autotype(cmdText);
      ctx.clearPrompt();
      ctx.echo(cmdText);
      hist.push(cmdText);
      await execute(cmdText, ctx);
    });
  return { run, history: () => hist.slice() };
}
