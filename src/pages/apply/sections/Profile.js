import React from 'react';
import Tip from '../../../components/Tooltip';
import { EMPTY_PROFILE, clearProfile, isProfileEmpty } from '../profile';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Percentile bands rather than raw numbers. admitProbability has always consumed
// percentiles, so nothing is lost by never asking for a GPA or a score — and what is
// gained is that even the local copy holds nothing that reads like a transcript.
const BANDS = [
  { value: 0.99, label: 'top 1%' },
  { value: 0.95, label: 'top 5%' },
  { value: 0.9, label: 'top 10%' },
  { value: 0.75, label: 'top 25%' },
  { value: 0.5, label: 'middle' },
  { value: 0.25, label: 'bottom half' },
];

const FIELDS = [
  { id: 'gpaPercentile', label: 'Grades', hint: 'against the admitted pool at your target schools' },
  { id: 'testPercentile', label: 'Test scores', hint: 'SAT or ACT, or leave blank if going test-optional' },
  { id: 'rigorPercentile', label: 'Course rigour', hint: 'how heavy your schedule is next to what is offered' },
  { id: 'activitiesPercentile', label: 'Activities and awards', hint: 'the part an essay cannot fake' },
];

// Radix Select has no null value, so "not set" is a sentinel option.
const NOT_SET = 'not-set';

export const Profile = ({ profile, setProfile }) => {
  const empty = isProfileEmpty(profile);

  const set = (id, value) => setProfile({ ...profile, [id]: value });

  return (
    <div className={empty ? 'ap-profile ap-profile-empty' : 'ap-profile'}>
      <div className="ap-profile-head">
        <p className="ap-profile-k">Your profile</p>
        <span className="ap-profile-local">stays on this device</span>
      </div>

      <p className="ap-profile-why">
        These four bands are what turn the numbers above from{' '}
        <em>these schools' admit rates</em> into <em>your odds</em>. They are stored in this
        browser and never sent to the database, because this page is going to be public and a
        transcript has no business in a public row. Bands, not scores: the model only ever used
        percentiles anyway.
      </p>

      <div className="ap-profile-grid">
        {FIELDS.map((field) => (
          <div className="ap-pfield" key={field.id}>
            <Label htmlFor={`pf-${field.id}`}>
              {field.label}
              <span className="ap-pfield-hint">{field.hint}</span>
            </Label>
            <Select
              value={profile[field.id] == null ? NOT_SET : String(profile[field.id])}
              onValueChange={(value) =>
                set(field.id, value === NOT_SET ? null : Number(value))
              }
            >
              <SelectTrigger id={`pf-${field.id}`} className="ap-pselect" aria-label={field.label}>
                <SelectValue placeholder="not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NOT_SET}>not set</SelectItem>
                {BANDS.map((band) => (
                  <SelectItem key={band.value} value={String(band.value)}>
                    {band.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="ap-pfield">
          <Label htmlFor="pf-residency">
            Residency
            <span className="ap-pfield-hint">in-state helps a lot at public universities</span>
          </Label>
          <Select
            value={profile.residency || 'in'}
            onValueChange={(value) => set('residency', value)}
          >
            <SelectTrigger id="pf-residency" className="ap-pselect" aria-label="Residency">
              <SelectValue placeholder="California resident" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">California resident</SelectItem>
              <SelectItem value="out">out of state everywhere</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="ap-profile-foot">
        {empty ? (
          <span className="ap-profile-note">
            Nothing set yet, so every probability on this page describes the schools rather than
            you, and the dial in S0 reads <Tip term="range">provisional</Tip>.
          </span>
        ) : (
          <span className="ap-profile-note">
            Odds are now yours. Clearing this browser's site data clears them, and they do not
            follow you to another device.
          </span>
        )}
        {!empty && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setProfile(clearProfile() || { ...EMPTY_PROFILE })}
          >
            clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default Profile;
