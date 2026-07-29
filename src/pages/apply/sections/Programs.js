import React, { useMemo, useState } from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';

const BUSINESS_LABEL = {
  none: 'no business',
  overlay: 'business overlay',
  heavy: 'business heavy',
};

const daysUntil = (iso) => {
  if (!iso) return null;
  const target = new Date(`${iso}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target - new Date()) / 86400000);
};

// Three buckets, in the order they deserve attention. The distinction that matters is not
// how selective a programme is, it is whether missing it now costs you the chance forever.
const bucketOf = (program) => {
  if (program.seniorOnly === true && program.canJoinLater !== true) return 'closing';
  if (program.canJoinLater === true) return 'later';
  return 'unverified';
};

const BUCKETS = [
  {
    id: 'closing',
    title: 'Doors that close',
    blurb:
      'Verified against the programme page: apply as a high school senior or you never can. These are the only ones where this autumn is genuinely your one shot.',
  },
  {
    id: 'later',
    title: 'Joinable later',
    blurb:
      'Widely believed to be senior-only, and not. Each of these takes applications from students already enrolled, so missing it now is a setback rather than an ending. Worth knowing before you spend an essay or an Early Decision on one.',
  },
  {
    id: 'unverified',
    title: 'Not established',
    blurb:
      'The programme page did not say either way. Recorded as unknown rather than assumed, because guessing this field wrong is how you miss a deadline that mattered.',
  },
];

export const Programs = ({ doc }) => {
  const [showBusinessHeavy, setShowBusinessHeavy] = useState(false);

  const grouped = useMemo(() => {
    const out = { closing: [], later: [], unverified: [] };
    for (const program of doc.programs || []) {
      out[bucketOf(program)].push(program);
    }
    // Soonest deadline first inside each bucket; undated programmes sink to the bottom
    // rather than sorting as if they were due today.
    for (const key of Object.keys(out)) {
      out[key].sort((a, b) => {
        const da = (a.deadline && a.deadline.value) || '9999';
        const db = (b.deadline && b.deadline.value) || '9999';
        return da.localeCompare(db);
      });
    }
    return out;
  }, [doc.programs]);

  const businessOut = doc.stance && doc.stance.business === 'out';

  const visible = (list) =>
    businessOut && !showBusinessHeavy ? list.filter((p) => p.businessLoad !== 'heavy') : list;

  const hiddenCount = businessOut
    ? (doc.programs || []).filter((p) => p.businessLoad === 'heavy').length
    : 0;

  // Several of the biggest scholarship competitions are at schools that never made the
  // list. That is a decision, not a footnote: applying to one means adding its school, so
  // the urgent panel has to say which ones would cost you a whole extra application.
  const onList = useMemo(
    () => new Set((doc.schools || []).flatMap((s) => [s.id, s.name])),
    [doc.schools]
  );

  const urgent = grouped.closing
    .filter((p) => {
      const days = daysUntil(p.deadline && p.deadline.value);
      return days != null && days <= 100 && days >= 0;
    })
    .map((p) => ({ ...p, offList: !onList.has(p.schoolId) && !onList.has(p.school) }));

  return (
    <section id="programs" className="ap-sec">
      <SectionHeading eyebrow="S4 / Programs" title="Doors That Close This Fall" />

      <Reveal as="p" className="ap-hint">
        The highest-leverage thing on this page. A strong application to a good engineering school
        is a strong application; a <Tip term="senior-only">senior-only</Tip> programme is a door
        that shuts when high school ends. Every flag below was checked against the programme's own
        page, and the sentence that proves it is quoted underneath.
      </Reveal>

      {urgent.length > 0 && (
        <div className="ap-urgent">
          <p className="ap-urgent-k">Inside 100 days</p>
          <ul className="ap-urgent-list">
            {urgent.map((program) => (
              <li key={program.id}>
                <b>{daysUntil(program.deadline.value)}d</b> {program.name}
                <span> · {program.school}</span>
                {program.offList && <em className="ap-offlist">not on your list</em>}
              </li>
            ))}
          </ul>
          {urgent.some((p) => p.offList) && (
            <p className="ap-urgent-note">
              The marked ones are at schools you have not chosen to apply to. Going after those
              scholarships means adding the school as well, which is a real cost and worth deciding
              deliberately rather than by accident.
            </p>
          )}
        </div>
      )}

      {hiddenCount > 0 && (
        <label className="ap-toggle">
          <input
            type="checkbox"
            checked={showBusinessHeavy}
            onChange={(event) => setShowBusinessHeavy(event.target.checked)}
          />
          Show the {hiddenCount} programmes that commit you to a business degree
          <span className="ap-toggle-why">
            Hidden by default because you said business happens outside school. They are still here
            if a programme is worth it as pure differentiation.
          </span>
        </label>
      )}

      {BUCKETS.map((bucket) => {
        const list = visible(grouped[bucket.id]);
        if (list.length === 0) return null;

        return (
          <div className="ap-bucket" key={bucket.id}>
            <h3 className={`ap-bucket-h ap-bucket-${bucket.id}`}>
              {bucket.title}
              <span>{list.length}</span>
            </h3>
            <p className="ap-bucket-blurb">{bucket.blurb}</p>

            <ul className="ap-programs">
              {list.map((program) => {
                const days = daysUntil(program.deadline && program.deadline.value);
                return (
                  <li className="ap-program" key={program.id}>
                    <div className="ap-program-top">
                      <span className="ap-program-name">{program.name}</span>
                      <span className="ap-program-school">{program.school}</span>
                    </div>

                    <div className="ap-program-tags">
                      <span className={`ap-tag ap-tag-${program.businessLoad || 'unknown'}`}>
                        {BUSINESS_LABEL[program.businessLoad] || 'business load unknown'}
                      </span>
                      <span className="ap-tag">{program.category}</span>
                      {program.deadline && program.deadline.value && (
                        <span className={days != null && days <= 100 ? 'ap-tag ap-tag-soon' : 'ap-tag'}>
                          {program.deadline.value}
                          {days != null && days >= 0 ? ` · ${days}d` : ''}
                        </span>
                      )}
                      {program.requiresED && <span className="ap-tag ap-tag-ed">needs ED</span>}
                      <span className={`ap-tag ap-tag-conf-${program.confidence || 'low'}`}>
                        {program.confidence || 'low'} confidence
                      </span>
                    </div>

                    {program.whyDifferentiating && (
                      <p className="ap-program-why">{program.whyDifferentiating}</p>
                    )}
                    {program.fitForThisApplicant && (
                      <p className="ap-program-fit">{program.fitForThisApplicant}</p>
                    )}
                    {program.eligibility && (
                      <blockquote className="ap-program-quote">{program.eligibility}</blockquote>
                    )}

                    {program.url && (
                      <a
                        className="ap-program-src"
                        href={program.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        source · read {program.fetchedAt || 'recently'}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <details className="plain">
        <summary>Plain English: why "joinable later" is the useful half of this</summary>
        <div className="pbody">
          <p>
            It is easy to find lists of prestigious programmes. It is much harder to find out which
            of them you can still get into after you enrol, and that is the fact that actually
            changes what you do this autumn.
          </p>
          <p>
            Several of the famous engineering-and-business dual degrees turn out to take
            applications from students already at the school, usually at the end of first year. That
            does not make them worse programmes. It makes them worse reasons to spend a binding
            Early Decision, because not getting one in December is no longer the end of the road.
          </p>
          <p>
            So the page sorts by whether the door shuts, not by how famous the name is. The
            scholarship competitions are what survive that sort, and most of them want an
            application well before the ordinary deadline.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Programs;
