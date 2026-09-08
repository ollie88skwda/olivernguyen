/**
 * src/terminal/panes/PaneGrid.jsx — recursive nested-flex render of the split
 * tree (N-2.1, §5 contract). The DOM mirrors the tree 1:1: split node →
 * .pane-split flex row/column whose .split-a child carries the ratio as
 * flex-basis; leaf → <Pane>. Zoom is a CSS class pair (has-zoom / zoomed) —
 * layout and tree untouched (P7).
 *
 *   <PaneGrid tree focusedId zoomedId programs onPaneClick onPaneAction flat/>
 *
 * programs — { main: <element slot from core/>, replay: Component, … } plus
 * optional `fallback` (used when a leaf's program has no entry, e.g. manual
 * splits). Element entries render as-is (core's session-buffer slot);
 * component entries get { id, title, entity, day } off the leaf — N-3
 * program adapters bind the shared api/model via the map's closure.
 *
 * flat — mobile flatten (P9/N-3.2): render ONLY the main leaf, full-size;
 * splits are disabled upstream, this is the render-side guarantee.
 *
 * A11y: on focus change (>1 pane) DOM focus follows onto the pane section so
 * AT announces the region — unless the user is typing (the prompt input keeps
 * keyboard focus; never yank mid-command — never-trap).
 */
import React, { isValidElement, useEffect, useRef } from 'react';
import './panes.css';
import Pane from './Pane.jsx';
import { findLeaf, leaves } from './tree.js';
import { indicator } from './prefix.js';

/** Auto-split toast copy (P7/09 §C — advertises the close key). */
export const toastText = (paneNumber) => `opened in pane ${paneNumber} · ^G x closes`;

/** StatusBar props feed (§5: core renders; panes state arrives as props). */
export function paneStatus({ tree, zoomedId, prefix }) {
  return {
    paneCount: leaves(tree).length,
    zoomed: Boolean(zoomedId),
    prefix: indicator(prefix),
  };
}

function paneContent(programs, leaf) {
  const entry = programs?.[leaf.program] ?? programs?.fallback;
  if (entry == null) return null;
  if (isValidElement(entry)) return entry;
  const Program = entry;
  return <Program id={leaf.id} title={leaf.title} entity={leaf.entity} day={leaf.day} />;
}

export default function PaneGrid({
  tree,
  focusedId,
  zoomedId,
  programs,
  onPaneClick,
  onPaneAction,
  toast = null,
  flat = false,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!focusedId || leaves(tree).length < 2) return;
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
    rootRef.current
      ?.querySelector(`[data-pane="${focusedId}"]`)
      ?.focus({ preventScroll: true });
  }, [focusedId, tree]);

  const renderLeaf = (leaf) => (
    <Pane
      key={leaf.id}
      leaf={leaf}
      focused={leaf.id === focusedId}
      zoomed={leaf.id === zoomedId}
      onClick={onPaneClick}
      onAction={onPaneAction}
    >
      {paneContent(programs, leaf)}
    </Pane>
  );

  const renderNode = (node) => {
    if (node.type === 'leaf') return renderLeaf(node);
    // key by the subtree's first leaf: stable across further splits of b
    const k = leaves(node)[0].id;
    return (
      <div className={`pane-split dir-${node.dir}`} key={k}>
        <div className="split-a" style={{ flexBasis: `${node.ratio * 100}%` }}>
          {renderNode(node.a)}
        </div>
        <div className="split-b">{renderNode(node.b)}</div>
      </div>
    );
  };

  const root = flat ? renderLeaf(findLeaf(tree, 'main')) : renderNode(tree);

  return (
    <div
      className={'term-panes' + (zoomedId && !flat ? ' has-zoom' : '')}
      data-testid="pane-grid"
      ref={rootRef}
    >
      {root}
      {toast && !flat && (
        <div className="pane-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
