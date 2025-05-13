-- Padel Pals - Supabase Row Level Security (RLS) Policies
-- This script defines the RLS policies to control access to tables based on user roles and permissions

-- First, ensure all tables have RLS enabled
ALTER TABLE box_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_league_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION check_if_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is in the admins table or has an admin role
  -- This will need to be modified based on your actual admin tracking mechanism
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if a user is related to a league
CREATE OR REPLACE FUNCTION is_user_related_to_league(league_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User is related to a league if:
  -- 1. They created the league
  -- 2. They are a player in any team in any box in the league
  RETURN EXISTS (
    SELECT 1 FROM box_leagues
    WHERE id = league_id AND creator_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 
    FROM box_league_teams t
    JOIN box_league_boxes b ON t.box_id = b.id
    WHERE b.league_id = league_id
    AND (t.player1_id = auth.uid() OR t.player2_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if a user is related to a box
CREATE OR REPLACE FUNCTION is_user_related_to_box(box_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  league_id UUID;
BEGIN
  -- Get the league ID for this box
  SELECT b.league_id INTO league_id
  FROM box_league_boxes b
  WHERE b.id = box_id;
  
  -- User is related to a box if:
  -- 1. They created the parent league
  -- 2. They are a player in any team in the box
  RETURN EXISTS (
    SELECT 1 FROM box_leagues
    WHERE id = league_id AND creator_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 
    FROM box_league_teams t
    WHERE t.box_id = box_id
    AND (t.player1_id = auth.uid() OR t.player2_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if a user is related to a team
CREATE OR REPLACE FUNCTION is_user_related_to_team(team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  box_id UUID;
BEGIN
  -- Get the box ID for this team
  SELECT t.box_id INTO box_id
  FROM box_league_teams t
  WHERE t.id = team_id;
  
  -- User is related to a team if:
  -- 1. They are a player in the team
  -- 2. They created the parent league
  RETURN EXISTS (
    SELECT 1 
    FROM box_league_teams t
    WHERE t.id = team_id
    AND (t.player1_id = auth.uid() OR t.player2_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if a user is related to a match
CREATE OR REPLACE FUNCTION is_user_related_to_match(match_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  box_id UUID;
  team1_id UUID;
  team2_id UUID;
BEGIN
  -- Get the box, team1, and team2 for this match
  SELECT m.box_id, m.team1_id, m.team2_id INTO box_id, team1_id, team2_id
  FROM box_league_matches m
  WHERE m.id = match_id;
  
  -- User is related to a match if:
  -- 1. They are a player in either team in the match
  -- 2. They created the parent league
  RETURN EXISTS (
    SELECT 1 
    FROM box_league_teams t
    WHERE (t.id = team1_id OR t.id = team2_id)
    AND (t.player1_id = auth.uid() OR t.player2_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- box_leagues Table Policies
-- =====================

-- 1. Admin users can do anything
CREATE POLICY admin_leagues_policy
  ON box_leagues
  USING (check_if_admin());

-- 2. Regular users can read all leagues 
CREATE POLICY read_leagues_policy
  ON box_leagues
  FOR SELECT
  USING (true);

-- 3. Regular users can create leagues
CREATE POLICY create_leagues_policy
  ON box_leagues
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- 4. Regular users can update leagues they created
CREATE POLICY update_leagues_policy
  ON box_leagues
  FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- 5. Regular users can delete leagues they created
CREATE POLICY delete_leagues_policy
  ON box_leagues
  FOR DELETE
  USING (auth.uid() = creator_id);

-- =====================
-- box_league_boxes Table Policies
-- =====================

-- 1. Admin users can do anything
CREATE POLICY admin_boxes_policy
  ON box_league_boxes
  USING (check_if_admin());

-- 2. Regular users can read boxes in leagues they're related to
CREATE POLICY read_boxes_policy
  ON box_league_boxes
  FOR SELECT
  USING (is_user_related_to_league(league_id));

-- 3. Regular users can create boxes in leagues they created
CREATE POLICY create_boxes_policy
  ON box_league_boxes
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM box_leagues
    WHERE id = league_id AND creator_id = auth.uid()
  ));

-- 4. Regular users can update boxes in leagues they created
CREATE POLICY update_boxes_policy
  ON box_league_boxes
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM box_leagues
    WHERE id = league_id AND creator_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM box_leagues
    WHERE id = league_id AND creator_id = auth.uid()
  ));

-- 5. Regular users can delete boxes in leagues they created
CREATE POLICY delete_boxes_policy
  ON box_league_boxes
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM box_leagues
    WHERE id = league_id AND creator_id = auth.uid()
  ));

-- =====================
-- box_league_teams Table Policies
-- =====================

-- 1. Admin users can do anything
CREATE POLICY admin_teams_policy
  ON box_league_teams
  USING (check_if_admin());

-- 2. Regular users can read teams in boxes they're related to
CREATE POLICY read_teams_policy
  ON box_league_teams
  FOR SELECT
  USING (is_user_related_to_box(box_id));

-- 3. Regular users can create teams in boxes they manage (leagues they created)
CREATE POLICY create_teams_policy
  ON box_league_teams
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  ));

-- 4. Regular users can update teams they are part of
CREATE POLICY update_teams_policy
  ON box_league_teams
  FOR UPDATE
  USING (player1_id = auth.uid() OR player2_id = auth.uid() OR EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  ))
  WITH CHECK (player1_id = auth.uid() OR player2_id = auth.uid() OR EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  ));

-- 5. Regular users can delete teams in boxes they manage (leagues they created)
CREATE POLICY delete_teams_policy
  ON box_league_teams
  FOR DELETE
  USING (EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  ));

-- =====================
-- box_league_matches Table Policies
-- =====================

-- 1. Admin users can do anything
CREATE POLICY admin_matches_policy
  ON box_league_matches
  USING (check_if_admin());

-- 2. Regular users can read matches in boxes they're related to
CREATE POLICY read_matches_policy
  ON box_league_matches
  FOR SELECT
  USING (is_user_related_to_box(box_id));

-- 3. Regular users can create matches in boxes they manage (leagues they created)
CREATE POLICY create_matches_policy
  ON box_league_matches
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  ));

-- 4. Regular users can update matches they are involved in
CREATE POLICY update_matches_policy
  ON box_league_matches
  FOR UPDATE
  USING (is_user_related_to_match(id))
  WITH CHECK (is_user_related_to_match(id));

-- 5. Regular users can delete matches in boxes they manage (leagues they created)
CREATE POLICY delete_matches_policy
  ON box_league_matches
  FOR DELETE
  USING (EXISTS (
    SELECT 1 
    FROM box_league_boxes b
    JOIN box_leagues l ON b.league_id = l.id
    WHERE b.id = box_id AND l.creator_id = auth.uid()
  ));

-- =====================
-- profiles Table Policies
-- =====================

-- 1. Admin users can do anything with profiles
CREATE POLICY admin_profiles_policy
  ON profiles
  USING (check_if_admin());

-- 2. Users can read all profiles (needed for display names, etc.)
CREATE POLICY read_profiles_policy
  ON profiles
  FOR SELECT
  USING (true);

-- 3. Users can update their own profile
CREATE POLICY update_profiles_policy
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Users can insert their own profile
CREATE POLICY insert_profiles_policy
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Only admins can delete profiles
CREATE POLICY delete_profiles_policy
  ON profiles
  FOR DELETE
  USING (check_if_admin());

-- =====================
-- Finish with a check to verify all tables have RLS enabled
-- =====================
COMMENT ON FUNCTION check_if_admin() IS 'Checks if the current user has admin privileges';
COMMENT ON FUNCTION is_user_related_to_league(UUID) IS 'Checks if the current user is related to a given league';
COMMENT ON FUNCTION is_user_related_to_box(UUID) IS 'Checks if the current user is related to a given box';
COMMENT ON FUNCTION is_user_related_to_team(UUID) IS 'Checks if the current user is related to a given team';
COMMENT ON FUNCTION is_user_related_to_match(UUID) IS 'Checks if the current user is related to a given match'; 