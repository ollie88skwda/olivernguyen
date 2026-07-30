import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { saveDecision } from '../../lib/decisions';
import { createSeed } from './seed';
import { stripProfile } from './profile';

// Same shape and same failure behaviour as /major's store, against its own row. Kept as a
// sibling rather than a shared abstraction: the two pages have one table each and no
// shared state, so factoring this out would add indirection without removing a decision.
const TABLE = 'apply_decision';
const ROW_ID = 'v1';
const SAVE_DEBOUNCE_MS = 800;

let saveTimer = null;
let started = false;
// Realtime echoes our own upserts back to us. Every write stamps updated_at, so anything
// at or before our last write is our own and gets dropped.
let lastWriteAt = null;

async function writeDoc(doc) {
  const updatedAt = new Date().toISOString();
  // Belt and braces: the seed no longer produces a profile and the page never puts one
  // here, but this is the single choke point through which anything reaches the shared
  // row, so it is the right place to make the guarantee unconditional.
  const next = { ...stripProfile(doc), updatedAt };
  lastWriteAt = updatedAt;
  await saveDecision({ table: TABLE, id: ROW_ID, doc: next, updatedAt });
  return { doc: next, updatedAt };
}

export const useApplyStore = create((set, get) => ({
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
          // Rows written before profile.js existed can still carry personal fields.
          set({ doc: stripProfile(data.doc), loading: false, savedAt: data.updated_at });
          return;
        }

        const bootstrapped = await writeDoc(createSeed());
        set({ doc: bootstrapped.doc, loading: false, savedAt: bootstrapped.updatedAt });
      } catch (err) {
        console.warn('[apply] falling back to local seed:', err.message || err);
        set({ doc: createSeed(), loading: false, offline: true });
      }
    })();

    const channel = supabase
      .channel('apply_decision_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const row = payload.new;
          if (!row || !row.doc) return;
          if (lastWriteAt && row.updated_at && row.updated_at <= lastWriteAt) return;
          set({ doc: stripProfile(row.doc), savedAt: row.updated_at });
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
      console.warn('[apply] save failed, keeping local changes:', err.message || err);
      set({ offline: true });
    }
  },
}));

export default useApplyStore;
