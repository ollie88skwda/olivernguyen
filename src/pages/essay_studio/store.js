import { create } from 'zustand';
import { buildVault } from './vaultModel';

// Long enough that a normal typing pause does not fire a commit, short enough that
// walking away from the keyboard never loses a paragraph. Every save is a real git
// commit in the vault repo, so this is deliberately not keystroke-level.
export const AUTOSAVE_MS = 8000;

const FRONTMATTER_RE = /^(---\s*\n[\s\S]*?\n---\s*\n)([\s\S]*)$/;

export function splitFrontmatter(raw) {
  const match = String(raw ?? '').match(FRONTMATTER_RE);
  return match ? { prefix: match[1], body: match[2] } : { prefix: '', body: String(raw ?? '') };
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    const err = new Error('unauthenticated');
    err.status = 401;
    throw err;
  }

  // `react-scripts start` does not serve api/*, it serves index.html for every
  // path with a 200. Swallowing that as an empty object made the Desk render a
  // hero over nothing, so an HTML body is a hard error rather than "no files".
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const err = new Error(
      'The /api routes are not running. Start the site with `vercel dev` — `react-scripts start` cannot serve them.'
    );
    err.status = res.status;
    err.noApi = true;
    throw err;
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return body;
}

// Debounce handles live outside the store: they are timers, not rendered state.
const autosaveTimers = new Map();

function clearTimer(path) {
  const handle = autosaveTimers.get(path);
  if (handle) {
    clearTimeout(handle);
    autosaveTimers.delete(path);
  }
}

export const useStudioStore = create((set, get) => ({
  authed: false,
  checkingAuth: true,
  authError: null,

  files: [],
  vault: { schools: [], prompts: [], archive: [], guides: [] },
  loadingFiles: false,
  filesError: null,

  // path -> { raw, sha, frontmatter, loading, error }
  docs: {},
  // path -> { prefix, body, baseline, saving, conflict, error, savedAt }
  editors: {},

  creatingDraft: false,
  draftError: null,

  apiMissing: false,

  async init() {
    set({ checkingAuth: true, apiMissing: false });
    try {
      await get().fetchList();
      set({ authed: true, checkingAuth: false });
    } catch (err) {
      // A missing backend is not a failed login; sending someone to a
      // passphrase box they can never get past is the wrong error.
      set({ authed: false, checkingAuth: false, apiMissing: Boolean(err.noApi) });
    }
  },

  async login(passphrase) {
    set({ authError: null });
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ passphrase }) });
      await get().fetchList();
      set({ authed: true });
      return true;
    } catch (err) {
      set({ authError: err.status === 401 ? 'Not it. Try again.' : 'Something went wrong.' });
      return false;
    }
  },

  async fetchList() {
    set({ loadingFiles: true, filesError: null });
    try {
      const { files } = await api('/api/vault/list');
      set({ files, vault: buildVault(files), loadingFiles: false });
      return files;
    } catch (err) {
      set({ loadingFiles: false, filesError: err.message });
      throw err;
    }
  },

  // ── documents ───────────────────────────────────────────────────────────────

  // `force` refetches a document already in cache (used after a 409 conflict).
  async loadDoc(path, { force = false } = {}) {
    if (!path) return null;
    const existing = get().docs[path];
    if (existing && !force && !existing.error) return existing;

    set((state) => ({ docs: { ...state.docs, [path]: { ...existing, loading: true, error: null } } }));
    try {
      const data = await api(`/api/vault/read?path=${encodeURIComponent(path)}`);
      const split = splitFrontmatter(data.raw);
      set((state) => ({
        docs: {
          ...state.docs,
          [path]: { raw: data.raw, sha: data.sha, frontmatter: data.frontmatter || {}, loading: false, error: null },
        },
        editors: {
          ...state.editors,
          [path]: {
            prefix: split.prefix,
            body: split.body,
            baseline: split.body,
            saving: false,
            conflict: false,
            error: null,
            savedAt: state.editors[path] ? state.editors[path].savedAt : null,
          },
        },
      }));
      return get().docs[path];
    } catch (err) {
      set((state) => ({
        docs: { ...state.docs, [path]: { ...existing, loading: false, error: err.message } },
      }));
      return null;
    }
  },

  // Load several paths at once and tolerate the ones that do not exist
  // (a v1 folder has no Changelog.md, a final pass has no Counselor Notes.md).
  async loadDocs(paths) {
    await Promise.all(paths.filter(Boolean).map((path) => get().loadDoc(path)));
  },

  setBody(path, body) {
    set((state) => {
      const editor = state.editors[path];
      if (!editor) return {};
      return { editors: { ...state.editors, [path]: { ...editor, body, error: null } } };
    });
    get().scheduleAutosave(path);
  },

  isDirty(path) {
    const editor = get().editors[path];
    return Boolean(editor && editor.body !== editor.baseline);
  },

  dirtyPaths() {
    const { editors } = get();
    return Object.keys(editors).filter((path) => editors[path].body !== editors[path].baseline);
  },

  scheduleAutosave(path) {
    clearTimer(path);
    if (!get().isDirty(path)) return;
    // A file that lost a race will lose it again in 8 seconds. Once it is in
    // conflict, saving is the user's call: reload, or hit save deliberately.
    const editor = get().editors[path];
    if (editor && editor.conflict) return;
    autosaveTimers.set(
      path,
      setTimeout(() => {
        autosaveTimers.delete(path);
        if (get().isDirty(path)) get().saveDoc(path);
      }, AUTOSAVE_MS)
    );
  },

  async saveDoc(path) {
    clearTimer(path);
    const editor = get().editors[path];
    const doc = get().docs[path];
    if (!editor || !doc || editor.body === editor.baseline) return true;

    const attempted = editor.body;
    const raw = editor.prefix + attempted;
    set((state) => ({
      editors: { ...state.editors, [path]: { ...state.editors[path], saving: true, conflict: false, error: null } },
    }));

    try {
      const result = await api('/api/vault/save', {
        method: 'PUT',
        body: JSON.stringify({ path, content: raw, sha: doc.sha }),
      });

      // The server recomputes word_count into the frontmatter, so mirror it locally
      // instead of leaving the chips showing pre-save numbers.
      const frontmatter =
        typeof result.wordCount === 'number'
          ? { ...doc.frontmatter, word_count: result.wordCount }
          : doc.frontmatter;

      set((state) => ({
        docs: { ...state.docs, [path]: { ...state.docs[path], raw, sha: result.sha, frontmatter } },
        editors: {
          ...state.editors,
          [path]: {
            ...state.editors[path],
            // Baseline is what we sent, not the newest keystrokes: typing during a
            // save must stay dirty.
            baseline: attempted,
            saving: false,
            conflict: false,
            error: null,
            savedAt: Date.now(),
          },
        },
      }));
      get().fetchList();
      return true;
    } catch (err) {
      set((state) => ({
        editors: {
          ...state.editors,
          [path]: {
            ...state.editors[path],
            saving: false,
            conflict: err.status === 409,
            error: err.status === 409 ? null : err.message,
          },
        },
      }));
      return false;
    }
  },

  async saveAllDirty() {
    const paths = get().dirtyPaths();
    const results = await Promise.all(paths.map((path) => get().saveDoc(path)));
    return results.every(Boolean);
  },

  // Discard local edits and take whatever is in the repo now.
  async reloadDoc(path) {
    clearTimer(path);
    return get().loadDoc(path, { force: true });
  },

  async createNewDraft(draftPath) {
    if (!draftPath) return null;
    set({ creatingDraft: true, draftError: null });
    try {
      const result = await api('/api/vault/new-draft', {
        method: 'POST',
        body: JSON.stringify({ draftPath }),
      });
      if (!result.newFilePath) {
        set({ creatingDraft: false, draftError: 'The new draft came back without a path.' });
        return null;
      }
      set({ creatingDraft: false });
      await get().fetchList();
      return result.newFilePath;
    } catch (err) {
      set({ creatingDraft: false, draftError: err.message });
      return null;
    }
  },

  // Used by the seam between the Desk and the Writing Room so a hard reload of a
  // deep link still has frontmatter to render.
  frontmatterFor(path) {
    const doc = get().docs[path];
    if (doc && doc.frontmatter) return doc.frontmatter;
    const entry = get().files.find((file) => file.path === path);
    return (entry && entry.frontmatter) || {};
  },
}));

export default useStudioStore;
