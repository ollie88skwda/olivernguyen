import React, { useState } from 'react';
import { MonoLabel, SectionHead } from '@/components/brand';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Tip from '../../../components/Tooltip';

const MAJORS = [
  { id: 'ie', short: 'IE' },
  { id: 'se', short: 'SE' },
  { id: 'me', short: 'ME' },
];

const NEW_SCHOOL_PLACEHOLDER = 'TODO — Ollie';

// Seed fields Ollie has not filled in yet are the literal string "TODO — Ollie". They get
// shown as written, just tinted, so the gap is obvious instead of hidden.
const isTodo = (value) => typeof value === 'string' && value.trim().startsWith('TODO');

const fieldClass = (value) => (isTodo(value) ? 'mjc-val mjc-todo' : 'mjc-val');

// A school with one combined degree covering two majors labels both chips with that
// degree's name, which is the whole point of the third seed card.
const chipLabel = (school, majorId) => {
  const combined = school.combined;
  if (combined && (combined.covers || []).includes(majorId)) return combined.label;
  return majorId.toUpperCase();
};

// Static by design. This is a reasoning diagram about how engineering curricula stack, not
// a render of doc data: Industrial and Systems swap cheaply for most of the degree,
// Mechanical closes early because thermo, statics and machine design run in a fixed order.
//
// Every stroke and fill is a token: solid switches are the accent, costly/closing ones the
// warning token, the faint track and the grid the hairline and faint roles, and the mono
// text is the label face. The RAIL DIAGRAM ENCODING (solid/dashed/absent = cheap/costly/
// shut) is flagged in the lane coverage record — it is a bespoke data graphic, not a
// library component.
const YardDiagram = () => (
  <svg
    className="mjc-yard"
    viewBox="0 0 800 230"
    role="img"
    aria-label="Rail switchyard. Industrial and Systems run as parallel tracks joined by solid switches at year one and year two, so moving between them stays cheap. Mechanical runs below on a fainter track, joined only by dashed costly switches, and its entry closes after year two."
  >
    <g className="mjc-yard-tick">
      <text x="118" y="20">YR 1</text>
      <text x="330" y="20">YR 2</text>
      <text x="542" y="20">YR 3</text>
      <text x="700" y="20">GRAD</text>
    </g>

    <g className="mjc-yard-grid">
      <line x1="130" y1="28" x2="130" y2="212" />
      <line x1="342" y1="28" x2="342" y2="212" />
      <line x1="554" y1="28" x2="554" y2="212" />
    </g>

    <line className="mjc-yard-track" x1="60" y1="66" x2="740" y2="66" />
    <line className="mjc-yard-track" x1="60" y1="136" x2="740" y2="136" />
    <line className="mjc-yard-track mjc-yard-faint" x1="60" y1="196" x2="740" y2="196" />

    <path className="mjc-yard-sw" d="M130,66 C170,66 172,136 212,136" />
    <path className="mjc-yard-sw" d="M130,136 C170,136 172,66 212,66" />
    <path className="mjc-yard-sw" d="M342,66 C382,66 384,136 424,136" />
    <path className="mjc-yard-sw mjc-yard-costly" d="M130,196 C176,196 178,136 224,136" />
    <path
      className="mjc-yard-sw mjc-yard-costly mjc-yard-closing"
      d="M342,136 C386,136 388,196 432,196"
    />

    <g className="mjc-yard-cap">
      <text x="150" y="104">EASY</text>
      <text className="mjc-yard-warn" x="150" y="176">
        COSTLY
      </text>
      <text className="mjc-yard-warn" x="362" y="176">
        CLOSING
      </text>
      <text className="mjc-yard-warn" x="566" y="60">
        ME ENTRY CLOSED
      </text>
    </g>

    <g className="mjc-yard-name">
      <text x="60" y="58">Industrial</text>
      <text x="60" y="128">Systems</text>
      <text className="mjc-yard-faint" x="60" y="188">
        Mechanical
      </text>
    </g>

    <g className="mjc-yard-node">
      <rect x="126" y="62" width="8" height="8" />
      <rect x="126" y="132" width="8" height="8" />
      <rect x="126" y="192" width="8" height="8" />
      <rect x="338" y="62" width="8" height="8" />
      <rect x="338" y="132" width="8" height="8" />
      <rect x="550" y="62" width="8" height="8" />
    </g>
  </svg>
);

const AddSchool = ({ updateDoc }) => {
  const [name, setName] = useState('');
  // Most schools offer all three, so the quick path is unchecking the ones that are missing.
  const [offers, setOffers] = useState(['ie', 'se', 'me']);

  const toggle = (id) =>
    setOffers((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  const submit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    updateDoc((current) => ({
      ...current,
      schools: [
        ...current.schools,
        {
          name: trimmed,
          offers: MAJORS.filter((m) => offers.includes(m.id)).map((m) => m.id),
          combined: null,
          switchPolicy: NEW_SCHOOL_PLACEHOLDER,
          deadline: NEW_SCHOOL_PLACEHOLDER,
          note: '',
        },
      ],
    }));
    setName('');
    setOffers(['ie', 'se', 'me']);
  };

  return (
    <form className="mjc-form" onSubmit={submit}>
      <MonoLabel tone="muted" className="mjc-form-t">
        Add a school
      </MonoLabel>
      <div className="mjc-field">
        <Label htmlFor="school-name">School</Label>
        <Input
          id="school-name"
          type="text"
          value={name}
          placeholder="Name of the school"
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <fieldset className="mjc-checks">
        <legend className="mjc-lbl">Offers</legend>
        {MAJORS.map((major) => (
          <div className="mjc-check" key={major.id}>
            <Checkbox
              id={`offer-${major.id}`}
              checked={offers.includes(major.id)}
              onCheckedChange={() => toggle(major.id)}
            />
            <Label htmlFor={`offer-${major.id}`} role="inline">
              {major.short}
            </Label>
          </div>
        ))}
      </fieldset>
      <Button type="submit" disabled={!name.trim()}>
        Add school
      </Button>
      <p className="mjc-form-hint">
        Switch policy and deadline start as placeholders. Fill them in from the doc when you have
        them.
      </p>
    </form>
  );
};

export const SwitchYard = ({ doc, editing, updateDoc }) => (
  <section id="switchyard" className="mj-sec">
    <SectionHead eyebrow="S5 / Switchyard" title="Which Doors Stay Open" />

    <p className="mj-hint">
      Picking a major is mostly a question about how easily you can change your mind later, and a
      normal matrix cannot show that. Solid lines are cheap switches. Dashed lines cost you a
      semester. A missing line is a door that already shut.
    </p>

    {/* Scrolls rather than shrinks: at phone width the whole 800 unit diagram would
        render its mono labels at about 4px. */}
    <div className="mjc-yardwrap">
      <YardDiagram />
    </div>

    <p className="mj-hint mjc-yard-note">
      The thing that matters here is the asymmetry. Industrial and Systems swap cheaply in both
      directions for most of the degree. Getting into Mechanical closes early, because thermo,
      statics and machine design stack on top of each other in a fixed order and you cannot catch
      up. That is a real argument for one of the first two, and it is{' '}
      <Tip term="option-value">option value</Tip>, not a score on the board.
    </p>

    <MonoLabel tone="muted" className="mjc-sub">
      S5.1 / School availability
    </MonoLabel>

    <div className="mjc-schools">
      {doc.schools.map((school, index) => (
        <Card key={`${school.name}-${index}`} className="mjc-school">
          <CardTitle as="h3" className={isTodo(school.name) ? 'mjc-todo' : undefined}>
            {school.name}
          </CardTitle>

          <div className="mjc-offers" aria-label="Majors offered">
            {MAJORS.map((major) => {
              const on = (school.offers || []).includes(major.id);
              return (
                <Badge key={major.id} solid={on} className="mjc-offer">
                  {chipLabel(school, major.id)}
                </Badge>
              );
            })}
          </div>

          <dl className="mjc-meta">
            <dt>Switch policy</dt>
            <dd className={fieldClass(school.switchPolicy)}>{school.switchPolicy || 'not set'}</dd>
            <dt>Deadline</dt>
            <dd className={fieldClass(school.deadline)}>{school.deadline || 'not set'}</dd>
            {school.combined && (
              <>
                <dt>Combined degree</dt>
                <dd className="mjc-val">
                  {school.combined.label} covers{' '}
                  {(school.combined.covers || []).map((id) => id.toUpperCase()).join(' and ')}
                </dd>
              </>
            )}
          </dl>

          {school.note && <p className="mjc-school-note">{school.note}</p>}
        </Card>
      ))}
    </div>

    {editing && <AddSchool updateDoc={updateDoc} />}

    <p className="mj-hint mjc-after">
      Look at the combined degree card. Plenty of schools only offer one ISE degree, and if that is
      true where you are applying then half of this decision does not exist. Worth checking before
      anything else.
    </p>

    <details className="plain">
      <summary>Plain English: what option value means</summary>
      <div className="pbody">
        <p>
          Two choices can look equally good today, but one leaves you three ways out and the other
          leaves you none. The one with exits is worth more, even if it scores slightly lower right
          now.
        </p>
        <p>
          That matters more than usual for you, because you have said you do not have enough
          information yet. When you are unsure, the right move is usually the one you can undo.
        </p>
        <p>
          The diagram is how the page shows that. Solid lines are cheap switches, dashed lines are
          expensive ones, and missing lines are doors that have already shut.
        </p>
      </div>
    </details>
  </section>
);

export default SwitchYard;
