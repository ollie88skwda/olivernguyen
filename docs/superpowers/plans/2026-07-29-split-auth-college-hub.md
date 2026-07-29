# Split Auth + College Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put `/studio` behind Clerk, `/major` and `/apply` behind a shared server-verified passphrase, and add a public `/college` hub reachable from the sidebar.

**Architecture:** Two independent gates. `api/_lib/auth.mjs` keeps its `requireSession(req, res) → boolean` signature but swaps jose-JWT verification for Clerk `verifyToken` plus a user-ID allowlist, so the five vault/exemplar routes never change. The passphrase moves to its own `api/_lib/passphrase.mjs` with its own `gate_session` cookie and serves only the `/major` and `/apply` page gates. Three near-identical client gate components (`mj-gate`, `ap-gate`, `es-gate`) collapse into one shared `PassphraseGate`.

**Tech Stack:** Create React App 5 (webpack 5), React 18, `react-router-dom` **v5** (uses `useHistory`/`Redirect`/`Switch`, NOT v6 `useNavigate`/`Routes`), zustand, Vercel Node serverless functions (`api/*.mjs`, default-exported `handler(req, res)`), `@clerk/react@6.12.9`, `@clerk/backend@3.14.0`, `jose`, `bcryptjs`.

Spec: `docs/superpowers/specs/2026-07-29-auth-college-hub-design.html`

## Global Constraints

- **This GitHub repo is public.** The passphrase and its bcrypt hash must never appear in any tracked file. Never write the literal passphrase into source, tests, comments, commit messages, or docs.
- **`react-router-dom` is v5.** Use `useHistory()`, `<Redirect>`, `<Switch>`, `useLocation()`. `useNavigate` and `<Routes>` do not exist here.
- **`@clerk/react` is v6, not `@clerk/clerk-react`.** `<SignedIn>` / `<SignedOut>` do not exist. Available: `ClerkProvider`, `Show`, `SignIn`, `UserButton`, `useAuth`, `useUser`, `RedirectToSignIn`.
- **`routerPush` and `routerReplace` must be passed together or not at all** — the type is a union that forbids one without the other.
- **`verifyToken` from `@clerk/backend@3.14.0` returns `Promise<JwtPayload>` and THROWS on failure.** It does not return `{ data, errors }` — that shape belongs to the internal `verifyJwt`. Use `try`/`catch`.
- **CRA env prefix is `REACT_APP_`.** Do not pass `publishableKey` to `ClerkProvider` as a prop; it is read from `REACT_APP_CLERK_PUBLISHABLE_KEY` automatically.
- **`react-scripts start` cannot serve `/api/*`** — it answers every path with `index.html` at status 200. All manual testing uses `vercel dev`.
- **Package manager is yarn 1.** `yarn` is not on PATH; invoke as `npx -y yarn@1.22.22 <cmd>`.
- **Match existing style:** single quotes in `src/`, double quotes in `api/`, no semicolon-free style, comments explain *why* not *what*.
- **Copy placeholders:** all human-facing prose on `/college` ships as literal `[…]` markers. Do not invent Oliver's words.

---

## File Structure

**New — server**
- `api/_lib/passphrase.mjs` — sign/verify the `gate_session` cookie. Owns `parseCookies`.
- `api/auth/session.mjs` — `GET` probe returning 200 or 401 for the passphrase gate.

**New — client**
- `src/auth/api.js` — shared `fetch` wrapper (same-origin credentials, 401 detection, HTML-body detection).
- `src/auth/ApiMissing.js` — the "run `vercel dev`" explainer, lifted out of `essay_studio/index.js`.
- `src/auth/passphrase/store.js` — zustand store: `checking`, `authed`, `error`, `apiMissing`, `check()`, `login()`.
- `src/auth/passphrase/PassphraseGate.js` — one passphrase form, `label` prop.
- `src/auth/RequirePassphrase.js` — three-state wrapper for `/major` and `/apply`.
- `src/auth/RequireClerk.js` — key-absent-safe wrapper for `/studio`. Exports `CLERK_KEY`.
- `src/auth/BackLink.js` — "← College" link used by all three tool pages.
- `src/pages/sign_in.js` — themed `<SignIn />`.
- `src/pages/college/index.js` — the hub.
- `src/styles/Gate.css` — `.gate*` rules, consolidated.
- `src/styles/College.css` — hub styles.

**Rewritten**
- `api/_lib/auth.mjs` — Clerk `verifyToken` + allowlist, same export name and signature.

**Modified**
- `api/auth/login.mjs` — import swap only.
- `src/Routes.js`, `src/pages/top_bar.js`, `src/pages/major/index.js`, `src/pages/apply/index.js`, `src/pages/essay_studio/index.js`, `src/pages/essay_studio/store.js`, `src/styles/Major.css`, `src/styles/Apply.css`, `src/styles/EssayStudio.css`.

**Deleted**
- `src/pages/essay_studio/AuthGate.js`

**Untouched (deliberately)**
- `api/vault/list.mjs`, `api/vault/read.mjs`, `api/vault/save.mjs`, `api/vault/new-draft.mjs`, `api/exemplars/list.mjs` — all five call `requireSession(req, res)`; preserving that signature is why they need no edit.

---

## Task 1: Split the server auth libs

Creates the passphrase lib and its probe endpoint. `api/_lib/auth.mjs` is left on jose in this task so `/studio` keeps working; Task 6 swaps it.

**Files:**
- Create: `api/_lib/passphrase.mjs`
- Create: `api/auth/session.mjs`
- Modify: `api/auth/login.mjs:2` (import line only)

**Interfaces:**
- Consumes: nothing.
- Produces: `signGate(): Promise<string>`, `gateCookie(token: string): string`, `requireGate(req, res): Promise<boolean>`, `parseCookies(header?: string): Record<string,string>` — all from `api/_lib/passphrase.mjs`. Endpoint `GET /api/auth/session` → `200 {ok:true}` or `401 {error}`.

- [ ] **Step 1: Create `api/_lib/passphrase.mjs`**

This is the current `api/_lib/auth.mjs` logic with the cookie renamed. `studio_session` becomes `gate_session` because after Task 6 this cookie no longer has anything to do with the studio.

```js
import { jwtVerify, SignJWT } from "jose";

// This cookie gates /major and /apply only. /studio is on Clerk, so the old
// `studio_session` name would be actively misleading.
const COOKIE = "gate_session";
const MAX_AGE = 7 * 24 * 60 * 60;

const secretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export async function signGate() {
  return new SignJWT({ role: "gate" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export function gateCookie(token) {
  const parts = [
    `${COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${MAX_AGE}`,
  ];
  if (process.env.VERCEL_ENV !== "development") parts.splice(2, 0, "Secure");
  return parts.join("; ");
}

export async function requireGate(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  try {
    await jwtVerify(token, secretKey());
    return true;
  } catch {
    res.status(401).json({ error: "Session expired" });
    return false;
  }
}
```

- [ ] **Step 2: Create `api/auth/session.mjs`**

`/major` and `/apply` have no data endpoint to probe auth with — they talk to Supabase straight from the browser. This is that probe.

```js
import { requireGate } from "../_lib/passphrase.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireGate(req, res))) return;
  res.status(200).json({ ok: true });
}
```

- [ ] **Step 3: Point `api/auth/login.mjs` at the new lib**

Change only the import and the two call sites. The bcrypt logic and all error messages stay exactly as they are.

Replace line 2:
```js
import { signSession, sessionCookie } from "../_lib/auth.mjs";
```
with:
```js
import { signGate, gateCookie } from "../_lib/passphrase.mjs";
```

Then in the handler body replace:
```js
  const token = await signSession();
  res.setHeader("Set-Cookie", sessionCookie(token));
```
with:
```js
  const token = await signGate();
  res.setHeader("Set-Cookie", gateCookie(token));
```

- [ ] **Step 4: Verify the endpoints against a running server**

Start `vercel dev` in a background shell, then:

```bash
# no cookie -> 401
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/auth/session
# expect: 401

# wrong passphrase -> 401
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"passphrase":"definitely-wrong"}' \
  -o /dev/null -w '%{http_code}\n'
# expect: 401

# correct passphrase -> 200 and a gate_session cookie
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"passphrase\":\"$GATE_PASSPHRASE\"}" -c /tmp/cj.txt -o /dev/null -w '%{http_code}\n'
grep -c gate_session /tmp/cj.txt
# expect: 200 then 1

# with cookie -> 200
curl -s -b /tmp/cj.txt -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/auth/session
# expect: 200
```

Export `GATE_PASSPHRASE` in your shell first so the passphrase never lands in a tracked file or in this plan. `rm /tmp/cj.txt` afterwards.

- [ ] **Step 5: Confirm the vault fails closed during the transition**

`login.mjs` now issues `gate_session`, while `api/_lib/auth.mjs` still expects `studio_session`. So `/studio`'s passphrase login is deliberately broken from here until Task 7 replaces it with Clerk. The property that matters is that this breaks *closed*:

```bash
# with a freshly issued gate cookie -> still 401, the gate cookie is not a vault key
curl -s -b /tmp/cj.txt -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/vault/list
# with no cookie -> 401
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/vault/list
```
Expected: `401` both times. Anything else means the vault opened up mid-migration — stop.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/passphrase.mjs api/auth/session.mjs api/auth/login.mjs
git commit -m "Split passphrase auth into its own lib and cookie

The passphrase will gate /major and /apply while /studio moves to Clerk,
so it gets its own gate_session cookie rather than sharing studio_session.
Adds GET /api/auth/session because those two pages have no data endpoint
to probe auth with."
```

---

## Task 2: Shared client gate

One `PassphraseGate` replaces three near-identical copies (`mj-gate`, `ap-gate`, `es-gate`).

**Files:**
- Create: `src/auth/api.js`, `src/auth/ApiMissing.js`, `src/auth/passphrase/store.js`, `src/auth/passphrase/PassphraseGate.js`, `src/auth/RequirePassphrase.js`, `src/styles/Gate.css`
- Test: `src/auth/RequirePassphrase.test.js`

**Interfaces:**
- Consumes: `GET /api/auth/session`, `POST /api/auth/login` from Task 1.
- Produces: `usePassphraseStore` (zustand, fields `checking`, `authed`, `error`, `apiMissing`, actions `check()`, `login(passphrase): Promise<boolean>`); `<PassphraseGate label={string} />`; `<RequirePassphrase label={string}>{children}</RequirePassphrase>`; `<ApiMissing route={string} />`; `apiFetch(path, options): Promise<object>`.

- [ ] **Step 1: Write the failing test**

Create `src/auth/RequirePassphrase.test.js`. The store is mocked so this is a pure render test of the three states.

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import RequirePassphrase from './RequirePassphrase';
import usePassphraseStore from './passphrase/store';

jest.mock('./passphrase/store');

const mockStore = (state) => {
  usePassphraseStore.mockImplementation((selector) =>
    selector({ checking: false, authed: false, error: null, apiMissing: false, check: jest.fn(), login: jest.fn(), ...state })
  );
};

describe('RequirePassphrase', () => {
  it('hides children while the session is still being checked', () => {
    mockStore({ checking: true });
    render(<RequirePassphrase label="Route /major · private"><p>secret</p></RequirePassphrase>);
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Passphrase')).not.toBeInTheDocument();
  });

  it('shows the gate when the check finished and no session exists', () => {
    mockStore({ checking: false, authed: false });
    render(<RequirePassphrase label="Route /major · private"><p>secret</p></RequirePassphrase>);
    expect(screen.getByLabelText('Passphrase')).toBeInTheDocument();
    expect(screen.getByText('Route /major · private')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('explains the missing backend instead of showing an unopenable gate', () => {
    mockStore({ checking: false, apiMissing: true });
    render(<RequirePassphrase label="Route /major · private"><p>secret</p></RequirePassphrase>);
    expect(screen.getByText(/vercel dev/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Passphrase')).not.toBeInTheDocument();
  });

  it('renders children once authenticated', () => {
    mockStore({ checking: false, authed: true });
    render(<RequirePassphrase label="Route /major · private"><p>secret</p></RequirePassphrase>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `CI=true npx react-scripts test --testPathPattern RequirePassphrase`
Expected: FAIL — `Cannot find module './RequirePassphrase'`.

- [ ] **Step 3: Create `src/auth/api.js`**

Lifted from the `api()` helper currently inside `src/pages/essay_studio/store.js`. Extracted because two stores now need it.

```js
// Shared fetch wrapper for the /api routes. `react-scripts start` does not serve
// api/* — it answers every path with index.html at 200 — so an HTML body is a hard
// error rather than an empty result, and callers can tell "no backend" apart from
// "not logged in".
export async function apiFetch(path, options = {}) {
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

export default apiFetch;
```

- [ ] **Step 4: Create `src/auth/ApiMissing.js`**

Moved out of `src/pages/essay_studio/index.js` so `/major` and `/apply` get the same explanation.

```jsx
import React from 'react';

// Only reachable in local development: `react-scripts start` answers /api/* with
// index.html, so no gate can ever open. Say that plainly instead of showing a
// passphrase box that will never accept anything.
export const ApiMissing = ({ route }) => (
  <main className="gate">
    <div className="grain" aria-hidden="true" />
    <div className="gate-card">
      <p className="gate-eyebrow">{route} · backend not running</p>
      <h1 className="gate-title">No API</h1>
      <p className="gate-hint">
        The <code>/api/*</code> routes are Vercel serverless functions.{' '}
        <code>react-scripts start</code> does not run them — it answers every path with{' '}
        <code>index.html</code>, so the gate can never open.
      </p>
      <p className="gate-hint">
        Start the site with <code>vercel dev</code> instead. It serves the same React app and
        runs <code>api/</code> alongside it, using the values already in <code>.env.local</code>.
      </p>
    </div>
  </main>
);

export default ApiMissing;
```

- [ ] **Step 5: Create `src/auth/passphrase/store.js`**

```js
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
```

- [ ] **Step 6: Create `src/auth/passphrase/PassphraseGate.js`**

Markup follows the existing `mj-gate` form so the look is unchanged; classes are renamed `.gate*` because it is no longer per-page.

```jsx
import React, { useState } from 'react';
import usePassphraseStore from './store';

export const PassphraseGate = ({ label }) => {
  const login = usePassphraseStore((s) => s.login);
  const error = usePassphraseStore((s) => s.error);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    await login(value.trim());
    setSubmitting(false);
  };

  return (
    <main className="gate">
      <div className="grain" aria-hidden="true" />
      <form className={error ? 'gate-card gate-wrong' : 'gate-card'} onSubmit={submit}>
        <p className="gate-eyebrow">{label}</p>
        <h1 className="gate-title">Passphrase</h1>
        <input
          className="gate-in"
          type="password"
          value={value}
          autoFocus
          autoComplete="off"
          aria-label="Passphrase"
          aria-invalid={!!error}
          onChange={(event) => setValue(event.target.value)}
        />
        <button className="gate-go" type="submit" disabled={submitting}>
          {submitting ? 'Checking…' : 'Enter'}
        </button>
        <p className="gate-err" role="alert">
          {error || ''}
        </p>
      </form>
    </main>
  );
};

export default PassphraseGate;
```

- [ ] **Step 7: Create `src/auth/RequirePassphrase.js`**

```jsx
import React, { useEffect } from 'react';
import usePassphraseStore from './passphrase/store';
import PassphraseGate from './passphrase/PassphraseGate';
import ApiMissing from './ApiMissing';
import '../styles/Gate.css';

export const RequirePassphrase = ({ label, route, children }) => {
  const checking = usePassphraseStore((s) => s.checking);
  const authed = usePassphraseStore((s) => s.authed);
  const apiMissing = usePassphraseStore((s) => s.apiMissing);
  const check = usePassphraseStore((s) => s.check);

  useEffect(() => {
    check();
  }, [check]);

  // Cream rather than a spinner: the gate and the page behind it share this
  // background, so a signed-in reload shows no flash of anything.
  if (checking) return <div style={{ minHeight: '100dvh', background: '#f1e9d4' }} />;
  if (apiMissing) return <ApiMissing route={route || label} />;
  if (!authed) return <PassphraseGate label={label} />;
  return children;
};

export default RequirePassphrase;
```

- [ ] **Step 8: Create `src/styles/Gate.css`**

Copy the `.mj-gate*` block from `src/styles/Major.css` (lines ~565–655 plus the `.mj-gate-wrong` keyframe reference near line 671) and rename every `mj-gate` to `gate`. Add the two rules the shared component needs that the per-page copies lacked:

```css
.gate-go:disabled {
  opacity: 0.5;
  cursor: default;
}

.gate-hint {
  font-family: var(--font-sans);
  font-size: 0.92rem;
  color: var(--text-muted);
  margin: 12px 0 0;
  max-width: 52ch;
}
```

Keep the existing `.mj-gate*` rules in `Major.css` for now — Task 3 deletes them once nothing references them.

- [ ] **Step 9: Run the tests to verify they pass**

Run: `CI=true npx react-scripts test --testPathPattern RequirePassphrase`
Expected: PASS, 4 tests.

- [ ] **Step 10: Commit**

```bash
git add src/auth src/styles/Gate.css
git commit -m "Add shared passphrase gate

Collapses three near-identical gate components into one. The store checks
GET /api/auth/session on mount so a valid cookie skips the form, and a
missing backend is reported as such rather than as a failed login."
```

---

## Task 3: Gate `/major` and `/apply`, delete the go-fish gates

**Files:**
- Modify: `src/Routes.js`, `src/pages/major/index.js`, `src/pages/apply/index.js`, `src/styles/Major.css`, `src/styles/Apply.css`
- Create: `src/auth/BackLink.js`

**Interfaces:**
- Consumes: `<RequirePassphrase label route>` from Task 2.
- Produces: `<BackLink />` — a "← College" anchor used by all three tool pages.

- [ ] **Step 1: Create `src/auth/BackLink.js`**

The TopBar is deliberately not mounted on the tool pages: it renders its own fixed bar and its own `.grain` overlay, and `/major` and `/apply` already render a `.grain`. This is the minimal nav affordance instead.

```jsx
import React from 'react';

export const BackLink = () => (
  <a className="back-link" href="/college">
    ← College
  </a>
);

export default BackLink;
```

Add to `src/styles/Gate.css`:

```css
.back-link {
  position: fixed;
  top: 18px;
  left: 20px;
  z-index: 40;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-faint);
  text-decoration: none;
  padding: 6px 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.back-link:hover {
  color: var(--text);
  border-color: var(--text-faint);
}
```

- [ ] **Step 2: Strip the gate out of `src/pages/major/index.js`**

Delete these, in order:
1. Lines 31–34 — the comment block plus `const GATE_KEY = 'major_gate';` and `const GATE_PASS = 'go-fish';`
2. The whole `const Gate = ({ onPass }) => { ... };` component (starts ~line 91, ends at its closing `};` before `export const Major`)
3. In `export const Major`, the line `const [unlocked, setUnlocked] = useState(() => localStorage.getItem(GATE_KEY) === 'true');`
4. The `if (!unlocked) return <Gate onPass={() => setUnlocked(true)} />;` line

Then add the back-link. Import at the top:
```jsx
import BackLink from '../../auth/BackLink';
```
and render it as the first child of the page's root element, immediately before the existing `<div className="grain" aria-hidden="true" />`:
```jsx
<BackLink />
```

Finally, remove `useState` from the React import **only if** no other `useState` call remains in the file — check with `grep -c 'useState' src/pages/major/index.js` after the edits. Leave it if others remain.

- [ ] **Step 3: Strip the gate out of `src/pages/apply/index.js`**

Same four deletions, at this file's own line numbers:
1. Lines 23–27 — comment plus `GATE_KEY = 'apply_gate'` and `GATE_PASS = 'go-fish'`
2. The `const Gate = ({ onPass }) => { ... };` component (starts ~line 86)
3. `const [unlocked, setUnlocked] = useState(() => typeof window !== 'undefined' && localStorage.getItem(GATE_KEY) === 'true');` (~line 132)
4. `if (!unlocked) return <Gate onPass={() => setUnlocked(true)} />;` (line 152)

Add the same `BackLink` import and render it in the same position.

- [ ] **Step 4: Delete the orphaned gate CSS**

- `src/styles/Major.css` — remove lines ~565–655 (the `.mj-gate*` block, starting at the `/* Passphrase gate. */` comment) and the `.mj-gate-wrong` rule inside the media query at ~671.
- `src/styles/Apply.css` — remove lines 13–85 (the `.ap-gate*` block) and the `.ap-gate-wrong` rule inside the media query at ~804.

Verify nothing still references them:
```bash
grep -rn "mj-gate\|ap-gate" src/ || echo "clean"
```
Expected: `clean`.

- [ ] **Step 5: Wrap the routes in `src/Routes.js`**

Add the import:
```jsx
import RequirePassphrase from "./auth/RequirePassphrase";
```

Replace the `/major` route with:
```jsx
<Route path="/major">
  <RequirePassphrase label="Route /major · private" route="/major">
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
      <Major />
    </Suspense>
  </RequirePassphrase>
</Route>
```

and `/apply` with:
```jsx
<Route path="/apply">
  <RequirePassphrase label="Route /apply · private" route="/apply">
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
      <Apply />
    </Suspense>
  </RequirePassphrase>
</Route>
```

- [ ] **Step 6: Verify the passphrase is not in the bundle**

```bash
npx -y yarn@1.22.22 build
grep -ri "go-fish" build/ src/ || echo "go-fish gone"
grep -ri "$GATE_PASSPHRASE" build/ src/ api/ docs/ || echo "passphrase not in bundle or tree"
```
Expected: both echo lines print. This is the check the entire server-side decision rests on — if it fails, stop and fix before continuing.

- [ ] **Step 7: E2E verify in a real browser**

With `vercel dev` running, using the Playwright MCP:
1. Navigate to `/major`. Expect the gate, eyebrow reading `Route /major · private`.
2. `localStorage.clear()` in the console, reload. Expect the gate again — this proves the old localStorage bypass is gone.
3. Enter a wrong passphrase. Expect "Not it. Try again."
4. Enter the correct one. Expect the board to render and the Supabase doc to load.
5. Navigate to `/apply`. Expect no second prompt — the cookie is shared.
6. Screenshot both pages. Check the back-link does not overlap page chrome at 1440px and at 390px width.

- [ ] **Step 8: Commit**

```bash
git add src/Routes.js src/pages/major/index.js src/pages/apply/index.js \
        src/styles/Major.css src/styles/Apply.css src/styles/Gate.css src/auth/BackLink.js
git commit -m "Gate /major and /apply on the server-verified passphrase

Replaces the two hardcoded go-fish gates, whose passphrase shipped in the
bundle, with the shared gate. Both pages share one cookie, so signing in on
one opens the other."
```

---

## Task 4: The `/college` hub

**Files:**
- Create: `src/pages/college/index.js`, `src/styles/College.css`
- Modify: `src/Routes.js`

**Interfaces:**
- Consumes: `TopBar` from `src/pages/top_bar.js`.
- Produces: route `/college`.

- [ ] **Step 1: Create `src/styles/College.css`**

```css
.cl-page {
  min-height: 100dvh;
  background: var(--bg-base);
  color: var(--text);
  padding: 120px 24px 96px;
}

.cl-inner {
  max-width: var(--maxw);
  margin: 0 auto;
}

.cl-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0 0 18px;
}

.cl-title {
  font-family: var(--font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(2.6rem, 9vw, 5rem);
  line-height: 0.88;
  margin: 0;
}

.cl-rule {
  height: 2px;
  width: 104px;
  background: rgba(18, 34, 49, 0.3);
  margin: 26px 0 0;
}

.cl-lede {
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 56ch;
  margin: 26px 0 0;
}

.cl-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  margin: 64px 0 0;
}

.cl-card {
  background: var(--surface);
  padding: 28px 24px 32px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: background 160ms var(--ease-out);
}

.cl-card:hover {
  background: var(--surface-2);
}

.cl-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cl-card-name {
  font-family: var(--font-display);
  font-weight: 800;
  text-transform: uppercase;
  font-size: 1.5rem;
  letter-spacing: 0.01em;
  margin: 0;
}

.cl-lock {
  font-family: var(--font-mono);
  font-size: 0.52rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-faint);
  border: 1px solid var(--border);
  padding: 3px 7px;
  white-space: nowrap;
}

.cl-card-desc {
  font-size: 0.94rem;
  color: var(--text-muted);
  margin: 0;
}

.cl-card-route {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  color: var(--text-faint);
  margin: 6px 0 0;
}

@media (max-width: 640px) {
  .cl-page {
    padding: 96px 18px 72px;
  }
}
```

- [ ] **Step 2: Create `src/pages/college/index.js`**

Every string a human reads is a literal `[…]` placeholder. Oliver writes his own copy; do not invent any.

```jsx
import React from 'react';
import { TopBar } from '../top_bar';
import '../../styles/College.css';

// Copy is deliberately unwritten. Oliver supplies the headline and the three
// descriptions; shipping invented prose under his name is worse than a visible gap.
const TOOLS = [
  {
    name: 'Major',
    route: '/major',
    gate: 'Passphrase',
    desc: '[ one line on what /major is for ]',
  },
  {
    name: 'Apply',
    route: '/apply',
    gate: 'Passphrase',
    desc: '[ one line on what /apply is for ]',
  },
  {
    name: 'Studio',
    route: '/studio',
    gate: 'Sign in',
    desc: '[ one line on what /studio is for ]',
  },
];

export const College = () => (
  <>
    <TopBar />
    <main className="cl-page">
      <div className="cl-inner">
        <p className="cl-eyebrow">olivernguyen.com · college</p>
        <h1 className="cl-title">[ headline ]</h1>
        <div className="cl-rule" aria-hidden="true" />
        <p className="cl-lede">[ two or three sentences introducing the college work ]</p>

        <div className="cl-cards">
          {TOOLS.map((tool) => (
            <a className="cl-card" href={tool.route} key={tool.route}>
              <div className="cl-card-top">
                <h2 className="cl-card-name">{tool.name}</h2>
                <span className="cl-lock">{tool.gate}</span>
              </div>
              <p className="cl-card-desc">{tool.desc}</p>
              <p className="cl-card-route">{tool.route}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  </>
);

export default College;
```

- [ ] **Step 3: Add the route to `src/Routes.js`**

Import at the top with the other eager pages:
```jsx
import College from "./pages/college/index.js";
```

Add the route before the catch-all `<Route><NotFoundPage /></Route>`:
```jsx
<Route path="/college">
  <College />
</Route>
```

- [ ] **Step 4: E2E verify**

With `vercel dev` running, via Playwright MCP:
1. Navigate to `/college` signed out. Expect the hero and three cards, no gate.
2. Confirm the three `[…]` placeholders are visibly present — they are intentional, not a bug.
3. Screenshot at 1440px and 390px. The card grid must reflow to one column on mobile and the page must not scroll horizontally.
4. Click the Major card. Expect the passphrase gate.

- [ ] **Step 5: Commit**

```bash
git add src/pages/college src/styles/College.css src/Routes.js
git commit -m "Add public /college hub

Hero plus one card per tool, each labelled with the gate it sits behind.
All human-facing copy ships as visible placeholders for Oliver to write."
```

---

## Task 5: College entry in the sidebar

**Files:**
- Modify: `src/pages/top_bar.js`, `src/styles/Top_Bar.css`

**Interfaces:**
- Consumes: route `/college` from Task 4.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the toggle state**

In `src/pages/top_bar.js`, alongside `isDrivingOpen` and `isSATOpen`:

```jsx
  const [isCollegeOpen, setIsCollegeOpen] = useState(false);
```

and alongside the other toggles:

```jsx
  const toggleCollege = () => {
    setIsCollegeOpen(!isCollegeOpen);
  };
```

- [ ] **Step 2: Add the sidebar entry**

The existing Driving and SAT entries use a `<button>` for the whole label, so the parent is not navigable. College needs both: a link to the hub *and* a toggle. Insert as the first `<li>` after the Home entry:

```jsx
          <li className={`dropdown split ${isCollegeOpen ? 'open' : ''}`}>
            <div className="dropdown-row">
              <a href="/college" className="sidebar-link">
                College
              </a>
              <button
                onClick={toggleCollege}
                className="dropdown-toggle icon-only"
                aria-expanded={isCollegeOpen}
                aria-label="Show college pages"
              >
                <span className="dropdown-icon">+</span>
              </button>
            </div>
            <div className="dropdown-content">
              <li>
                <a href="/major" className="sidebar-link">
                  Major
                </a>
              </li>
              <li>
                <a href="/apply" className="sidebar-link">
                  Apply
                </a>
              </li>
              <li>
                <a href="/studio" className="sidebar-link">
                  Studio
                </a>
              </li>
            </div>
          </li>
```

- [ ] **Step 3: Add the two new styles**

Append to `src/styles/Top_Bar.css`:

```css
/* College is the one dropdown whose parent is also a destination, so the label
   and the expand control are separate hit targets rather than one button. */
.sidebar .dropdown.split .dropdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sidebar .dropdown.split .dropdown-row .sidebar-link {
  flex: 1;
}

.sidebar .dropdown-toggle.icon-only {
  flex: 0 0 auto;
  width: 44px;
  min-height: 44px;
  display: grid;
  place-items: center;
}
```

The 44px minimum is a touch-target floor — the toggle sits directly beside a link and must not be tappable by accident on mobile.

- [ ] **Step 4: E2E verify**

Via Playwright MCP, on `/` where the TopBar is mounted:
1. Open the sidebar. Expect a College entry above Driving.
2. Click the **label**. Expect navigation to `/college`.
3. Back, reopen sidebar, click the **+**. Expect Major / Apply / Studio to expand and the label *not* to navigate.
4. Repeat both at 390px width. Confirm the two hit targets do not overlap.
5. Confirm Driving and SAT still expand — the shared `.dropdown` styles must not have regressed.

- [ ] **Step 5: Commit**

```bash
git add src/pages/top_bar.js src/styles/Top_Bar.css
git commit -m "Add College entry to the sidebar

Unlike Driving and SAT, the parent label is itself a destination, so the
link and the expand toggle are separate hit targets."
```

---

## Task 6: Move the vault API to Clerk

`api/_lib/auth.mjs` is rewritten. All five call sites keep working untouched because the export name and signature are preserved.

**Files:**
- Rewrite: `api/_lib/auth.mjs`

**Interfaces:**
- Consumes: `CLERK_SECRET_KEY`, `CLERK_ALLOWED_USER_IDS` from env.
- Produces: `requireSession(req, res): Promise<boolean>` — same name and signature as before, now Clerk-backed.

- [ ] **Step 1: Rewrite `api/_lib/auth.mjs`**

```js
import { verifyToken } from "@clerk/backend";

// Same export and signature as the previous jose implementation, so the five
// vault and exemplar routes that call it need no edit. Only the verification
// changes: Clerk's __session cookie instead of our own signed one.
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function allowlist() {
  return (process.env.CLERK_ALLOWED_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function requireSession(req, res) {
  if (!process.env.CLERK_SECRET_KEY) {
    res.status(500).json({ error: "CLERK_SECRET_KEY is missing on the server." });
    return false;
  }

  const token = parseCookies(req.headers.cookie).__session;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }

  // verifyToken in @clerk/backend v3 resolves to the JwtPayload and throws on
  // failure. It does not return a { data, errors } pair — that is the internal
  // verifyJwt.
  let payload;
  try {
    payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    res.status(401).json({ error: "Session expired" });
    return false;
  }

  // Clerk permits open sign-up unless it is turned off in the dashboard. This is
  // the server-side backstop: authenticating is not the same as being allowed in.
  // The userId is echoed back deliberately — it is how the allowlist gets
  // populated the first time, and it is the caller's own id, not a disclosure.
  if (!allowlist().includes(payload.sub)) {
    res.status(403).json({
      error: "This account is not on the allowlist.",
      userId: payload.sub,
    });
    return false;
  }

  return true;
}
```

`authorizedParties` is deliberately omitted: it guards against subdomain cookie leaking, which needs a per-environment origin list, and a wrong value locks the vault out silently. The allowlist is the meaningful control here.

- [ ] **Step 2: Verify the five call sites did not need changes**

```bash
grep -rn "requireSession" api/
```
Expected: one declaration in `api/_lib/auth.mjs` and five `if (!(await requireSession(req, res))) return;` lines — none of them edited in this task.

- [ ] **Step 3: Verify the vault is closed**

With `vercel dev` running and no Clerk keys set yet:
```bash
curl -s http://localhost:3000/api/vault/list | head -c 200
```
Expected: `{"error":"CLERK_SECRET_KEY is missing on the server."}` with status 500. That is correct fail-closed behaviour — the vault is unreachable, not open.

Once `CLERK_SECRET_KEY` is set but with no cookie:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/vault/list
```
Expected: `401`.

- [ ] **Step 4: Commit**

```bash
git add api/_lib/auth.mjs
git commit -m "Verify vault requests against Clerk instead of the passphrase JWT

Keeps requireSession's name and signature so the five vault and exemplar
routes are untouched. Adds a user-ID allowlist as a server-side backstop,
since Clerk permits open sign-up until it is disabled in the dashboard.
The 403 echoes the rejected userId so the allowlist can be populated."
```

---

## Task 7: Clerk on the client, `/studio` gated

**Files:**
- Create: `src/auth/RequireClerk.js`, `src/pages/sign_in.js`
- Modify: `src/Routes.js`, `src/pages/essay_studio/store.js`, `src/pages/essay_studio/index.js`, `src/styles/EssayStudio.css`
- Delete: `src/pages/essay_studio/AuthGate.js`
- Test: `src/auth/RequireClerk.test.js`

**Interfaces:**
- Consumes: `useAuth` from `@clerk/react`; `apiFetch` from Task 2.
- Produces: `CLERK_KEY` (string | undefined) and `<RequireClerk>{children}</RequireClerk>` from `src/auth/RequireClerk.js`.

- [ ] **Step 1: Write the failing test**

Create `src/auth/RequireClerk.test.js`. The key case is the one that would otherwise white-screen the whole site.

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@clerk/react', () => ({ useAuth: jest.fn() }));
const { useAuth } = require('@clerk/react');

const load = () => require('./RequireClerk').default;

const renderGate = () => {
  const RequireClerk = load();
  return render(
    <MemoryRouter initialEntries={['/studio']}>
      <RequireClerk><p>vault</p></RequireClerk>
    </MemoryRouter>
  );
};

describe('RequireClerk', () => {
  const original = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  afterEach(() => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = original;
    jest.resetModules();
  });

  it('explains itself instead of crashing when no publishable key is set', () => {
    delete process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    jest.resetModules();
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderGate();
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    expect(screen.queryByText('vault')).not.toBeInTheDocument();
  });

  it('hides children while Clerk is still loading', () => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    jest.resetModules();
    useAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });
    renderGate();
    expect(screen.queryByText('vault')).not.toBeInTheDocument();
  });

  it('renders children when signed in', () => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    jest.resetModules();
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    renderGate();
    expect(screen.getByText('vault')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `CI=true npx react-scripts test --testPathPattern RequireClerk`
Expected: FAIL — `Cannot find module './RequireClerk'`.

- [ ] **Step 3: Create `src/auth/RequireClerk.js`**

The key check must happen in an outer component. `useAuth` throws without a mounted `ClerkProvider`, and hooks cannot be called conditionally — so the guard is a separate component, not an early return.

```jsx
import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/react';

export const CLERK_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const NotConfigured = () => (
  <main className="gate">
    <div className="grain" aria-hidden="true" />
    <div className="gate-card">
      <p className="gate-eyebrow">Route /studio · unavailable</p>
      <h1 className="gate-title">Not Configured</h1>
      <p className="gate-hint">
        <code>REACT_APP_CLERK_PUBLISHABLE_KEY</code> is not set, so sign-in cannot load.
        The rest of the site is unaffected.
      </p>
    </div>
  </main>
);

// Split in two on purpose: useAuth throws when no ClerkProvider is mounted, and
// hooks cannot be called conditionally, so the key check has to live one level up.
const ClerkGate = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <div style={{ minHeight: '100dvh', background: '#f1e9d4' }} />;
  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect=${encodeURIComponent(location.pathname)}`} />;
  }
  return children;
};

export const RequireClerk = ({ children }) => {
  if (!CLERK_KEY) return <NotConfigured />;
  return <ClerkGate>{children}</ClerkGate>;
};

export default RequireClerk;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `CI=true npx react-scripts test --testPathPattern RequireClerk`
Expected: PASS, 3 tests.

- [ ] **Step 5: Create `src/pages/sign_in.js`**

```jsx
import React from 'react';
import { SignIn } from '@clerk/react';
import '../styles/Gate.css';

// Clerk's element keys, mapped onto the site's tokens. These are Clerk internals
// and can change across major versions; the failure mode is an unstyled card,
// not a broken sign-in.
const appearance = {
  variables: {
    colorPrimary: '#092441',
    colorBackground: '#f9f3e5',
    colorText: '#122231',
    colorTextSecondary: '#45576a',
    colorInputBackground: '#fcf8ee',
    borderRadius: '2px',
    fontFamily: '"Hanken Grotesk", -apple-system, sans-serif',
  },
  elements: {
    card: { border: '1px solid rgba(18,34,49,.16)', boxShadow: 'none' },
    headerTitle: {
      fontFamily: '"Big Shoulders", sans-serif',
      textTransform: 'uppercase',
      fontWeight: 900,
      letterSpacing: '.01em',
    },
    divider: { display: 'none' },
    footer: { display: 'none' },
  },
};

export const SignInPage = () => {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || '/studio';

  return (
    <main className="gate">
      <div className="grain" aria-hidden="true" />
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={null}
        forceRedirectUrl={redirect}
        appearance={appearance}
      />
    </main>
  );
};

export default SignInPage;
```

`footer: { display: 'none' }` hides the "Don't have an account? Sign up" link — there is no sign-up route, and offering one that 404s is worse than offering none.

- [ ] **Step 6: Wire the provider and routes in `src/Routes.js`**

Add imports:
```jsx
import { ClerkProvider } from "@clerk/react";
import { useHistory } from "react-router-dom";
import RequireClerk, { CLERK_KEY } from "./auth/RequireClerk";
import SignInPage from "./pages/sign_in.js";
```

Add the bridge component above `export const Routes`:
```jsx
// ClerkProvider needs router functions, and those need useHistory, which only
// works inside <Router>. Hence a component between Router and Switch rather than
// wrapping the whole app in index.js. routerPush and routerReplace are a union in
// Clerk's types: both or neither.
const ClerkBridge = ({ children }) => {
  const history = useHistory();
  if (!CLERK_KEY) return children;
  return (
    <ClerkProvider
      afterSignOutUrl="/college"
      routerPush={(to) => history.push(to)}
      routerReplace={(to) => history.replace(to)}
    >
      {children}
    </ClerkProvider>
  );
};
```

Wrap the `<Switch>` in `<ClerkBridge>`:
```jsx
    <Router>
      <ClerkBridge>
        <Switch>
          {/* ...existing routes... */}
        </Switch>
      </ClerkBridge>
    </Router>
```

Add the sign-in route (not `exact` — Clerk's flow uses sub-paths):
```jsx
        <Route path="/sign-in">
          <SignInPage />
        </Route>
```

Wrap both studio routes:
```jsx
        <Route path="/studio/:schoolSlug/:promptSlug/:versionKey">
          <RequireClerk>
            <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
              <WritingRoom />
            </Suspense>
          </RequireClerk>
        </Route>
        <Route path="/studio">
          <RequireClerk>
            <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
              <EssayStudio />
            </Suspense>
          </RequireClerk>
        </Route>
```

- [ ] **Step 7: Strip auth out of the studio store**

In `src/pages/essay_studio/store.js`:

1. Delete the local `async function api(path, options = {})` definition and import the shared one instead. Add at the top:
```js
import { apiFetch as api } from '../../auth/api';
```
2. Delete these initial-state fields: `authed: false`, `checkingAuth: true`, `authError: null`, `apiMissing: false`.
3. Delete the whole `async login(passphrase) { ... }` action.
4. Replace `init()` with:
```js
  async init() {
    await get().fetchList();
  },
```

- [ ] **Step 8: Strip auth out of the studio page**

In `src/pages/essay_studio/index.js`:

1. Delete the `ApiMissing` component definition (lines ~14–33) — `RequireClerk` and `RequirePassphrase` own that concern now, and the studio's own errors surface through `filesError`.
2. Delete the import `import AuthGate from './AuthGate';`
3. Delete these selector lines: `const checkingAuth = ...`, `const apiMissing = ...`, `const authed = ...`
4. Delete the render branches that use them — the `if (checkingAuth) ...`, `if (apiMissing) return <ApiMissing />;` and `if (!authed) return <AuthGate />;` lines.
5. Add the back-link and the Clerk user button. Import:
```jsx
import { UserButton } from '@clerk/react';
import BackLink from '../../auth/BackLink';
```
and render both as the first children of the page root:
```jsx
<BackLink />
<div className="es-user"><UserButton afterSignOutUrl="/college" /></div>
```

Add to `src/styles/EssayStudio.css`:
```css
.es-user {
  position: fixed;
  top: 14px;
  right: 20px;
  z-index: 40;
}
```

- [ ] **Step 9: Delete the old gate and its styles**

```bash
git rm src/pages/essay_studio/AuthGate.js
```

Remove the `.es-gate*` block from `src/styles/EssayStudio.css` (lines ~518–605, starting at the `/* ══ the gate ══ */` comment) and the `.es-gate-wrong` rule inside the media query at ~1319.

Verify nothing references them:
```bash
grep -rn "es-gate\|AuthGate" src/ || echo "clean"
```
Expected: `clean`.

- [ ] **Step 10: Verify the build and the full unit suite**

```bash
npx -y yarn@1.22.22 build
CI=true npx react-scripts test
```
Expected: build succeeds; all suites pass including `model.test.js`, `portfolio.test.js`, `seed.test.js`, `vaultModel.test.js`, `RequirePassphrase.test.js`, `RequireClerk.test.js`.

If the build fails resolving `@clerk/react` under webpack 5, stop — that is the known CRA-versus-modern-exports risk from the spec and needs a decision, not a workaround.

- [ ] **Step 11: Commit**

```bash
git add -A src/ && git commit -m "Put /studio behind Clerk

Adds the provider bridge inside Router (routerPush/routerReplace need
useHistory), a themed /sign-in, and a gate that degrades to an explainer
when no publishable key is set, so a missing key cannot white-screen
/college, /major and /apply. Removes the studio's passphrase gate."
```

---

## Task 8: Full-system verification

No new code. This is the gate before calling the work done.

**Files:** none.

**Interfaces:** none.

- [ ] **Step 1: Confirm no secret leaked**

```bash
npx -y yarn@1.22.22 build
grep -ri "$GATE_PASSPHRASE" build/ src/ api/ docs/ && echo "LEAK — STOP" || echo "clean"
git grep -i "$GATE_PASSPHRASE" && echo "LEAK IN TREE — STOP" || echo "tree clean"
```
Expected: `clean` and `tree clean`. Anything else stops the release.

- [ ] **Step 2: Run the whole unit suite**

```bash
CI=true npx react-scripts test
```
Expected: all suites pass, zero new warnings.

- [ ] **Step 3: E2E, no Clerk keys configured**

With `vercel dev` running and `REACT_APP_CLERK_PUBLISHABLE_KEY` unset, via Playwright MCP:
1. `/college` renders. 2. `/major` gates and opens with the passphrase. 3. `/apply` opens on the same cookie. 4. `/studio` shows "Not Configured" — **not** a white screen. 5. Browser console shows no uncaught errors on any of the four.

- [ ] **Step 4: E2E, Clerk keys configured**

With both Clerk keys set and `CLERK_ALLOWED_USER_IDS` still empty:
1. `/studio` signed out redirects to `/sign-in`.
2. `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/vault/list` → `401`.
3. Sign in through the Clerk card. `curl` the same endpoint with the browser's cookies → `403`, body contains `userId`.
4. Put that userId in `CLERK_ALLOWED_USER_IDS`, restart `vercel dev`, reload `/studio`. The vault lists.
5. Open a file, type, wait for autosave, confirm a real commit lands in the vault repo.
6. Sign out via `UserButton`. Expect to land on `/college` and `/studio` to gate again.

- [ ] **Step 5: Confirm the split actually holds**

The point of the whole design. In a fresh browser profile:
1. Enter the passphrase on `/major`.
2. Navigate to `/studio`. Expect the Clerk sign-in, **not** the vault. The passphrase must not open the studio.
3. `curl` `/api/vault/list` with only the `gate_session` cookie → `401`.

- [ ] **Step 6: Pixel pass**

At 1440px and 390px, screenshot `/college`, `/major`, `/apply`, `/studio`, `/sign-in`, and the open sidebar. Check: no horizontal scroll; the back-link and `UserButton` clear existing chrome; the gate card is centred; no doubled `.grain` overlay; the sidebar's College label and `+` do not overlap. Fix anything that looks off, including pre-existing issues noticed along the way.

- [ ] **Step 7: Commit any fixes**

```bash
git add -A && git commit -m "Fix layout issues found in end-to-end verification"
```

---

## Self-Review

**Spec coverage:** Clerk on `/studio` → Tasks 6, 7. Passphrase on `/major` and `/apply` → Tasks 1, 2, 3. Public `/college` → Task 4. Sidebar College entry → Task 5. Back-links not TopBar → Task 3 Step 1, Task 7 Step 8. Two server libs with separate cookies → Task 1, Task 6. Five vault routes untouched → Task 6 Step 2. `go-fish` deleted → Task 3. Missing-key guard → Task 7 Step 3. Copy placeholders → Task 4 Step 2. Build order → Tasks 1–3, then 4–5, then 6–7. Verification list → Task 8. RLS and `/debt` correctly absent as out-of-scope.

**Placeholder scan:** No TBDs. Every code step carries real code. The `[…]` markers in Task 4 are the spec's deliberate copy placeholders, labelled as such.

**Type consistency:** `requireGate` / `signGate` / `gateCookie` / `parseCookies` defined in Task 1 and used only there. `apiFetch` defined Task 2 Step 3, imported Task 2 Step 5 and Task 7 Step 7. `usePassphraseStore` fields (`checking`, `authed`, `error`, `apiMissing`, `check`, `login`) match across store, gate, wrapper, and test. `CLERK_KEY` exported Task 7 Step 3, imported Task 7 Step 6. `requireSession` name and signature preserved in Task 6. `<PassphraseGate label>` and `<RequirePassphrase label route>` consistent between definition, test, and both call sites.
