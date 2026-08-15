# olivernguyen

Oliver Nguyen's personal site. React 18 + `react-router-dom` v5, built with Vite, deployed to Vercel.

## Available Scripts

Run with yarn (yarn is the package manager — see `packageManager` in `package.json`):

### `yarn dev` (alias `yarn start`)

Runs the app in development mode via the Vite dev server.\
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### `yarn dev:vercel`

Runs `vercel dev` instead, needed to exercise the `/api/*` Vercel serverless functions locally (the plain Vite dev server answers those paths with `index.html`).

### `yarn build`

Builds the app for production to the `dist` folder.

### `yarn test`

Runs the Vitest suite once (`vitest run`).

## Learn More

See `AGENTS.md` for build-system internals (env var wiring, JSX-in-`.js` handling, Tailwind v4 + shadcn/ui setup) and other project-specific notes.
