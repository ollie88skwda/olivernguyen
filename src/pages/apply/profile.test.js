import {
  EMPTY_PROFILE,
  PROFILE_KEY,
  isProfileEmpty,
  loadProfile,
  saveProfile,
  clearProfile,
  stripProfile,
} from './profile';

describe('local profile', () => {
  beforeEach(() => window.localStorage.clear());

  test('starts empty and reports itself as empty', () => {
    expect(loadProfile()).toEqual(EMPTY_PROFILE);
    expect(isProfileEmpty(loadProfile())).toBe(true);
  });

  test('round-trips through localStorage', () => {
    saveProfile({ ...EMPTY_PROFILE, gpaPercentile: 0.95 });

    expect(loadProfile().gpaPercentile).toBe(0.95);
    expect(isProfileEmpty(loadProfile())).toBe(false);
  });

  test('a profile saved by an older version still loads', () => {
    // Missing every field added since. Merging onto the defaults beats throwing it away.
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ gpaPercentile: 0.9 }));
    const loaded = loadProfile();

    expect(loaded.gpaPercentile).toBe(0.9);
    expect(loaded.testPercentile).toBeNull();
    expect(loaded.residency).toBe('in');
  });

  test('corrupt storage falls back to empty instead of throwing', () => {
    window.localStorage.setItem(PROFILE_KEY, '{not json');

    expect(loadProfile()).toEqual(EMPTY_PROFILE);
  });

  test('clear wipes the stored copy', () => {
    saveProfile({ ...EMPTY_PROFILE, testPercentile: 0.99 });
    clearProfile();

    expect(window.localStorage.getItem(PROFILE_KEY)).toBeNull();
    expect(loadProfile()).toEqual(EMPTY_PROFILE);
  });

  test('residency alone does not count as a filled profile', () => {
    // It defaults to 'in' for everyone, so treating it as data would make the page claim
    // the odds are personalised when nothing personal has been entered.
    expect(isProfileEmpty({ ...EMPTY_PROFILE, residency: 'out' })).toBe(true);
  });
});

describe('stripProfile', () => {
  test('removes a profile written by an earlier version of the seed', () => {
    const legacy = { schools: [], profile: { gpaPercentile: 0.99 } };

    expect(stripProfile(legacy)).toEqual({ schools: [] });
    expect('profile' in stripProfile(legacy)).toBe(false);
  });

  test('leaves a clean doc untouched and does not clone needlessly', () => {
    const clean = { schools: [] };

    expect(stripProfile(clean)).toBe(clean);
  });

  test('survives null', () => {
    expect(stripProfile(null)).toBeNull();
  });
});
