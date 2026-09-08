import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { GlossaryProvider } from '../../components/Tooltip';
import { GLOSSARY } from './glossary';
import useApplyStore from './store';
import { computeAHP, computeWSM, normalizeScores } from '../major/model';
import { admitProbability, classifyTier, greedySelect, portfolioOutcome } from './portfolio';
import { applyFilters, DEFAULT_FILTER_STATE } from './filters';
import { loadProfile, saveProfile } from './profile';
import { MonoLabel, Display, SectionHead, StatusPill } from '../../components/brand';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Status from './sections/Status';
import Board from './sections/Board';
import Duel from './sections/Duel';
import Portfolio from './sections/Portfolio';
import Programs from './sections/Programs';
import Calendar from './sections/Calendar';
import Filters from './sections/Filters';
import Effort from './sections/Effort';
import Evidence from './sections/Evidence';
import Glossary from './sections/Glossary';
import './apply.css';

// The two dates that bind. Nov 1 is first because Early Decision is live, so it is the
// real deadline even though the UC date is the one everyone quotes.
const BINDING = '2026-11-01';
const UC_CLOSE = '2026-11-30';

const daysUntil = (iso) => {
  const target = new Date(`${iso}T23:59:59`);
  return Math.max(0, Math.ceil((target - new Date()) / 86400000));
};

// model.js wants alternatives with an id and a scores map; a researched school already is
// one. The only translation needed is dropping schools with no scores at all, which can
// only happen if the generated data is mid-rebuild.
const scorable = (schools) => schools.filter((school) => school && school.scores);

function buildDerived(doc, profile) {
  // Hard filters are applied before anything is computed, not after. A school hidden from
  // the board but still counted in P(at least one admit) would report odds for a list you
  // are not actually applying to, which is worse than not filtering at all.
  const filterState = (doc.settings && doc.settings.filters) || DEFAULT_FILTER_STATE;
  const { kept, cut } = applyFilters(scorable(doc.schools), filterState);
  const schools = kept;
  const ahp = computeAHP(doc.criteria, doc.pairwise);
  const normalized = normalizeScores(schools, doc.criteria);
  const wsm = computeWSM(schools, doc.criteria, ahp.weights);

  // Fit and odds are deliberately separate. A school can be a perfect fit you will not get
  // into, or a sure thing you do not want, and collapsing those into one number early is
  // how a list ends up all reaches.
  const entries = schools.map((school) => {
    const p = admitProbability(school, profile);
    const pEd = school.deadlines && school.deadlines.ed
      ? admitProbability(school, profile, { ed: true })
      : null;
    return {
      id: school.id,
      name: school.name,
      fit: (wsm[school.id] && wsm[school.id].total) || 0,
      p,
      pEd: pEd ? pEd.mid : null,
      tier: classifyTier(p),
      effort: (school.essays && school.essays.count) || 1,
      school,
    };
  });

  const rho = (doc.settings && doc.settings.rho) ?? 0.6;
  const outcome = portfolioOutcome(entries, { rho });
  const recommended = greedySelect(entries, {
    rho,
    budget: (doc.settings && doc.settings.effortBudget) ?? Infinity,
    allowEd: !!(doc.settings && doc.settings.allowEd),
  });

  return { ahp, normalized, wsm, entries, outcome, recommended, rho, schools, cut, filterState };
}

export const Apply = () => {
  const { doc, loading, offline, savedAt, init, updateDoc } = useApplyStore();
  const [editing, setEditing] = useState(false);

  useEffect(() => init(), [init]);

  // 34 schools is roughly ten times /major's board, so a keystroke in EDIT must be able to
  // paint before the recompute lands. Same trick /major uses, and it matters more here.
  // Personal numbers are read from localStorage, never from the shared document. See
  // profile.js for why.
  const [profile, setProfileState] = useState(loadProfile);
  const setProfile = (next) => setProfileState(saveProfile(next));

  const deferred = useDeferredValue(doc);
  const derived = useMemo(
    () => (deferred ? buildDerived(deferred, profile) : null),
    [deferred, profile]
  );

  if (loading || !doc || !derived) {
    return (
      <main className="ap-page ap-loading sakura">
        <MonoLabel tone="faint">LOADING THE BOARD</MonoLabel>
      </main>
    );
  }

  const savedTime = savedAt ? new Date(savedAt) : null;
  const stamp =
    savedTime && !Number.isNaN(savedTime.getTime())
      ? `SAVED ${savedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
      : 'NOT SAVED YET';

  const sectionProps = { doc, derived, editing, updateDoc, profile, setProfile };
  const clock = { binding: daysUntil(BINDING), uc: daysUntil(UC_CLOSE) };

  return (
    <GlossaryProvider value={GLOSSARY}>
      <main className="ap-page sakura">

        <header className="ap-hero">
          <MonoLabel tone="faint" className="ap-hero-eyebrow">
            Route /apply · private · unlinked
          </MonoLabel>
          <Display as="h1" className="ap-hero-title">
            Where To Apply
          </Display>
          <Separator className="ap-hero-rule" />
          <p className="on-prose ap-hero-sub">
            /major decides what to study. This decides where to apply, and it scores the whole
            list rather than ranking schools one at a time.
          </p>
          <p className="on-prose ap-hero-note">
            Every claim here came off a real university page and carries its link and the date it
            was read. Anything nobody checked yet says so instead of guessing.
          </p>
        </header>

        <Status {...sectionProps} clock={clock} />
        <Board {...sectionProps} />
        <Duel {...sectionProps} />
        <Portfolio {...sectionProps} />
        <Programs {...sectionProps} />
        <Calendar {...sectionProps} />
        <Filters {...sectionProps} />
        <Effort {...sectionProps} />
        <Evidence {...sectionProps} />
        <Glossary />

        <div className="ap-tools">
          {editing && (
            <StatusPill status={offline ? 'warning' : 'live'}>
              {offline ? 'OFFLINE, NOT SAVING' : stamp}
            </StatusPill>
          )}
          <Button
            type="button"
            variant={editing ? 'primary' : 'ghost'}
            aria-pressed={editing}
            onClick={() => setEditing((on) => !on)}
          >
            {editing ? 'DONE' : 'EDIT'}
          </Button>
        </div>
      </main>
    </GlossaryProvider>
  );
};

export default Apply;
