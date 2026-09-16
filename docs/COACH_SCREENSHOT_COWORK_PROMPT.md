# Cowork prompt — Group Lessons marketing screenshots and recording

Copy everything below the line into Claude Cowork / Claude Code Desktop (iOS Simulator).

---

```text
# Task: Capture Padel Pals Group Lessons marketing screenshots (iOS Simulator)

## Goal
Drive the Padel Pals iOS app in Apple’s iOS Simulator and capture clean full-device screenshots of the **Group Lessons / coaching** flow for the public website (`coaches.html`).

Save PNGs with the **exact filenames** below into:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/

When finished, write:

/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/COACH_SCREENSHOT_CAPTURE_REPORT.md

listing each filename, pass/fail, and notes. Also record the short video named below if you can get a clean pass.

Do **not** edit website HTML in this capture pass.

## Hard constraints
- iOS Simulator only. Prefer the same device used for the existing `mkt_*.png` pack (iPhone 17 Pro Max if available) — **dark mode**, portrait, club theme colours.
- Prefer a **throwaway / demo club** with non-identifying player names (e.g. “Court 1 Player A”). Do not publish real member names or ratings unless consent is already granted for that club.
- Do **NOT** overwrite existing files: `mkt_*.png` (except the new `mkt_coach_*` names listed), `Club_*.png`, `step_*.png`, `Box_*.png`, `Icon.png`, `app-store-badge.svg`, `og_share.png`.
- Full-device frames only. Wait for UI to settle (no spinners / half-open sheets).
- Dismiss keyboards before capture unless the shot is specifically about typing.
- Do not publish irreversible club-wide changes if avoidable (cancel confirm dialogs after capturing them).
- Prefer `xcrun simctl io booted screenshot "/full/path/to/filename.png"`.
- Use the same simulator/device, appearance, status-bar state and club theme for the complete set.
- Do **not** capture Stripe / Apple Pay sheets with live card details, or any PAN / CVV.

## Current app IA
Bottom tabs: Americano | Matches | Competitions | Stats | Profile

Coaching is **not** a bottom tab. Typical paths:

**Coach (account with `is_coach`):**
- Profile → Coach dashboard
- Profile / dashboard → **My lessons** (title: My lessons). `+` adds a Group Lesson.
- Add Group Lesson: Lesson catalogue, Repeat Weekly / One-off, group size, who can book.

**Player:**
- Club Home → **Group Lessons this week** / **Book a Group Lesson**
- Profile → **Book a Group Lesson** / **My lessons**
- Matches menu may also expose Lessons.

Product name in the UI is **Group Lessons**. Defaults: 60 minutes, four players, £15 per player. Recurrence is **Weekly** or **One-off**. Players book one week at a time. Do not label club social fixtures as “arranged lessons”.

## Filename contract — required

| File | Navigate to | Must show |
|---|---|---|
| `mkt_coach_club_home.png` | Club Home as a **player** | **Group Lessons this week** (or equivalent) with at least one joinable class. |
| `mkt_coach_my_lessons.png` | Coach **My lessons** | Offering list: title, Weekly/One-off summary, price · player count · eligibility (e.g. Ladies · 3.0–4.5). Notify / share visible if present. |
| `mkt_coach_add_catalog.png` | Add Group Lesson → **Lesson** picker | **Band training** section plus at least one skill group (e.g. At Net). Keyboard dismissed. |
| `mkt_coach_add_when.png` | Add Group Lesson, **When** | Repeat **Weekly** selected, day of week, start/end series dates. |
| `mkt_coach_add_who.png` | Add Group Lesson, **Group size** + **Who can book** | 4 players, rating band, Gender (All / Men / Ladies). Keyboard dismissed. |
| `mkt_coach_book_list.png` | Player **Book a Group Lesson** | “This week” (and Later if shown), class title, spots, price, eligibility. |
| `mkt_coach_dashboard.png` | **Coach dashboard** | Upcoming bookings, spots, suggested hourly rate (guide). |
| `mkt_coach_roster.png` | Dashboard → one lesson | **Who's joined**, names + rating/paid state. Use demo names. |

## Filename contract — strongly recommended

| File | Navigate to | Must show |
|---|---|---|
| `mkt_coach_add_oneoff.png` | Add Group Lesson with Repeat **One-off** | Date picker — contrast to the weekly shot. |
| `mkt_coach_skip_dates.png` | Offering dates | Joined vs **Skipped** week. |
| `mkt_coach_notify.png` | Notify eligible members confirm, or list with Notify | Push-to-band copy, not WhatsApp. |
| `mkt_coach_waitlist.png` | Book screen, full class | Waitlist control if the UI shows it. Skip and note if not. |
| `mkt_coach_my_bookings.png` | Player **My lessons** | Confirmed booking; 24h cancel context if visible. |
| `mkt_coach_one_to_one.png` | Add lesson **1 player** *or* **Lesson rate** sheet | Footer: hourly rate is a 1-to-1 guide; groups stay £15/player. |
| `mkt_coach_profile.png` | Coach profile | Bio + Group Lessons + Book a Group Lesson. |

## Screen recording (optional)
Record 10–20 seconds covering Add Group Lesson → My lessons list → player Book a Group Lesson:

    xcrun simctl io booted recordVideo --codec=h264 "/Users/benwhite/Library/Mobile Documents/com~apple~CloudDocs/Developer/padelpals-website/images/mkt_coach_flow.mp4"

Stop after a clean pass. Trim later if needed. Also capture a still poster frame as `mkt_coach_poster.png` (Club Home or My lessons is fine).

## Claim verification (write into the capture report)
Confirm from the live UI before anyone writes further marketing copy:

1. Navigation titles — My lessons / Add Group Lesson / Book a Group Lesson / Coach dashboard.
2. Defaults — duration, group size, price per player.
3. Repeat options — exact labels (Weekly / One-off) and whether series start/end exist.
4. Lesson picker — Band training vs skill groups vs Other.
5. Who can book — rating band tightness, Men / Ladies / All.
6. Group size range (expect 1–8) and how 1 player is labelled.
7. Suggested hourly rate — copy that it is a 1-to-1 guide only.
8. Notify / skip date / waitlist — present or not, exact labels.
9. Payment — Stripe / Apple Pay / £0 free class behaviour (do not screenshot card PAN).
10. Cancel — 24-hour copy if shown.

## Checklist
- [ ] mkt_coach_club_home.png
- [ ] mkt_coach_my_lessons.png
- [ ] mkt_coach_add_catalog.png
- [ ] mkt_coach_add_when.png
- [ ] mkt_coach_add_who.png
- [ ] mkt_coach_book_list.png
- [ ] mkt_coach_dashboard.png
- [ ] mkt_coach_roster.png
- [ ] mkt_coach_add_oneoff.png (or noted skipped)
- [ ] mkt_coach_skip_dates.png (or noted skipped)
- [ ] mkt_coach_notify.png (or noted skipped)
- [ ] mkt_coach_waitlist.png (or noted skipped)
- [ ] mkt_coach_my_bookings.png (or noted skipped)
- [ ] mkt_coach_one_to_one.png (or noted skipped)
- [ ] mkt_coach_profile.png (or noted skipped)
- [ ] mkt_coach_flow.mp4 (optional)
- [ ] mkt_coach_poster.png (optional)
- [ ] COACH_SCREENSHOT_CAPTURE_REPORT.md with claim verification
- [ ] No real member names unless consented
- [ ] Existing non-coach `mkt_*.png` files untouched
```
