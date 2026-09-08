// C-0.4 — cadence timings + the print/command queue (Gate T0's unit leg).
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  TYPE_BASE_MS,
  TYPE_JITTER_MS,
  PRINT_BASE_MS,
  PRINT_JITTER_MS,
  typeDelay,
  printDelay,
  motionOK,
  createQueue,
  sleep,
} from './cadence.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('cadence timings (§3.1.5)', () => {
  it('typeDelay spans 26–52ms/char', () => {
    expect(typeDelay(() => 0)).toBe(TYPE_BASE_MS); // 26
    expect(typeDelay(() => 1)).toBe(TYPE_BASE_MS + TYPE_JITTER_MS); // 52
    const d = typeDelay();
    expect(d).toBeGreaterThanOrEqual(26);
    expect(d).toBeLessThanOrEqual(52);
  });

  it('printDelay spans 34–74ms/line by default', () => {
    expect(printDelay(undefined, () => 0)).toBe(PRINT_BASE_MS); // 34
    expect(printDelay(undefined, () => 1)).toBe(PRINT_BASE_MS + PRINT_JITTER_MS); // 74
  });

  it('printDelay honors the §5 print({stagger}) base override', () => {
    expect(printDelay(70, () => 0)).toBe(70);
    expect(printDelay(70, () => 1)).toBe(70 + PRINT_JITTER_MS);
  });
});

describe('motionOK()', () => {
  it('false under prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    expect(motionOK()).toBe(false);
  });

  it('true when motion is not reduced', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    expect(motionOK()).toBe(true);
  });

  it('false under the ?still screenshot param (C-3.2)', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    const original = window.location;
    vi.stubGlobal('location', { ...original, search: '?still' });
    expect(motionOK()).toBe(false);
  });
});

describe('createQueue() — the never-interleave serializer (§5)', () => {
  it('runs tasks strictly in FIFO order even when earlier tasks are slower', async () => {
    const q = createQueue();
    const order = [];
    const a = q.enqueue(async () => {
      await sleep(30);
      order.push('a');
    });
    const b = q.enqueue(async () => {
      order.push('b');
    });
    const c = q.enqueue(() => order.push('c'));
    await Promise.all([a, b, c]);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('returns the task’s own promise (resolved value visible to caller)', async () => {
    const q = createQueue();
    await expect(q.enqueue(async () => 42)).resolves.toBe(42);
  });

  it('a rejected task never blocks the tasks behind it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const q = createQueue();
    const order = [];
    const bad = q.enqueue(async () => {
      throw new Error('boom');
    });
    const good = q.enqueue(async () => order.push('after'));
    await expect(bad).rejects.toThrow('boom');
    await good;
    expect(order).toEqual(['after']);
    expect(warn).toHaveBeenCalled(); // reported as warn, not console.error
  });

  it('idle() flips false while tasks run, true when drained', async () => {
    const q = createQueue();
    expect(q.idle()).toBe(true);
    const t = q.enqueue(() => sleep(10));
    expect(q.idle()).toBe(false);
    await t;
    await Promise.resolve(); // let the finally() settle
    expect(q.idle()).toBe(true);
  });
});
