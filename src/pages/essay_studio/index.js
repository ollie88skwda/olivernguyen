import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import Reveal from '../../components/Reveal';
import WordReveal from '../../components/WordReveal';
import { UserButton } from '@clerk/react';
import useStudioStore from './store';
import BackLink from '../../auth/BackLink';
import Status from './sections/Status';
import Board from './sections/Board';
import Archive from './sections/Archive';
import { versionPath } from './vaultModel';
import '../../styles/EssayStudio.css';

export const EssayStudio = () => {
  const history = useHistory();
  const init = useStudioStore((s) => s.init);
  const vault = useStudioStore((s) => s.vault);
  const docs = useStudioStore((s) => s.docs);
  const loadingFiles = useStudioStore((s) => s.loadingFiles);
  const filesError = useStudioStore((s) => s.filesError);
  const loadDocs = useStudioStore((s) => s.loadDocs);
  const loadDoc = useStudioStore((s) => s.loadDoc);
  const createNewDraft = useStudioStore((s) => s.createNewDraft);
  const creatingDraft = useStudioStore((s) => s.creatingDraft);
  const draftError = useStudioStore((s) => s.draftError);

  useEffect(() => {
    init();
  }, [init]);

  const overviewPaths = useMemo(
    () => vault.prompts.map((prompt) => prompt.overviewPath),
    [vault.prompts]
  );

  // Sections are numbered in document order the way /major numbers its own:
  // S0 status, then one per school, then the archive last. Adding MIT adds S2,
  // it does not reshuffle what came before it.
  const sections = useMemo(() => {
    const withPrompts = vault.schools.filter((school) => school.prompts.length > 0);
    const hasArchive = vault.schools.some(
      (school) => school.archive.length > 0 || school.guides.length > 0
    );
    let n = 0;
    return {
      status: `S${n++} / Status`,
      boards: withPrompts.map((school) => ({ school, eyebrow: `S${n++} / ${school.name}` })),
      archive: hasArchive ? `S${n++} / Archive` : null,
    };
  }, [vault.schools]);

  // The board needs each prompt's question, which lives in the body of
  // 00_Overview.md rather than in the listing's frontmatter.
  useEffect(() => {
    if (overviewPaths.length) loadDocs(overviewPaths);
  }, [overviewPaths, loadDocs]);

  const openVersion = (prompt, version) => {
    history.push(versionPath(prompt, version));
  };

  const startNewDraft = async (prompt) => {
    if (!prompt.latest) return;
    const newPath = await createNewDraft(prompt.latest.draftPath);
    if (!newPath) return;
    // Re-resolve against the refreshed vault: the created draft only exists in
    // the model after the list round-trips.
    const refreshed = useStudioStore
      .getState()
      .vault.prompts.find((entry) => entry.dir === prompt.dir);
    const created = refreshed && refreshed.versions.find((version) => version.draftPath === newPath);
    if (created) history.push(versionPath(refreshed, created));
  };

  return (
    <main className="es-page">
      <div className="grain" aria-hidden="true" />
      <BackLink />
      <div className="es-user">
        <UserButton afterSignOutUrl="/college" />
      </div>

      <header className="es-hero">
        <Reveal as="p" className="es-hero-eyebrow">
          Route /studio · private · unlinked
        </Reveal>
        <h1 className="es-hero-title">
          <WordReveal text="Essay Studio" />
        </h1>
        <div className="es-hero-rule" aria-hidden="true" />
        <Reveal as="p" className="es-hero-sub" delay={0.4}>
          Every draft in the vault, what it is answering, and how far over the word wall it runs.
          Open a version to write.
        </Reveal>
      </header>

      {loadingFiles && vault.prompts.length === 0 && <p className="es-readout">Reading the vault…</p>}
      {filesError && <p className="es-readout es-readout-error">{filesError}</p>}
      {draftError && <p className="es-readout es-readout-error">{draftError}</p>}

      {vault.prompts.length > 0 ? (
        <>
          <Status schools={vault.schools} eyebrow={sections.status} onOpen={openVersion} />
          {sections.boards.map((entry, index) => (
            <Board
              key={entry.school.slug}
              school={entry.school}
              eyebrow={entry.eyebrow}
              showHint={index === 0}
              overviews={docs}
              onOpen={openVersion}
              onNewDraft={startNewDraft}
              creatingDraft={creatingDraft}
            />
          ))}
        </>
      ) : (
        !loadingFiles &&
        !filesError && (
          <section className="es-sec">
            <p className="es-readout">Vault read, nothing to show</p>
            <p className="es-hint">
              No prompt folders came back. The Desk looks for a directory containing{' '}
              <code>00_Overview.md</code> — check that the repo in <code>GITHUB_REPO</code> is the vault
              and that its default branch has the <code>UC/</code> tree.
            </p>
          </section>
        )
      )}

      {sections.archive && (
        <Archive schools={vault.schools} eyebrow={sections.archive} docs={docs} onLoad={loadDoc} />
      )}
    </main>
  );
};

export default EssayStudio;
