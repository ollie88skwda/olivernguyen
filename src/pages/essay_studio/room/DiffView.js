import React, { useEffect, useRef } from 'react';
import { MergeView } from '@codemirror/merge';
import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';

// Compares prose to prose. Frontmatter is stripped from both sides first,
// otherwise every diff opens with a wall of changed word_count/date/time lines
// and buries the sentence that actually moved.
const stripFrontmatter = (raw) => String(raw ?? '').replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');

const theme = EditorView.theme({
  '&': { backgroundColor: 'transparent' },
  '.cm-scroller': { fontFamily: 'var(--font-sans)', fontSize: '.94rem', lineHeight: '1.7' },
  '.cm-content': { padding: '10px 0' },
  '&.cm-focused': { outline: 'none' },
});

const BASE = [markdown(), EditorView.lineWrapping, EditorView.editable.of(false), theme];

export const DiffView = ({ fromLabel, fromRaw, toLabel, toRaw }) => {
  const host = useRef(null);

  useEffect(() => {
    if (!host.current) return undefined;
    const view = new MergeView({
      a: { doc: stripFrontmatter(fromRaw), extensions: BASE },
      b: { doc: stripFrontmatter(toRaw), extensions: BASE },
      parent: host.current,
      highlightChanges: true,
      gutter: true,
      collapseUnchanged: { margin: 2, minSize: 4 },
    });
    return () => view.destroy();
  }, [fromRaw, toRaw]);

  return (
    <div className="es-diff">
      <div className="es-diff-head">
        <span>{fromLabel}</span>
        <span>{toLabel}</span>
      </div>
      <div className="es-diff-body" ref={host} />
    </div>
  );
};

export default DiffView;
