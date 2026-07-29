import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { vim } from '@replit/codemirror-vim';

// The buffer is still markdown -- it has to round-trip to git byte for byte --
// but it stops *looking* like a config file. Headings and syntax markers are
// demoted to small mono labels so the prose is the only thing with weight.
const proseHighlight = HighlightStyle.define([
  {
    tag: [tags.heading, tags.heading1, tags.heading2, tags.heading3],
    fontFamily: 'var(--font-mono)',
    fontSize: '0.66rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: '500',
    color: 'var(--text-faint)',
  },
  { tag: tags.processingInstruction, color: 'rgba(18,34,49,0.28)' },
  { tag: tags.strong, fontWeight: '600', color: 'var(--text)' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.link, color: 'var(--accent-hi)' },
  { tag: tags.quote, color: 'var(--text-muted)', fontStyle: 'italic' },
  { tag: tags.monospace, fontFamily: 'var(--font-mono)', fontSize: '0.86em' },
]);

const proseTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--text)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'var(--font-sans)',
    fontSize: '1.02rem',
    lineHeight: '1.75',
    overflow: 'visible',
  },
  '.cm-content': {
    padding: '0',
    maxWidth: '62ch',
    caretColor: 'var(--accent)',
  },
  '.cm-line': { padding: '0' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(9,36,65,0.16)',
  },
  '.cm-placeholder': { color: 'var(--text-faint)' },

  // Vim's block cursor and status line, dressed as page furniture rather than
  // as terminal chrome.
  '.cm-fat-cursor': {
    background: 'rgba(9,36,65,0.45) !important',
    outline: 'none !important',
  },
  '&:not(.cm-focused) .cm-fat-cursor': {
    background: 'none !important',
    outline: '1px solid rgba(9,36,65,0.45) !important',
  },
  '.cm-vim-panel': {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.66rem',
    letterSpacing: '0.08em',
    background: 'var(--surface-2)',
    borderTop: '1px solid var(--border)',
    color: 'var(--text-muted)',
    padding: '5px 8px',
  },
  '.cm-vim-panel input': {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.66rem',
    color: 'var(--text)',
  },
});

const BASIC_SETUP = {
  lineNumbers: false,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  highlightSelectionMatches: false,
  bracketMatching: false,
  closeBrackets: false,
  autocompletion: false,
  searchKeymap: false,
  drawSelection: true,
  allowMultipleSelections: false,
};

export const ProseEditor = ({
  value,
  onChange,
  onSave,
  readOnly = false,
  ariaLabel,
  vimMode = false,
}) => {
  const extensions = useMemo(() => {
    const list = [];
    // Vim has to be registered before any other keymap or its bindings lose.
    if (vimMode) list.push(vim({ status: true }));
    list.push(
      markdown(),
      EditorView.lineWrapping,
      syntaxHighlighting(proseHighlight),
      proseTheme,
      EditorView.editorAttributes.of({ 'aria-label': ariaLabel || 'Draft' })
    );
    return list;
  }, [ariaLabel, vimMode]);

  return (
    <div
      className={vimMode ? 'es-prose es-prose-vim' : 'es-prose'}
      // Cmd/Ctrl+S must beat the browser's Save Page dialog, and CodeMirror does
      // not own this shortcut, so it is caught on the wrapper.
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          if (onSave) onSave();
        }
      }}
    >
      <CodeMirror
        value={value}
        editable={!readOnly}
        readOnly={readOnly}
        basicSetup={BASIC_SETUP}
        extensions={extensions}
        onChange={onChange}
      />
    </div>
  );
};

export default ProseEditor;
