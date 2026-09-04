# Cowork prompt — Americano marketing screenshots and recording

Copy everything below the line into Claude Cowork / Claude Code Desktop (iOS Simulator).

---

```text
# Task: Capture Padel Pals Americano marketing screenshots (iOS Simulator)

## Goal
Drive the Padel Pals iOS app in Apple’s iOS Simulator and capture clean full-device screenshots of the **Americano** flow for the public website.

Save PNGs with the **exact filenames** below into:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/

When finished, write:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/AMERICANO_SCREENSHOT_CAPTURE_REPORT.md

listing each filename, pass/fail, and notes. Also record the short video named below.

Do **not** edit website HTML in this capture pass.

## Hard constraints
- iOS Simulator only. Prefer the same device used for the existing `mkt_*.png` pack (iPhone 17 Pro Max if available) — **dark mode**, portrait, club theme colours.
- Prefer a **throwaway / demo club** with non-identifying player names (e.g. “Court 1 Player A”). Do not publish real member names or ratings unless consent is already granted for that club.
- Do **NOT** overwrite existing files: `mkt_*.png` (except the new `mkt_americano_*` names listed), `Club_*.png`, `step_*.png`, `Box_*.png`, `Icon.png`, `app-store-badge.svg`, `og_share.png`.
- Full-device frames only. Wait for UI to settle (no spinners / half-open sheets).
- Dismiss keyboards before capture unless the shot is specifically about typing.
- Do not publish irreversible club-wide changes if avoidable (cancel confirm dialogs after capturing them).
- Prefer `xcrun simctl io booted screenshot "/full/path/to/filename.png"`.
- Use the same simulator/device, appearance, status-bar state and club theme for the complete set.

## Current app IA
Bottom tabs: Americano | Matches | Competitions | Stats | Profile

Americano is a first-class tab. Hosting and scoring work on iOS and Android; capture on iOS only for visual consistency with the existing marketing pack.

## Filename contract

| File | Navigate to | Must show |
|---|---|---|
| `mkt_americano_tab.png` | **Americano** tab | List of club sessions (open and/or live). Status labels readable. |
| `mkt_americano_setup.png` | Create or edit session | Courts, points to win, target players, eligibility (gender / rating) if those controls exist. |
| `mkt_americano_signups.png` | Open session sign-ups | Member sign-up list; guests if the UI shows them. |
| `mkt_americano_live.png` | Live session standings | Ranked table with points. |
| `mkt_americano_round.png` | Live current round | Fixtures for the current round; sitting-out names if shown. |
| `mkt_americano_share.png` | Share / QR / public board control in-app | Enough to explain that a public link exists. Skip this file (and note it) if no such screen exists. |

## Screen recording
Record 10–20 seconds covering create → sign-ups → live standings:

    xcrun simctl io booted recordVideo --codec=h264 "/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/mkt_americano_flow.mp4"

Stop after a clean pass. Trim later if needed. Also capture a still poster frame as `mkt_americano_poster.png` (a live standings shot is fine).

## Claim verification (write into the capture report)
Confirm from the live UI before anyone writes further marketing copy:

1. Courts / points-to-win / player-count controls — exact labels and whether player count is fixed.
2. Guest players — yes/no, and how they are added.
3. Who can host and score.
4. Gender / rating eligibility — present or not.
5. Format variants (Mexicano, team Americano, etc.) — name them only if the app actually offers them.
6. Share / public board — how the link is produced.

## Public web board (optional, outside Simulator)
If a demo session token is available, capture the browser page at `https://padelpals.app/americano/{token}` as `mkt_americano_web_board.png`. If the page looks unfinished, skip it and say so in the report. Do not invent a token.

## Checklist
- [ ] mkt_americano_tab.png
- [ ] mkt_americano_setup.png
- [ ] mkt_americano_signups.png
- [ ] mkt_americano_live.png
- [ ] mkt_americano_round.png
- [ ] mkt_americano_share.png (or noted skipped)
- [ ] mkt_americano_flow.mp4
- [ ] mkt_americano_poster.png
- [ ] AMERICANO_SCREENSHOT_CAPTURE_REPORT.md with claim verification
- [ ] No real member names unless consented
- [ ] Existing non-Americano `mkt_*.png` files untouched
```
