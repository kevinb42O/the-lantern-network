export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          vibe_tags: string[];
          trust_score: number;
          lantern_balance: number;
          location: Json | null;
          is_admin: boolean;
          is_moderator: boolean;
          badges: string[];
          completed_flares_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          vibe_tags?: string[];
          trust_score?: number;
          lantern_balance?: number;
          location?: Json | null;
          is_admin?: boolean;
          is_moderator?: boolean;
          badges?: string[];
          completed_flares_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          vibe_tags?: string[];
          trust_score?: number;
          lantern_balance?: number;
          location?: Json | null;
          is_admin?: boolean;
          is_moderator?: boolean;
          badges?: string[];
          completed_flares_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flares: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string;
          category: string;
          vibe_tags: string[];
          location: Json;
          radius_miles: number;
          max_participants: number | null;
          current_participants: number;
          lantern_cost: number;
          starts_at: string;
          ends_at: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description: string;
          category: string;
          vibe_tags?: string[];
          location: Json;
          radius_miles?: number;
          max_participants?: number | null;
          current_participants?: number;
          lantern_cost?: number;
          starts_at: string;
          ends_at?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string;
          category?: string;
          vibe_tags?: string[];
          location?: Json;
          radius_miles?: number;
          max_participants?: number | null;
          current_participants?: number;
          lantern_cost?: number;
          starts_at?: string;
          ends_at?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flare_participants: {
        Row: {
          id: string;
          flare_id: string;
          user_id: string;
          status: string;
          message: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          flare_id: string;
          user_id: string;
          status?: string;
          message?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          flare_id?: string;
          user_id?: string;
          status?: string;
          message?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          connected_user_id: string;
          trust_level: number;
          met_through_flare_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connected_user_id: string;
          trust_level?: number;
          met_through_flare_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connected_user_id?: string;
          trust_level?: number;
          met_through_flare_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          flare_id: string | null;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          flare_id?: string | null;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          flare_id?: string | null;
          content?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          flare_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          flare_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          description?: string;
          flare_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          inviter_id: string;
          code: string;
          used: boolean;
          used_by_id: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          code: string;
          used?: boolean;
          used_by_id?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          inviter_id?: string;
          code?: string;
          used?: boolean;
          used_by_id?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_flare_participants: {
        Args: { flare_id: string };
        Returns: void;
      };
      decrement_flare_participants: {
        Args: { flare_id: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Base profile type from database
export type ProfileRow = Tables<'profiles'>;

// Import SupporterBadgeTier from types.ts to avoid duplication
import type { SupporterBadgeTier } from './types';

// Extended profile type with supporter badge (from separate table)
export type Profile = ProfileRow & {
  supporter_badge?: SupporterBadgeTier | null;
};
export type Flare = Tables<'flares'>;
export type FlareParticipant = Tables<'flare_participants'>;
export type Connection = Tables<'connections'>;
export type Message = Tables<'messages'>;
export type Transaction = Tables<'transactions'>;
export type Invite = Tables<'invites'>;
