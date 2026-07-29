import { create } from 'zustand';
import { apiFetch } from '../api';

export const usePassphraseStore = create((set) => ({
  checking: true,
  authed: false,
  error: null,
  apiMissing: false,

  async check() {
    set({ checking: true, apiMissing: false });
    try {
      await apiFetch('/api/auth/session');
      set({ authed: true, checking: false });
    } catch (err) {
      // A missing backend is not a failed login; sending someone to a passphrase
      // box they can never get past is the wrong error.
      set({ authed: false, checking: false, apiMissing: Boolean(err.noApi) });
    }
  },

  async login(passphrase) {
    set({ error: null });
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ passphrase }),
      });
      set({ authed: true });
      return true;
    } catch (err) {
      set({ error: err.status === 401 ? 'Not it. Try again.' : 'Something went wrong.' });
      return false;
    }
  },
}));

export default usePassphraseStore;
