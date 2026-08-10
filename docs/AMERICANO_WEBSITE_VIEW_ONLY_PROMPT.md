# Prompt: Club Americano view-only on padelpals-website

Bring **view-only** club Americanos to the website dashboard: members signed into [dashboard.html](../dashboard.html) can discover their club’s open / live / completed Americanos, watch standings + current-round fixtures, and open a rankings-style fullscreen overlay for TV / projector. Do **not** add web join, scoring, or session create.

UK English in user-facing copy (e.g. “sign-ups”, “organised”).

---

## Goal

Club members can:

1. Open an **Americanos** tab on the dashboard and list club sessions
2. Open a **detail board** (standings + fixtures, or open-session info) — view-only
3. Enter a **fullscreen overlay** (mirror rankings FS) for cast / projector
4. Keep using the existing Worker share URL `https://padelpals.app/americano/{token}` as the public cast / deeplink surface (restyle in the same release)

```
Club member on dashboard
  → Americanos tab list
  → Detail (standings + fixtures)
  → Fullscreen overlay
List / detail → Supabase (REST list + RPC poll)
Worker share page → anon poll same RPC
```

---

## Context

iOS is the source of truth for Americano cloud data (create, RSVP, host manage, scoring). Android has a separate parity prompt. The website today has:

- No Americano tab or UI on the dashboard (only marketing/guide mentions)
- Rankings fullscreen overlay pattern ready to copy
- Tournament list + `#bracketModal` detail pattern ready to mirror
- Worker adaptive page in the sibling **padelpals** repo (`worker.js` → `americanoPageHtml`)

**Backend gap (required):** RLS on `americano_sessions` only lets club members `SELECT` when `status = 'open'`. Live / completed rows are host / signed-up / admin only — so a club member who did not play cannot load results via REST for the dashboard list.

`get_americano_by_token` already exposes live / completed payload to anon (share / TV stays public by token). No change needed to that RPC for cast links.

---

## Backend contract

Shared Supabase project. Tables / RPCs already live from Americano cloud migrations in the **padelpals** repo. Website implementation must apply **one new RLS migration** there; do not redefine tables or signup RPCs.

### Existing migrations (docs only — already applied)

| Migration | Purpose |
|---|---|
| `padelpals/supabase/migrations/20260810120000_americano_sessions.sql` | Tables, initial RLS, `get_americano_by_token`, `set_americano_signup`, realtime |
| `padelpals/supabase/migrations/20260810123000_fix_americano_rls_recursion.sql` | SECURITY DEFINER helpers; current `americano_sessions_select` |
| `padelpals/supabase/migrations/20260810134000_admin_set_americano_signup.sql` | Host add/remove registered players on behalf |

### Enums

| Enum | Values |
|---|---|
| `americano_session_status` | `draft` \| `open` \| `live` \| `completed` \| `cancelled` |
| `americano_signup_status` | `in` \| `withdrawn` |

### Tables (fields the website needs)

**`americano_sessions`**

| Column | Notes |
|---|---|
| `id` | uuid PK |
| `share_token` | text UNIQUE — detail poll + Worker / deep link |
| `club_id` | uuid? — list filter = current user’s club |
| `session_name` | text |
| `play_at` | timestamptz |
| `signup_deadline` | timestamptz? |
| `number_of_courts` | int |
| `points_to_win` | int (also on live payload) |
| `target_players` | int? |
| `min_rating` / `max_rating` | numeric? |
| `allowed_gender` | `NULL` / `'male'` / `'female'` |
| `status` | enum |
| `guest_players` | jsonb `[{ "id", "name" }]` |
| `payload` | jsonb live state (see below) |
| `current_round` | int |
| `updated_at` | timestamptz — “Updated …” |

**`americano_signups`** — optional for open-session counts if not using RPC; guests are **not** signup rows (count `guest_players.length` separately).

### RPCs

| RPC | Who | Args | Behaviour |
|---|---|---|---|
| `get_americano_by_token` | anon + authenticated | `token text` | jsonb `{ session, signup_count, my_signup, signups }` — prefer this for detail / FS / Worker so payload shape matches iOS |
| `set_americano_signup` | authenticated | `token`, `joining` | **Do not call** from website (view-only) |
| `admin_set_americano_signup` | authenticated | host add/remove | **Do not call** |

### Live payload shape (`session.payload`)

```json
{
  "players": [{ "id": "<uuid>", "name": "…", "user_id": "<uuid>?" }],
  "rounds": [{
    "id": "<uuid>",
    "round_number": 1,
    "fixtures": [{
      "id": "<uuid>",
      "round": 1,
      "court": 1,
      "team1": [{ "id", "name", "user_id?" }],
      "team2": [{ "id", "name", "user_id?" }],
      "team1_score": 12
    }],
    "sitting_out": [{ "id", "name", "user_id?" }]
  }],
  "current_round": 1,
  "points_to_win": 24,
  "number_of_courts": 2,
  "session_name": "…"
}
```

When scored, team2 points = `points_to_win - team1_score`.

### Standings algorithm (same as Worker)

Implement once and reuse in dashboard detail + fullscreen (+ keep Worker in sync):

1. Init each `payload.players[]` with `{ name, pts: 0, wins: 0, gp: 0 }`
2. For every fixture in every round where `team1_score != null`:
   - `s1 = team1_score`, `s2 = points_to_win - s1` (default `points_to_win` = 24)
   - Each team1 player: `pts += s1`, `gp += 1`, `wins += 1` if `s1 > s2`
   - Each team2 player: `pts += s2`, `gp += 1`, `wins += 1` if `s2 > s1`
3. Sort: **points desc**, then **wins desc**
4. Display columns: `#` / `Player` / `Pts` / `W`

Reference: `standingsFromPayload` in sibling `padelpals/worker.js` (~487–508).

---

## Required RLS migration (padelpals repo)

**Current policy** (`americano_sessions_select` in `20260810123000_fix_americano_rls_recursion.sql`):

```sql
-- club-member branch today
club_id IS NOT NULL
AND status = 'open'
AND public.is_club_member(club_id)
```

**Widen SELECT** so club members see open **and** live / completed:

```sql
DROP POLICY IF EXISTS americano_sessions_select ON public.americano_sessions;
CREATE POLICY americano_sessions_select ON public.americano_sessions
  FOR SELECT TO authenticated
  USING (
    host_user_id = auth.uid()
    OR public.is_global_admin()
    OR public.is_americano_signed_up(id)
    OR (
      club_id IS NOT NULL
      AND public.is_club_member(club_id)
      AND status IN ('open', 'live', 'completed')
    )
  );
```

| Keep unchanged | Notes |
|---|---|
| INSERT / UPDATE / DELETE on `americano_sessions` | Host / admin only |
| `americano_signups` policies | No change required for view-only |
| `set_americano_signup` eligibility | No change |
| `get_americano_by_token` | Already returns live/completed payload to anon |

Add a new migration file under `padelpals/supabase/migrations/` (timestamp after existing Americano migrations). Apply from the **padelpals** repo — not from this website repo.

`draft` / `cancelled` stay off the club-member list (host / signed-up / admin can still see via other branches where applicable). Dashboard filters never need draft.

---

## Website UX — checklist

Target file: [dashboard.html](../dashboard.html). Match existing Bootstrap tab + tournament modal patterns; reuse rankings fullscreen mechanics.

### A. Tab — Americanos

1. Add Bootstrap tab **after Tournaments** in `#dashboardTabs` (~1290–1308):
   - Button: `id="americanos-tab"`, `data-bs-target="#americanos"`
   - Pane: `id="americanos"`, `aria-labelledby="americanos-tab"`
2. Lazy-load on `shown.bs.tab` (same idea as tournaments ~2707 / rankings ~6283).
3. List query (authenticated REST), after RLS widen:

   ```
   GET /rest/v1/americano_sessions
     ?club_id=eq.{currentUserClub}
     &status=in.(open,live,completed)
     &select=id,share_token,session_name,play_at,signup_deadline,status,current_round,
             target_players,guest_players,min_rating,max_rating,allowed_gender,updated_at
     &order=play_at.desc
   ```

   Resolve `currentUserClub` the same way rankings does (`user_profiles` → `clubs` / `club_id`; see `currentUserClubId` / `window.currentUserClubData` ~6364–6372).
4. Optional: for open rows, fetch signup counts (`americano_signups` with `status=eq.in`) or show `guest_players` length + a count from a light secondary query. Prefer keeping list lean; detail uses RPC for accurate `signup_count`.
5. **Cards / rows:** name, play at, status badge, signup + guest count when `open`, round when `live`.
6. **Filters:** Live | Upcoming | Completed. Default = **Live + Upcoming** (`open` = upcoming). Persist filter in-memory for the session only (no need for localStorage unless rankings already does).
7. **Empty states:**
   - No club on profile → explain that Americanos are club-scoped; point user to complete club on profile
   - Club set but no sessions matching filters → friendly empty copy
8. Open card → detail view (same page).

### B. Detail — view-only board

Use a Bootstrap modal / panel pattern like `#bracketModal` (~1549–1568) + `openBracketModal` — not a separate route.

For selected session (prefer poll `get_americano_by_token(share_token)`):

| Status | UI |
|---|---|
| `open` | Header + play at, deadline, eligibility summary (`allowed_gender`, rating range), signup count (+ guests). **No join form.** CTA: “Join in the PadelPals app” + optional deep link `padelpals://americano/{token}` and/or QR / copy of `https://padelpals.app/americano/{token}` |
| `live` | Standings table + current-round courts with scores + sitting-out line. Poll every **3s**. Show “Updated …” from last successful fetch (or `session.updated_at`) |
| `completed` | Same board as live but “Final standings”; **stop polling** |
| `cancelled` / missing | Clear cancelled / not-found empty state (should be rare from club list) |

**Header always:** session name, club branding colours from `window.currentUserClubData` (`primary_color` / `secondary_color`), status badge, round (when live/completed).

**Current-round fixtures:** find round where `round_number === payload.current_round` (fallback last round). Show court teams + score (`team1_score – (points_to_win - team1_score)` or “—” if unscored).

**Sitting out:** if `round.sitting_out?.length`, show a single line (parity with iOS `AmericanoLiveStandingsView`) — e.g. “Sitting out: Name, Name”.

**Polling rules:**

- Interval **3000 ms** while `status === 'live'`
- Pause when `completed` / `cancelled`
- Pause when document / tab hidden (`visibilitychange`) or modal closed; resume when visible again if still live
- Prefer RPC so payload matches Worker / iOS

**Fullscreen button:** on live / completed detail only, same placement idea as `#fullscreenRankingsBtn` (~1745).

### C. Fullscreen mode (mirror rankings)

Do **not** require the browser Fullscreen API (rankings does not).

Copy / adapt the rankings FS pattern in [dashboard.html](../dashboard.html):

| Piece | Approx. lines | Copy |
|---|---|---|
| CSS | `#rankingsFullscreenOverlay` **1089–1251** | Fixed overlay, `.active`, header / body / footer / table / controls / progress bar |
| Markup | **7655–7708** | Overlay shell, progress bar, logo, list, Prev / Next / Rotate / Exit |
| JS | **7711–7982** | Open / close, theme, keyboard, auto-rotate, paging |

Constants to mirror: `FS_PAGE_SIZE = 20`, `FS_ROTATE_MS = 8000` (rankings also caps `FS_MAX_PLAYERS = 100` — apply a sensible cap for standings rows).

| Control | Action |
|---|---|
| Exit button | Close overlay |
| Esc | Close |
| Space | Pause / resume auto-rotate |
| Prev / Next (and ← / →) | Manual page; restart rotate timer |
| Progress bar | Animate over rotate interval |

**Branding:** `rankingsFsApplyTheme`-style from `window.currentUserClubData`:

- `primary_color` / `primaryColor` → header / accents (default `#FF6B35`)
- `secondary_color` / `secondaryColor` → overlay / footer bg (default `#0d1b2e`)
- `logo_url` → club logo (hide on missing / error)

**Content:**

1. Large standings table; page if many players; auto-rotate ~8s
2. Secondary strip **or** rotating page for current-round fixtures (+ sitting-out)
3. Live badge / “Final” when completed; round number in subtitle

While FS is open and session is live, keep the same 3s data poll (or share the detail poller) and re-render the current page without resetting the user’s pause state unnecessarily.

### D. Worker page polish (same release — padelpals repo)

File: sibling `padelpals/worker.js` — route `/americano/{token}` (~332–341), `americanoPageHtml` (~430–564).

Keep anon poll every 3s via `get_americano_by_token`. Upgrade UI so cast links feel like the dashboard FS board:

1. Clearer **Live** / **Final** badge; larger typography hierarchy
2. Render **sitting-out** for the current round
3. Status messaging:
   - `open` → sign-ups open + “Open in PadelPals” (existing)
   - `live` / `completed` → standings + fixtures
   - `cancelled` → cancelled empty state (today falls through to misleading sign-ups CTA)
   - `draft` → not public / ask host (do not look like open sign-ups)
4. Club colours: if a public `clubs` read by `session.club_id` exists for anon, apply primary / secondary; otherwise keep the dark green / gold TV theme (`#0b1f17` / `#d4af37`)
5. Keep `standingsFromPayload` algorithm identical to dashboard

---

## Data flow (locked decisions)

| Concern | Choice |
|---|---|
| Detail UI | Bootstrap modal / panel like tournaments — not a separate route |
| Tab placement | After Tournaments in `#dashboardTabs` |
| List fetch | Authenticated REST on `americano_sessions` (needs RLS widen) |
| Detail / FS fetch | Prefer `get_americano_by_token(share_token)` |
| FS paging | Same constants as rankings (`FS_PAGE_SIZE=20`, rotate 8s) |
| Worker colours | Attempt club branding via `club_id`; fallback dark TV theme |

---

## Important UX rules (do not skip)

1. **View-only** — no join form, no score inputs, no create / edit / delete on the web.
2. Open-session CTA is app-only: “Join in the PadelPals app” (+ optional deeplink / QR / copy share URL).
3. Poll only while live and visible; stop on completed / closed / hidden.
4. Standings math must match Worker (scored fixtures only; team2 = points_to_win − team1_score; sort pts then wins).
5. Sitting-out parity with iOS on detail, FS, and Worker.
6. No club on profile → empty state, not a broken list.
7. Do not use the browser Fullscreen API or Chromecast SDK.
8. Token charset for links: `^[A-Za-z0-9._-]+$` (same as Worker route).

---

## Reference anchors

| Area | Where |
|---|---|
| Dashboard tabs | `dashboard.html` `#dashboardTabs` ~1290–1308 |
| Tournament modal pattern | `#bracketModal` ~1549–1568, `openBracketModal` |
| Rankings FS CSS | `#rankingsFullscreenOverlay` ~1089–1251 |
| Rankings FS markup | ~7655–7708 |
| Rankings FS JS | ~7711–7982 (`openRankingsFullscreen`, rotate, keys) |
| Club branding source | `window.currentUserClubData` ~4194 / ~6372 |
| Worker route + HTML | `padelpals/worker.js` ~332–341, `americanoPageHtml` ~430–564 |
| Standings helper | `standingsFromPayload` ~487–508 |
| iOS live UI parity | `AmericanoLiveStandingsView.swift` (sitting-out, board) |
| Android product prompt (style / backend tables) | `padelpals/docs/AMERICANO_CLOUD_SIGNUP_LIVE_ANDROID_PROMPT.md` |

---

## Out of scope

- Scoring or joining from the website
- Creating / editing / deleting Americanos on the web
- Browser Fullscreen API / Chromecast SDK
- Android work (separate prompt)
- Changing iOS flows (already source of truth)
- Changing `set_americano_signup` eligibility or host manage RPCs
- Americano League / box-league product surfaces

---

## Acceptance checks

1. **RLS:** After migration, a signed-in club member who is **not** host and **not** signed up can `SELECT` club Americanos with `status` in `open`, `live`, `completed` via REST. They still cannot UPDATE / DELETE.
2. **Tab:** Americanos appears after Tournaments; lists club sessions ordered by `play_at` desc; filters Live / Upcoming / Completed default to Live + Upcoming.
3. **Empty:** No club on profile shows a clear empty state (no spurious errors).
4. **Open detail:** Shows schedule / deadline / eligibility / counts; CTA to join in the app only — no join form.
5. **Live detail:** Standings + current-round fixtures + sitting-out; polls every 3s; pauses when tab/modal hidden; “Updated …” advances.
6. **Completed detail:** Final standings; polling stopped; Fullscreen still available.
7. **Fullscreen:** Overlay uses club logo + colours; large standings; auto-rotate ~8s with progress bar; Exit / Esc / Space pause / Prev / Next work; no browser Fullscreen API required.
8. **Worker:** `/americano/{token}` shows clearer live/final board, sitting-out, and correct cancelled / draft messaging; anon poll still works.
9. **Standings:** For a scored fixture, team2 points = `points_to_win - team1_score`; order matches Worker.
10. **No regressions:** Rankings FS and tournament modal still work; no web scoring / RSVP UI shipped.

---

## Suggested commit messages

Split across repos:

**padelpals** (RLS + Worker):

```
Widen Americano club SELECT for live/completed and polish share TV page
```

**padelpals-website** (dashboard):

```
Add view-only club Americanos tab, detail board, and fullscreen overlay
```
