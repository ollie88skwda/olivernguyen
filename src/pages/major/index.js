import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import Reveal from '../../components/Reveal';
import WordReveal from '../../components/WordReveal';
import useMajorStore from './store';
import {
  computeAHP,
  computeConfidence,
  computeVOI,
  computeWSM,
  flipDistance,
  normalizeScores,
  runMonteCarlo,
} from './model';
import Status from './sections/Status';
import Board from './sections/Board';
import Duel from './sections/Duel';
import Ridges from './sections/Ridges';
import Tornado from './sections/Tornado';
import SwitchYard from './sections/SwitchYard';
import PreMortem from './sections/PreMortem';
import Assumptions from './sections/Assumptions';
import EvidenceLog from './sections/EvidenceLog';
import Glossary from './sections/Glossary';
import '../../styles/Major.css';
import '../../styles/MajorB.css';
import '../../styles/MajorC.css';

// UI privacy only, not security. The passphrase and the Supabase anon key both ship in the
// bundle, so this keeps the page out of casual sight and nothing more.
const GATE_KEY = 'major_gate';
const GATE_PASS = 'go-fish';

// Land just past the tipping point rather than exactly on it, so the previewed board
// actually re-sorts instead of showing a dead heat.
const PREVIEW_OVERSHOOT = 1.08;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// 9.4 reads as 9 pts, but 0.4 must not round away to 0 pts and claim the flip is free.
const points = (delta) => {
  const n = Math.abs(delta) * 100;
  return n >= 1 ? String(Math.round(n)) : n.toFixed(1);
};

function buildDerived(doc) {
  const ahp = computeAHP(doc.criteria, doc.pairwise);
  const normalized = normalizeScores(doc.alternatives, doc.criteria);
  const wsm = computeWSM(doc.alternatives, doc.criteria, ahp.weights);
  const monteCarlo = runMonteCarlo(
    doc.alternatives,
    doc.criteria,
    ahp.weights,
    ahp.consistencyRatio
  );
  const flip = flipDistance(doc.alternatives, doc.criteria, ahp.weights);
  const voi = computeVOI(
    doc.unknowns,
    doc.alternatives,
    doc.criteria,
    ahp.weights,
    ahp.consistencyRatio
  );
  return { ahp, normalized, wsm, monteCarlo, flip, voi, confidence: computeConfidence(monteCarlo.winRate) };
}

// Same construction flipDistance solves against: move one weight by delta and scale the
// others by (1 - w - delta) / (1 - w), which keeps the set summing to 1.
function shiftWeights(criteria, weights, criterionId, delta, direction) {
  const total = criteria.reduce((sum, c) => sum + (weights[c.id] || 0), 0);
  const unit = {};
  for (const criterion of criteria) {
    unit[criterion.id] = total > 0 ? (weights[criterion.id] || 0) / total : 1 / criteria.length;
  }
  const own = unit[criterionId] || 0;
  const rest = 1 - own;
  const signed = (direction === 'decrease' ? -delta : delta) * PREVIEW_OVERSHOOT;
  const next = own + clamp(signed, -own, rest);
  const scale = rest > 0 ? (1 - next) / rest : 0;

  const shifted = {};
  for (const criterion of criteria) {
    shifted[criterion.id] =
      criterion.id === criterionId ? next : unit[criterion.id] * scale;
  }
  return shifted;
}

const Gate = ({ onPass }) => {
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    if (value.trim().toLowerCase() !== GATE_PASS) {
      setWrong(true);
      return;
    }
    localStorage.setItem(GATE_KEY, 'true');
    onPass();
  };

  return (
    <main className="mj-gate">
      <div className="grain" aria-hidden="true" />
      <form className={wrong ? 'mj-gate-card mj-gate-wrong' : 'mj-gate-card'} onSubmit={submit}>
        <p className="mj-gate-eyebrow">Route /major · private</p>
        <h1 className="mj-gate-title">Passphrase</h1>
        <input
          className="mj-gate-in"
          type="password"
          value={value}
          autoFocus
          autoComplete="off"
          aria-label="Passphrase"
          aria-invalid={wrong}
          onChange={(event) => {
            setValue(event.target.value);
            setWrong(false);
          }}
        />
        <button className="mj-gate-go" type="submit">
          Enter
        </button>
        <p className="mj-gate-err" role="alert">
          {wrong ? 'Not it. Try again.' : ''}
        </p>
      </form>
    </main>
  );
};

export const Major = () => {
  const reduce = useReducedMotion();
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(GATE_KEY) === 'true');
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(null);

  const doc = useMajorStore((state) => state.doc);
  const loading = useMajorStore((state) => state.loading);
  const offline = useMajorStore((state) => state.offline);
  const savedAt = useMajorStore((state) => state.savedAt);
  const updateDoc = useMajorStore((state) => state.updateDoc);
  const init = useMajorStore((state) => state.init);

  useEffect(() => init(), [init]);

  // Deferred so a keystroke in EDIT mode paints immediately and the 10,000-run simulation
  // catches up on the next pass, instead of blocking the input for a few hundred ms.
  const deferredDoc = useDeferredValue(doc);
  const derived = useMemo(() => (deferredDoc ? buildDerived(deferredDoc) : null), [deferredDoc]);

  // S4 hands back a criterion id; the board redraws under weights that just clear that
  // criterion's flip point. Nothing is written to the doc.
  const previewed = useMemo(() => {
    if (!preview || !doc || !derived) return null;
    const criterion = doc.criteria.find((c) => c.id === preview.criterionId);
    const entry = derived.flip[preview.criterionId];
    if (!criterion || !entry || !Number.isFinite(entry.delta)) return null;

    const weights = shiftWeights(
      doc.criteria,
      derived.ahp.weights,
      criterion.id,
      entry.delta,
      entry.direction
    );
    return {
      criterion,
      entry,
      derived: {
        ...derived,
        ahp: { ...derived.ahp, weights },
        wsm: computeWSM(doc.alternatives, doc.criteria, weights),
      },
    };
  }, [preview, doc, derived]);

  if (!unlocked) return <Gate onPass={() => setUnlocked(true)} />;

  if (loading || !doc || !derived) {
    return (
      <main className="mj-page mj-loading">
        <div className="grain" aria-hidden="true" />
        <p>LOADING THE DOC</p>
      </main>
    );
  }

  const previewFlip = (criterionId) => {
    setPreview({ criterionId });
    const board = document.getElementById('board');
    if (board) board.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const savedTime = savedAt ? new Date(savedAt) : null;
  const stamp =
    savedTime && !Number.isNaN(savedTime.getTime())
      ? `SAVED ${savedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
      : 'NOT SAVED YET';

  const sectionProps = { doc, derived, editing, updateDoc };

  return (
    <main className="mj-page">
      <div className="grain" aria-hidden="true" />

      <header className="mj-hero">
        <Reveal as="p" className="mj-hero-eyebrow">
          Route /major · private · unlinked
        </Reveal>
        <h1 className="mj-hero-title">
          <WordReveal text="Major Decision Engine" />
        </h1>
        <div className="mj-hero-rule" aria-hidden="true" />
        <Reveal as="p" className="mj-hero-sub" delay={0.4}>
          Industrial, Systems or Mechanical. This page runs the decision, and it is willing to
          tell you when it does not know the answer.
        </Reveal>
        <Reveal as="p" className="mj-hero-note" delay={0.5}>
          Every technical term is a dotted underline you can hover or tap, every section opens a
          plain English box, and S9 is a full glossary. Nothing here is harder than multiplication.
        </Reveal>
      </header>

      <Status {...sectionProps} />

      {previewed && (
        <div className="mj-preview" role="status">
          <span>
            Previewing: {previewed.criterion.label.toLowerCase()}{' '}
            {previewed.entry.direction === 'decrease' ? '-' : '+'}
            {points(previewed.entry.delta)} pts. Nothing is saved.
          </span>
          <button type="button" className="mj-preview-clear" onClick={() => setPreview(null)}>
            clear
          </button>
        </div>
      )}
      <Board {...sectionProps} derived={previewed ? previewed.derived : derived} />

      <Duel {...sectionProps} />
      <Ridges {...sectionProps} />
      <Tornado {...sectionProps} onPreviewFlip={previewFlip} />
      <SwitchYard {...sectionProps} />
      <PreMortem {...sectionProps} />
      <Assumptions {...sectionProps} />
      <EvidenceLog {...sectionProps} />
      <Glossary {...sectionProps} />

      <div className="mj-tools">
        {editing && (
          <span className={offline ? 'mj-stamp mj-stamp-off' : 'mj-stamp'}>
            {offline ? 'OFFLINE, NOT SAVING' : stamp}
          </span>
        )}
        <button
          type="button"
          className={editing ? 'mj-tool mj-tool-on' : 'mj-tool'}
          aria-pressed={editing}
          onClick={() => setEditing((on) => !on)}
        >
          {editing ? 'DONE' : 'EDIT'}
        </button>
      </div>
    </main>
  );
};

export default Major;
