-- The Lantern Network - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name VARCHAR(30) NOT NULL,
  avatar_url TEXT,
  bio VARCHAR(200),
  vibe_tags TEXT[] DEFAULT '{}',
  trust_score INTEGER DEFAULT 0,
  lantern_balance INTEGER DEFAULT 5,
  location JSONB,
  is_admin BOOLEAN DEFAULT FALSE,
  is_moderator BOOLEAN DEFAULT FALSE,
  badges TEXT[] DEFAULT '{}',
  completed_flares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flares table (help requests / events)
CREATE TABLE IF NOT EXISTS flares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  vibe_tags TEXT[] DEFAULT '{}',
  location JSONB NOT NULL,
  radius_miles DECIMAL DEFAULT 5,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  lantern_cost INTEGER DEFAULT 1,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'completed', 'cancelled')),
  flare_type VARCHAR(10) DEFAULT 'request' NOT NULL CHECK (flare_type IN ('request', 'offer')),
  is_free BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flare participants (also used for help requests)
CREATE TABLE IF NOT EXISTS flare_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flare_id UUID REFERENCES flares(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied', 'completed', 'left')),
  message TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flare_id, user_id)
);

-- Connections (friendships between users)
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trust_level INTEGER DEFAULT 1 CHECK (trust_level >= 1 AND trust_level <= 5),
  met_through_flare_id UUID REFERENCES flares(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Messages (direct messages between users)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flare_id UUID REFERENCES flares(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (lantern economy)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('welcome_bonus', 'flare_creation', 'transfer_in', 'transfer_out', 'bonus', 'invite_bonus', 'referral_bonus', 'announcement_gift')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  flare_id UUID REFERENCES flares(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites (invite codes for new users)
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(8) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper functions for flare participant counts
CREATE OR REPLACE FUNCTION increment_flare_participants(flare_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE flares 
  SET current_participants = current_participants + 1,
      updated_at = NOW()
  WHERE id = flare_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_flare_participants(flare_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE flares 
  SET current_participants = GREATEST(0, current_participants - 1),
      updated_at = NOW()
  WHERE id = flare_id;
END;
$$ LANGUAGE plpgsql;

-- Security definer function to check if current user is admin
-- This avoids circular RLS checks when querying the profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flares ENABLE ROW LEVEL SECURITY;
ALTER TABLE flare_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can update any profile (for badges, moderator status, credits)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Flares policies
-- Users can view flares that are:
-- 1. Active (visible to everyone)
-- 2. Created by them (creator can always see their flares)
-- 3. They are participating in (helpers can see flares they offered to help with)
CREATE POLICY "Active flares are viewable by everyone" ON flares
  FOR SELECT USING (
    status = 'active' 
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM flare_participants 
      WHERE flare_participants.flare_id = flares.id 
      AND flare_participants.user_id = auth.uid()
    )
  );

-- Admins can view all flares (for admin panel)
CREATE POLICY "Admins can view all flares" ON flares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Authenticated users can create flares" ON flares
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own flares" ON flares
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own flares" ON flares
  FOR DELETE USING (auth.uid() = creator_id);

-- Admin can delete any flare
CREATE POLICY "Admins can delete any flare" ON flares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Admin can update any flare (for admin panel operations)
CREATE POLICY "Admins can update any flare" ON flares
  FOR UPDATE USING (is_admin());

-- Flare participants policies
CREATE POLICY "Participants are viewable by flare members" ON flare_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join flares" ON flare_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave flares" ON flare_participants
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" ON flare_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Flare owners can update participants on their flares
CREATE POLICY "Flare owners can update participants" ON flare_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM flares 
      WHERE flares.id = flare_participants.flare_id 
      AND flares.creator_id = auth.uid()
    )
  );

-- Admins can delete any participant (for removing flares)
CREATE POLICY "Admins can delete any participant" ON flare_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update any participant (for admin panel operations)
CREATE POLICY "Admins can update any participant" ON flare_participants
  FOR UPDATE USING (is_admin());

-- Connections policies
CREATE POLICY "Users can view their own connections" ON connections
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their connections" ON connections
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
-- Users can view their own messages OR campfire messages (flare_id is null)
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR flare_id IS NULL);

CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update messages (mark as read)" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Admin can delete any message (for clearing campfire)
CREATE POLICY "Admins can delete any message" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Admin can view all campfire messages (for admin panel)
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can create transactions for any user (for bonus credits)
CREATE POLICY "Admins can create transactions for any user" ON transactions
  FOR INSERT WITH CHECK (is_admin());

-- Invites policies
CREATE POLICY "Invites are viewable by creator or anyone validating" ON invites
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create invites" ON invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invites can be updated when redeemed" ON invites
  FOR UPDATE USING (true);

-- Reports table (user content reports)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('message', 'flare', 'user')),
  target_id UUID,
  category VARCHAR(30) NOT NULL CHECK (category IN ('harassment', 'spam', 'inappropriate_content', 'safety_concern', 'other')),
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  action_taken VARCHAR(20) CHECK (action_taken IN ('none', 'warning', 'content_removed', 'user_banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reports policies
-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Moderators can view all reports
CREATE POLICY "Moderators can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Moderators can update reports
CREATE POLICY "Moderators can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_flares_creator_id ON flares(creator_id);
CREATE INDEX IF NOT EXISTS idx_flares_status ON flares(status);
CREATE INDEX IF NOT EXISTS idx_flare_participants_flare_id ON flare_participants(flare_id);
CREATE INDEX IF NOT EXISTS idx_flare_participants_user_id ON flare_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Announcements table (broadcast messages from admins/moderators)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  gift_amount INTEGER DEFAULT 0 CHECK (gift_amount >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement recipients table (tracks read status and gift claims)
CREATE TABLE IF NOT EXISTS announcement_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ,
  gift_claimed BOOLEAN DEFAULT FALSE,
  gift_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS on announcements tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- Announcements policies
-- Users can view active announcements
CREATE POLICY "Users can view active announcements" ON announcements
  FOR SELECT USING (is_active = true);

-- Admins can view all announcements
CREATE POLICY "Admins can view all announcements" ON announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Moderators can view all announcements
CREATE POLICY "Moderators can view all announcements" ON announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Admins can create announcements
CREATE POLICY "Admins can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Moderators can create announcements
CREATE POLICY "Moderators can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Admins can update announcements
CREATE POLICY "Admins can update announcements" ON announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Moderators can update announcements
CREATE POLICY "Moderators can update announcements" ON announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Announcement recipients policies
-- Users can view their own recipient records
CREATE POLICY "Users can view their own announcement recipients" ON announcement_recipients
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all recipient records (for analytics)
CREATE POLICY "Admins can view all announcement recipients" ON announcement_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Moderators can view all recipient records (for analytics)
CREATE POLICY "Moderators can view all announcement recipients" ON announcement_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_moderator = true
    )
  );

-- Users can insert their own recipient records (when viewing announcement)
CREATE POLICY "Users can insert their own announcement recipients" ON announcement_recipients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own recipient records (for marking read/claiming gift)
CREATE POLICY "Users can update their own announcement recipients" ON announcement_recipients
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_sender_id ON announcements(sender_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_user_id ON announcement_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_announcement_id ON announcement_recipients(announcement_id);

-- Supporter Badges table (donation recognition system)
CREATE TABLE IF NOT EXISTS supporter_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  badge_type VARCHAR(20) NOT NULL CHECK (badge_type IN ('supporter', 'flame_keeper', 'beacon', 'lighthouse')),
  notes TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL
);

-- Enable RLS on supporter_badges table
ALTER TABLE supporter_badges ENABLE ROW LEVEL SECURITY;

-- Supporter badges policies
-- Everyone can view supporter badges (for display on profiles)
CREATE POLICY "Supporter badges are viewable by everyone" ON supporter_badges
  FOR SELECT USING (true);

-- Only admins and moderators can grant badges
CREATE POLICY "Admins can manage supporter badges" ON supporter_badges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND (is_admin = true OR is_moderator = true)
    )
  );

-- Only admins and moderators can update badges
CREATE POLICY "Admins can update supporter badges" ON supporter_badges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND (is_admin = true OR is_moderator = true)
    )
  );

-- Only admins and moderators can delete badges
CREATE POLICY "Admins can delete supporter badges" ON supporter_badges
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND (is_admin = true OR is_moderator = true)
    )
  );

-- Create indexes for supporter badges
CREATE INDEX IF NOT EXISTS idx_supporter_badges_user_id ON supporter_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_supporter_badges_badge_type ON supporter_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_supporter_badges_granted_at ON supporter_badges(granted_at);

-- Stories table (neighborhood moments)
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content VARCHAR(500) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours')
);

-- Story reactions table
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction VARCHAR(20) NOT NULL CHECK (reaction IN ('heart', 'celebrate', 'home')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS on stories tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Stories policies
-- Non-expired stories are viewable by everyone
CREATE POLICY "Non-expired stories are viewable by everyone" ON stories
  FOR SELECT USING (expires_at > NOW());

-- Users can view their own stories even if expired
CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (auth.uid() = creator_id);

-- Authenticated users can create stories
CREATE POLICY "Authenticated users can create stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own stories
CREATE POLICY "Creators can delete their own stories" ON stories
  FOR DELETE USING (auth.uid() = creator_id);

-- Story reactions policies
-- Reactions are viewable by everyone (for counting)
CREATE POLICY "Story reactions are viewable by everyone" ON story_reactions
  FOR SELECT USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions" ON story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update their own reactions" ON story_reactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON story_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_creator_id ON stories(creator_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE stories;
ALTER PUBLICATION supabase_realtime ADD TABLE story_reactions;

-- Enable realtime for messages and flare_participants tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE flare_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE flares;

-- Connection Requests table (for Trust Circle system)
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  flare_id UUID REFERENCES flares(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Enable RLS on connection_requests table
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Connection requests policies
-- Users can view requests they sent or received
CREATE POLICY "Users can view their own connection requests" ON connection_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create connection requests
CREATE POLICY "Users can create connection requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update requests they received (to accept/decline)
CREATE POLICY "Users can update received connection requests" ON connection_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Users can delete their own requests
CREATE POLICY "Users can delete their own connection requests" ON connection_requests
  FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Create indexes for connection requests
CREATE INDEX IF NOT EXISTS idx_connection_requests_from_user_id ON connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_to_user_id ON connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

-- Enable realtime for connection_requests and connections
ALTER PUBLICATION supabase_realtime ADD TABLE connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;

-- Add circle_only column to flares table (if not exists)
-- Note: ALTER TABLE ADD COLUMN IF NOT EXISTS is PostgreSQL 9.6+
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flares' AND column_name = 'circle_only') THEN
    ALTER TABLE flares ADD COLUMN circle_only BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
