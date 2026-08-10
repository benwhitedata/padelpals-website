# PadelPals marketing screenshot capture — report

**Captured:** 10 August 2026, ~14:03–14:15 BST
**Device:** iPhone 17 Pro Max simulator, iOS 26.1, portrait, **dark mode**
**Build:** the app already installed and signed in on the simulator (club: *Mode*, account: Ben White, rating 7.3)
**Output:** all files written to `padelpals-website/images/` as `mkt_*.png`, 1320 × 2868 px full-device frames

---

## Results

| # | Filename | Screen | Status |
|---|---|---|---|
| 1 | `mkt_stats_me.png` | Stats → Me: form dots, 2W streak, best run 7W, bagels 16, comebacks 11, best partnership, toughest opponent, badge progress (183/200) | ✅ |
| 2 | `mkt_stats_hub.png` | Same frame as #1 — Me / Players / Club segment control visible at bottom | ✅ (duplicate of #1) |
| 3 | `mkt_stats_leaderboard.png` | Stats → Club → Leaderboard, Club / All / Men / Ladies / **Followed** filters, ranks 1–10 with ratings | ✅ |
| 4 | `mkt_stats_players.png` | Stats → Players directory with search, match counts and win % | ✅ *(bonus, not on original list)* |
| 5 | `mkt_profile_public.png` | Adam Haffar public profile: avatar, club, **Follow** button, match rating 7.3 / 78% confidence / Advanced, coach rating, Playtomic level, head-to-head, rating trend chart | ✅ |
| 6 | `mkt_profile_own.png` | Own Player Profile: gender, preferred side, Playtomic level, coach rating, match rating, Advanced category description, 88.1% confidence | ⚠️ shows "Change photo / Remove photo" buttons — slightly editorial, still usable |
| 7 | `mkt_badges_gallery.png` | Badges gallery, **cropped** to Matches / Box League / Tournaments | ✅ (see note 1) |
| 7b | `mkt_badges_gallery_full.png` | Uncropped original of the same screen | ⚠️ contains an Americano section — **do not publish** |
| 8 | `mkt_badges_unlock.png` | Badge detail overlay: Gold tier, Box Champion, criteria, "Unlocked 8 Aug 2026", Share Badge | ✅ (substituted for the live unlock animation — see note 2) |
| 9 | `mkt_join_board.png` | Upcoming Matches → **Club** tab, populated with club fixtures, ratings and level bands | ⚠️ substitution — see note 3 |
| 9b | `mkt_join_filters.png` | Join board filter sheet: My club only, Gender (All/Men/Ladies/Anyone), Format (All/Open/Competitive), Level range | ✅ *(bonus — this is the strongest "find a match" asset)* |
| 9c | `mkt_upcoming_mine.png` | Upcoming Matches → **Mine**, showing "Open" player slots and "People I follow" gating on a fixture | ✅ *(bonus)* |
| 10 | `mkt_schedule_gates.png` | Schedule Match → **Who can join**: All/Men/Ladies, level range slider 6.3–8.8, "People I follow only" toggle, Share with club, Counts towards ratings | ✅ best-in-set |
| 11 | `mkt_club_socials_list.png` | Club Socials list: Padel Monday / Padel Thursday, "34 signed up · 32 spaces", Published pills | ⚠️ both socials sit under a **"Past"** header (no upcoming socials in the data right now) |
| 12 | `mkt_club_socials_availability.png` | Padel Monday → Sign-ups: 4pm–5.15pm slot, 8 players with ratings | ✅ |
| 13 | `mkt_club_socials_admin.png` | Social formats admin: Padel Thursday / Padel Monday, "2 courts · 4 slots", level ranges | ✅ |
| 13b | `mkt_club_socials_fixtures.png` | Padel Monday → Fixtures: Court 1 / Court 2 pairings, balance deltas (Δ 0.6, Δ 0.4), Swap players, **Publish to schedule** | ✅ *(bonus — best B2B/club-organiser asset in the pack)* |
| 14 | `mkt_match_detail_rating.png` | Match Details 2–0 with per-player rating deltas (+0.04, +0.06, −0.04, −0.07), Competitive pill, rating range, **"Were these ratings fair?"** peer-feedback prompt | ✅ |
| 14b | `mkt_match_history.png` | My Matches history with filter chips, Open/Competitive pills and per-match rating deltas | ✅ *(bonus)* |
| 15 | `mkt_competitions_box_or_bracket.png` | Tournament detail: Mode Ladies Summer 2026, Knockout only, teams with avg ratings, seeded draw | ⚠️ substitution — see note 4 |
| 16 | `mkt_matches_menu.png` | Matches menu with club logo and the five actions incl. Club Socials | ✅ |

**19 usable files delivered** (21 including `mkt_badges_gallery_full.png` and the flagged duplicate).

---

## Notes and deviations

1. **Badges gallery / Americano.** The gallery renders an Americano section as its fourth band. `mkt_badges_gallery.png` is cropped at 84.5% height so that section is gone — verified visually, the frame now ends cleanly after the Tournaments row. However the header copy still reads *"Earn badges across matches, box leagues, tournaments, and Americanos."* If zero Americano surface is a hard requirement, crop the top band off too, or shoot this screen again once the copy is parameterised. `mkt_badges_gallery_full.png` is kept only as an archive — it should not go on the site.

2. **No live unlock overlay.** There was no unlockable badge to trigger during the session, so the badge *detail* sheet (Gold · Box Champion · Unlocked 8 Aug 2026) stands in for it. It reads well as an unlock moment and includes the Share Badge CTA.

3. **Join board is empty.** Upcoming Matches → Join returned *"No Suitable Matches Found — No open matches match your rating (7.3) right now"*, and widening the filters to 0.0–9.9 across all genders and formats still returned nothing. So the Club tab was captured instead under the `mkt_join_board.png` name so downstream HTML can use the planned filename. **Recommendation:** seed 3–4 open matches at mixed levels on the demo club and re-shoot this one screen — it's the hero image for `find-a-match.html` and the substitute doesn't show joinable open slots.

4. **Leagues (Box) came back empty** — *"No Results for Filters"* — so the competitions shot is a knockout tournament rather than a box table. The site's existing `Box_*.png` assets already cover Box League, so this is low priority.

5. **Dark mode, not light.** The simulator and app were already in dark mode. The app's identity is yellow-on-black and it looks strong, but every shot in this pack is dark — worth deciding deliberately before the homepage rewrite, since the current site is light. Re-shooting in light mode would mean redoing all 19.

6. **Device is iPhone 17 Pro Max**, not the iPhone 15/16 Pro specified in the plan. Consistent across the whole set.

7. **Real club data.** These are live *Mode* club records — real member names, ratings and results (Ben White, Kieron Jones, Adam Haffar, Deborah O'Driscoll and others). Fine for internal review; get consent or swap to a demo club before publishing, particularly for `mkt_club_socials_availability.png` and `mkt_stats_players.png`, which list many members by name and rating.

8. **No Americano screens were captured or navigated into** for marketing purposes. No app data was modified: the Schedule Match sheet was dismissed without scheduling, "Publish to schedule" was never pressed, and an accidental player-swap on Padel Monday fixtures was cancelled before any change was committed.

9. **Originals** remain on the Desktop as `Simulator Screenshot - iPhone 17 Pro Max - 2026-08-10 at *.png` — they can be deleted once this pack is signed off.

---

## Suggested next step

Re-shoot only `mkt_join_board.png` after seeding open matches, then proceed to the Priority 1 homepage rewrite using these filenames as image sources. `mkt_schedule_gates.png`, `mkt_club_socials_fixtures.png` and `mkt_stats_me.png` are the three strongest assets and should carry the homepage pillars.
