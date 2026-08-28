import React, { useState } from 'react';
import { MonoLabel, SectionHead } from '@/components/brand';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Tip from '../../../components/Tooltip';

const LIKELIHOODS = [
  { id: 'low', label: 'Long shot' },
  { id: 'med', label: 'Could happen' },
  { id: 'high', label: 'Likely' },
];

const likelihoodLabel = (id) => {
  const found = LIKELIHOODS.find((l) => l.id === id);
  return found ? found.label : id;
};

const AddEntry = ({ alternatives, updateDoc }) => {
  const [alternative, setAlternative] = useState(alternatives[0] ? alternatives[0].id : '');
  const [failureMode, setFailureMode] = useState('');
  const [likelihood, setLikelihood] = useState('med');
  const [mitigation, setMitigation] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const failure = failureMode.trim();
    if (!failure || !alternative) return;
    updateDoc((current) => ({
      ...current,
      premortem: [
        ...current.premortem,
        {
          id: `pm-${Date.now().toString(36)}`,
          alternative,
          failureMode: failure,
          likelihood,
          mitigation: mitigation.trim(),
        },
      ],
    }));
    setFailureMode('');
    setMitigation('');
    setLikelihood('med');
  };

  return (
    <form className="mjc-form" onSubmit={submit}>
      <MonoLabel tone="muted" className="mjc-form-t">
        Write a way this goes wrong
      </MonoLabel>

      <div className="mjc-form-row">
        <div className="mjc-field">
          <Label htmlFor="pm-alternative">You picked</Label>
          <Select value={alternative} onValueChange={setAlternative}>
            <SelectTrigger id="pm-alternative">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {alternatives.map((alt) => (
                <SelectItem value={alt.id} key={alt.id}>
                  {alt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mjc-field">
          <Label htmlFor="pm-likelihood">How likely</Label>
          <Select value={likelihood} onValueChange={setLikelihood}>
            <SelectTrigger id="pm-likelihood">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIKELIHOODS.map((option) => (
                <SelectItem value={option.id} key={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mjc-field">
        <Label htmlFor="pm-failure">What went wrong</Label>
        <Textarea
          id="pm-failure"
          value={failureMode}
          placeholder="I picked it for the money and hated every day of it"
          onChange={(event) => setFailureMode(event.target.value)}
        />
      </div>

      <div className="mjc-field">
        <Label htmlFor="pm-mitigation">What would have stopped it</Label>
        <Textarea
          id="pm-mitigation"
          value={mitigation}
          placeholder="Sit in on one class before the deadline"
          onChange={(event) => setMitigation(event.target.value)}
        />
      </div>

      <Button type="submit" disabled={!failureMode.trim()}>
        Add to the pre-mortem
      </Button>
    </form>
  );
};

export const PreMortem = ({ doc, editing, updateDoc }) => {
  const entries = doc.premortem || [];

  const labelOf = (id) => {
    const found = doc.alternatives.find((alt) => alt.id === id);
    return found ? found.label : id;
  };

  return (
    <section id="premortem" className="mj-sec">
      <SectionHead eyebrow="S6 / Pre-mortem" title="It Is 2032 And This Was Wrong" />

      <p className="mj-hint">
        A <Tip term="premortem">pre-mortem</Tip> is the one part of this page the arithmetic cannot
        do for you. Assume the choice already went badly, then write down why. It catches the risks
        no column ever captures, because you get to say you would resent it instead of scoring it
        out of ten.
      </p>

      {entries.length === 0 ? (
        <Card className="mjc-empty">
          <p className="mjc-empty-h">Nothing written down yet.</p>
          <p>
            Start with the one that would actually sting. You are four years in, you tell someone
            you regret it, and the sentence after that is the entry.
          </p>
          {!editing && (
            <MonoLabel tone="accent" className="mjc-empty-cue">
              Turn on EDIT to add the first one.
            </MonoLabel>
          )}
        </Card>
      ) : (
        <div className="mjc-notes">
          {entries.map((entry, index) => (
            <Card key={entry.id} className="mjc-note">
              <div className="mjc-note-head">
                <span className="mjc-note-alt">{labelOf(entry.alternative)}</span>
                <Badge
                  tone={entry.likelihood === 'high' ? 'warning' : 'neutral'}
                  className={`mjc-lik mjc-lik-${entry.likelihood}`}
                >
                  {likelihoodLabel(entry.likelihood)}
                </Badge>
              </div>
              <p className="mjc-note-fail">{entry.failureMode}</p>
              {entry.mitigation && (
                <p className="mjc-note-mit">
                  <span>What would stop it</span>
                  {entry.mitigation}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {editing && <AddEntry alternatives={doc.alternatives} updateDoc={updateDoc} />}

      <details className="plain">
        <summary>Plain English: why imagine failing on purpose</summary>
        <div className="pbody">
          <p>
            Asking whether a plan could fail gets you a shrug. Telling yourself it already failed and
            asking why gets you real answers, because your brain will happily explain something that
            has already happened.
          </p>
          <p>
            Nothing here feeds the score. It sits next to the score on purpose. If the winning major
            has a failure mode you read and immediately believe, that is worth more than a two point
            lead on the board.
          </p>
        </div>
      </details>
    </section>
  );
};

export default PreMortem;
