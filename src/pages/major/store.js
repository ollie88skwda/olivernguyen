import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { createSeed } from './seed';

const TABLE = 'major_decision';
const ROW_ID = 'v1';
const SAVE_DEBOUNCE_MS = 800;

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

let saveTimer = null;
let started = false;
// Realtime echoes our own upserts back to us. Every write stamps updated_at, so anything
// at or before our last write is our own and gets dropped.
let lastWriteAt = null;

async function writeDoc(doc) {
  const updatedAt = new Date().toISOString();
  const next = { ...doc, updatedAt };
  lastWriteAt = updatedAt;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, doc: next, updated_at: updatedAt });
  if (error) throw error;
  return { doc: next, updatedAt };
}

export const useMajorStore = create((set, get) => ({
  doc: null,
  loading: true,
  offline: false,
  savedAt: null,

  // Loads the row (bootstrapping it from the seed if absent) and opens the realtime
  // channel. Idempotent. Returns a cleanup function for the caller's useEffect.
  init() {
    if (started) return () => {};
    started = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select('doc, updated_at')
          .eq('id', ROW_ID)
          .maybeSingle();
        if (error) throw error;

        if (data && data.doc) {
          set({ doc: data.doc, loading: false, savedAt: data.updated_at });
          return;
        }

        const bootstrapped = await writeDoc(createSeed());
        set({ doc: bootstrapped.doc, loading: false, savedAt: bootstrapped.updatedAt });
      } catch (err) {
        console.warn('[major] falling back to local seed:', err.message || err);
        set({ doc: createSeed(), loading: false, offline: true });
      }
    })();

    const channel = supabase
      .channel('major_decision_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const row = payload.new;
          if (!row || !row.doc) return;
          if (lastWriteAt && row.updated_at && row.updated_at <= lastWriteAt) return;
          set({ doc: row.doc, savedAt: row.updated_at });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      started = false;
    };
  },

  // patcher is either a function (doc) => nextDoc or a partial doc to shallow-merge.
  // Local state updates immediately; the Supabase write is debounced.
  updateDoc(patcher) {
    const current = get().doc;
    if (!current) return;
    const next =
      typeof patcher === 'function' ? patcher(current) : { ...current, ...patcher };
    set({ doc: next });

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get().save(), SAVE_DEBOUNCE_MS);
  },

  async save() {
    clearTimeout(saveTimer);
    const doc = get().doc;
    if (!doc) return;
    try {
      const written = await writeDoc(doc);
      set({ doc: written.doc, savedAt: written.updatedAt, offline: false });
    } catch (err) {
      console.warn('[major] save failed, keeping local changes:', err.message || err);
      set({ offline: true });
    }
  },
}));

export default useMajorStore;
