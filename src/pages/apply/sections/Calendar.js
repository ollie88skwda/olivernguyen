import React, { useMemo } from 'react';
import { SectionHead } from '../../../components/brand';
import Tip from '../../../components/Tooltip';

// The season, as the page understands it. Starts at the day the applications open and ends
// after the last regular deadline worth planning around.
const START = '2026-08-01';
const END = '2027-02-01';

const day = (iso) => new Date(`${iso}T12:00:00`);
const span = (a, b) => (day(b) - day(a)) / 86400000;
const TOTAL = span(START, END);

const positionOf = (iso) => {
  const offset = span(START, iso);
  if (!Number.isFinite(offset)) return null;
  return Math.max(0, Math.min(100, (offset / TOTAL) * 100));
};

const MONTHS = ['2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01'];
const MONTH_LABEL = { '08': 'Aug', '09': 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec', '01': 'Jan' };

// A week with more than this many things due is where a plan quietly falls apart.
const CROWDED = 4;

export const Calendar = ({ doc, derived }) => {
  const today = new Date().toISOString().slice(0, 10);

  const items = useMemo(() => {
    const out = [];
    for (const school of derived.schools || []) {
      const value = school.deadlines && school.deadlines.regular && school.deadlines.regular.value;
      if (value) out.push({ id: school.id, label: school.name, date: value, kind: 'school' });
      const ed = school.deadlines && school.deadlines.ed && school.deadlines.ed.value;
      if (ed) out.push({ id: `${school.id}-ed`, label: `${school.name} (ED)`, date: ed, kind: 'ed' });
    }
    for (const program of doc.programs || []) {
      const value = program.deadline && program.deadline.value;
      // Only the doors that actually shut. A programme you can join later does not belong on
      // a calendar built to stop you missing something irreversible.
      if (value && program.seniorOnly === true && program.canJoinLater !== true) {
        out.push({ id: program.id, label: program.name, date: value, kind: 'program' });
      }
    }
    return out
      .filter((item) => item.date >= START && item.date <= END)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [derived.schools, doc.programs]);

  // Group into ISO weeks so a pile-up is visible as a pile-up rather than as a dense row.
  const weeks = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const d = day(item.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()]
      .map(([week, list]) => {
        // Early Decision is single-use, so a week holding ten ED deadlines is not ten
        // things to do. It is one choice with ten candidates, and counting them
        // individually would invent a crisis that does not exist.
        const eds = list.filter((item) => item.kind === 'ed');
        const load = list.length - Math.max(0, eds.length - 1);
        return { week, list, load, edChoices: eds.length };
      })
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [items]);

  const crowded = weeks.filter((week) => week.load >= CROWDED);
  const programCount = items.filter((item) => item.kind === 'program').length;

  return (
    <section id="calendar" className="ap-sec">
      <SectionHead kicker="S5 / Calendar" title="The Season, To Scale" />

      <p className="on-prose ap-hint">
        Everything with a date, laid on one line from the day applications open to the last
        deadline worth planning around. Only the {programCount} programmes whose door actually
        shuts appear here; the ones you can join later are not emergencies.
      </p>

      <div className="ap-gantt">
        <div className="ap-gantt-months">
          {MONTHS.map((month) => (
            <span key={month} style={{ left: `${positionOf(month)}%` }}>
              {MONTH_LABEL[month.slice(5, 7)]}
            </span>
          ))}
        </div>

        <div className="ap-gantt-track">
          {MONTHS.map((month) => (
            <i className="ap-gantt-grid" key={month} style={{ left: `${positionOf(month)}%` }} />
          ))}
          {positionOf(today) != null && (
            <i className="ap-gantt-today" style={{ left: `${positionOf(today)}%` }} title="today" />
          )}
          {items.map((item) => (
            <i
              key={item.id}
              className={`ap-gantt-pin ap-gantt-${item.kind}`}
              style={{ left: `${positionOf(item.date)}%` }}
              title={`${item.date} · ${item.label}`}
            />
          ))}
        </div>

        <div className="ap-gantt-key">
          <span className="ap-gk ap-gk-program">door closes</span>
          <span className="ap-gk ap-gk-ed">
            <Tip term="ed">early decision</Tip>
          </span>
          <span className="ap-gk ap-gk-school">regular deadline</span>
          <span className="ap-gk ap-gk-today">today</span>
        </div>
      </div>

      {crowded.length > 0 && (
        <div className="ap-collide">
          <p className="ap-collide-k">Weeks with {CROWDED} or more things due</p>
          <ul>
            {crowded.map((week) => (
              <li key={week.week}>
                <b>week of {week.week}</b>
                <span>{week.load} due</span>
                {week.edChoices > 1 && (
                  <span className="ap-collide-ed">{week.edChoices} ED options, pick one</span>
                )}
                <em>
                  {week.list
                    .filter((item) => item.kind !== 'ed')
                    .map((item) => item.label)
                    .join(' · ')}
                  {week.edChoices > 1 &&
                    ` · Early Decision, one of: ${week.list
                      .filter((item) => item.kind === 'ed')
                      .map((item) => item.label.replace(' (ED)', ''))
                      .join(', ')}`}
                </em>
              </li>
            ))}
          </ul>
          <p className="ap-collide-note">
            These are the weeks a plan actually fails in. Nothing here is individually hard; the
            problem is that they land together, and the essays for them get written in the weeks
            before, not during.
          </p>
        </div>
      )}

      <div className="ap-timeline">
        {weeks.map((week) => (
          <div className="ap-tl-week" key={week.week}>
            <span className="ap-tl-date">{week.week}</span>
            <ul>
              {week.list.map((item) => (
                <li key={item.id} className={`ap-tl-${item.kind}`}>
                  {item.label}
                  <em>{item.date}</em>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <details className="plain">
        <summary>Plain English: why November 1 is the real deadline</summary>
        <div className="pbody">
          <p>
            Everyone quotes November 30, because that is when the UC application closes. But you
            said you are willing to use Early Decision, and Early Decision is binding and
            single-use. That choice gets made around November 1, and once it is made it cannot be
            unmade.
          </p>
          <p>
            So the decision that constrains everything else lands a month before the deadline
            people plan around. The scholarship competitions land even earlier, some of them in
            early October, and those are the ones that vanish entirely if you miss them.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Calendar;
