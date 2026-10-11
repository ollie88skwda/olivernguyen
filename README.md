# olivernguyen.com

Oliver Nguyen's portfolio: projects, tools, experiments, and two ways to explore them — graph and
terminal.

## Development

```bash
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:3000`.

Use `npm run dev:vercel` when testing Vercel serverless functions under `api/`.

## Owner time blocks

The private `/time-blocks` route is an owner-only phone workflow: edit one ordered daily
activity template, start the day’s plan, then tap each due block to start its timer and tap it
again to finish. Timers are saved independently, so different blocks can run simultaneously and
remain active across reloads and midnight until finished. The page does not send alerts while an
iPhone is backgrounded or closed.

For isolated QA, open `http://localhost:3000/time-blocks-dev.html` after `npm run dev`. The
harness uses in-memory storage. Keep `TIME_BLOCKS_BUCKET` unset until the dedicated private
bucket is approved and verified; production storage uses the server-side service role.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run dev:vercel` | Start Vercel's local server, including `/api` routes |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |
| `npm run test:run` | Run unit tests once |
| `npm run e2e` | Run Playwright browser checks |
| `npm run contrast` | Check the brand colour pairs |
