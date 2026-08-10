# Plan: Refresh App Guide screenshots for current app UX

## Context

The public App Guide ([`guide.html`](../guide.html)) still drives five **legacy** walkthroughs with Apr 2025 images (`Club_*`, `step_*`, `Box_*`). Copy still says “Create Match” and “main menu → Box League”, but the live app uses:

- Matches → **Schedule Match** / **Record Result**
- Competitions → **Leagues** → Box League
- Profile → **Your Club** → Change

Newer guide tabs (Profile, Stats, Find a Match, Club Socials, Badges, Competitions) already use `mkt_*.png` and stay out of scope except for copy polish if labels drift.

**Americano** guide stub stays untouched.

Consent for Mode club screenshots is granted.

---

## Phase 0 — Capture (Cowork) — STATUS 10 Aug 2026

See [`images/GUIDE_SCREENSHOT_CAPTURE_REPORT.md`](../images/GUIDE_SCREENSHOT_CAPTURE_REPORT.md). Legacy backup: `images/_legacy_guide_2025/`.

| Flow | Status |
|---|---|
| Choose Club | ✅ Club_1–3 refreshed |
| Schedule Match | ✅ step_1–5 refreshed |
| Record Result | ⚠️ form done (`guide_record_form` / step_6); confirm dialog still missing |
| View / Submit Box League | ❌ blocked — My Leagues empty; Box_1–11 still Apr 2025 |

**Remaining capture:** (1) Record confirm on a throwaway club or accepted live match → `guide_record_confirm.png` + `step_7.png`. (2) Seed Mode box league + fixture → re-run Flows D & E.

**Outputs (overwrite legacy names):**

| Flow | Files |
|---|---|
| Choose Club | `Club_1.png` … `Club_3.png` |
| Schedule Match | `step_1.png` … `step_5.png` |
| Record Result | `guide_record_form.png`, `guide_record_confirm.png`, plus `step_6.png` / `step_7.png` copies |
| View Box League | `Box_1.png` … `Box_4.png` |
| Submit Box Result | `Box_5.png` … `Box_11.png` |

Do not overwrite `mkt_*.png`.

---

## Phase 1 — Rewrite guide copy + step structure ([`guide.html`](../guide.html))

**Status:** Choose Club, Schedule, and Record guide cases updated to current copy/images (10 Aug 2026). Box League cases still use Apr 2025 `Box_*` assets until capture unblocks — do not rewrite those steps yet (new copy + old UI would mismatch).

Update the five legacy `switch` cases. Keep alternating image/text layout.

### 1. `chooseClub`
- Step 1: Profile tab → Your Club (`Club_1`)
- Step 2: Tap **Change** / **Select Club** (`Club_2`)
- Step 3: Pick club in **Select Club** sheet (`Club_3`)
- Drop “Launch the app and click Player Profile” vagueness; say **Profile** tab explicitly.

### 2. `schedule`
- Step 1: Matches menu (`step_1`)
- Step 2: **Schedule Match** (`step_2`) — replace “Create Match”
- Step 3: Player picker (`step_3`)
- Step 4: Players + date/time (`step_4`)
- Step 5: **Match settings** / Who can join (`step_5`); CTA is **Schedule**, not save/score
- One-line link to [`find-a-match.html`](../find-a-match.html) for join gates.

### 3. `register`
Stop cloning the Schedule screenshots for steps 2–5. New structure:

| Step | Image | Copy |
|---|---|---|
| 1 | `step_1.png` | Matches menu |
| 2 | `guide_record_form.png` | Open **Record Result**, pick players, enter scoreboard |
| 3 | `step_5.png` or settings on record form | Optional Match settings (share / ratings / privacy) |
| 4 | `guide_record_confirm.png` | Confirm **Record this result?** |
| — | — | Note alt path: pending match → **Enter Score** |

Remove obsolete “Create Match” / duplicated player-selection ladder unless still accurate on Record Result.

### 4. `view` (View Box League)
- Step 1: **Competitions** tab (`Box_1`)
- Step 2: Segment **Leagues** (`Box_2`)
- Step 3: **My Leagues** list / select Box League (`Box_3`)
- Step 4: **View League** standings grid (`Box_4`)
- Remove “Box League option from the main menu”.

### 5. `submit` (Submit Box League Result)
Keep ~7–9 steps but align labels to Match Details / Set Scores / Submit Result:

1. Open league grid (`Box_4` or `Box_5`)
2. Tap pending cell / Upcoming match (`Box_5`)
3. Match Details (+ optional schedule) (`Box_6`)
4. Enter Set Scores (`Box_7`)
5. Submit Result (`Box_8`)
6. Return to grid (`Box_9`)
7. Refresh if needed (`Box_10`)
8. Updated standings (`Box_11`)

Drop or soften “click the + icon” if the current UI is cell/row tap only — match whatever the capture report shows.

### 6. Guide chrome (light)
- Hero subtitle: mention Matches · Competitions · Profile tabs.
- Button labels: rename **Register Match Result** → **Record Match Result**; **Schedule Matches** can stay or become **Schedule a Match**.
- Leave Americano button/stub as-is.

---

## Phase 2 — Consistency sweep (small)

| File | Change |
|---|---|
| [`support.html`](../support.html) | FAQ lines that still say Create Match / old Box navigation → current labels |
| [`boxleague.html`](../boxleague.html) | Only if it still says results must be submitted via outdated menu paths |
| Marketing pages | No change (already on `mkt_*`) |

---

## Phase 3 — Ship

1. Commit images + `guide.html` (+ FAQ/boxleague if touched) + capture report.
2. Push `main` (GitHub Pages → www.padelpals.app).
3. Smoke-test each guide tab on production.

---

## Out of scope

- Americano guide content
- Replacing `mkt_*` marketing shots
- Dashboard / web product parity
- Android-specific screenshots (iOS dark club-themed pack is the source of truth)

---

## Success criteria

- No guide step shows Apr 2025 “Create Match” chrome or pre-tab-bar IA.
- Schedule and Record are visually distinct flows.
- Box League guides start from **Competitions → Leagues**.
- Dark club-themed frames match the rest of the live marketing site.
- Americano remains a stub only.
