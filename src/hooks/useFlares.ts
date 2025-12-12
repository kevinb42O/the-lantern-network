import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Flare } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_LOCATION } from '@/lib/economy';

// Fetch all active flares
export function useFlares() {
  return useQuery({
    queryKey: ['flares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flares')
        .select('*, profiles:creator_id(display_name, avatar_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Fetch a single flare
export function useFlare(id: string) {
  return useQuery({
    queryKey: ['flares', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flares')
        .select('*, profiles:creator_id(display_name, avatar_url, trust_score)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Fetch flares near a location
export function useNearbyFlares(lat: number, lng: number, radiusMiles: number = 10) {
  return useQuery({
    queryKey: ['flares', 'nearby', lat, lng, radiusMiles],
    queryFn: async () => {
      // For now, fetch all active flares and filter client-side
      // In production, you'd use PostGIS for efficient geo queries
      const { data, error } = await supabase
        .from('flares')
        .select('*, profiles:creator_id(display_name, avatar_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Simple distance calculation (Haversine formula)
      const toRad = (deg: number) => deg * (Math.PI / 180);
      const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 3959; // Earth's radius in miles
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      return data?.filter((flare) => {
        const location = flare.location as { lat: number; lng: number };
        if (!location?.lat || !location?.lng) return false;
        const distance = haversineDistance(lat, lng, location.lat, location.lng);
        return distance <= radiusMiles;
      });
    },
    enabled: !!lat && !!lng,
  });
}

// Create a new flare
export function useCreateFlare() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (flare: Omit<Flare, 'id' | 'created_at' | 'updated_at' | 'creator_id'>) => {
      if (!user) throw new Error('Must be logged in to create a flare');

      const { data, error } = await supabase
        .from('flares')
        .insert({
          ...flare,
          creator_id: user.id,
          location: flare.location || DEFAULT_LOCATION,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating flare:', error.message, error.details ?? '', error.hint ?? '');
        throw error;
      }

      // Deduct lantern cost from user's balance
      if (flare.lantern_cost > 0) {
        await supabase
          .from('profiles')
          .update({ lantern_balance: (profile?.lantern_balance || 0) - flare.lantern_cost })
          .eq('user_id', user.id);

        // Record transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'flare_creation',
          amount: -flare.lantern_cost,
          description: `Created flare: ${flare.title}`,
          flare_id: data.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flares'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Join a flare
export function useJoinFlare() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flareId: string) => {
      if (!user) throw new Error('Must be logged in to join a flare');

      // Check if already joined
      const { data: existing } = await supabase
        .from('flare_participants')
        .select('id')
        .eq('flare_id', flareId)
        .eq('user_id', user.id)
        .single();

      if (existing) throw new Error('Already joined this flare');

      // Add participant
      const { error } = await supabase.from('flare_participants').insert({
        flare_id: flareId,
        user_id: user.id,
        status: 'joined',
      });

      if (error) throw error;

      // Increment participant count
      await supabase.rpc('increment_flare_participants', { flare_id: flareId });

      return { success: true };
    },
    onSuccess: (_, flareId) => {
      queryClient.invalidateQueries({ queryKey: ['flares'] });
      queryClient.invalidateQueries({ queryKey: ['flares', flareId] });
      queryClient.invalidateQueries({ queryKey: ['my-flares'] });
    },
  });
}

// Leave a flare
export function useLeaveFlare() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flareId: string) => {
      if (!user) throw new Error('Must be logged in to leave a flare');

      const { error } = await supabase
        .from('flare_participants')
        .delete()
        .eq('flare_id', flareId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Decrement participant count
      await supabase.rpc('decrement_flare_participants', { flare_id: flareId });

      return { success: true };
    },
    onSuccess: (_, flareId) => {
      queryClient.invalidateQueries({ queryKey: ['flares'] });
      queryClient.invalidateQueries({ queryKey: ['flares', flareId] });
      queryClient.invalidateQueries({ queryKey: ['my-flares'] });
    },
  });
}

// Get user's joined flares
export function useMyFlares() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-flares'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('flare_participants')
        .select('*, flares(*, profiles:creator_id(display_name, avatar_url))')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Get flare participants
export function useFlareParticipants(flareId: string) {
  return useQuery({
    queryKey: ['flare-participants', flareId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flare_participants')
        .select('*, profiles:user_id(display_name, avatar_url, trust_score)')
        .eq('flare_id', flareId);

      if (error) throw error;
      return data;
    },
    enabled: !!flareId,
  });
}
