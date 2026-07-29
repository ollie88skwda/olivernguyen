import React from 'react';
import Tip from '../../../components/Tooltip';
import { EMPTY_PROFILE, clearProfile, isProfileEmpty } from '../profile';

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
            <label htmlFor={`pf-${field.id}`}>
              {field.label}
              <span>{field.hint}</span>
            </label>
            <select
              id={`pf-${field.id}`}
              className="ap-pselect"
              value={profile[field.id] == null ? '' : String(profile[field.id])}
              onChange={(event) =>
                set(field.id, event.target.value === '' ? null : Number(event.target.value))
              }
            >
              <option value="">not set</option>
              {BANDS.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="ap-pfield">
          <label htmlFor="pf-residency">
            Residency
            <span>in-state helps a lot at public universities</span>
          </label>
          <select
            id="pf-residency"
            className="ap-pselect"
            value={profile.residency || 'in'}
            onChange={(event) => set('residency', event.target.value)}
          >
            <option value="in">California resident</option>
            <option value="out">out of state everywhere</option>
          </select>
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
          <button
            type="button"
            className="ap-profile-clear"
            onClick={() => setProfile(clearProfile() || { ...EMPTY_PROFILE })}
          >
            clear
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
