import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Get user's connections
export function useConnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('connections')
        .select('*, connected_profile:connected_user_id(id, display_name, avatar_url, trust_score, vibe_tags)')
        .eq('user_id', user.id)
        .order('trust_level', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Create a new connection
export function useCreateConnection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      connectedUserId,
      flareId,
    }: {
      connectedUserId: string;
      flareId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to create a connection');

      // Check if connection already exists
      const { data: existing } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('connected_user_id', connectedUserId)
        .single();

      if (existing) throw new Error('Connection already exists');

      // Create bidirectional connections
      const { error } = await supabase.from('connections').insert([
        {
          user_id: user.id,
          connected_user_id: connectedUserId,
          trust_level: 1,
          met_through_flare_id: flareId,
        },
        {
          user_id: connectedUserId,
          connected_user_id: user.id,
          trust_level: 1,
          met_through_flare_id: flareId,
        },
      ]);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

// Update connection trust level
export function useUpdateTrustLevel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      connectionId,
      trustLevel,
    }: {
      connectionId: string;
      trustLevel: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('connections')
        .update({ trust_level: trustLevel, updated_at: new Date().toISOString() })
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

// Remove a connection
export function useRemoveConnection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (connectedUserId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Remove both directions of the connection
      const { error } = await supabase
        .from('connections')
        .delete()
        .or(`and(user_id.eq.${user.id},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${user.id})`);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}
