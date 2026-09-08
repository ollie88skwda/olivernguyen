import React, { useState } from 'react';
import { MonoLabel, SectionHead } from '@/components/brand';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

// A bare YYYY-MM-DD parses as UTC midnight, which sorts and prints a day early west of
// Greenwich. Pin date-only strings to local midnight. Anything unparseable sinks last.
const timeOf = (raw) => {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const at = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text);
  return Number.isNaN(at) ? -Infinity : at;
};

const today = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const deltaText = (delta) =>
  typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}` : String(delta);

const AddEntry = ({ updateDoc }) => {
  const [date, setDate] = useState(today);
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmedNote = note.trim();
    if (!trimmedNote) return;
    updateDoc((current) => ({
      ...current,
      evidence: [
        ...current.evidence,
        {
          date: date || today(),
          source: source.trim() || 'Not stated',
          url: url.trim() || null,
          criterion: null,
          alternative: null,
          delta: null,
          note: trimmedNote,
        },
      ],
    }));
    setSource('');
    setUrl('');
    setNote('');
    setDate(today());
  };

  return (
    <form className="mjc-form" onSubmit={submit}>
      <MonoLabel tone="muted" className="mjc-form-t">
        Log what you just learned
      </MonoLabel>

      <div className="mjc-form-row">
        <div className="mjc-field mjc-field-sm">
          <Label htmlFor="ev-date">Date</Label>
          <Input
            id="ev-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="mjc-field">
          <Label htmlFor="ev-source">Source</Label>
          <Input
            id="ev-source"
            type="text"
            value={source}
            placeholder="NY Fed, labour market by major"
            onChange={(event) => setSource(event.target.value)}
          />
        </div>
      </div>

      <div className="mjc-field">
        <Label htmlFor="ev-url">Link, if there is one</Label>
        <Input
          id="ev-url"
          type="url"
          value={url}
          placeholder="https://"
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>

      <div className="mjc-field">
        <Label htmlFor="ev-note">What it changed</Label>
        <Textarea
          id="ev-note"
          value={note}
          placeholder="ME unemployment came in lower than IE, so the saturated claim is looking weak"
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <Button type="submit" disabled={!note.trim()}>
        Add to the log
      </Button>
    </form>
  );
};

export const EvidenceLog = ({ doc, editing, updateDoc }) => {
  const rows = [...(doc.evidence || [])].sort((a, b) => timeOf(b.date) - timeOf(a.date));

  const criterionLabel = (id) => {
    const found = doc.criteria.find((c) => c.id === id);
    return found ? found.label : id;
  };
  const alternativeLabel = (id) => {
    const found = doc.alternatives.find((a) => a.id === id);
    return found ? found.label : id;
  };

  return (
    <section id="evidence" className="mj-sec">
      <SectionHead kicker="S8 / Evidence log" title="Why The Answer Moved" />

      <p className="mj-hint">
        Every time something you find out changes a number, it gets a dated row here. Newest first.
        In three months, when the page says something different to what it says today, this is the
        record of what did it.
      </p>

      <Table className="mjc-table">
        <TableHeader>
          <TableRow>
            <TableHead className="mjc-col-date">Date</TableHead>
            <TableHead className="mjc-col-src">Source</TableHead>
            <TableHead>What it moved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.date}-${row.source}-${index}`}>
              <TableCell className="mjc-date">{row.date}</TableCell>
              <TableCell>
                {row.url ? (
                  <a className="mjc-link" href={row.url} target="_blank" rel="noreferrer">
                    {row.source}
                  </a>
                ) : (
                  row.source
                )}
              </TableCell>
              <TableCell>
                {row.note}
                {(row.criterion || row.alternative || row.delta !== null) && (
                  <span className="mjc-tags">
                    {row.alternative && <Badge className="mjc-tag">{alternativeLabel(row.alternative)}</Badge>}
                    {row.criterion && <Badge className="mjc-tag">{criterionLabel(row.criterion)}</Badge>}
                    {row.delta !== null && row.delta !== undefined && (
                      <Badge tone="accent" className="mjc-tag">
                        {deltaText(row.delta)}
                      </Badge>
                    )}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && <AddEntry updateDoc={updateDoc} />}

      <details className="plain">
        <summary>Plain English: why keep a log at all</summary>
        <div className="pbody">
          <p>
            Without it you just have a number that mysteriously moved. With it you can go back and
            see that Systems overtook Industrial the day you read three real job posts, and then
            decide whether three job posts should have counted for that much.
          </p>
          <p>
            It also stops the page from quietly rewriting history. Old rows stay where they are even
            when a later one contradicts them.
          </p>
        </div>
      </details>
    </section>
  );
};

export default EvidenceLog;
