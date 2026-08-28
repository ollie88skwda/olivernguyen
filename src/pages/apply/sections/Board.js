import React, { useState } from 'react';
import { SectionHead } from '../../../components/brand';
import Tip from '../../../components/Tooltip';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const EMPTY_SCORE = { lo: 0, mid: 0, hi: 0 };
// The ink ramp is a flagged data encoding (see coverage record): the rating
// darkness is drawn from --accent-hi via color-mix instead of legacy navy.
const INK_FLOOR = 0.15;
const INK_RANGE = 0.85;
// Below this the ink is too pale to carry on-accent text.
const INK_INVERT = 0.5;
const RAMP = [0.2, 0.4, 0.6, 0.8, 1];
const COLLAPSED_ROWS = 12;

const dec2 = (value) => value.toFixed(2).replace(/^0/, '');
const dec3 = (value) => value.toFixed(3).replace(/^0/, '');

const cellStyle = (value) => ({
  background: `color-mix(in srgb, var(--accent-hi) ${Math.round(
    INK_FLOOR * 100 + INK_RANGE * value * 100
  )}%, var(--surface))`,
  color: value > INK_INVERT ? 'var(--on-accent)' : 'var(--text-muted)',
});

// A school nobody has researched gets hatching rather than a shade, because a mid-grey box
// reads as "average" and the honest answer is "unknown". Ollie asked for counselor picks to
// be addable mid-cycle, and this is what stops them inheriting scores they did not earn.
const isUnresearched = (school, criterionId) => {
  const basis = school.scores && school.scores[criterionId] && school.scores[criterionId].basis;
  return typeof basis === 'string' && basis === 'unresearched';
};

export const Board = ({ doc, derived, editing, updateDoc }) => {
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState('total');

  const { ahp, normalized, wsm, schools } = derived;
  const { criteria } = doc;

  const totalOf = (id) => (wsm[id] && wsm[id].total) || 0;
  const contributionOf = (schoolId, critId) =>
    (wsm[schoolId] && wsm[schoolId].contributions[critId]) || 0;
  const ratingOf = (schoolId, critId) => (normalized[critId] && normalized[critId][schoolId]) || 0;
  const scoreOf = (school, critId) => (school.scores && school.scores[critId]) || EMPTY_SCORE;

  const sorted = [...schools].sort((a, b) =>
    sortBy === 'total' ? totalOf(b.id) - totalOf(a.id) : ratingOf(b.id, sortBy) - ratingOf(a.id, sortBy)
  );
  const rows = showAll ? sorted : sorted.slice(0, COLLAPSED_ROWS);

  const maxWeight = Math.max(...criteria.map((c) => ahp.weights[c.id] || 0), 0.0001);

  const setScore = (schoolId, critId, key, raw) => {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? parsed : 0;
    updateDoc((current) => ({
      ...current,
      schools: current.schools.map((school) =>
        school.id === schoolId
          ? {
              ...school,
              scores: {
                ...school.scores,
                [critId]: {
                  ...(school.scores[critId] || EMPTY_SCORE),
                  [key]: value,
                  // Typing a number is Ollie overriding the derivation, so the basis has to
                  // stop claiming a rule produced it.
                  basis: 'entered by hand',
                },
              },
            }
          : school
      ),
    }));
  };

  // The tooltip stays on top; only the horizontal align follows the column so a
  // tooltip never falls off the viewport edge.
  const tooltipAlign = (index) =>
    index === 0 ? 'start' : index === criteria.length - 1 ? 'end' : 'center';

  return (
    <section id="board" className="ap-sec">
      <SectionHead kicker="S1 / The Board" title="Every School, As Ink" />

      <p className="on-prose ap-hint">
        Each column is one thing you care about and each box is how well a school does on it.
        Darker is better. The number at the end of a row is the whole{' '}
        <Tip term="weighted-matrix">weighted</Tip> result. Columns are even and the{' '}
        <Tip term="weight">weight</Tip> sits under each heading as a bar and a percentage, so the
        heading can just be the name of the thing.
      </p>

      <div className="ap-board-tools">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="ap-sort" aria-label="Sort the board">
            <SelectValue placeholder="by total" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">by total</SelectItem>
            {criteria.map((criterion) => (
              <SelectItem key={criterion.id} value={criterion.id}>
                by {criterion.label.toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="on-label" data-tone="faint">
          {rows.length} of {schools.length}
        </span>
      </div>

      <TooltipProvider delayDuration={0}>
        <div className="ap-board">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                {criteria.map((criterion) => (
                  <TableHead key={criterion.id}>
                    <span className="ap-head-label">{criterion.label}</span>
                    <span className="ap-rail" aria-hidden="true">
                      <Progress
                        className="ap-rail-progress"
                        value={((ahp.weights[criterion.id] || 0) / maxWeight) * 100}
                      />
                      <span className="ap-rail-val">
                        {Math.round((ahp.weights[criterion.id] || 0) * 100)}%
                      </span>
                    </span>
                  </TableHead>
                ))}
                <TableHead numeric>total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <span className="ap-board-name">{school.name}</span>
                    {school.addedBy && <Badge solid className="ap-added">{school.addedBy}</Badge>}
                  </TableCell>

                  {criteria.map((criterion, index) => {
                    const rating = ratingOf(school.id, criterion.id);
                    const score = scoreOf(school, criterion.id);
                    const unknown = isUnresearched(school, criterion.id);

                    if (editing) {
                      return (
                        <TableCell className="ap-cell-edit" key={criterion.id}>
                          <div className="ap-cell-edit-inner">
                            {['lo', 'mid', 'hi'].map((key) => (
                              <span className="ap-in-row" key={key}>
                                <i>{key}</i>
                                <Input
                                  className="ap-in"
                                  face="mono"
                                  type="number"
                                  step="0.5"
                                  value={score[key]}
                                  aria-label={`${school.name}, ${criterion.label}, ${key}`}
                                  onChange={(event) =>
                                    setScore(school.id, criterion.id, key, event.target.value)
                                  }
                                />
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      );
                    }

                    const label = unknown
                      ? `${school.name}, ${criterion.label}: not researched yet`
                      : `${school.name}, ${criterion.label}: rated ${dec2(rating)} of 1. Range ${score.lo} to ${score.hi}, best guess ${score.mid}. ${score.basis || ''}`.trim();

                    return (
                      <TableCell key={criterion.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="ap-cellbtn"
                              style={unknown ? undefined : cellStyle(rating)}
                              data-unknown={unknown || undefined}
                              aria-label={label}
                            >
                              <span className="ap-cell-v">{unknown ? '—' : dec2(rating)}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent align={tooltipAlign(index)} side="top" sideOffset={8} className="ap-cell-tip">
                            <b>
                              {school.name} · {criterion.label}
                            </b>
                            {unknown ? (
                              <span>Not researched yet. Wide on purpose, so it reads as unknown.</span>
                            ) : (
                              <>
                                <span>
                                  {score.lo} to {score.hi}, best guess {score.mid}
                                </span>
                                <span>
                                  rated {dec2(rating)} of 1, adds{' '}
                                  {dec3(contributionOf(school.id, criterion.id))} to the row
                                </span>
                              </>
                            )}
                            {score.basis && <span className="ap-cell-tip-note">{score.basis}</span>}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    );
                  })}

                  <TableCell numeric className="ap-total">
                    {dec3(totalOf(school.id))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {schools.length > COLLAPSED_ROWS && (
        <Button
          type="button"
          variant="ghost"
          className="ap-more"
          onClick={() => setShowAll((on) => !on)}
        >
          {showAll ? 'show top 12' : `show all ${schools.length}`}
        </Button>
      )}

      <div className="ap-legend">
        <span className="ap-key">
          Darkness is how well a school does on that column
          <span className="ap-ramp" aria-hidden="true">
            {RAMP.map((step) => (
              <i key={step} style={{ background: cellStyle(step).background }} />
            ))}
          </span>
        </span>
        <span className="ap-key">
          Hatched means <Tip term="unresearched">unresearched</Tip>, not bad.
        </span>
        <span className="ap-key">
          Weights come from the duels in S2. You never type one.
        </span>
      </div>

      <details className="plain">
        <summary>Plain English: where these scores came from</summary>
        <div className="pbody">
          <p>
            Three of the four columns were filled in from research, not opinion. Whether a
            kinesiology department exists is a fact. Whether you can start undeclared and how hard
            it is to switch majors afterwards are facts. How many programs a school has whose door
            shuts when high school ends is a fact. Hover any box and it tells you the rule that
            produced its number.
          </p>
          <p>
            Program strength is the exception. Whether Georgia Tech beats Purdue for what you
            actually want to do is your call, not something a page can look up, so every school
            starts as a placeholder there until you fill it in.
          </p>
          <p>
            Anything nobody has checked stays hatched and wide rather than landing in the middle. A
            grey box in the middle would read as average, and the honest answer is that we do not
            know yet.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Board;
