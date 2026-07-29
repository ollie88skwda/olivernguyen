import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import { statusClass } from '../statusStyle';
import { parseOverview, Markdown } from '../markdown';
import { budgetGeometry } from '../BudgetBar';

// Over the limit is the number you must act on, so it stays signed. Under the
// limit reads as headroom rather than as a deficit -- "-50" looks like a problem
// and 50 words of room is not one.
const delta = (version) => {
  const geometry = budgetGeometry(version.wordCount, version.wordLimit);
  if (!geometry.hasLimit) return `${version.wordCount}`;
  if (geometry.delta > 0) return `${version.wordCount} · +${geometry.delta}`;
  if (geometry.delta === 0) return `${version.wordCount} · at limit`;
  return `${version.wordCount} · ${-geometry.delta} left`;
};

const PromptBlock = ({ prompt, overview, onOpen, onNewDraft, creatingDraft }) => {
  const parsed = overview ? parseOverview(overview.raw) : null;
  const latest = prompt.latest;

  return (
    <div className="es-prompt">
      <h3 className="es-prompt-title">{prompt.title}</h3>

      {parsed && parsed.question ? (
        <p className="es-prompt-q">{parsed.question}</p>
      ) : (
        <p className="es-prompt-q es-prompt-q-missing">
          {overview ? 'No prompt description in 00_Overview.md.' : 'Loading prompt…'}
        </p>
      )}

      {prompt.versions.length === 0 ? (
        <p className="es-empty">No drafts yet.</p>
      ) : (
        <div className="es-rail" role="group" aria-label={`${prompt.title} versions`}>
          {prompt.versions.map((version) => {
            const current = latest && version.id === latest.id;
            const geometry = budgetGeometry(version.wordCount, version.wordLimit);
            const classes = ['es-stn'];
            if (current) classes.push('es-stn-current');
            if (version.isOdyssey) classes.push('es-stn-odyssey');
            return (
              <button
                type="button"
                key={version.id}
                className={classes.join(' ')}
                onClick={() => onOpen(prompt, version)}
                aria-current={current ? 'true' : undefined}
                title={
                  version.isOdyssey
                    ? `${version.label} — counselor-authored pass (${version.author})`
                    : `Open ${version.label}`
                }
              >
                <span className="es-stn-v">{version.label}</span>
                <span className={geometry.isOver ? 'es-stn-d es-stn-d-over' : 'es-stn-d'}>
                  {delta(version)}
                </span>
              </button>
            );
          })}
          {latest && (
            <button
              type="button"
              className="es-stn es-stn-add"
              onClick={() => onNewDraft(prompt)}
              disabled={creatingDraft}
              title={`Clone ${latest.label} into the next draft`}
            >
              <span className="es-stn-v">{creatingDraft ? '…' : '+'}</span>
              <span className="es-stn-d">next</span>
            </button>
          )}
        </div>
      )}

      {latest && (
        <p className="es-tags">
          <span className={statusClass(latest.status)}>{latest.status}</span>
          {latest.isOdyssey && (
            <span className="es-pill es-pill-warn">{latest.author || 'Odyssey'} — counselor voice</span>
          )}
        </p>
      )}

      {parsed && (parsed.consider || parsed.constraints || parsed.brainstorm) && (
        <details className="plain">
          <summary>Prompt notes: things to consider, targets, brainstorm</summary>
          <div className="pbody">
            {parsed.consider && (
              <>
                <p className="es-md-h">Things to consider</p>
                <p>{parsed.consider}</p>
              </>
            )}
            {parsed.constraints && <Markdown source={parsed.constraints} />}
            {parsed.brainstorm && (
              <>
                <p className="es-md-h">Brainstorm</p>
                <Markdown source={parsed.brainstorm} />
              </>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

// One section per school. Adding MIT means a new numbered section, not a new
// level of nesting inside an existing one.
export const Board = ({ school, eyebrow, showHint, overviews, onOpen, onNewDraft, creatingDraft }) => (
  <section id={`board-${school.slug}`} className="es-sec">
    <SectionHeading eyebrow={eyebrow} title={school.name} />

    {showHint && (
      <Reveal as="p" className="es-hint">
        One block per prompt, each with the question it is actually answering. The rail is the version
        history — the outlined station is the newest draft, <code>OD</code> marks a counselor-authored
        pass, and <code>+</code> clones the latest into the next draft.
      </Reveal>
    )}

    {school.prompts.length === 0 ? (
      <p className="es-empty">No prompts selected for this school yet.</p>
    ) : (
      school.prompts.map((prompt) => (
        <PromptBlock
          key={prompt.slug}
          prompt={prompt}
          overview={overviews[prompt.overviewPath]}
          onOpen={onOpen}
          onNewDraft={onNewDraft}
          creatingDraft={creatingDraft}
        />
      ))
    )}
  </section>
);

export default Board;
