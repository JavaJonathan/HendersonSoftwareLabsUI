# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server, http://localhost:5173 (port is pinned with strictPort — must match the API's CORS policy)
npm run build     # tsc -b && vite build — see gotcha below, this is NOT the same as `tsc --noEmit`
npm run lint      # oxlint
npm run preview   # preview the production build
```

There is no automated test suite in this project.

**Local dev prerequisite**: `.env.local` (gitignored) must set `VITE_API_BASE_URL` pointing at the backend API (its dev profile runs on `http://localhost:5194`).

### Gotcha: use `npm run build`, not `tsc --noEmit`, to typecheck

This project uses a solution-style root `tsconfig.json` (`references` only, no `include`/`files`). Running plain `tsc --noEmit` against it compiles **zero files** and reports success even when the code has real type errors — this produced a false "clean" result during development that masked a real bug (an MUI prop that no longer existed in the installed version). Always verify with `npm run build` (which runs `tsc -b`, the project-reference build mode that actually typechecks) before considering a change verified.

## Architecture

**Stack**: Vite + React 19 + TypeScript, MUI v9 (Emotion) for all UI — **not** Tailwind. Tailwind was the original styling choice and was fully removed in favor of MUI partway through this project's history; don't reintroduce it.

**Design system lives in `src/theme.ts`** — primary blue `#2563eb`, Plus Jakarta Sans for headings/buttons + Inter for body text (both self-hosted via `@fontsource`, imported in `main.tsx`), pill-shaped buttons, card hover-lift, sticky-AppBar blur-on-scroll styling. Prefer relying on theme defaults over hardcoding one-off `sx` styles that duplicate what the theme already provides.

**Two reusable motion primitives, both in `src/components/motion/`** — reuse these rather than writing new `framer-motion` code:
- `Reveal.tsx` — scroll-triggered fade/slide-up wrapper, used for nearly every section/card entrance across the site (supports a `delay` prop for staggering a list)
- `GradientBackdrop.tsx` — decorative animated blurred gradient blobs, used behind hero-style page headers (`Hero.tsx`, `PortfolioPage.tsx`, `LoginPage.tsx`)

**`src/hooks/useScrolled.ts`** — shared scroll-position hook backing the sticky-header blur effect. Used by `NavBar.tsx` and all three authenticated-app headers (`PortalPage`, `AdminPage`, `AdminClientDetailPage`) so the effect is implemented once, not duplicated per page.

**Two distinct app surfaces sharing one auth system:**
- Public marketing site: `/`, `/login`, `/portfolio` (the last is intentionally unlinked from any nav — reachable only by typing the URL directly, same pattern as a normal page, just not advertised)
- Authenticated app: `/portal` (client's own software list) and `/admin` + `/admin/clients/:clientId` (admin-only client/project management)

There is **no self-service signup**. Client accounts exist only because an admin created them via the `/admin` UI, which calls `POST /api/admin/clients` — the backend generates the password, and the UI shows it exactly once (`CreateClientDialog.tsx`) for the admin to relay to the client manually.

**Auth (`src/auth/`)**: `AuthContext.tsx` stores the JWT in `localStorage` under `hsl_token` and exposes `{ user, loading, login(), logout() }`; `login()` returns the freshly-authenticated user so callers can branch on `user.isAdmin` without a second round-trip. `api/client.ts`'s `apiFetch` wrapper auto-attaches the bearer token and auto-logs-out on `401` — but **not** on `423` (account locked from too many failed attempts); callers that need to handle a locked account must check `err.status === 423` themselves (see `LoginPage.tsx`).

**Route guards**: `ProtectedRoute.tsx` requires any authenticated user (redirects to `/login` otherwise); `AdminRoute.tsx` additionally requires `user.isAdmin` (redirects a logged-in non-admin to `/portal` rather than `/login`, since they're a valid user, just not authorized for that route). `LoginPage.tsx` routes admins to `/admin` and everyone else to `/portal` after a successful login (unless a deep-linked `from` location takes precedence).

**Data isolation is enforced server-side, not just hidden in the UI** — `PortalPage.tsx` can only ever render the logged-in client's own projects because the backend's `/api/portal/projects` endpoint filters by the caller's JWT claim; there's no client-side-only gate to bypass.

## Known gotchas (from this project's history)

- MUI icon component names don't always match intuitive guesses and differ between MUI major versions (e.g. `CheckCircleOutline` doesn't exist in the installed version, it's `CheckCircleOutlined`). Before importing an icon that isn't already used elsewhere in this codebase, verify it exists: `ls node_modules/@mui/icons-material | grep -i <name>`.
- After installing/removing npm packages while the Vite dev server is running, kill it, delete `node_modules/.vite`, and restart — otherwise you'll see "Invalid hook call" / duplicate-React errors that look like real bugs but are just a stale dependency pre-bundle cache.
- Never run two `npm install`/`npm uninstall` commands concurrently in this project — they can clobber each other's `package.json` writes (this has actually happened here).
