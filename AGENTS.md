# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository. `CLAUDE.md` in this repo mirrors this file for Claude Code - update both together.

## Writing style

Do not use em dashes (`—`) anywhere: not in code, comments, docs, commit messages, or user-facing copy (marketing text, `aria-label`s, portfolio content). Rewrite with a comma, parentheses, a colon, or two sentences; a spaced hyphen (` - `) is an acceptable last resort. This applies to en dashes (`–`) in prose too; a plain hyphen is fine for ranges.

## Project Status (as of 2026-09-22)

Everything is deployed and live in production (see "Production Deployment") with no known bugs or unfinished work. Opportunity Radar's "decision cockpit redesign" (see its section below) is committed, pushed, and deployed (Amplify build #44, 2026-09-22); the corresponding API backend is deployed too and its `InitOpportunityRadar` migration has been applied to the production database (see the API repo's `AGENTS.md`). The redesign was browser-verified against a real (local dev) API and database rather than a mock: both lanes, the digest, a full detail-page decision review-and-save cycle, and the mobile (375px) layout including the collapsed action menu and delete-confirmation dialog, satisfying the real-API pass this section previously flagged as outstanding. A no-op line-clamp ternary in the compact row layout (`OpportunityRow.tsx`) was found during that pass and fixed. The Import, Preferences, and Export dialogs were exercised structurally but not individually submitted end to end; a pass through those specific flows is still worth doing. Live Jev is now live in production; the API side's container was restarted to pick up the newly-configured `TypeSafe/ApiKey` (see the API repo's `AGENTS.md`). Next up: a substantial rebuild of the public task cost calculator at `/tools/task-cost-calculator` - see "The task cost calculator" below, which is the section to read before touching anything under `src/pages/tools/` or `src/components/tools/`. This file and the API repo's `AGENTS.md` are both kept current - read both before resuming.

## Commands

```bash
npm run dev       # Vite dev server, http://localhost:5173 (port is pinned with strictPort - must match the API's CORS policy)
npm run build     # tsc -b && vite build - see gotcha below, this is NOT the same as `tsc --noEmit`
npm run lint      # oxlint
npm run preview   # preview the production build
```

```bash
npm test          # node --test "tests/**/*.test.ts" - pure model/logic tests, no DOM
```

**Local dev prerequisite**: `.env.local` (gitignored) must set `VITE_API_BASE_URL` pointing at the backend API (its dev profile runs on `http://localhost:5194`).

### Gotcha: use `npm run build`, not `tsc --noEmit`, to typecheck

This project uses a solution-style root `tsconfig.json` (`references` only, no `include`/`files`). Running plain `tsc --noEmit` against it compiles **zero files** and reports success even when the code has real type errors - this produced a false "clean" result during development that masked a real bug (an MUI prop that no longer existed in the installed version). Always verify with `npm run build` (which runs `tsc -b`, the project-reference build mode that actually typechecks) before considering a change verified.

## Architecture

**Stack**: Vite + React 19 + TypeScript, MUI v9 (Emotion) for all UI - **not** Tailwind. Tailwind was the original styling choice and was fully removed in favor of MUI partway through this project's history; don't reintroduce it.

**Design system lives in `src/theme.ts`** - primary blue `#2563eb`, Plus Jakarta Sans for headings/buttons + Inter for body text (both self-hosted via `@fontsource`, imported in `main.tsx`), pill-shaped buttons, card hover-lift, sticky-AppBar blur-on-scroll styling. Also overrides the browser's default autofill styling on `MuiOutlinedInput` (`&:-webkit-autofill`) so autofilled fields keep the app's own white background instead of Chrome/Edge's pale-blue tint. Prefer relying on theme defaults over hardcoding one-off `sx` styles that duplicate what the theme already provides.

**Two reusable motion primitives, both in `src/components/motion/`** - reuse these rather than writing new `framer-motion` code:
- `Reveal.tsx` - scroll-triggered fade/slide-up wrapper, used for nearly every section/card entrance across the site (supports a `delay` prop for staggering a list, and a `fullWidth` prop - pass it whenever `Reveal` sits inside a flex container; otherwise its `motion.div` wrapper shrinks to fit its content as a flex item, silently making any `width`/`maxWidth` set on the child a no-op. This exact bug ate real time on `LoginPage.tsx` before being traced back to `Reveal` itself - see the gotcha below.)
- `GradientBackdrop.tsx` - decorative animated blurred gradient blobs, used behind hero-style page headers (`Hero.tsx`, `PortfolioPage.tsx`, `LoginPage.tsx`)

**Branding assets (`src/assets/branding/`)**: `icon-dark.webp` (dark HSL monogram, for light backgrounds - `NavBar`, `AuthedAppBar`, `LoginPage`'s form side) and `wordmark-light.webp` (white-text wordmark, for dark backgrounds - `Footer` twice, once as the 38px sign-off and once as the oversized 9%-opacity signature bled off the bottom edge, plus `LoginPage`'s dark brand panel) are in active use across most of the site. `wordmark-dark.webp` (black-text wordmark, for light backgrounds) is used once, as `LoginPage.tsx`'s mobile-only header (shown below the `md` breakpoint, where the dark panel is hidden). `wordmark-square-dark.png` was generated alongside the others, never used, and has been deleted.

These were 250-290 KB PNGs exported at 1254-2172px and displayed at 30-640px, so roughly 550 KB of logo shipped on every cold page view. They are now WebP, resized to exactly 2x their largest real render (`wordmark-light` is 1280px wide because `LoginPage` draws it at 640 CSS px at `lg`), which took the built bundle from 2.74 MB to 1.82 MB. **If you re-export any of these, resize to 2x the largest CSS size it is drawn at and keep WebP** - do not drop a full-resolution export back in. `public/social-card.png` stays PNG on purpose (social scrapers are unreliable with WebP) and is a 256-colour 800x800 palette PNG at 8.5 KB; it is square because `index.html` declares `twitter:card=summary`, so do not crop it to 1.91:1 without changing that tag too.

**`src/hooks/useScrolled.ts`** - shared scroll-position hook backing the sticky-header blur effect. Used by `NavBar.tsx` and all three authenticated-app headers (`PortalPage`, `AdminPage`, `AdminClientDetailPage`) so the effect is implemented once, not duplicated per page.

**Two distinct app surfaces sharing one auth system:**
- Public marketing site: `/`, `/login`, `/portfolio` (the last is intentionally unlinked from any nav - reachable only by typing the URL directly, same pattern as a normal page, just not advertised)
- Authenticated app: `/portal` (client's own software list) and `/admin` + `/admin/clients/:clientId` (admin-only client/project management)

There is **no self-service signup**. Client accounts exist only because an admin created them via the `/admin` UI, which calls `POST /api/admin/clients` - the backend generates the password, and the UI shows it exactly once (`CreateClientDialog.tsx`) for the admin to relay to the client manually.

**Auth (`src/auth/`)**: `AuthContext.tsx` stores the JWT in `localStorage` under `hsl_token` and exposes `{ user, loading, login(), logout() }`; `login()` returns the freshly-authenticated user so callers can branch on `user.isAdmin` without a second round-trip. `api/client.ts`'s `apiFetch` wrapper auto-attaches the bearer token and auto-logs-out on `401` - but **not** on `423` (account locked from too many failed attempts); callers that need to handle a locked account must check `err.status === 423` themselves (see `LoginPage.tsx`).

**Route guards**: `ProtectedRoute.tsx` requires any authenticated user (redirects to `/login` otherwise); `AdminRoute.tsx` additionally requires `user.isAdmin` (redirects a logged-in non-admin to `/portal` rather than `/login`, since they're a valid user, just not authorized for that route). `LoginPage.tsx` routes admins to `/admin` and everyone else to `/portal` after a successful login (unless a deep-linked `from` location takes precedence).

**Data isolation is enforced server-side, not just hidden in the UI** - `PortalPage.tsx` can only ever render the logged-in client's own projects because the backend's `/api/portal/projects` endpoint filters by the caller's JWT claim; there's no client-side-only gate to bypass.

## Admin dialog conventions

Every dialog in the authenticated app (`ResetPasswordDialog.tsx`, `ProjectDialog.tsx`, `CreateClientDialog.tsx`, and the inquiry detail dialog in `AdminInquiriesPage.tsx`) follows one shared recipe. A new dialog should match it rather than falling back to MUI's bare defaults, and an existing one that doesn't match it is a bug, not a style choice:
- A 5px `linear-gradient(90deg, #2563eb, #60a5fa)` accent bar as the first element inside the dialog `Paper`, before `DialogTitle`.
- `useMediaQuery(theme.breakpoints.down('sm'))` drives `fullScreen` on the `Dialog`, paired with `slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}`, so it goes edge-to-edge on a phone instead of shrinking to a small rounded box.
- `DialogTitle` uses the shared `TITLE_SX` shape (Plus Jakarta Sans, weight 800, size 20, flex row with a close `IconButton` at the end), not the plain MUI default with no close affordance.
- Any status-like value (inquiry status, project status) gets one consistent color mapping, applied identically everywhere it's rendered (list chip, dialog chip, any picker); it is never left as an uncolored default `Chip`.
- Long-form or quoted content a user typed (an inquiry message, a project description) renders inside its own `Paper variant="outlined"` with `bgcolor: SURFACE_SUBTLE`, not as bare `Typography` at the same visual weight as the surrounding chrome.

This is here because the inquiry detail dialog originally shipped without any of it (bare `Dialog`, no accent bar, uncolored status, message rendered as plain text indistinguishable from the name/email above it), and it took a dedicated cleanup pass on 2026-09-20 to bring it in line with the other three dialogs. Check a new dialog against this list before calling it done.

## The task cost calculator

The public tool at `/tools/task-cost-calculator` (lazy-loaded in `App.tsx`, linked only from the `Footer`). It is the one part of the site meant to be used rather than read, so it is built to beat the obvious alternative of asking a chat assistant the same question: it is interactive, it is honest about its own uncertainty, and it produces an artifact you can send to whoever signs off on the spend.

**Layering is strict, and worth preserving.** `src/pages/tools/` holds pure logic with no React in it at all; `src/components/tools/` holds the presentation.

- `taskCostModel.ts` - all the arithmetic. Inputs, results, the month-by-month payback `projectCashflow`, and `sensitivity` (the tornado chart's data). **Design rule: every assumption is a no-op at its default**, so the four-field version of the tool produces exactly the naive `time x runs` answer and the advanced panels only ever make the estimate more specific. `tests/taskCostAssumptions.test.ts` pins that rule; do not add an assumption that violates it.
- `taskCostFormat.ts` - every string the tool renders. Round for display only, and never let a small non-zero result print as a flat "0".
- `taskCostScenario.ts` - the `Scenario` type, the unit that gets shared, exported and round-tripped.
- `taskCostUrl.ts` - `Scenario` <-> query string. **The URL is the tool's save file** (no account, no storage), so only non-default values are written and decoding clamps everything it reads.
- `taskCostForm.ts` - the bridge between raw form strings and a clean `Scenario`. Text fields keep their raw string so a half-typed "1." is never clobbered; `resolveForm` always returns usable numbers plus per-field errors, so the results panel can keep drawing while a field is invalid.
- `taskCostExport.ts` - the paste-ready summary and CSV.

**The default surface is deliberately shallow.** A first pass shipped 18 inputs across three
collapsed panels plus an always-visible sensitivity chart, and a look at it side by side with
the original 7-input tool made clear that was too much for a public lead-gen page. The fix
was UI-only (the model already treats every assumption as a no-op at its default, so nothing
about correctness changed): `TaskCostControls.tsx`'s "How realistic is this?" panel shows only
Adoption and Confidence band by default, with rework/realization tucked behind a nested
`MoreToggle` (a plain text button + `Collapse`, not a second `Expandable` - two nested bordered
boxes read as clutter); "Cost of the fix" shows only build cost and monthly cost, with ramp and
horizon behind their own `MoreToggle`. `SensitivityPanel.tsx`'s tornado chart is opt-in (an
`open`/`onOpen` pair): its heading stays visible while scrolling past, but the chart itself only
renders once someone clicks "Show the breakdown". Each `MoreToggle`'s `useState` is lazily
initialized from the `form` prop at mount, mirroring the trick `initialState()` already uses for
the outer panels, so a shared link that sets a nested-only value (rework, realization, ramp,
horizon) still opens the control holding it rather than hiding a number the recipient can't
see or account for. The task name field moved out of the top of `TaskCostControls.tsx` (prime
first-impression space for something that only matters at share time) into `ShareBar.tsx`
itself, right next to Copy link.

**There is no preset picker.** One was tried (`PresetPicker.tsx`, `taskCostPresets.ts`, six
starting scenarios) and then removed: the tool already loads with a worked example, so the
"blank page" problem a preset picker solves didn't really exist, and clicking one silently
overwrote whatever a visitor had already typed with no confirmation, the opposite of what a
lead-gen tool wants. If starting-point scenarios come back, build in an are-you-sure before
overwriting a touched form.

**Charts are hand-rolled**, not a library: `PaybackChart.tsx` is SVG, `SensitivityChart.tsx` is boxes. This keeps the lazy chunk near 100 kB and avoids adding a dependency for two charts. `PaybackChart` uses a 1:1 user-unit-to-pixel viewBox driven by `useElementWidth` rather than a fixed viewBox that scales, specifically so axis labels stay readable on a phone instead of shrinking with the drawing.

### Gotcha: the pure modules in `src/pages/tools/` import each other with an explicit `.ts` extension

`npm test` runs `node --test` directly against the TypeScript sources, and Node's ESM resolver does not guess extensions. The older files here got away with extensionless imports only because theirs were type-only and erased by type stripping. Anything importing a *value* from a sibling needs `from './taskCostModel.ts'`. `allowImportingTsExtensions` is already on in `tsconfig.app.json`, and Vite resolves the explicit extension fine. The `.tsx` consumers are bundler-only and stay extensionless.

## Production Deployment

Hosted on **AWS Amplify** (app `henderson-software-labs-ui`, id `d2qschmehrzw1m`), connected to this repo's `master` branch - a push triggers an automatic build (`amplify.yml` in this repo) and deploy, no manual step. Live at `https://hendersonsoftwarelabs.com` and `https://www.hendersonsoftwarelabs.com` (the original `https://master.d2qschmehrzw1m.amplifyapp.com` still resolves too). The backend is a separate repo/deployment (`HendersonSoftwareLabsAPI`, on EC2) - see its `AGENTS.md` for that infrastructure.

**`VITE_API_BASE_URL`** is set as an Amplify branch environment variable (not committed here) pointing at `https://api.hendersonsoftwarelabs.com`.

## Known Amplify gotchas (from setting this up)

- Amplify's console **always requires a service role** to proceed past branch setup, even for a pure static site with "Enable full-stack deploys" unchecked. If the "Create a new role" button appears to do nothing, it's likely a blocked popup - create one manually via IAM instead (trust `amplify.amazonaws.com`, attach the AWS-managed `AdministratorAccess-Amplify` policy) and select it from the dropdown.
- The console's "Add branch" wizard does not necessarily default the branch-name dropdown to `master`/`main` - double-check it before finishing, or you'll end up with an unrelated branch connected instead.

## Known gotchas (from this project's history)

- `Reveal`'s wrapper is a plain `motion.div` with no explicit width - inside a flex container (e.g. `display:'flex', justifyContent:'center'`), it shrinks to fit its content as a flex item, which makes any `width`/`maxWidth` set on `Reveal`'s child silently do nothing regardless of the value. Pass `fullWidth` to `Reveal` in that situation (see `LoginPage.tsx`) rather than fighting it with sizing on the child.
- MUI icon component names don't always match intuitive guesses and differ between MUI major versions (e.g. `CheckCircleOutline` doesn't exist in the installed version, it's `CheckCircleOutlined`). Before importing an icon that isn't already used elsewhere in this codebase, verify it exists: `ls node_modules/@mui/icons-material | grep -i <name>`.
- After installing/removing npm packages while the Vite dev server is running, kill it, delete `node_modules/.vite`, and restart - otherwise you'll see "Invalid hook call" / duplicate-React errors that look like real bugs but are just a stale dependency pre-bundle cache.
- Never run two `npm install`/`npm uninstall` commands concurrently in this project - they can clobber each other's `package.json` writes (this has actually happened here).

## Contact inquiries (2026-09-19)

The public `/contact` page saves name, email and message through anonymous `POST /api/contact`. It uses plain fetch without auth tokens, keeps a submission UUID across retries, and generates a new UUID if the visitor changes the payload. Drafts stay in component memory. No email is sent by the application. The two main homepage CTAs link here; the FAQ sits above the final CTA.

Admins open `/admin/inquiries` from the Clients page. The inbox defaults to New, supports 25-row pagination and New/Contacted/Archived/All filters, and provides a detail dialog, copy-email action and mailto reply. Status changes are explicit; opening a draft never marks an inquiry Contacted. Archived inquiries can return to New. The inbox requires the existing admin route guard and admin API authorization. The detail dialog follows the shared "Admin dialog conventions" above as of a 2026-09-20 cleanup pass.

Verification: `npm run build`, `npm run lint`, `npm test`, plus browser checks for contact validation, submission, mobile layout and inbox status changes.

## Opportunity Radar checkpoint 1 (2026-09-20)

The private admin workflow lives at `/admin/opportunities` with detail routes at `/admin/opportunities/:id`. `src/api/opportunities.ts` owns the contract. The inbox supports paste and CSV import, synthetic examples, filters, simulated evaluation, screening preferences, near-duplicate warnings, and persistent decisions and notes.

Every checkpoint 1 evaluation is simulated and must remain visibly labeled. Evidence quotations render only from stored source passages. Missing budget is distinct from an explicitly inadequate budget. The preferences dialog is the only UI source for the budget floor and scope window; saving preferences asks the API to rescore simulated evaluations.

## Opportunity Radar checkpoint 2 (2026-09-20)

The inbox fetches provider availability from the server. Evaluate all opens a preview dialog instead of immediately spending provider usage. Live Jev is disabled when the server key is absent; when available, the dialog shows record count, conservative maximum input tokens and cost, the server batch ceiling, and rolling token usage before the explicit confirmation button is enabled.

Detail pages distinguish simulated, live, stale, and failed evaluations. A provider failure never appears as Pass. Budget and scope changes are rescored locally, while capability changes mark live results stale until Jev runs again. Browser code never receives the TypeSafe key.

## Opportunity Radar checkpoint 3 (2026-09-20)

The detail view compares semantic evaluation with the literal keyword baseline, including matched terms and every hard-rule outcome. Synthetic comparisons must retain the illustration label and must not be described as benchmarks.

The inbox export dialog excludes synthetic examples by default and explains that exported copies are sanitized without changing stored data. The download must continue through the authenticated API helper. Do not build CSV in the browser or bypass the server sanitizer.

## Opportunity Radar: split into ActiveProject / BusinessProspect (2026-09-21)

Checkpoints 1-3 above shipped a single opportunity model. Before any migration was ever applied on the API side, it split into two lanes with their own routes: `/admin/opportunities` (Active Projects, default), `/admin/opportunities/prospects` (Business Prospects), `/admin/opportunities/digest` (today's best-ranked records per lane, a view only, no scheduled/emailed digest exists). `OpportunityLaneTabs` (new, `src/components/opportunities/`) renders the switcher on all three; this is the first use of MUI `Tabs` in this codebase (`variant="scrollable"` for narrow viewports), distinct from the paste/CSV button-pair toggle pattern still used inside `ImportDialog`.

`OpportunityRadarPage` takes a required `entityType` prop rather than forking into two page files; `OpportunityRow` (new, `src/components/opportunities/`) is the shared row renderer used by both lanes and the digest page, its chip stack forks per `entityType` (source/budget chips for ActiveProject; industry/geography/website-domain chips for BusinessProspect). `ImportDialog` is similarly adaptive on the same prop (business name/evidence/website fields instead of title/description/source-type), and `PreferencesDialog` gained a "Business prospect screening" section (industries/geographies, its own 7-key weight row) plus two digest-count fields, alongside the unchanged "Active project screening" section.

`OpportunityDetailPage` branches on `item.entityType`: decision `Select` options come from `ActiveProjectDecision` (Pursue/Investigate/Pass) or `BusinessProspectDecision` (Prioritize/Watch/Skip); a "Business details" block (website/geography/industry) renders only for BusinessProspect; the keyword-baseline half of the comparison section is replaced with `comparison.baselineUnavailableReason` when `comparison.baseline` is null (BusinessProspect has no keyword-baseline equivalent), while the semantic-evaluation half still renders. `RadarFactor`/`EvidenceList`/`Section` needed no changes, both rubrics already fit their existing generic shape.

`src/api/opportunities.ts` is the single source of truth for the contract: `OpportunityEntityType`, the two decision unions plus the widened `OpportunityRecommendation`, `RECOMMENDATION_META`/`SOURCE_TYPE_LABELS` (centralized here, previously duplicated inline in both pages), split `RadarPreferences`, the four import functions (`importActiveProject`/`importActiveProjectCsv`/`importBusinessProspect`/`importBusinessProspectCsv`, replacing the old single pair), and `getOpportunityDigest`. Import responses are `{id, created, updated, nearDuplicateOfId}` (a resubmission that matches an existing record **updates** it and returns `updated: true`, it does not 409), never assume the old reject-on-duplicate shape.

## Opportunity Radar: review fixes (2026-09-21)

A review found the inbox had no way to remove a bad import or clear a false duplicate flag, and that `OpportunityRow` was a mouse-only clickable element. Both fixed here; see the API repo's `AGENTS.md` for the corresponding server-side fixes (reimport matching, digest filtering, weight normalization, the list endpoint rewrite) this checkpoint pairs with.

- **`OpportunityDetailPage.tsx`** gained a "Danger zone" panel (delete, with a confirmation dialog) and a "Not a duplicate" action on the existing duplicate `Alert`. `deleteOpportunity`/`clearOpportunityDuplicate` are new functions in `src/api/opportunities.ts`, following the existing `apiFetch<T>` pattern. The confirmation dialog is the first delete-confirmation dialog in this codebase; it follows the "Admin dialog conventions" above (accent bar, `TITLE_SX`-shaped title, close `IconButton`, `fullScreen` breakpoint) and is also the first use of `color="error"` on a `Button` here (existing status coloring elsewhere is chip-only) - match both when a future destructive action needs the same treatment. In-place editing of imported fields (title/description/source) was deliberately left out of scope; delete and reimport instead.
- **`OpportunityRow.tsx`** gained keyboard operation at this checkpoint. The later decision-cockpit redesign below replaced the temporary `role="button"` container with a native React Router link inside `CardActionArea`, which is now the authoritative accessibility pattern for these rows. The duplicate flag remains read-only; its clearing action lives on the detail page.

## Opportunity Radar: decision cockpit redesign (2026-09-21)

The Radar UI was rebuilt as a decision cockpit without changing its API contract. `RadarPageHeader` and `RadarDialog` now provide shared page and dialog structure. Inbox filters persist in the URL, search is debounced, mobile actions collapse into a compact menu, loading uses stable skeletons, and filtered-empty states have their own recovery action. `OpportunityRow` is now a real React Router link through `CardActionArea`, so keyboard use, opening in a new tab, and link semantics are native. Its default and compact ranked layouts replace the old chip-heavy presentation in the inbox and digest.

The detail page now leads with one recommendation panel, uses scored factor rows with direct evidence anchors, groups facts and risks into a decision-signals grid, and collapses supporting comparison/source/evidence sections. Review decisions use lane-specific toggle controls with unsaved-state feedback. The review panel stays sticky on desktop and moves directly below the recommendation on smaller screens; deletion is isolated at the page bottom. Preferences are split into Active Projects, Business Prospects, and Digest tabs, with free-entry chip fields, relative-weight guidance, and client-side validation.

Verification: `npm run build`, `npm run lint`, and `npm test` pass. Desktop and 375px mobile layouts for the inbox and Active Project detail were browser-verified against a temporary local mock API. A real-API pass for both entity types and all mutation dialogs is still required when local API secrets are available.
