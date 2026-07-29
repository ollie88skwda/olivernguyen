import React from 'react';
import { statusClass } from '../statusStyle';
import { versionSlug } from '../vaultModel';

const stamp = (savedAt) => {
  if (!savedAt) return null;
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const SaveState = ({ dirty, saving, savedAt, conflict, onSave }) => {
  if (conflict) return <span className="es-save es-save-warn">Changed elsewhere</span>;
  if (saving) return <span className="es-save">Saving…</span>;
  if (dirty) {
    return (
      <button type="button" className="es-save es-save-btn" onClick={onSave}>
        Save ⌘S
      </button>
    );
  }
  const time = stamp(savedAt);
  // Before the first save of a session there is nothing to claim credit for --
  // "Saved" with no timestamp reads like a lie.
  if (!time) return <span className="es-save es-save-rest">No changes</span>;
  return <span className="es-save es-save-ok">● Saved {time}</span>;
};

export const TopRail = ({
  school,
  prompt,
  version,
  dirty,
  saving,
  savedAt,
  conflict,
  vimMode,
  onToggleVim,
  onSave,
  onBack,
  onSwitch,
}) => (
  <header className="es-rail-top">
    <button type="button" className="es-back" onClick={onBack}>
      ← Desk
    </button>

    <span className="es-rail-heading">
      {school && <span className="es-rail-school">{school.name}</span>}
      <span className="es-rail-title">{prompt.title}</span>
    </span>
    <span className={statusClass(version.status)}>{version.status}</span>

    <span className="es-versions" role="group" aria-label="Versions">
      {prompt.versions.map((entry) => {
        const current = entry.id === version.id;
        return (
          <button
            type="button"
            key={entry.id}
            className={current ? 'es-version es-version-on' : 'es-version'}
            aria-current={current ? 'true' : undefined}
            onClick={() => !current && onSwitch(versionSlug(entry))}
            title={entry.isOdyssey ? `${entry.label} — counselor pass` : entry.label}
          >
            {entry.label}
            {entry.isOdyssey && <i className="es-version-od" aria-hidden="true" />}
          </button>
        );
      })}
    </span>

    <button
      type="button"
      className={vimMode ? 'es-vim es-vim-on' : 'es-vim'}
      aria-pressed={vimMode}
      onClick={onToggleVim}
      title={
        vimMode
          ? 'Vim mode on — :w saves, :wq saves and returns, :q goes back'
          : 'Turn on Vim keybindings'
      }
    >
      VIM
    </button>

    <SaveState dirty={dirty} saving={saving} savedAt={savedAt} conflict={conflict} onSave={onSave} />
  </header>
);

export default TopRail;
