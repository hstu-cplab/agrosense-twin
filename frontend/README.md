# AgroSense Twin — frontend

Vite + React 19 + TypeScript single-page app. This is the deployable part of the
repo.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

On the login screen click **Enter Simulation Mode** (or open `?sim=1`) to run the
whole digital-twin stack with no backend. Real login uses Firebase Auth.

URL params: `?sim=1`, `?tab=architecture|dashboard|sensors|digitaltwin|yield|disease`,
`?theme=light|dark`, `?lang=en|bn`.

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build → `dist/` |
| `npm run preview` | serve the built `dist/` on :4173 |
| `npm run lint` | `tsc --noEmit` type-check |

## Config

Firebase is baked in with a working demo project, so nothing is required. To use
your own project, set the `VITE_FIREBASE_*` vars — see `.env.example`.

## Deploy

See [`../DEPLOYMENT.md`](../DEPLOYMENT.md). On Vercel: import the repo, set
**Root Directory = `frontend`**, deploy. `vercel.json` supplies the rest.
