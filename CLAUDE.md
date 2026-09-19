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

Design doc: https://claude.ai/artifact/FAwcHoAiRsKBVaSsBBDYoX — a monthly subscription product for coaches, read it before touching anything below.

**Hard rule, non-negotiable:** lesson content, PDFs, video, and entitlement decisions never live in this repo, in any form. Content lives in Supabase (`coaching` schema, separate from `matches`/`ratings`) as data; a template page renders whatever the database is willing to return under row-level security. The Stripe secret key and Supabase service role key never appear here either — only the publishable/anon key does.

**Build order:**
1. Schema + RLS policies — done elsewhere (Cowork/Supabase connector), not in this repo. **Not done yet as of the last check** (`coaching` schema has zero tables) — the site/function code below was written against the artifact's data model ahead of that, so verify column names (`coaching.subscribers`, `coaching.lessons`, `coaching.stripe_events`) match whatever migration actually lands.
2. **This repo (Claude Code):** the renderer/library pages (done — `coach-planner*.html`), Stripe Checkout + Customer Portal links + the webhook Edge Function (code written in `supabase/functions/`, not yet deployed or wired into the site pages — see below), tested in Stripe test mode.
3. Sales page design — separate design pass.
4. Ongoing: monthly content batches, inserted as data, not files.

**Pages (done, flat, at root):**
- `coach-planner.html` — public sales page, no sign-in. This is what the nav links to.
- `coach-planner-library.html` — index of plans the signed-in user is entitled to.
- `coach-planner-lesson.html` — single-plan renderer; the free sample is just this page opened on the one row flagged `is_sample`.

Nav: the For Coaches dropdown (`js/shared-navigation.js`) and footer link are done.

A subscription grants no role — it never touches the existing roles/permissions tables, only `coaching.subscribers`.

**Stripe Edge Functions (`supabase/functions/`, code written, not yet deployed):**
- `stripe-webhook` — handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Idempotent via `coaching.stripe_events`.
- `create-checkout-session` — called by a signed-in coach; returns 501 until `STRIPE_COACH_PLANNER_PRICE_ID` is set (pricing isn't decided yet).
- `create-portal-session` — called by a signed-in coach with an existing `stripe_customer_id`.
- Required secrets are listed in `supabase/functions/.env.example`. Set them with `supabase secrets set --env-file supabase/functions/.env` (create that file locally first, gitignored) — never paste real Stripe keys into a chat session.
- **Not deployed yet** — `supabase functions deploy` is a production action this session's auto-mode classifier blocks without explicit user approval. Nothing on the live site calls these yet either.

## Stale docs at root

`APPLE_*`, `*_FIX.md`, `*_TROUBLESHOOTING.md`, `OAUTH_FIX_GUIDE.md`, `DESIGN_REVIEW.md`, `RANKINGS_OPTIMIZATION.md`, `CREDENTIALS_CHECKLIST.md` are historical debugging notes, not living documentation. Verify against actual code before relying on any claim in them.
