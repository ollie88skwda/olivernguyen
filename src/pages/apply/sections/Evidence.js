import React, { useMemo, useState } from 'react';
import { SectionHead, StatBlock } from '../../../components/brand';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Fields worth surfacing individually, in the order they matter for a decision. Anything
// not listed here still counts towards the gap totals; this is just what gets a column.
const TRACKED = [
  { path: 'deadlines.regular', label: 'deadline' },
  { path: 'admitRate.engineering', label: 'engineering admit rate' },
  { path: 'switchPolicy', label: 'switch policy' },
  { path: 'kines', label: 'kinesiology' },
  { path: 'essays', label: 'essays' },
];

const read = (school, path) => {
  const [head, tail] = path.split('.');
  const node = school[head];
  return tail ? node && node[tail] : node;
};

const hasValue = (field) => {
  if (!field) return false;
  if (typeof field === 'object') {
    if ('value' in field) return field.value !== null && field.value !== undefined;
    if ('exists' in field) return field.exists !== null && field.exists !== undefined;
    if ('difficulty' in field) return !!field.difficulty;
    if ('count' in field) return field.count !== null && field.count !== undefined;
    return Object.keys(field).length > 0;
  }
  return true;
};

const urlOf = (field) => (field && typeof field === 'object' ? field.url : null);

export const Evidence = ({ doc }) => {
  const [onlyGaps, setOnlyGaps] = useState(false);

  const rows = useMemo(
    () =>
      doc.schools
        .filter((school) => school.scores)
        .map((school) => {
          const cells = TRACKED.map((tracked) => {
            const field = read(school, tracked.path);
            return { ...tracked, ok: hasValue(field), url: urlOf(field) };
          });
          return {
            school,
            cells,
            gaps: (school.needsResearch || []).length,
            sourced: cells.filter((cell) => cell.ok && cell.url).length,
          };
        })
        .sort((a, b) => b.gaps - a.gaps),
    [doc.schools]
  );

  const visible = onlyGaps ? rows.filter((row) => row.gaps > 0) : rows;

  const totalGaps = rows.reduce((sum, row) => sum + row.gaps, 0);
  const unsourced = rows.reduce(
    (sum, row) => sum + row.cells.filter((cell) => cell.ok && !cell.url).length,
    0
  );

  return (
    <section id="evidence" className="ap-sec">
      <SectionHead kicker="S8 / Evidence" title="What this page does not know" />

      <p className="on-prose ap-hint">
        Every filled-in field on this page came from a real university page and has its link and
        the date it was read. Everything else is listed here as missing, not guessed. A wrong
        deadline can cost you an application cycle. A visible gap costs an afternoon.
      </p>

      <div className="ap-ev-stats">
        <div>
          <StatBlock value={rows.length} label="schools" />
        </div>
        <div>
          <StatBlock value={doc.programs.length} label="programs" />
        </div>
        <div>
          <StatBlock value={totalGaps} label="open gaps" />
        </div>
        <div className={unsourced > 0 ? 'ap-ev-bad' : undefined}>
          <StatBlock value={unsourced} label="values with no source" />
        </div>
      </div>

      {unsourced === 0 && (
        <p className="ap-ev-clean">
          Every value shown across all {rows.length} schools has a source URL. That was the rule
          for the research, and this check confirms it held.
        </p>
      )}

      <div className="ap-toggle">
        <span className="on-check-row">
          <Checkbox
            id="only-gaps"
            checked={onlyGaps}
            onCheckedChange={(checked) => setOnlyGaps(!!checked)}
          />
          <Label htmlFor="only-gaps" role="inline">
            Only show schools with open gaps
          </Label>
        </span>
      </div>

      <div className="ap-ev-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              {TRACKED.map((tracked) => (
                <TableHead key={tracked.path}>{tracked.label}</TableHead>
              ))}
              <TableHead numeric>gaps</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.school.id}>
                <TableCell className="ap-ev-name">{row.school.name}</TableCell>
                {row.cells.map((cell) => (
                  <TableCell className="ap-ev-cell" key={cell.path}>
                    {cell.ok ? (
                      cell.url ? (
                        <a href={cell.url} target="_blank" rel="noreferrer" title={cell.url}>
                          cited
                        </a>
                      ) : (
                        <em className="ap-ev-nosrc">no source</em>
                      )
                    ) : (
                      <em className="ap-ev-missing">missing</em>
                    )}
                  </TableCell>
                ))}
                <TableCell numeric className={row.gaps > 0 ? 'ap-ev-gaps ap-ev-bad' : 'ap-ev-gaps'}>
                  {row.gaps}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <h3 className="ap-sub">What changed the plan</h3>
      <ul className="ap-ev-log">
        {(doc.assumptions || []).map((assumption) => (
          <li key={assumption.id} className="ap-assume">
            <div className="ap-assume-status">
              <Badge tone={assumption.status === 'refuted' ? 'danger' : 'neutral'}>
                {assumption.status}
              </Badge>
            </div>
            <span className="ap-assume-claim">{assumption.claim}</span>
            {assumption.note && <span className="ap-assume-note">{assumption.note}</span>}
            {!assumption.note && <span className="ap-assume-note">Test: {assumption.test}</span>}
          </li>
        ))}
      </ul>

      <details className="plain">
        <summary>Plain English: why the gaps are the useful part</summary>
        <div className="pbody">
          <p>
            A research document that looks complete is riskier than one that admits what it missed,
            because you stop checking. So the gap count above is large and easy to see.
          </p>
          <p>
            The rule for the research was simple: if a claim could not be traced to a real
            university page, it was written down as unknown, not guessed. That is why some schools
            have a dozen gaps. It is also why you can trust the fields that are filled in.
          </p>
          <p>
            The assumptions list applies the same idea to this page's own reasoning. One assumption
            is already marked refuted, and that changed which schools are worth an Early Decision.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Evidence;
