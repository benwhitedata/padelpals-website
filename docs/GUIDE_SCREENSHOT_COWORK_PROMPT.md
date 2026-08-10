# Cowork prompt — refresh App Guide screenshots (legacy flows)

Copy everything below the line into Claude Cowork / Claude Code Desktop (iOS Simulator).

---

```text
# Task: Capture refreshed Padel Pals App Guide screenshots (iOS Simulator)

## Goal
Drive the Padel Pals iOS app in Apple’s iOS Simulator and capture clean full-device screenshots for the **existing App Guide flows** whose UI has changed since Apr 2025:

1. Choose Club
2. Schedule Matches
3. Register / Record Match Result
4. View Box League
5. Submit Box League Result

Save PNGs with the **exact filenames** below into:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/

When finished, write:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/GUIDE_SCREENSHOT_CAPTURE_REPORT.md

listing each filename, pass/fail, and notes. Do not edit website HTML in this pass.

## Hard constraints
- iOS Simulator only. Prefer iPhone 17 Pro Max (or whatever matches the existing `mkt_*.png` pack) for consistency — **dark mode**, portrait, club theme colours.
- App already installed and signed in is fine (Mode club / consented demo account OK).
- Do **NOT** open, screenshot, or navigate into Americano.
- Do **NOT** overwrite: `mkt_*.png`, `Icon.png`, `app-store-badge.svg`, or any non-guide assets.
- **DO overwrite** these legacy guide filenames when capturing the new shots (same names so the guide can swap with minimal path churn):
  - `Club_1.png` … `Club_3.png`
  - `step_1.png` … `step_7.png`
  - `Box_1.png` … `Box_11.png`
- Full-device frames only. Wait for UI to settle (no spinners / half-open sheets).
- Dismiss keyboards before capture unless the shot is specifically about typing a player name.
- Do not submit irreversible league results or publish socials. Prefer cancelling confirm dialogs after capturing them, or use a scratch/pending box match if available.
- Prefer `xcrun simctl io booted screenshot "/full/path/to/filename.png"`.

## Current app IA (use these labels — not the old “Create Match” copy)
Bottom tabs: Americano | Matches | Competitions | Stats | Profile  
(You may see Americano — never select it for a guide shot.)

Matches menu pills include: Club Socials · Record Result · Schedule Match · Upcoming Matches · Match History

Competitions hub segments: Tournament | Leagues (Box League lives under **Leagues**)

---

## Flow A — Choose Club → overwrite Club_1…Club_3

| File | Navigate to | Must show |
|---|---|---|
| `Club_1.png` | Profile tab | Own profile with **Your Club** section visible (avatar/ratings OK above) |
| `Club_2.png` | Profile → Your Club → **Change** (or **Select Club**) | Club row / change control clearly visible before or as sheet opens — if sheet covers everything, capture Profile with Change highlighted first; prefer the Select Club entry state |
| `Club_3.png` | **Select Club** sheet | Search + club list (Mode or available clubs). Do not permanently switch clubs unless you can switch back. |

Navigation recipe:
1. Tap **Profile**
2. Scroll to **Your Club** → capture `Club_1.png`
3. Tap **Change** / **Select Club** → capture sheet list as `Club_3.png`
4. If Change control is hard to see under the sheet, dismiss once, capture Profile focused on Your Club+Change as `Club_2.png`, then reopen for `Club_3.png`

---

## Flow B — Schedule Matches → overwrite step_1…step_5

Old guide said “Create Match”. Current labels are **Schedule Match**.

| File | Screen |
|---|---|
| `step_1.png` | **Matches** tab → Matches menu (all pills visible, including Schedule Match) |
| `step_2.png` | **Schedule Match** sheet/form open (title Schedule Match) |
| `step_3.png` | Player picker open for one slot (club members list / search) |
| `step_4.png` | Schedule form with multiple players filled (or clearly in progress) + date/time if visible |
| `step_5.png` | **Match settings** expanded: Share with club, Counts towards ratings, Who can join, Level range, People I follow only — then stop. **Do not tap Schedule** (or cancel after capture). |

Navigation recipe:
1. Matches tab → capture menu → `step_1.png`
2. Tap **Schedule Match** → `step_2.png`
3. Open a player slot picker → `step_3.png`
4. Fill players / show scheduled date → `step_4.png`
5. Expand **Match settings** → `step_5.png` → dismiss without scheduling

---

## Flow C — Register / Record Match Result (after Flow B)

Schedule already owns `step_1`…`step_5`. Do **not** overwrite those again. Capture Record Result onto these files:

| File | Screen |
|---|---|
| `guide_record_form.png` | Matches → **Record Result** sheet: players + **Scoreboard** / set scores visible |
| `guide_record_confirm.png` | Confirmation **Record this result?** (or equivalent). Capture then tap **Cancel** |
| `step_6.png` | Same as `guide_record_form.png` (also write/copy here for legacy path compatibility) |
| `step_7.png` | Same as `guide_record_confirm.png` (also write/copy here) |

Optional: if Record Result’s Match settings disclosure is useful, expand it once and note in the report (no extra required filename).

Do **not** finalise recording a real result unless it is acceptable on the demo club.

---

## Flow D — View Box League → overwrite Box_1…Box_4

| File | Screen |
|---|---|
| `Box_1.png` | Main tab bar visible; prefer **Competitions** tab selected (not a blank launch) |
| `Box_2.png` | Competitions hub with **Leagues** segment selected |
| `Box_3.png` | **My Leagues** list (Box filter if present; avoid Americano rows) |
| `Box_4.png` | Box League detail / **View League** screen showing standings grid or league summary |

Navigation:
1. Competitions tab → Leagues → `Box_1.png` / `Box_2.png` as appropriate (tab + segment)
2. Open leagues list → `Box_3.png`
3. Open a Box League → View League → `Box_4.png`

---

## Flow E — Submit Box League Result → overwrite Box_5…Box_11

From the View League screen:

| File | Screen |
|---|---|
| `Box_5.png` | League grid / Upcoming Matches with a pending match cell or + affordance visible |
| `Box_6.png` | Match Details sheet (schedule date/time controls if shown) |
| `Box_7.png` | **Set Scores** entry (Set 1–3) |
| `Box_8.png` | **Submit Result** button visible (capture before tapping, or capture confirm if any) |
| `Box_9.png` | Back on league grid after dismiss/cancel OR after a safe submit |
| `Box_10.png` | Pull-to-refresh in progress or grid refreshing (optional; if hard, capture grid with a clear refresh hint / recent state and note in report) |
| `Box_11.png` | Standings / points updated view (or current standings if submit was cancelled — note in report) |

Prefer: open Match Details → fill scores for capture → capture Submit → **Cancel** without submitting if that protects live league data. If you must submit, use a match that is OK to complete.

---

## Quality bar
- Dark mode, club primary/secondary colours, consistent device across the set
- Readable text; no permission dialogs; no Americano
- Populated Box League preferred over empty states — if leagues are empty, stop and report what is missing

## Deliverables checklist
- [ ] Club_1…3 overwritten
- [ ] step_1…5 overwritten (Schedule path)
- [ ] step_6…7 overwritten (Record score path)
- [ ] guide_record_form.png + guide_record_confirm.png written
- [ ] Box_1…11 overwritten (or gaps listed)
- [ ] GUIDE_SCREENSHOT_CAPTURE_REPORT.md written
- [ ] No website HTML changes
- [ ] No Americano screenshots

Start by confirming Simulator is booted, dark mode, Padel Pals at the main tab bar, then run Flow A → E in order.
```
