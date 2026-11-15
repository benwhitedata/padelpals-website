-- Close signed-out reads of member data.
--
-- Before this, anyone holding the public (anon) key could read every row of
-- user_profiles, matches (private ones included), ratings, americano_results
-- and tournament_results, because each had a SELECT policy with USING (true)
-- that applied to the anon role.
--
-- After this, those five tables need a signed-in session. What signed-in users
-- can read does not change. The views player_search_view and players_view are
-- security_invoker, so they follow automatically.
--
-- Deliberately left alone:
--   * clubs stays readable signed-out (name, colours, logo: needed to pick a
--     club before an account exists).
--   * get_session_by_token / get_americano_by_token are SECURITY DEFINER, so
--     share links keep working for signed-out visitors.

-- user_profiles: "Authenticated users can select user profiles" and
-- "Users can view their own profile" remain.
drop policy if exists "Anon can read profiles for ratings" on public.user_profiles;

-- matches: "Authenticated users can select matches" remains.
drop policy if exists "Enable read for all users" on public.matches;

-- ratings: the only SELECT policy was the public one, so replace it.
drop policy if exists "Enable read access for all users" on public.ratings;
create policy "Authenticated users can read ratings"
  on public.ratings
  for select
  to authenticated
  using (true);

-- americano_results: the misnamed "view their own" policy was USING (true)
-- for everyone. Keep the same visibility for signed-in users only.
drop policy if exists "Users can view their own americanos" on public.americano_results;
create policy "Authenticated users can read americano results"
  on public.americano_results
  for select
  to authenticated
  using (true);

-- tournament_results: same shape.
drop policy if exists "Tournament results are viewable by everyone" on public.tournament_results;
create policy "Authenticated users can read tournament results"
  on public.tournament_results
  for select
  to authenticated
  using (true);
