// C-1.3 — command table + completion + runner, against a mock ctx.
import { describe, it, expect, vi } from 'vitest';
import {
  COMMAND_WORDS,
  complete,
  completionMatches,
  createRunner,
  execute,
} from './commands.js';
import { BOOT_DAY, DAY_COUNT } from './terminalModel.js';

const mockCtx = () => ({
  echo: vi.fn(),
  print: vi.fn(),
  printLine: vi.fn(),
  printErr: vi.fn(),
  clear: vi.fn(),
  autotype: vi.fn(async () => {}),
  clearPrompt: vi.fn(),
  printBoot: vi.fn(),
  printSection: vi.fn(),
  printLs: vi.fn(),
  printHelp: vi.fn(),
  printDay: vi.fn(),
  openArtifact: vi.fn(),
  copyEmail: vi.fn(),
  dispatchMode: vi.fn(),
  navigate: vi.fn(),
  quitLine: vi.fn(),
});

describe('execute() dispatch table', () => {
  it.each([
    ['ls', 'printLs'],
    ['ls -la', 'printLs'],
    ['help', 'printHelp'],
    ['email', 'copyEmail'],
    ['clear', 'clear'],
    ['cls', 'clear'],
    ['quit', 'quitLine'],
    ['q', 'quitLine'],
    ['exit', 'quitLine'],
  ])('%s → ctx.%s', async (cmd, verb) => {
    const ctx = mockCtx();
    await execute(cmd, ctx);
    expect(ctx[verb]).toHaveBeenCalledTimes(1);
  });

  it('cat existing file prints its section; unknown errors', async () => {
    const ctx = mockCtx();
    await execute('cat tools.txt', ctx);
    expect(ctx.printSection).toHaveBeenCalledWith('tools.txt');
    await execute('cat nosuch.txt', ctx);
    expect(ctx.printErr).toHaveBeenCalledWith('cat: nosuch.txt: No such file');
  });

  it('whoami/contact are file aliases', async () => {
    const ctx = mockCtx();
    await execute('whoami', ctx);
    expect(ctx.printSection).toHaveBeenCalledWith('whoami.txt');
    await execute('contact', ctx);
    expect(ctx.printSection).toHaveBeenCalledWith('contact.txt');
  });

  it('operator --replay honors --day N, defaults to BOOT_DAY', async () => {
    const ctx = mockCtx();
    await execute('operator --replay --day 5', ctx);
    expect(ctx.printBoot).toHaveBeenCalledWith(5);
    await execute('operator --replay', ctx);
    expect(ctx.printBoot).toHaveBeenCalledWith(BOOT_DAY);
  });

  it('day N validates 1..DAY_COUNT', async () => {
    const ctx = mockCtx();
    await execute('day 4', ctx);
    expect(ctx.printDay).toHaveBeenCalledWith(4);
    await execute('day 9', ctx);
    expect(ctx.printErr).toHaveBeenCalledWith(`day: expected 1-${DAY_COUNT}`);
  });

  it('open resolves entity ids, errors on unknown nodes', async () => {
    const ctx = mockCtx();
    await execute('open mac-agent', ctx);
    expect(ctx.openArtifact).toHaveBeenCalledWith('mac-agent');
    await execute('open nope', ctx);
    expect(ctx.printErr).toHaveBeenCalledWith(
      'open: nope: no such node (try Tab, or ls)',
    );
  });

  it('mode graph dispatches; mode terminal just says so', async () => {
    const ctx = mockCtx();
    await execute('mode graph', ctx);
    expect(ctx.dispatchMode).toHaveBeenCalledWith('graph');
    await execute('mode terminal', ctx);
    await execute('mode term', ctx);
    expect(ctx.printLine).toHaveBeenCalledTimes(2);
    expect(ctx.printLine).toHaveBeenCalledWith(
      'mut',
      'already in terminal mode',
    );
  });

  it('digits 1-5 re-enter via the window command without extra echo', async () => {
    const ctx = mockCtx();
    await execute('2', ctx);
    expect(ctx.printSection).toHaveBeenCalledWith('tools.txt');
    expect(ctx.echo).not.toHaveBeenCalled();
    await execute('1', ctx);
    expect(ctx.printBoot).toHaveBeenCalledWith(BOOT_DAY);
  });

  it(': prefix reuses the table; unknown : command is E492 (L7 joke)', async () => {
    const ctx = mockCtx();
    await execute(':ls', ctx);
    expect(ctx.printLs).toHaveBeenCalledTimes(1);
    await execute(':wq', ctx);
    expect(ctx.printErr).toHaveBeenCalledWith('E492: not a command: wq');
    await execute('sudo make me a sandwich', ctx);
    expect(ctx.printErr).toHaveBeenCalledWith('command not found: sudo');
  });

  it('blank input is a no-op', async () => {
    const ctx = mockCtx();
    await execute('   ', ctx);
    await execute(':', ctx);
    for (const k of Object.keys(ctx)) {
      if (typeof ctx[k] === 'function' && ctx[k].mock)
        expect(ctx[k]).not.toHaveBeenCalled();
    }
  });
});

describe('complete()', () => {
  it('completes command words, preserving the : prefix', () => {
    expect(complete('he')).toBe('help');
    expect(complete(':cle')).toBe(':clear');
    expect(complete('mode g')).toBe('mode graph');
  });

  it('completes cat filenames and open entity ids', () => {
    expect(complete('cat to')).toBe('cat tools.txt');
    expect(complete('cat ')).toBe('cat tools.txt');
    expect(complete('open mac')).toBe('open mac-agent');
    expect(complete('open ', () => ['oliver'])).toBe('open oliver');
  });

  it('returns null on no match or no change', () => {
    expect(complete('zzz')).toBeNull();
    expect(complete('help')).toBeNull(); // already complete
    expect(complete('')).toBeNull();
  });

  it('keeps ambiguous command prefixes visible and completes unique ones', () => {
    expect(complete('c')).toBeNull();
    expect(completionMatches('c')).toEqual(['cat ', 'cd ', 'clear', 'contact']);
    expect(complete('ca')).toBe('cat ');
  });
});

describe('cd navigation', () => {
  it('navigates linked destinations and parent/root paths', async () => {
    const ctx = mockCtx();
    await execute('cd articlewriter', ctx);
    await execute('cd ..', ctx);
    await execute('cd /', ctx);
    expect(ctx.navigate.mock.calls).toEqual([['/articlewriter'], ['/'], ['/']]);
  });

  it('reports invalid paths and exposes deterministic ambiguous matches', async () => {
    const ctx = mockCtx();
    await execute('cd nope', ctx);
    expect(ctx.printErr).toHaveBeenCalledWith(expect.stringContaining('available:'));
    expect(complete('cd p')).toBeNull();
    expect(completionMatches('cd p')).toEqual(['cd pull', 'cd permit']);
    expect(complete('cd art')).toBe('cd articlewriter');
  });
});

describe('createRunner()', () => {
  it('serializes commands on its own queue (a command awaiting a print task\n     on the buffer queue must never deadlock — C-1 regression)', async () => {
    const ctx = mockCtx();
    // simulate a section printer that awaits a buffer-queued print
    let resolvePrint;
    ctx.printSection = vi.fn(
      () => new Promise((r) => (resolvePrint = r)),
    );
    const r = createRunner(ctx);
    const first = r.run('cat tools.txt');
    const second = r.run('ls');
    let firstDone = false;
    first.then(() => (firstDone = true));
    await new Promise((r2) => setTimeout(r2, 20));
    expect(ctx.printSection).toHaveBeenCalled();
    expect(firstDone).toBe(false);
    expect(ctx.printLs).not.toHaveBeenCalled(); // strictly after first
    resolvePrint();
    await first;
    await second;
    expect(ctx.printLs).toHaveBeenCalledTimes(1);
  });

  it('echoes, records history, executes; autotype only when asked', async () => {
    const ctx = mockCtx();
    const r = createRunner(ctx);
    await r.run('ls');
    expect(ctx.autotype).not.toHaveBeenCalled();
    expect(ctx.clearPrompt).toHaveBeenCalled();
    expect(ctx.echo).toHaveBeenCalledWith('ls');
    expect(ctx.printLs).toHaveBeenCalled();
    await r.run('help', { autotype: true });
    expect(ctx.autotype).toHaveBeenCalledWith('help');
    expect(r.history()).toEqual(['ls', 'help']);
  });
});
