import React, { useEffect } from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BufferView, { useBuffer } from './Buffer.jsx';

function BufferHarness({ onReady }) {
  const engine = useBuffer();
  useEffect(() => onReady(engine.api), [engine.api, onReady]);
  return <BufferView api={engine.api} label="test buffer" />;
}

describe('buffer print cancellation', () => {
  it('does not print work queued before clear', async () => {
    vi.useFakeTimers();
    let api;
    const { container } = render(
      <BufferHarness onReady={(value) => { api = value; }} />,
    );

    let pending;
    await act(async () => {
      pending = api.print('stale output', { stagger: 100 });
      api.clear();
      await vi.runAllTimersAsync();
      await pending;
    });

    expect(container.querySelectorAll('.blk')).toHaveLength(0);
    vi.useRealTimers();
  });
});
