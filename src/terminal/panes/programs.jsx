/**
 * src/terminal/panes/programs.jsx — program adapters (N-3.1, §3.2).
 * A pane = a program running a buffer: each adapter owns a private useBuffer
 * engine and renders its own <BufferView> (independently scrollable — §5).
 * ALL content flows through core's sections.jsx/terminalModel selectors
 * (P4: zero hardcoded copy; the pane-keys help rows are UI grammar).
 *
 * PaneGrid passes { id, title, entity, day } off the leaf:
 *   replay   — operator week log; follows the last `day N` via leaf.day
 *              (core retargets it with tree.setLeaf — see panes/dev.jsx)
 *   tools / robotics / whoami / contact — section pagers
 *   artifact — entity dossier (dossier lines; site.js media is null across
 *              the board today — a media block lands only when an asset does)
 *   help     — 07's key table + the ^G pane bindings
 *
 * `main` is NOT here: it is the session scrollback slot core passes into the
 * programs map at X-1 (§5). data-cmd buttons inside printed dossiers bubble
 * to core's term-main click delegation — no listeners here.
 */
import React, { useEffect, useRef } from 'react';
import { useBuffer, BufferView, ln } from '../Buffer.jsx';
import { BOOT_DAY, FILES, artifact } from '../lib/terminalModel.js';
import {
  artifactLines,
  dayLines,
  helpLines,
  sectionLinesByFile,
} from '../sections.jsx';

/**
 * Shared engine harness: prints makeLines() into a private buffer once per
 * depKey — StrictMode-safe (ref guard), reprints (clear first) when depKey
 * changes (replay day switch, artifact retarget). Cadence + RM-instant come
 * free from the buffer engine.
 */
function ProgramBuffer({ label, depKey, makeLines }) {
  const { api } = useBuffer();
  const printedRef = useRef(null);
  useEffect(() => {
    if (printedRef.current === depKey) return;
    const isReprint = printedRef.current !== null;
    printedRef.current = depKey;
    // microtask: the mount effect may run inside a flushSync commit (pane
    // opened from a command / the harness driver); the engine itself calls
    // flushSync per printed line, which React forbids inside a lifecycle.
    queueMicrotask(() => {
      if (isReprint) api.clear();
      api.print(makeLines());
    });
    // makeLines is a fresh closure every render; content is keyed by depKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, api]);
  return <BufferView api={api} label={label} />;
}

/* ------------------------------- programs ------------------------------- */

export function Replay({ day }) {
  const d = day ?? BOOT_DAY;
  return (
    <ProgramBuffer
      label={`operator · day ${d}`}
      depKey={`day-${d}`}
      makeLines={() => dayLines(d)}
    />
  );
}

export function Artifact({ entity, title }) {
  return (
    <ProgramBuffer
      label={title ?? entity ?? 'artifact'}
      depKey={`artifact-${entity}`}
      makeLines={() =>
        entity && artifact(entity)
          ? artifactLines(entity)
          : [ln('err', `open ${entity ?? ''}: no such node`)]
      }
    />
  );
}

const span = (c, t, key) => (
  <span className={c} key={key}>
    {t}
  </span>
);

/** 09 §C: `^G ?` adds the pane keys to 07's table (same row grammar). */
const paneHelpRows = [
  ['panes     ', '^G v split right · ^G - split down · ^G x close · ^G z zoom'],
  ['          ', '^G h/j/k/l focus · ^G Tab cycle · ^G r resize (Esc exits) · ^G ? help'],
];

export function Help() {
  return (
    <ProgramBuffer
      label="help"
      depKey="help"
      makeLines={() => [
        ...helpLines(),
        ...paneHelpRows.map(([k, v], i) =>
          ln('', [span('dim', k, 'k'), span('mut', v, 'v')], `p${i}`),
        ),
      ]}
    />
  );
}

/** Section pagers, derived from core's file→window map (no hardcoded list). */
const fileBySection = Object.fromEntries(
  Object.entries(FILES).map(([file, f]) => [f.section, file]),
);

function makePager(section) {
  const file = fileBySection[section];
  function Pager() {
    return (
      <ProgramBuffer
        label={file}
        depKey={file}
        makeLines={() => sectionLinesByFile(file)}
      />
    );
  }
  Pager.displayName = `Pager(${section})`;
  return Pager;
}

/** The §5 programs map, minus `main` (core's session slot at X-1). */
export const PROGRAMS = {
  replay: Replay,
  artifact: Artifact,
  help: Help,
  tools: makePager('tools'),
  robotics: makePager('robotics'),
  whoami: makePager('whoami'),
  contact: makePager('contact'),
};

export default PROGRAMS;
