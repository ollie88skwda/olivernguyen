/**
 * src/terminal/Prompt.jsx — the one live prompt (C-1.1).
 *
 * The visible prompt is a text echo + full-cell inverse block cursor; the
 * real <input> is visually offscreen (prototype pattern) and UNCONTROLLED —
 * the DOM owns the value, React mirrors it for rendering. Behavior (§3.1.3):
 *   · Enter runs, Tab completes (files + commands + entity ids), ↑/↓ history
 *   · Esc → onEscape (TerminalHome owns the cascade; default = clear)
 *   · `:` is just a prefix in the same input (mode indicator → COMMAND)
 *   · empty-prompt keys are offered to onBareKey (digits now, vim keys C-2.1)
 *   · never-trap: once the prompt is non-empty every key is just text
 *   · focus: on-mount + document-click refocus on FINE pointers only (P9);
 *     tapping the promptline focuses on any pointer
 * No window listeners here — TerminalHome owns THE ONE window keydown (P3).
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { SIGIL } from './Buffer.jsx';
import { motionOK, sleep, typeDelay } from './lib/cadence.js';

export const modeOf = (v) =>
  v === '' ? '-- NORMAL --' : v.startsWith(':') ? '-- COMMAND --' : '-- INSERT --';

const finePointer = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: fine)').matches;

const Prompt = forwardRef(function Prompt(
  { onSubmit, completer, onAmbiguous, history, onModeChange, onBareKey, onEscape, canRefocus },
  ref,
) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const histIdx = useRef(null); // null = past the end (fresh line)

  const sync = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    setValue(el.value);
    setCaret(el.selectionStart ?? el.value.length);
  }, []);

  const setInput = useCallback(
    (v) => {
      const el = inputRef.current;
      if (!el) return;
      el.value = v;
      el.setSelectionRange(v.length, v.length);
      sync();
    },
    [sync],
  );

  useEffect(() => {
    onModeChange?.(modeOf(value));
  }, [value, onModeChange]);

  /* focus on load — fine pointers only (P9: never pop a software keyboard) */
  useEffect(() => {
    if (finePointer()) inputRef.current?.focus({ preventScroll: true });
  }, []);

  /* document-click refocus, fine-pointer only; overlays veto via canRefocus */
  useEffect(() => {
    if (!finePointer()) return undefined;
    const onDocClick = (event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          '[data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]',
        )
      )
        return;
      if (canRefocus && !canRefocus()) return;
      if (window.getSelection && String(window.getSelection())) return;
      inputRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [canRefocus]);

  const histNav = (d) => {
    const hist = history ? history() : [];
    if (!hist.length) return;
    let idx = histIdx.current ?? hist.length;
    idx = Math.max(0, Math.min(hist.length, idx + d));
    histIdx.current = idx;
    setInput(idx === hist.length ? '' : hist[idx]);
  };

  const onKeyDown = (e) => {
    const el = inputRef.current;
    if (e.metaKey || e.ctrlKey || e.altKey) return; // ⌘K/^G bubble to window
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = el.value.trim();
      histIdx.current = null;
      if (v) onSubmit?.(v);
      return;
    }
    if (e.key === 'Tab') {
      if (!el.value) return;
      const c = completer?.(el.value);
      if (c != null) {
        e.preventDefault();
        setInput(c);
      } else if (onAmbiguous?.(el.value)) {
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      histNav(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      histNav(1);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (onEscape) onEscape();
      else setInput('');
      return;
    }
    /* never-trap: mid-command, every key is just text */
    if (el.value !== '') return;
    if (onBareKey && onBareKey(e.key)) e.preventDefault();
  };

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus({ preventScroll: true }),
      clear: () => {
        histIdx.current = null;
        setInput('');
      },
      isEmpty: () => !inputRef.current || inputRef.current.value === '',
      /** the site visibly types commands it runs for you (§3.1.5) */
      autotype: async (cmd) => {
        const el = inputRef.current;
        if (!el) return;
        histIdx.current = null;
        if (!motionOK()) {
          setInput(cmd);
          return;
        }
        setInput('');
        for (const ch of cmd) {
          setInput(el.value + ch);
          await sleep(typeDelay());
        }
        await sleep(150);
      },
    }),
    [setInput],
  );

  const at = Math.min(caret, value.length);
  return (
    /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
    <div
      className={'promptline' + (focused ? '' : ' blurred')}
      data-testid="term-promptline"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      <span className="psigil">{SIGIL}</span>
      <span className="pecho" data-testid="term-pecho">
        {value.slice(0, at)}
        <span className="pcursor">{value.slice(at, at + 1) || '\u00a0'}</span>
        {value.slice(at + 1)}
      </span>
      <label className="sr-only" htmlFor="term-prompt-input">
        Terminal prompt
      </label>
      <input
        id="term-prompt-input"
        ref={inputRef}
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onInput={sync}
        onSelect={sync}
        onKeyUp={sync}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
});

export default Prompt;
