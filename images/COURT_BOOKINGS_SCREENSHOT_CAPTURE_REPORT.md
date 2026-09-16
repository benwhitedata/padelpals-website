# Court Bookings marketing screenshot capture — report

**Captured:** 16 September 2026, ~07:32–08:15 BST  
**Device:** iPhone 17 Pro Max simulator (`49E47D01-FC4D-490B-BE01-1D84A62CADF3`), iOS 26.1, portrait, **dark mode**  
**Club / account:** Mode, signed-in staff (same pack as the existing `mkt_*.png` set)  
**Output:** `padelpals-website/images/mkt_court_bookings_*.png`, 1320 × 2868 px full-device frames

---

## Results

| File | Status | Notes |
|---|---|---|
| `mkt_court_bookings_board.png` | Pass | **Book a court** day board, Wednesday 16 September, Staff/Member, quota chip, Padel 1 / Padel 2, mixed booked slots (named members) and free `+` cells. Deep-link sheet (no tab bar). |
| `mkt_court_bookings_settings.png` | Pass | **Courts and booking**: Member booking is live on, Players row, Hours, Slot length 30/60/90. Keyboard dismissed. |
| `mkt_court_bookings_players.png` | Pass | **Players**: All / Allowed / Not allowed, Court booking switches. Live Mode names (same consent as the rest of the marketing pack). |
| `mkt_court_bookings_social.png` | Pass | Staff **Hold a court** with reason **Club social** (Padel 1 selected). Not saved. Preferred “Book these courts first?” confirm was not captured this pass. |
| `mkt_court_bookings_lesson.png` | Pass | **Add Group Lesson** Court section: named court **Padel 1**, **Keep court even if empty** off, footer visible. Cancelled, not saved. |
| `mkt_court_bookings_play_times.png` | Pass | **Play times** upcoming list: Open / Confirmed / Not available, declared counts, staff `+`. Populated club windows. |
| `mkt_court_bookings_home.png` | Pass (recommended) | Club Home **Your courts**: Book a court + next booking (Padel 1, 11:00–12:00). |
| `mkt_court_bookings_detail.png` | Skipped | Own booking detail not shot. |
| `mkt_court_bookings_my.png` | Skipped | My court bookings not shot on Pro Max. |
| `mkt_court_bookings_flow.mp4` | Skipped | Optional recording not taken. |

---

## Claim verification (from live UI)

1. **Titles** — Book a court; Courts and booking; Players; Play times. My court bookings exists on Profile (seen on a second simulator; not filed).
2. **Day-board cells** — Free slots show `+`; booked slots show player name and times. Held / Lesson / Listed / Closed were not all on this Wednesday board.
3. **Member booking is live** — Toggle on, with copy that only ticked Players can book when it is on. Players list has Court booking switches and All / Allowed / Not allowed.
4. **Slot length** — 30 / 60 / 90 min visible on Courts and booking.
5. **Social gate** — Hold editor reason **Club social** captured. Confirm copy “Book these courts first?” / “This social’s courts are still free…” was not on screen this pass (create-social path did not present it before capture).
6. **Lesson** — Court picker with named court (Padel 1) and **Keep court even if empty**, plus footer that members can still book until someone joins.
7. **Box league play times** — Staff list of shared windows (times, Open/Confirmed/Not available). Mode has no *active* box league in Competitions (filters show none); play windows exist at club level. Day board did not show a play-window fixture in the captured Wednesday frame.
8. **Waitlist / Add to Calendar** — Not verified; booking detail skipped.

---

## Notes

- Same Mode club and real member names as the existing marketing pack.
- No live club setting was turned off. Holds and Group Lessons were cancelled without Save.
- XCUITest was used for settings / players / social / lesson. A later UITest reinstall signed the Pro Max out; after sign-in, Play times and Home were captured with `simctl` (no app reinstall).
- Existing non-court-booking `mkt_*.png` files were not overwritten.
