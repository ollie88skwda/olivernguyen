import React from 'react';
import { MonoLabel, SectionHead } from '@/components/brand';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUSES = ['untested', 'supported', 'refuted'];

const toneOf = (status) =>
  status === 'untested' ? 'warning' : status === 'supported' ? 'success' : 'neutral';

export const Assumptions = ({ doc, editing, updateDoc }) => {
  const rows = doc.assumptions || [];
  const untested = rows.filter((row) => row.status === 'untested').length;

  const patch = (id, field, value) =>
    updateDoc((current) => ({
      ...current,
      assumptions: current.assumptions.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    }));

  return (
    <section id="assumptions" className="mj-sec">
      <SectionHead kicker="S7 / Assumptions" title="Your Beliefs, Written Down As Work" />

      <p className="mj-hint">
        None of these are facts yet. They are things you said, sitting in the model and moving the
        scores as if they were checked. Written out with the word untested next to them, they turn
        into a short list of jobs.
      </p>

      {untested > 0 && (
        <MonoLabel tone="warning" className="mjc-count">
          {untested} of {rows.length} still untested
        </MonoLabel>
      )}

      <Table className="mjc-table">
        <TableHeader>
          <TableRow>
            <TableHead>What you believe</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>How to check it</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.claim}</TableCell>
              <TableCell>
                {editing ? (
                  <Select
                    value={row.status}
                    onValueChange={(value) => patch(row.id, 'status', value)}
                  >
                    <SelectTrigger aria-label={`Status of: ${row.claim}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem value={status} key={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    tone={toneOf(row.status)}
                    className={row.status === 'refuted' ? 'mjc-pill-refuted' : undefined}
                  >
                    {row.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {editing ? (
                  <Input
                    type="text"
                    value={row.test}
                    aria-label={`How to check: ${row.claim}`}
                    onChange={(event) => patch(row.id, 'test', event.target.value)}
                  />
                ) : (
                  row.test
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <details className="plain">
        <summary>Plain English: why write down things you already believe</summary>
        <div className="pbody">
          <p>
            Right now mechanical is saturated is quietly acting like a fact inside your head, and it
            is dragging Mechanical down on the board without anyone ever checking it. Putting it in a
            table with untested next to it makes that visible.
          </p>
          <p>
            Each row comes with the cheapest way to settle it. When one turns out to be true, mark it
            supported and the belief has earned its place. When one turns out to be wrong, mark it
            refuted and go fix the score it was holding down.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Assumptions;
