// Where Ollie's own numbers live: this browser, and nowhere else.
//
// Everything else on /apply is stored in a Supabase row that the anon key can read, and
// that key ships in the JavaScript bundle. Schools, weights and filters are fine there.
// A GPA and a test score are not, and the Clerk migration deliberately makes /apply a
// public page, so the row is never going to become private.
//
// Rather than gate the page, the personal fields simply never enter the shared document.
// They live in localStorage, they are read at render time, and the store has no idea they
// exist. Nothing to leak, on any device but this one.
//
// The cost, stated plainly: the profile does not follow you between browsers or machines,
// and clearing site data loses it. That is the right trade for four numbers you can retype
// in a minute, and the wrong trade would be silent.

export const PROFILE_KEY = 'apply_profile';

// Only percentiles, never raw scores. admitProbability has always consumed percentiles,
// so storing "top 5%" instead of "1520" loses no accuracy in the model, and it means even
// the local copy holds nothing that reads like a transcript.
export const EMPTY_PROFILE = {
  gpaPercentile: null,
  testPercentile: null,
  rigorPercentile: null,
  activitiesPercentile: null,
  residency: 'in',
};

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

export function loadProfile() {
  if (!isBrowser()) return { ...EMPTY_PROFILE };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...EMPTY_PROFILE };
    const parsed = JSON.parse(raw);
    // Merge onto the defaults so a profile saved by an older version, missing a field
    // added since, still loads instead of throwing the whole thing away.
    return { ...EMPTY_PROFILE, ...parsed };
  } catch (err) {
    console.warn('[apply] could not read the local profile:', err.message || err);
    return { ...EMPTY_PROFILE };
  }
}

export function saveProfile(profile) {
  if (!isBrowser()) return profile;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[apply] could not save the local profile:', err.message || err);
  }
  return profile;
}

export function clearProfile() {
  if (isBrowser()) window.localStorage.removeItem(PROFILE_KEY);
  return { ...EMPTY_PROFILE };
}

export function isProfileEmpty(profile) {
  if (!profile) return true;
  return ['gpaPercentile', 'testPercentile', 'rigorPercentile', 'activitiesPercentile'].every(
    (key) => typeof profile[key] !== 'number'
  );
}

// Strips any personal fields out of a document loaded from Supabase.
//
// Earlier versions of the seed carried `profile` inside the doc, so a row written before
// this change can still have one. Removing it on read means the next save quietly cleans
// the stored row, and a doc that came from the shared store can never feed personal data
// back into the shared store.
export function stripProfile(doc) {
  if (!doc || !('profile' in doc)) return doc;
  const { profile, ...rest } = doc;
  return rest;
}
