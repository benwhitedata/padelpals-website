# Padel Pals website

Static site, no build step. Flat HTML files at repo root, deployed via GitHub Pages (see `CNAME`, `.nojekyll`). No `.github/workflows/` exists despite what `README.md` claims — that file is partly stale, don't trust its deployment section.

## Nav and footer: one source of truth

`js/shared-navigation.js` defines `SHARED_NAV_HTML` and `SHARED_FOOTER_HTML` as template literals — every page renders nav/footer from these. That is the only place to edit them.

`components/navbar.html`, `components/footer.html`, `components/auth-script.html`, `js/components.js`, and `convert-to-components.sh` were an abandoned component-migration attempt. Nothing in the repo includes `js/components.js`, so none of it renders. Do not edit these files expecting them to affect the live site — they should not exist (see repo history for their removal).

## Config / Supabase

- `config.js` (gitignored) holds `supabaseUrl` + the anon/publishable key for local dev. Never put the service role key here.
- `config-loader.js` and `supabase-config.js` embed the same anon key as a hardcoded fallback if `config.js`/`enhanced-config.js` fail to load. This is intentional and fine — it's a publishable key, not a secret.
- Supabase project ref: `peaphqbxdmknxzsfdxuh`.
- Supabase CLI is installed locally (v2.112.0) but this repo has no `supabase/` directory — not yet linked/initialized. Needed before writing any Edge Function.

## Coach Planner (in progress)

Design doc: https://claude.ai/artifact/FAwcHoAiRsKBVaSsBBDYoX — a monthly subscription product for coaches, read it before touching anything below.

**Hard rule, non-negotiable:** lesson content, PDFs, video, and entitlement decisions never live in this repo, in any form. Content lives in Supabase (`coaching` schema, separate from `matches`/`ratings`) as data; a template page renders whatever the database is willing to return under row-level security. The Stripe secret key and Supabase service role key never appear here either — only the publishable/anon key does.

**Build order:**
1. Schema + RLS policies — done elsewhere (Cowork/Supabase connector), not in this repo.
2. **This repo (Claude Code):** the renderer/library pages, Stripe Checkout + Customer Portal links, the webhook Edge Function, tested in Stripe test mode.
3. Sales page design — separate design pass.
4. Ongoing: monthly content batches, inserted as data, not files.

**New pages to add (flat, at root, matching convention):**
- `coach-planner.html` — public sales page, no sign-in. This is what the nav links to.
- `coach-planner-library.html` — index of plans the signed-in user is entitled to.
- `coach-planner-lesson.html` — single-plan renderer; the free sample is just this page opened on the one row flagged `is_sample`.

**Nav change** (in `js/shared-navigation.js`): convert the For Coaches `<li>` (~line 394) from a plain link into a `nav-item has-dropdown`, matching the Features dropdown pattern (~line 396), holding Group Lessons → `coaches.html`, Coach Planner → `coach-planner.html`, Player Levels → `ratings.html`. Also add a Coach Planner row to the For Coaches footer column (~line 747, inside `SHARED_FOOTER_HTML`).

A subscription grants no role — it never touches the existing roles/permissions tables, only `coaching.subscribers`.

## Stale docs at root

`APPLE_*`, `*_FIX.md`, `*_TROUBLESHOOTING.md`, `OAUTH_FIX_GUIDE.md`, `DESIGN_REVIEW.md`, `RANKINGS_OPTIMIZATION.md`, `CREDENTIALS_CHECKLIST.md` are historical debugging notes, not living documentation. Verify against actual code before relying on any claim in them.
