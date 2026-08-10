# Cowork prompt — Record Result guide screenshots only

Copy everything below the line into Claude Cowork / Claude Code Desktop (iOS Simulator).

This is a **separate flow from Schedule Match**. Do not overwrite `step_1.png`…`step_5.png` (those belong to Schedule).

---

```text
# Task: Capture Record Result App Guide screenshots (iOS Simulator)

## Goal
Capture the **Record Result** walkthrough as its own flow (not Schedule Match). Save PNGs into:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/

When finished, append a short section to:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/GUIDE_SCREENSHOT_CAPTURE_REPORT.md

under heading “## Flow C — Record Result (follow-up)”.

Do not edit website HTML in this pass.

## Hard constraints
- iOS Simulator only. Same device as the mkt_/guide pack if possible: iPhone 17 Pro Max, portrait, **dark mode**.
- Signed-in account OK (Mode / consented). Prefer a **throwaway club** or a match you are happy to keep if a confirm dialog only appears after commit — see “Confirm capture” below.
- Do **NOT** open Americano.
- Do **NOT** overwrite: `mkt_*.png`, `Club_*.png`, `step_1.png`…`step_5.png`, `Box_*.png`, `Icon.png`, `app-store-badge.svg`.
- You **MAY** overwrite: `guide_record_form.png`, `step_6.png` (legacy alias of the filled form).
- Full-device frames. Wait for UI to settle. Prefer:
  `xcrun simctl io booted screenshot "/full/path/to/file.png"`

## Why this is not Schedule
| Schedule Match | Record Result |
|---|---|
| Matches → **Schedule Match** | Matches → **Record Result** |
| Future date/time, no scoreboard | Played date + **Scoreboard** |
| CTA: **Schedule** | CTA: **Record Result** |

Use only the Record Result path.

---

## Exact files to write

| File | Screen | Notes |
|---|---|---|
| `guide_record_sheet.png` | **Record Result** sheet just after opening — empty or mostly empty Team slots, Scoreboard visible, title **Record Result** | This is guide Step 2 (parallel to Schedule’s step_2). **Required.** |
| `guide_record_players.png` | **Select Player** picker opened from a Record Result slot | Optional but preferred (mirrors Schedule step_3). |
| `guide_record_form.png` | Record Result fully filled: four players + set scores on Scoreboard + **Record Result** button enabled | Overwrite existing. Also copy to `step_6.png`. |
| `guide_record_confirm.png` | Confirmation after tapping Record Result (e.g. **Record this result?**) | **Required** for guide Step 4. Also copy to `step_7.png`. |

---

## Navigation recipe

1. Matches tab → Matches menu (do not re-save step_1 unless asked).
2. Tap **Record Result** (not Schedule Match).
3. Wait for sheet → capture `guide_record_sheet.png`.
4. Open one player slot → capture `guide_record_players.png` → pick a player or dismiss picker.
5. Fill four players, played date, enter set scores (e.g. 6–4, 6–3) → capture `guide_record_form.png` and copy/write `step_6.png` the same.
6. **Confirm capture (choose one):**
   - **Preferred:** switch to a throwaway/demo club first, then tap **Record Result**, capture the confirm dialog as `guide_record_confirm.png` (+ `step_7.png`), then **Cancel** if Cancel dismisses without saving — or complete the record if Cancel is not offered and the club is throwaway.
   - **Mode club:** STOP before tapping Record Result and ask the user whether to proceed. Do not move live ratings without approval.
7. Dismiss without leaving the app in a broken state.

## Quality bar
- Dark mode, club theme colours, readable text
- Sheet title must read **Record Result**, not Schedule Match
- Scoreboard must be visible on form shots
- No Americano; no HTML edits

## Deliverables checklist
- [ ] guide_record_sheet.png
- [ ] guide_record_players.png (or noted skipped)
- [ ] guide_record_form.png + step_6.png
- [ ] guide_record_confirm.png + step_7.png
- [ ] Report section appended
- [ ] Nothing scheduled/recorded on Mode unless user approved

Start at the Matches menu, then open Record Result only.
```
