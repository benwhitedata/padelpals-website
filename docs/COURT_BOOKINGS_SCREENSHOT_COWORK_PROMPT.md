# Cowork prompt — Court Bookings marketing screenshots

Copy everything below the line into Claude Cowork / Claude Code Desktop (iOS Simulator).

---

```text
# Task: Capture Padel Pals Court Bookings marketing screenshots (iOS Simulator)

## Goal
Drive the Padel Pals iOS app in Apple’s iOS Simulator and capture clean full-device screenshots of **Court Bookings** for the public website (`court-bookings.html` and the homepage spotlight).

Save PNGs with the **exact filenames** below into:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/

When finished, write:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/COURT_BOOKINGS_SCREENSHOT_CAPTURE_REPORT.md

listing each filename, pass/fail, and notes.

Do **not** edit website HTML in this capture pass.

## Hard constraints
- iOS Simulator only. Prefer the same device used for the existing `mkt_*.png` pack (iPhone 17 Pro Max if available) — **dark mode**, portrait, club theme colours.
- Prefer a **throwaway / demo club** with non-identifying player names (e.g. “Court 1 Player A”). Do not publish real member names unless consent is already granted for that club.
- Do **NOT** overwrite existing files: `mkt_*.png` (except the new `mkt_court_bookings_*` names listed), `Club_*.png`, `step_*.png`, `Box_*.png`, `Icon.png`, `app-store-badge.svg`, `og_share.png`.
- Full-device frames only. Wait for UI to settle (no spinners / half-open sheets).
- Dismiss keyboards before capture unless the shot is specifically about typing.
- Do not publish irreversible club-wide changes if avoidable (cancel confirm dialogs after capturing them). Do **not** turn **Member booking is live** off on a live club.
- Prefer `xcrun simctl io booted screenshot "/full/path/to/filename.png"`.
- Use the same simulator/device, appearance, status-bar state and club theme for the complete set.

## Current app IA
Bottom tabs: Americano | Matches | Competitions | Stats | Profile

Court Bookings is **not** a bottom tab. Product names in the UI: **Book a court**, **Courts and booking**, **My court bookings**, **Players**, **Member booking is live**.

Typical paths:

**Member (allowlisted, live on):**
- Club Home / Matches Home → **Your courts** / **Book a court**
- Profile → **Courts** → Book a court / My court bookings
- Matches menu may also expose **Book a court**

**Club admin:**
- Profile → Club Admin Area → **Courts and booking**
- Profile → Club Admin Area → **Players** (Court booking switches)

**Coach:**
- Add / Edit Group Lesson → **Court** picker and **Keep court even if empty**

**Club Socials:**
- Create / open a social without courts booked → **Book these courts first?** / “Book these courts before opening the social.”
- Staff book-as type **Club social** on the day board

**Box League:**
- Competitions → a Box League → **Play times**
- Court booking detail may link to a play window / Enter score when assigned

## Filename contract — required

| File | Navigate to | Must show |
|---|---|---|
| `mkt_court_bookings_board.png` | **Book a court** day board | Date header, quota chip if shown, hourly gutter, at least two courts, mixed **Free** / **Booked** / **Held** (Lesson if present). Title **Book a court**. |
| `mkt_court_bookings_settings.png` | Club Admin Area → **Courts and booking** | **Member booking is live** plus Hours and/or Everyone (advance, quota, cancel). Keyboard dismissed. Scroll so rules are readable — hours + Everyone on one frame if they fit. |
| `mkt_court_bookings_players.png` | Club Admin Area → **Players** | Player rows with trailing **Court booking** switches. Filter All / Allowed / Not allowed if visible. Footer: ticked players can book when member booking is live. Demo names. |
| `mkt_court_bookings_social.png` | Create Club Social **or** staff book-as | Prefer the **Book these courts first?** confirm (“This social’s courts are still free…”) **or** a staff booking with type **Club social**. Do not leave a live social half-created. |
| `mkt_court_bookings_lesson.png` | Add / Edit Group Lesson, **Court** section | Court picker (named court) and **Keep court even if empty**. Keyboard dismissed. |
| `mkt_court_bookings_play_times.png` | Box League **Play times** **or** a court booking detail that links to a play window | Shared window times / courts, or booking detail with box-league / Enter score context. Populated preferred over empty. |

## Filename contract — strongly recommended

| File | Navigate to | Must show |
|---|---|---|
| `mkt_court_bookings_detail.png` | Own **Court booking** detail | Type, times, **Add to Calendar**, cancel. |
| `mkt_court_bookings_my.png` | **My court bookings** | Upcoming member list (no staff Edit / no-show). |
| `mkt_court_bookings_home.png` | Club Home **Your courts** | Next booking row + Book a court. |

## Screen recording (optional)
Record 10–20 seconds: Club Home **Book a court** → day board → tap a free slot → duration:

    xcrun simctl io booted recordVideo --codec=h264 "/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/mkt_court_bookings_flow.mp4"

Stop after a clean pass. Do not complete a real booking on a live club if that is unwelcome — cancel after capture.

## Claim verification (write into the capture report)
Confirm from the live UI:

1. Navigation titles — Book a court / Courts and booking / Players / My court bookings / Play times.
2. Day-board cell labels — Free, Booked, Your booking, Held, Lesson, Listed, Closed.
3. Member booking is live copy and Players footer.
4. Slot length options shown (30 / 60 / 90) if visible in settings.
5. Social gate copy — “Book these courts before opening the social.”
6. Lesson — Court picker + Keep court even if empty footer.
7. Box league play times — how they appear on the board vs Play times list.
8. Whether waitlist / Add to Calendar appear on detail.

## Checklist
- [ ] mkt_court_bookings_board.png
- [ ] mkt_court_bookings_settings.png
- [ ] mkt_court_bookings_players.png
- [ ] mkt_court_bookings_social.png
- [ ] mkt_court_bookings_lesson.png
- [ ] mkt_court_bookings_play_times.png
- [ ] mkt_court_bookings_detail.png (or noted skipped)
- [ ] mkt_court_bookings_my.png (or noted skipped)
- [ ] mkt_court_bookings_home.png (or noted skipped)
- [ ] mkt_court_bookings_flow.mp4 (optional)
- [ ] COURT_BOOKINGS_SCREENSHOT_CAPTURE_REPORT.md with claim verification
- [ ] No real member names unless consented
- [ ] Existing non-court-booking `mkt_*.png` files untouched
```
