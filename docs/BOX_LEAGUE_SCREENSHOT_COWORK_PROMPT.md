# Cowork prompt — Box League marketing screenshots

Copy everything below the line into Claude Cowork / Claude Code Desktop (iOS Simulator).

---

```text
# Task: Capture Padel Pals Box League marketing screenshots (iOS Simulator)

## Goal
Drive the Padel Pals iOS app in Apple’s iOS Simulator and capture clean full-device screenshots of **Box League** for the public website (`boxleague.html` and the homepage spotlight).

Save PNGs with the **exact filenames** below into:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/

When finished, write:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/BOX_LEAGUE_SCREENSHOT_CAPTURE_REPORT.md

listing each filename, pass/fail, and notes.

Do **not** edit website HTML in this capture pass.

## Hard prerequisite — seed first
Mode currently has **no active box league** in Competitions (confirmed 16 Sep 2026 Court Bookings capture; Play times exist at club level only). Empty My Leagues is not usable for marketing.

Before any screenshot:

1. Seed a **populated** box league on the demo/Mode club (consent already granted for Mode).
2. Include at least two boxes or one box with several pairs, mix of completed and pending fixtures, and readable standings (Pts column).
3. Prefer a throwaway / demo club with non-identifying names if Mode cannot be seeded. Do not publish real member names unless consent is already granted.
4. If seeding is blocked, stop and write the capture report with what is missing. Do not capture empty states as `mkt_box_league_*`.

## Hard constraints
- iOS Simulator only. Prefer the same device used for the existing `mkt_*.png` pack (iPhone 17 Pro Max if available) — **dark mode**, portrait, club theme colours.
- Do **NOT** overwrite existing files: `mkt_*.png` (except the new `mkt_box_league_*` names listed), `Club_*.png`, `step_*.png`, `Box_*.png` (except the optional App Guide overwrite listed below), `Icon.png`, `app-store-badge.svg`, `og_share.png`.
- Full-device frames only. Wait for UI to settle (no spinners / half-open sheets).
- Dismiss keyboards before capture unless the shot is specifically about typing.
- Do not publish irreversible club-wide changes if avoidable (cancel confirm dialogs after capturing them). Do **not** submit a live Mode result unless that fixture is approved to complete.
- Prefer `xcrun simctl io booted screenshot "/full/path/to/filename.png"`.
- Use the same simulator/device, appearance, status-bar state and club theme for the complete set.

## Current app IA
Bottom tabs: Americano | Matches | Competitions | Stats | Profile

Box League is **not** a bottom tab. It lives under **Competitions → Leagues**.

Product names in the UI (verify; do not invent others):
- Competitions hub segments: **Tournament** | **Leagues**
- Leagues list title: **My Leagues**
- Filters: **All / Active / Upcoming / Completed** and **All Formats / Box / Americano**
- League detail title: **Leagues** — pills **Manage Teams** (staff), **Edit League Settings** (staff), **View League**, **Play times**
- View League: division picker, standings grid (`Team`, `Pts`), **Upcoming Matches**, **Match Results**
- Result sheet: **Set Scores**, **Award Walkover**, **Submit Result**
- Staff create: **+** → **Create New League** → **Box League** or Americano → **Create Box League** (League Name, Host Club, League Duration, Number of Boxes, Teams Per Box, Teams to Move, Private League)

Typical paths:

**Member:**
- Competitions → **Leagues** → a Box League → **View League**
- Grid cell or upcoming row → match sheet → **Set Scores** / **Submit Result**
- League detail or View League → **Play times**

**Club staff:**
- Competitions → Leagues → **+** → Create Box League
- League detail → Manage Teams / Edit League Settings / Play times

## Filename contract — required

| File | Navigate to | Must show |
|---|---|---|
| `mkt_box_league_leagues.png` | Competitions → **Leagues** | **My Leagues** list with at least one Box League card. Status (Active) readable. Prefer Box filter if Americano rows would confuse the shot. Tab bar visible if this is the hub root. |
| `mkt_box_league_standings.png` | **View League** | Standings grid: Team names, **Pts**, match cells. Division / box picker if more than one box. Populated, not empty. This is the homepage hero shot. |
| `mkt_box_league_match.png` | Upcoming match row **or** a pending grid cell | Fixture / match details (pairs, date if shown). Not the score-entry form. |
| `mkt_box_league_score.png` | Match result sheet | **Set Scores** (Set 1–3) and **Submit Result** visible. Keyboard dismissed. Capture then **Cancel** unless the fixture is approved to complete. |

Reuse existing `mkt_court_bookings_play_times.png` for Play times unless a league-scoped Play times screen (opened from a Box League, not the club-level list) is clearly better — in that case save it as `mkt_box_league_play_times.png` and note it in the report.

## Filename contract — capture if the live UI actually has them

| File | Navigate to | Must show |
|---|---|---|
| `mkt_box_league_hub.png` | Competitions hub | **Tournament** / **Leagues** segment control. Skip if `mkt_box_league_leagues.png` already shows it. |
| `mkt_box_league_detail.png` | Box League detail (before View League) | League name, Duration, Structure (boxes / teams), Promotion/Relegation if shown, **View League** + **Play times** pills. |
| `mkt_box_league_create.png` | Staff **Create Box League** | League Name, boxes / teams per box, Teams to Move if visible. Do not save a live league unless it is the seed you just created. |
| `mkt_box_league_promote.png` | Promotion / relegation or end-of-round | Only if a real screen exists. Skip rather than fake. |

## Optional — same session, App Guide `Box_*` overwrite
The public App Guide still uses Apr 2025 `Box_1`–`Box_11`. If the seeded league is on screen, also overwrite those files per `docs/GUIDE_SCREENSHOT_COWORK_PROMPT.md` Flows D & E. Do this **after** the `mkt_box_league_*` set so a mistake cannot clobber marketing names.

## Claim verification (write into the capture report)
Confirm from the live UI before anyone changes marketing copy:

1. Exact tab / segment / list titles (Competitions, Leagues, My Leagues, View League, Play times).
2. How a player opens a pending match and submits a result (grid cell vs Upcoming row vs +).
3. Set Scores labels and whether walkover is **Award Walkover**.
4. Play times entry points (league detail vs View League vs club-level).
5. Whether club staff create leagues in-app (**Create Box League** fields actually shown).
6. Scoring shown in the UI vs website rules (2–0 → 5–1, 2–1 → 4–2, walkover 4–0).
7. Promotion/relegation — on-screen copy (“N teams move between boxes”) vs a dedicated screen.

## Checklist
- [ ] Seeded populated box league (or report stopped here)
- [ ] mkt_box_league_leagues.png
- [ ] mkt_box_league_standings.png
- [ ] mkt_box_league_match.png
- [ ] mkt_box_league_score.png
- [ ] mkt_box_league_hub.png / detail / create / promote (or noted skipped)
- [ ] Optional Box_1…Box_11 overwrite (or noted skipped)
- [ ] BOX_LEAGUE_SCREENSHOT_CAPTURE_REPORT.md with claim verification
- [ ] No real member names unless consented
- [ ] Existing non-box-league `mkt_*.png` files untouched
```
