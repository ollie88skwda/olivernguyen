# `/studio` — AI Essay Studio

Status: spec approved (this session), execution not yet started. Blocked on Phase 0 (Ollie-owned prerequisites — see below) before Phase 2 backend work can begin against a real repo.

Source: implements `~/Documents/College_Apps/future.md` in full (all 3 of its roadmap phases), with the open architecture questions in that doc resolved below.

---

## Context

`future.md` specs a private writing studio for Ollie's college essays (UC PIQs etc.), synced with the `College_Apps` Obsidian vault, with an AI co-pilot sidebar and a counselor-sharing portal. This doc locks the decisions future.md left open and adapts it to what the `olivernguyen` repo actually is.

**Corrections to future.md's assumptions, found by reading the real repo and vault:**

- **Not Next.js.** `olivernguyen` is Vite + React 18.3 + `react-router-dom` v5, deployed to Vercel (`vercel.json` → `framework: null`, `buildCommand: vite build`, `outputDirectory: dist`). The `next` package and `.next/` folder present in the repo are unused leftovers — nothing in `src/` imports from `next`. So "Next.js API routes" → **Vercel zero-config `/api/*.js` serverless functions**, which Vercel deploys regardless of frontend framework.
- **No auth or DB to reuse.** `@supabase/supabase-js` is used in `/pull` and `/major`, but only the anon key — no Supabase Auth, no session code anywhere in the repo. This feature needs real server-side secrets (GitHub PAT, Gemini key), so it's getting its own auth layer (see Locked decisions) rather than reusing Supabase for that.
- **`College_Apps` is not a git repo yet.** `git remote -v` there returns `fatal: not a git repository`. Cloud GitHub sync is impossible until it's pushed to a private GitHub repo with Obsidian Git installed and syncing. **This blocks everything past Phase 1 and is Ollie's to do, not mine** — it needs his GitHub account/credentials.
- **Vault structure verified live**, matches future.md exactly: `UC/1_Leadership/Draft v2 - 07.27/Leadership v2 - 07.27.md`, a `00_Overview.md` per prompt, `Counselor Notes.md` and `Changelog.md` inside v2+ draft folders, and a real `Draft v3 - 07.27 (Odyssey)` folder — an actual counselor-authored pass, exactly the case Module D's attribution banner exists to catch. Frontmatter schema, confirmed byte-for-byte from real files:
  ```yaml
  school: "University of California (UC)"
  prompt: "1. Leadership"
  version: "v1"
  date: "07/27"
  time: "05:25 PM"
  word_count: 246
  word_limit: 350
  status: "Drafting"   # also seen: "Pending Counselor Review"
  ```
- **`College_Apps/scripts/update_word_counts.py` already exists** and defines the vault's canonical word-counting algorithm (strips frontmatter, `#` headers, `>` blockquotes, fenced code, then regex-tokenizes `\b[A-Za-z0-9'-]+\b`). The Studio's save handler ports this exact algorithm to JS — inventing a different count would make the site and the local script disagree.
- **Design correction:** future.md calls for "dark mode glassmorphism." The site's actual theme (`src/styles/theme.css`) is light cream-paper/navy-ink (Big Shoulders / Martian Mono / Hanken Grotesk), and `/major`'s own spec doc commits to an "engineering-drawing" motif for exactly this kind of dense, structured UI. Studio follows the real site theme, not future.md's literal wording.

## Locked decisions

**Sync** = GitHub cloud-native (future.md's Option 5: Octokit + Obsidian Git, zero home-hardware dependency) · **Persistence** = the GitHub repo only, no database — share tokens live in a `_meta/shares.json` file committed to the vault repo like any other file · **Auth** = single passphrase → signed JWT httpOnly cookie (`jose` + `bcryptjs`; full OAuth is overkill for exactly one user) · **Editor** = CodeMirror 6 over TipTap (this round-trips markdown+YAML verbatim to git; it isn't rich text) · **AI** = Gemini only, no multi-provider abstraction (future.md names Gemini first; nothing calls for provider swapping) · **PDF export** = browser print view for v1, not a serverless PDF renderer (skips Puppeteer-on-Vercel weight) · **Routes** = `/studio` (Ollie, passphrase-gated), `/counselor-portal/:token` (public, read-only, no login) · **Not in the public sidebar nav** — direct-URL only, since it holds private application essays.

## Architecture

```
olivernguyen/
  api/
    _lib/
      github.js         Octokit client factory + owner/repo/path helpers (from env)
      auth.js            verify studio_session JWT cookie — used by every protected handler
      gemini.js           Gemini client factory
      wordcount.js         JS port of update_word_counts.py's prose-counting regex
    auth/
      login.js           POST passphrase -> bcrypt.compare -> sign JWT -> Set-Cookie
    vault/
      list.js            GET recursive git tree -> nested School/Prompt/Draft structure + per-file frontmatter
      read.js              GET one file -> raw body + parsed frontmatter (gray-matter) + blob sha
      save.js               PUT -> recompute word_count, commit via Octokit (needs current sha; 409 on stale sha)
      new-draft.js            POST -> clone latest draft into Draft v[X+1] - [MM.DD]/, seed Changelog.md
      share.js                 POST -> flip status to "Pending Counselor Review", write/rotate token in _meta/shares.json
    ai/
      critique.js         POST essay + 00_Overview.md + latest Counselor Notes.md -> Gemini -> JSON
    export/
      shared/[token].js    GET public -> resolve token via shares.json, return that one file read-only
      bundle.js              GET -> aggregate active UC PIQ prompts 1/2/3/6 into one print-ready doc

  src/pages/essay_studio/
    index.js             /studio route (lazy-loaded like /major), mounts AuthGate + layout
    store.js               zustand: current file, tree, sidebar/AI state
    AuthGate.js              passphrase form; calls /api/auth/login, re-prompts on 401
    ExportBundle.js           Module D: PIQ bundle print view (window.print)
    components/
      VaultNavigator.js       Module A: tree view, word-count/status badges, search/filter
      EssayEditor.js            Module B: CodeMirror pane (markdown + YAML highlighting)
      AiSidebar.js                Module B: inline action pins, reorder view (@codemirror/merge), compression button
      CounselorToggle.js           Module D: share switch + Odyssey/non-student-voice warning banner

  src/pages/counselor_portal/
    index.js              /counselor-portal/:token, public read-only, calls /api/export/shared/[token]
```

**Dependencies still needed** (check `package.json` before adding anything): `@codemirror/lang-yaml` and `@google/generative-ai`. The other dependencies used by this plan are already installed.

**New env vars** (`.env.example` to be added, real values set as Vercel project env vars — Ollie-owned): `GITHUB_TOKEN` (fine-grained PAT, contents read/write scoped to the `College_Apps` repo only), `GITHUB_OWNER`, `GITHUB_REPO`, `JWT_SECRET`, `AUTH_PASSPHRASE_HASH` (bcrypt hash, never plaintext), `GEMINI_API_KEY`.

## Data model

```js
// frontmatter (per essay .md file) — schema confirmed live, do not deviate
{
  school: string,
  prompt: string,        // e.g. "1. Leadership"
  version: string,        // "v1", "v2", "Final v3"
  date: string,           // "MM/DD"
  time: string,
  word_count: number,     // server-recomputed on every save via wordcount.js
  word_limit: number,
  status: "Drafting" | "Pending Counselor Review" | "Final",
}

// _meta/shares.json — the entire "database" for this feature
{
  [token]: { path: string, createdAt: string, expiresAt: string | null }
}

// AI critique response shape (api/ai/critique.js)
{
  pins: [{ anchor: string, comment: string, category: "tighten" | "clarity" | "reorder" | "voice" }],
  reorder: { order: number[], rationale: string } | null,
  compression: [{ original: string, tightened: string }],   // only populated when word_count is near/over word_limit
}
```

## UI — module breakdown

- **S0 — AuthGate**: single passphrase input, POSTs to `/api/auth/login`; on success sets cookie and mounts the rest of Studio. Any protected API call returning 401 tears down state and re-shows this.
- **S1 — VaultNavigator (Module A)**: collapsible tree (School → Prompt → Draft), each Draft row shows a word-count-vs-limit chip and a status badge (color keyed to `status`), free-text filter across school/prompt/status.
- **S2 — EssayEditor (Module B)**: CodeMirror pane, markdown+YAML syntax highlighting, Save button disabled until dirty, shows the 409-conflict toast inline above the editor when a save is rejected.
- **S3 — AiSidebar (Module B)**: collapsible right panel; "Critique" button calls `/api/ai/critique`, renders pins as clickable markers that scroll/highlight the anchor text in S2, a reorder diff view (via `@codemirror/merge`) when the model suggests one, and one-click compression swaps for word-limit overages.
- **S4 — CounselorToggle (Module D)**: switch that calls `/api/vault/share`; when the current draft's folder/file name matches `(Odyssey)`, an inline warning banner ("counselor-authored pass — review for your own voice before adopting") renders regardless of toggle state.
- **S5 — CounselorPortal**: separate public route, no chrome from the authed app, renders the one shared file read-only with its status badge.
- **S6 — ExportBundle**: print-styled view aggregating the active UC PIQ prompts (1/2/3/6), triggers `window.print()`; uses the site's existing typography (no new fonts).

## Out of scope for v1

Cloudflare Tunnel / Tailscale mesh VPN / custom Bun bridge daemon (future.md's Options 1–3) · multi-provider AI abstraction (OpenAI swap) · server-rendered PDF (Puppeteer) · real-time multi-device collaborative editing · adding Studio to the public site nav.

## Verification

- Phase 2–3: exercise each `/api/vault/*` route with `curl` against a real file in the (now-git) `College_Apps` repo before wiring any UI — confirm list/read/save/409-conflict behavior.
- Phase 4: confirm AI pins anchor to the correct quoted text in the editor, and that compression suggestions only appear when `word_count` is near/over `word_limit`.
- Phase 7 (final): full browser pass (Playwright/obscura) through the golden path — login → browse → open → edit → save → confirm the commit landed in GitHub → new-draft → AI critique → share toggle → counselor portal view → bundle export print — plus edge cases: stale-sha conflict, Odyssey banner, a prompt missing `Counselor Notes.md`.

## Execution phases

- **Phase 0 (Ollie-owned, blocking):** make `College_Apps` a private GitHub repo, install/configure Obsidian Git, create the fine-grained `GITHUB_TOKEN`, generate `JWT_SECRET`/`AUTH_PASSPHRASE_HASH`, get a `GEMINI_API_KEY`, set all as Vercel env vars.
- **Phase 1 (this step):** this spec doc + its lavish artifact.
- **Phase 2:** backend foundation (`api/_lib/*`, `api/auth/login.js`, `api/vault/*`, new deps, `.env.example`).
- **Phase 3:** Module A (`/studio` route, `AuthGate`, `VaultNavigator`, wired into `Routes.js`).
- **Phase 4:** Module B (`EssayEditor`, `AiSidebar`, `api/ai/critique.js`).
- **Phase 5:** Module C polish (`new-draft.js` + Changelog automation, conflict handling, word-count parity check).
- **Phase 6:** Module D (counselor portal, `share.js`, `_meta/shares.json`, Odyssey banner, `ExportBundle.js`).
- **Phase 7:** full verification pass (above).
