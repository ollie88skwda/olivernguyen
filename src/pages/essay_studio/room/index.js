import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import useStudioStore from '../store';
import AuthGate from '../AuthGate';
import { findVersion, versionSlug } from '../vaultModel';
import { registerVimCommands, setVimHandlers } from './vimCommands';
import { proseWordCount } from '../wordcount';
import { BudgetTrack, BudgetReadout, budgetGeometry } from '../BudgetBar';
import TopRail from './TopRail';
import ContextRail from './ContextRail';
import ProseEditor from './ProseEditor';
import DiffView from './DiffView';
import '../../../styles/EssayStudio.css';

const CONTEXT_KEY = 'studio_context_open';
const VIM_KEY = 'studio_vim';

export const WritingRoom = () => {
  const history = useHistory();
  const { schoolSlug, promptSlug, versionKey } = useParams();

  const checkingAuth = useStudioStore((s) => s.checkingAuth);
  const apiMissing = useStudioStore((s) => s.apiMissing);
  const authed = useStudioStore((s) => s.authed);
  const init = useStudioStore((s) => s.init);
  const vault = useStudioStore((s) => s.vault);
  const docs = useStudioStore((s) => s.docs);
  const editors = useStudioStore((s) => s.editors);
  const loadDocs = useStudioStore((s) => s.loadDocs);
  const setBody = useStudioStore((s) => s.setBody);
  const saveDoc = useStudioStore((s) => s.saveDoc);
  const reloadDoc = useStudioStore((s) => s.reloadDoc);
  const saveAllDirty = useStudioStore((s) => s.saveAllDirty);
  const dirtyPaths = useStudioStore((s) => s.dirtyPaths);

  // On a phone the rail is a bottom sheet, and an open sheet leaves about three
  // lines of prose visible. Start it closed there until the user says otherwise.
  const [contextOpen, setContextOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(CONTEXT_KEY);
    if (stored !== null) return stored !== 'false';
    return window.innerWidth > 860;
  });
  const [compareWith, setCompareWith] = useState('');
  const [vimMode, setVimMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(VIM_KEY) === 'true';
  });

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    registerVimCommands();
  }, []);

  const { school, prompt, version } = useMemo(
    () => findVersion(vault, schoolSlug, promptSlug, versionKey),
    [vault, schoolSlug, promptSlug, versionKey]
  );

  const draftPath = version ? version.draftPath : null;
  const notesPath = version ? version.notesPath : null;
  const changelogPath = version ? version.changelogPath : null;
  const overviewPath = prompt ? prompt.overviewPath : null;

  const paths = useMemo(
    () => [draftPath, notesPath, changelogPath, overviewPath],
    [draftPath, notesPath, changelogPath, overviewPath]
  );

  useEffect(() => {
    if (paths.some(Boolean)) loadDocs(paths);
  }, [paths, loadDocs]);

  // Leaving the tab with unsaved work must cost a confirm, not a paragraph.
  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (useStudioStore.getState().dirtyPaths().length === 0) return undefined;
      event.preventDefault();
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const draftEditor = draftPath ? editors[draftPath] : null;
  const draftDoc = draftPath ? docs[draftPath] : null;

  const liveCount = useMemo(
    () => (draftEditor ? proseWordCount(draftEditor.body) : version ? version.wordCount : 0),
    [draftEditor, version]
  );

  const isDirty = useCallback(
    (path) => {
      if (!path) return false;
      const editor = editors[path];
      return Boolean(editor && editor.body !== editor.baseline);
    },
    [editors]
  );

  // The one place a navigation can silently eat work, so it is the one place
  // that asks. Answering "cancel" leaves you where you were.
  const guardedNavigate = useCallback(
    async (to) => {
      const dirty = dirtyPaths();
      if (dirty.length > 0) {
        const wantsSave = window.confirm(
          `You have unsaved changes in ${dirty.length} file${dirty.length === 1 ? '' : 's'}.\n\nOK to save them first, Cancel to stay here.`
        );
        if (!wantsSave) return;
        const ok = await saveAllDirty();
        if (!ok) {
          window.alert('Save failed — staying on this draft so nothing is lost.');
          return;
        }
      }
      history.push(to);
    },
    [dirtyPaths, saveAllDirty, history]
  );

  // `:w`, `:wq` and `:q` route to the same handlers the toolbar uses, dirty
  // guard included, so vim muscle memory cannot bypass the save prompt.
  useEffect(() => {
    setVimHandlers({
      save: draftPath ? () => saveDoc(draftPath) : null,
      saveAndClose: draftPath
        ? async () => {
            const ok = await saveDoc(draftPath);
            if (ok) history.push('/studio');
          }
        : null,
      close: () => guardedNavigate('/studio'),
    });
    return () => setVimHandlers({ save: null, saveAndClose: null, close: null });
  }, [draftPath, saveDoc, history, guardedNavigate]);

  const toggleVim = () => {
    setVimMode((on) => {
      const next = !on;
      if (typeof window !== 'undefined') window.localStorage.setItem(VIM_KEY, String(next));
      return next;
    });
  };

  const toggleContext = () => {
    setContextOpen((open) => {
      const next = !open;
      if (typeof window !== 'undefined') window.localStorage.setItem(CONTEXT_KEY, String(next));
      return next;
    });
  };

  if (checkingAuth) {
    return (
      <main className="es-room es-room-center">
        <p className="es-readout">Checking…</p>
      </main>
    );
  }

  if (apiMissing) {
    return (
      <main className="es-room es-room-center">
        <p className="es-readout">
          The /api routes are not running. Start the site with `vercel dev`.
        </p>
      </main>
    );
  }

  if (!authed) return <AuthGate />;

  if (!prompt || !version) {
    const loading = vault.prompts.length === 0;
    return (
      <main className="es-room es-room-center">
        <p className="es-readout">{loading ? 'Reading the vault…' : 'No such draft.'}</p>
        {!loading && (
          <button type="button" className="es-back" onClick={() => history.push('/studio')}>
            ← Desk
          </button>
        )}
      </main>
    );
  }

  const others = prompt.versions.filter((entry) => entry.id !== version.id);
  const comparison = compareWith
    ? prompt.versions.find((entry) => versionSlug(entry) === compareWith)
    : null;
  const comparisonDoc = comparison ? docs[comparison.draftPath] : null;
  const geometry = budgetGeometry(liveCount, version.wordLimit);

  return (
    <main className={contextOpen ? 'es-room' : 'es-room es-room-wide'}>
      <div className="grain" aria-hidden="true" />
      <TopRail
        school={school}
        prompt={prompt}
        version={version}
        dirty={isDirty(draftPath)}
        saving={Boolean(draftEditor && draftEditor.saving)}
        savedAt={draftEditor ? draftEditor.savedAt : null}
        conflict={Boolean(draftEditor && draftEditor.conflict)}
        vimMode={vimMode}
        onToggleVim={toggleVim}
        onSave={() => saveDoc(draftPath)}
        onBack={() => guardedNavigate('/studio')}
        onSwitch={(slug) => guardedNavigate(`/studio/${prompt.schoolSlug}/${prompt.slug}/${slug}`)}
      />

      <div className="es-room-main">
        <div className={comparison ? 'es-writer es-writer-diff' : 'es-writer'}>
        {version.isOdyssey && (
          <p className="es-odyssey" role="note">
            Counselor-authored pass ({version.author}). Read every phrase against your own voice before
            you adopt it.
          </p>
        )}

        {draftEditor && draftEditor.conflict && (
          <p className="es-conflict" role="alert">
            <span>This file changed in the repo since you opened it.</span>
            <button type="button" onClick={() => reloadDoc(draftPath)}>
              Reload and lose local edits
            </button>
          </p>
        )}

        {draftDoc && draftDoc.error && (
          <p className="es-conflict" role="alert">
            <span>{draftDoc.error}</span>
          </p>
        )}

        <div className="es-writer-head">
          <p className="es-fileline">
            {version.label} · {version.date}
            {version.author ? ` · ${version.author}` : ''}
          </p>
          {others.length > 0 && (
            <div className="es-compare">
              <label htmlFor="es-compare-select">Compare with</label>
              <select
                id="es-compare-select"
                value={compareWith}
                onChange={(event) => {
                  const next = event.target.value;
                  setCompareWith(next);
                  const target = prompt.versions.find((entry) => versionSlug(entry) === next);
                  if (target) loadDocs([target.draftPath]);
                }}
              >
                <option value="">off</option>
                {others.map((entry) => (
                  <option key={entry.id} value={versionSlug(entry)}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {comparison ? (
          comparisonDoc && !comparisonDoc.loading && draftDoc ? (
            <DiffView
              fromLabel={comparison.label}
              fromRaw={comparisonDoc.raw}
              toLabel={version.label}
              toRaw={draftEditor ? draftEditor.prefix + draftEditor.body : draftDoc.raw}
            />
          ) : (
            <p className="es-readout">Loading {comparison.label}…</p>
          )
        ) : !draftDoc || draftDoc.loading || !draftEditor ? (
          <p className="es-readout">Loading draft…</p>
        ) : (
          <ProseEditor
            value={draftEditor.body}
            onChange={(value) => setBody(draftPath, value)}
            onSave={() => saveDoc(draftPath)}
            ariaLabel={`${prompt.title} ${version.label}`}
            vimMode={vimMode}
          />
        )}
        </div>
      </div>

      <ContextRail
        overviewDoc={overviewPath ? docs[overviewPath] : null}
        notesPath={notesPath}
        notesDoc={notesPath ? docs[notesPath] : null}
        notesEditor={notesPath ? editors[notesPath] : null}
        changelogPath={changelogPath}
        changelogDoc={changelogPath ? docs[changelogPath] : null}
        changelogEditor={changelogPath ? editors[changelogPath] : null}
        onChange={setBody}
        onSave={saveDoc}
        onReload={reloadDoc}
        isDirty={isDirty}
        vimMode={vimMode}
        collapsed={!contextOpen}
        onToggle={toggleContext}
      />

      <footer className="es-room-foot">
        <BudgetTrack count={liveCount} limit={version.wordLimit} compact />
        <BudgetReadout count={liveCount} limit={version.wordLimit} showDelta={false} />
        {geometry.isOver && geometry.hasLimit && (
          <span className="es-foot-note">
            cut {geometry.delta} word{geometry.delta === 1 ? '' : 's'}
          </span>
        )}
        {isDirty(draftPath) && <span className="es-foot-note es-foot-note-warn">unsaved</span>}
      </footer>
    </main>
  );
};

export default WritingRoom;
