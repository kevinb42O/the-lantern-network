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
  type VARCHAR(30) NOT NULL CHECK (type IN ('welcome_bonus', 'flare_creation', 'transfer_in', 'transfer_out', 'bonus', 'invite_bonus', 'referral_bonus')),
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

-- Enable realtime for messages and flare_participants tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE flare_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE flares;
