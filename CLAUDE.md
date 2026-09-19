# Padel Pals website

Static site, no build step. Flat HTML files at repo root, deployed via GitHub Pages (see `CNAME`, `.nojekyll`). No `.github/workflows/` exists despite what `README.md` claims — that file is partly stale, don't trust its deployment section.

## Nav and footer: one source of truth

`js/shared-navigation.js` defines `SHARED_NAV_HTML` and `SHARED_FOOTER_HTML` as template literals — every page renders nav/footer from these. That is the only place to edit them.

`components/navbar.html`, `components/footer.html`, `components/auth-script.html`, `js/components.js`, and `convert-to-components.sh` were an abandoned component-migration attempt. Nothing in the repo includes `js/components.js`, so none of it renders. Do not edit these files expecting them to affect the live site — they should not exist (see repo history for their removal).

**Whenever `js/shared-navigation.js` content changes, bump its `?v=` query string on every page that loads it** (`grep -rl 'shared-navigation.js?v=' *.html`, then bump the suffix, e.g. `20260916g` → `20260916h`). This site has no build step, so that query string is the only cache-buster — GitHub Pages and browsers will keep serving the old cached script forever otherwise. Every prior nav edit in git history bumped it; missing this once already shipped a dropdown that silently didn't appear for anyone with a cached copy. The same applies to `css/marketing.css?v=...` if you ever edit that file.

## Config / Supabase

- `config.js` (gitignored) holds `supabaseUrl` + the anon/publishable key for local dev. Never put the service role key here.
- `config-loader.js` and `supabase-config.js` embed the same anon key as a hardcoded fallback if `config.js`/`enhanced-config.js` fail to load. This is intentional and fine — it's a publishable key, not a secret.
- Supabase project ref: `peaphqbxdmknxzsfdxuh`.
- Supabase CLI (v2.112.0) is linked to this project (`supabase link` done, `supabase/config.toml` committed). `supabase/.temp/` and `supabase/functions/.env` are gitignored — never commit either.
- Edge Functions use the `@supabase/server` SDK's `withSupabase({ auth: ... })` pattern (current Supabase convention, not the older manual-`createClient` style): `auth: "user"` for calls from a signed-in browser (keep `verify_jwt = true`), `auth: "secret"` for server-to-server, `auth: "none"` for externally-signed webhooks like Stripe's (`verify_jwt = false`, verify the signature yourself in the handler). See `supabase/functions/*/index.ts`.

## Coach Planner (in progress)

Free signed-in library for now. Subscription / Stripe later.

**Hard rule, non-negotiable:** lesson content, PDFs, video, and entitlement decisions never live in this repo. Content lives in Supabase (`coaching.lessons`) as data; the template pages render whatever RLS returns. Stripe secrets and the service role key never appear here.

**Current product**
- Signed-in Padel Pals accounts can read every published plan. No paywall.
- Targeting is by **group name** (`audience`: Intro to Padel, Beginner / Improver, Improver / Intermediate), not numeric ratings.
- Spines in `coaching.spines` (`sunday-drill`, `intro-padel`). Each week is one `coaching.lessons` overlay (`spine_id` + `step_details`), not a copied seven-step `run_sheet`.
- Do not add `subscribers` / `stripe_events` until we actually charge.
- Local generation catalogue: `~/Documents/Padel Training/INDEX.md` (refresh with `refresh-index.py` there). LTA PDFs stay on disk. Do not flatten LTA PDFs into rows.

**Pages**
- `coach-planner.html` — public sales page, nav target.
- `coach-planner-library.html` — signed-in index. **Drills** and **Coaching** are separate sections (`lessons.session_kind`). Current weekly plans are drills. **Games** is warm-ups, mini games, and extra overhead resources (`coaching.games`). The drills-versus-coaching wording and funnel live in `coaching.guides` (`drills-v-coaching`), not in this repo.
- `coach-planner-lesson.html` — renderer; requires sign-in and `?slug=`. Joins the overlay to its spine and games, then composes the hour in `js/coach-planner-print.js`.

**Publish a week (overlay only)**
- Point `spine_id` at `sunday-drill` or `intro-padel`. Leave `run_sheet` null.
- Point `warmup_game_id` and `conditioned_game_id` at `coaching.games` rather than rewriting the 5–12 and 48–58 slots.
- Write theme fields: `title`, `audience`, `session_date`, `skill_id`, `game_situation` / `phase` / `tactic`, `objective`, `success_check`, `differentiation`, `equipment`, `coach_note`.
- Put only the lines that differ from the spine in `step_details`, keyed by label (`Demo`, `Closed`, Intro `Flavour`). Omit `Name the focus` (uses `objective`), omit `Open` (uses `differentiation` / STEP), omit `Close` to fill from the next published week of the same audience.
- Do not paste the seven-step hour again. Do not add HTML or static lesson files. Do not flatten LTA PDFs or transcribe LTA clips into game rows. Overhead extras (Up or Down, Jumper Off, Elbow Push, Hide the Logo, Momentum, Clocks, Open Racket, Scarf, Beat the Bounce) are original one-line problem notes plus a Vimeo link.

**Stripe Edge Functions** in `supabase/functions/` are written but **not deployed**. Live `stripe-webhook` is the PaymentIntent webhook for tips, lessons and tournament entries — never overwrite it with the Coach Planner file of the same name.

Nav: For Coaches dropdown in `js/shared-navigation.js`.

## Stale docs at root

`APPLE_*`, `*_FIX.md`, `*_TROUBLESHOOTING.md`, `OAUTH_FIX_GUIDE.md`, `DESIGN_REVIEW.md`, `RANKINGS_OPTIMIZATION.md`, `CREDENTIALS_CHECKLIST.md` are historical debugging notes, not living documentation. Verify against actual code before relying on any claim in them.
