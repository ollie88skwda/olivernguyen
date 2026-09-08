/**
 * src/terminal/panes/Pane.jsx — one pane card (N-2.1, §5 contract).
 * <section class="pane" role="region" aria-label> with a title row carrying
 * the [|] [–] [z] [×] mouse-parity buttons (09 §C discoverability), then the
 * program content. Focus border + dim are CSS (panes.css).
 *
 * onClick(id)        — pane body/title click → core focuses this pane.
 * onAction(id, act)  — title-row buttons; act ∈ 'split-right'|'split-down'|
 *                      'zoom'|'close'. The TARGET is this pane's id (clicking
 *                      [×] on an unfocused pane closes THAT pane) — the
 *                      executor should focus id first, then apply. Refusals
 *                      (main close, limits) surface as statusbar E-errors.
 * tabIndex=-1        — PaneGrid moves DOM focus here on focus actions (AT).
 *
 * R-T1: the title row is BRAND.md §7's label role (panes.css) and the close
 * mark is now <Glyph name="close">, i.e. §8's ratified ✕ — it used to be a bare
 * × multiplication sign in the JSX. The other three stay bracket-grammar
 * characters: they are tmux/Herdr notation, not icons, and §8's set has no
 * mark for "split" or "zoom".
 */
import React from 'react';
import { Glyph } from '@/components/brand';

const CLOSE = <Glyph name="close" label="" />;

const BTNS = [
  ['split-right', '[|]', 'split pane right'],
  ['split-down', '[\u2013]', 'split pane down'],
  ['zoom', '[z]', 'zoom pane'],
  ['close', <React.Fragment key="c">[{CLOSE}]</React.Fragment>, 'close pane'],
];

export default function Pane({ leaf, focused, zoomed, onClick, onAction, children }) {
  const name = leaf.title ?? leaf.program ?? leaf.id;
  return (
    // click-to-focus is mouse parity for ^G h/j/k/l — not a keyboard surface
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <section
      className={'pane' + (focused ? ' focused' : '') + (zoomed ? ' zoomed' : '')}
      role="region"
      aria-label={name}
      data-pane={leaf.id}
      tabIndex={-1}
      onClick={() => onClick?.(leaf.id)}
    >
      <header className="pane-title">
        <span className="pane-name">{name}</span>
        <span className="pane-btns">
          {BTNS.map(([act, glyph, label]) => (
            <button
              key={act}
              type="button"
              aria-label={`${label} (${name})`}
              onClick={(e) => {
                e.stopPropagation(); // action targets THIS pane, not a focus click
                onAction?.(leaf.id, act);
              }}
            >
              {glyph}
            </button>
          ))}
        </span>
      </header>
      <div className="pane-body">{children}</div>
    </section>
  );
}
