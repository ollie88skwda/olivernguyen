import React, { useState } from 'react';
import { Markdown, parseNotes, parseOverview } from '../markdown';
import ProseEditor from './ProseEditor';

const TABS = [
  { id: 'prompt', label: 'Prompt' },
  { id: 'notes', label: 'Notes' },
  { id: 'changes', label: 'Changes' },
];

// Notes and Changelog are real vault files, so the rail can write them back
// through the same save path the draft uses.
const EditablePane = ({ path, doc, editor, dirty, saving, onChange, onSave, onReload, label, vimMode, children }) => {
  const [editing, setEditing] = useState(false);

  if (!path) {
    return <p className="es-ctx-empty">No {label.toLowerCase()} in this draft folder.</p>;
  }
  if (!doc || doc.loading) return <p className="es-ctx-empty">Loading…</p>;
  if (doc.error) return <p className="es-ctx-empty">{doc.error}</p>;

  return (
    <>
      <div className="es-ctx-actions">
        <button
          type="button"
          className="es-ctx-btn"
          onClick={() => {
            if (editing && dirty) onSave();
            setEditing((on) => !on);
          }}
        >
          {editing ? (dirty ? 'Save & close' : 'Done') : 'Edit'}
        </button>
        {saving && <span className="es-ctx-state">Saving…</span>}
        {!saving && dirty && <span className="es-ctx-state es-ctx-state-warn">Unsaved</span>}
        {editor && editor.conflict && (
          <button type="button" className="es-ctx-btn es-ctx-btn-warn" onClick={onReload}>
            Changed elsewhere — reload
          </button>
        )}
      </div>
      {editing && editor ? (
        <div className="es-ctx-editor">
          <ProseEditor
            value={editor.body}
            onChange={onChange}
            onSave={onSave}
            ariaLabel={`${label} markdown`}
            vimMode={vimMode}
          />
        </div>
      ) : (
        children
      )}
    </>
  );
};

export const ContextRail = ({
  overviewDoc,
  notesPath,
  notesDoc,
  notesEditor,
  changelogPath,
  changelogDoc,
  changelogEditor,
  onChange,
  onSave,
  onReload,
  isDirty,
  vimMode,
  collapsed,
  onToggle,
}) => {
  const [tab, setTab] = useState('prompt');

  if (collapsed) {
    return (
      <aside className="es-ctx es-ctx-collapsed">
        <button type="button" className="es-ctx-handle" onClick={onToggle} aria-expanded="false">
          <span>Context</span>
        </button>
      </aside>
    );
  }

  const overview = overviewDoc && !overviewDoc.loading ? parseOverview(overviewDoc.raw) : null;
  const notes = notesDoc && !notesDoc.loading ? parseNotes(notesDoc.raw) : null;

  return (
    <aside className="es-ctx" aria-label="Draft context">
      <div className="es-ctx-head">
        <div className="es-ctx-tabs" role="tablist">
          {TABS.map((entry) => (
            <button
              type="button"
              key={entry.id}
              role="tab"
              aria-selected={tab === entry.id}
              className={tab === entry.id ? 'es-ctx-tab es-ctx-tab-on' : 'es-ctx-tab'}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
              {((entry.id === 'notes' && isDirty(notesPath)) ||
                (entry.id === 'changes' && isDirty(changelogPath))) && (
                <i className="es-ctx-dot" aria-label="unsaved" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="es-ctx-close"
          onClick={onToggle}
          aria-expanded="true"
          title="Collapse context"
        >
          ›
        </button>
      </div>

      <div className="es-ctx-body">
        {tab === 'prompt' &&
          (!overviewDoc || overviewDoc.loading ? (
            <p className="es-ctx-empty">Loading…</p>
          ) : overview && overview.hasContent ? (
            <>
              <p className="es-ctx-h">The question</p>
              <p className="es-ctx-q">{overview.question}</p>
              {overview.consider && (
                <>
                  <p className="es-ctx-h">Things to consider</p>
                  <p className="es-ctx-p">{overview.consider}</p>
                </>
              )}
              {overview.constraints && (
                <>
                  <p className="es-ctx-h">Targets</p>
                  <Markdown source={overview.constraints} className="es-ctx-md" />
                </>
              )}
              {overview.brainstorm && (
                <details className="es-ctx-more">
                  <summary>Brainstorm</summary>
                  <Markdown source={overview.brainstorm} className="es-ctx-md" />
                </details>
              )}
            </>
          ) : (
            <p className="es-ctx-empty">No prompt description in 00_Overview.md.</p>
          ))}

        {tab === 'notes' && (
          <EditablePane
            path={notesPath}
            doc={notesDoc}
            editor={notesEditor}
            dirty={isDirty(notesPath)}
            saving={notesEditor && notesEditor.saving}
            onChange={(value) => onChange(notesPath, value)}
            onSave={() => onSave(notesPath)}
            onReload={() => onReload(notesPath)}
            label="Counselor notes"
            vimMode={vimMode}
          >
            {notes && notes.beats.length > 0 && (
              <>
                <p className="es-ctx-h">Structural map</p>
                <ul className="es-ctx-beats">
                  {notes.beats.map((beat) => (
                    <li key={beat.beat}>
                      <code>[{beat.beat.replace(/^\[|\]$/g, '')}]</code> {beat.text}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {notes && notes.actions && (
              <>
                <p className="es-ctx-h">Action items</p>
                <Markdown source={notes.actions} className="es-ctx-md" />
              </>
            )}
            {notes && !notes.hasContent && notesDoc && (
              <Markdown source={notesDoc.raw.replace(/^---[\s\S]*?\n---\n/, '')} className="es-ctx-md" />
            )}
          </EditablePane>
        )}

        {tab === 'changes' && (
          <EditablePane
            path={changelogPath}
            doc={changelogDoc}
            editor={changelogEditor}
            dirty={isDirty(changelogPath)}
            saving={changelogEditor && changelogEditor.saving}
            onChange={(value) => onChange(changelogPath, value)}
            onSave={() => onSave(changelogPath)}
            onReload={() => onReload(changelogPath)}
            label="Changelog"
            vimMode={vimMode}
          >
            {changelogDoc && (
              <Markdown
                source={changelogDoc.raw.replace(/^---[\s\S]*?\n---\n/, '')}
                className="es-ctx-md"
              />
            )}
          </EditablePane>
        )}
      </div>
    </aside>
  );
};

export default ContextRail;
