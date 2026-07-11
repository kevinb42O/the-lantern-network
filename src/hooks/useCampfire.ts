import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/types';

/**
 * Fetch campfire messages (public chat).
 * Campfire messages use the convention sender_id === receiver_id
 * with flare_id = null to distinguish them from DMs/mission chats.
 */
export function useCampfireMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campfire-messages'],
    queryFn: async () => {
      // Fetch messages with no flare_id
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .is('flare_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!messagesData) return { messages: [] as Message[], adminIds: [] as string[], moderatorIds: [] as string[] };

      // Filter to campfire messages (sender_id === receiver_id)
      const campfireMessages = messagesData.filter(m => m.sender_id === m.receiver_id);

      // Get all unique sender IDs
      const senderIds = [...new Set(campfireMessages.map(m => m.sender_id))];

      if (senderIds.length === 0) {
        return { messages: [] as Message[], adminIds: [] as string[], moderatorIds: [] as string[] };
      }

      // Fetch profiles including admin/moderator flags
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, is_admin, is_moderator')
        .in('user_id', senderIds);

      const profileMap: Record<string, string> = {};
      const adminIds: string[] = [];
      const moderatorIds: string[] = [];

      profilesData?.forEach(p => {
        profileMap[p.user_id] = p.display_name;
        if (p.is_admin) adminIds.push(p.user_id);
        if (p.is_moderator) moderatorIds.push(p.user_id);
      });

      // Format messages
      const messages: Message[] = campfireMessages.map(m => ({
        id: m.id,
        userId: m.sender_id,
        username: profileMap[m.sender_id] || 'Onbekende buur',
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
        type: 'campfire' as const,
      }));

      return { messages, adminIds, moderatorIds };
    },
    enabled: !!user,
    refetchInterval: 3000, // Poll every 3 seconds (matching original behavior)
  });
}

/**
 * Send a campfire message.
 * Uses optimistic updates for instant feedback.
 */
export function useSendCampfireMessage() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user || !profile) throw new Error('Must be logged in');

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: user.id, // campfire convention
        content,
        flare_id: null,
      });

      if (error) throw error;
      return { success: true };
    },
    onMutate: async (content) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['campfire-messages'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['campfire-messages']);

      // Optimistic update
      if (user && profile) {
        queryClient.setQueryData(['campfire-messages'], (old: { messages: Message[]; adminIds: string[]; moderatorIds: string[] } | undefined) => {
          if (!old) return old;
          const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            userId: user.id,
            username: profile.display_name,
            content,
            timestamp: Date.now(),
            type: 'campfire',
          };
          return { ...old, messages: [...old.messages, tempMessage] };
        });
      }

      return { previous };
    },
    onError: (_err, _content, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(['campfire-messages'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['campfire-messages'] });
    },
  });
}

/**
 * Admin: Clear all campfire messages.
 */
export function useClearCampfire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Fetch all messages with flare_id = null
      const { data: messagesToCheck, error: fetchError } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id')
        .is('flare_id', null);

      if (fetchError) throw fetchError;
      if (!messagesToCheck || messagesToCheck.length === 0) return;

      // Filter to campfire messages (sender_id === receiver_id)
      const campfireMessageIds = messagesToCheck
        .filter(m => m.sender_id === m.receiver_id)
        .map(m => m.id);

      if (campfireMessageIds.length === 0) return;

      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', campfireMessageIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campfire-messages'] });
    },
  });
}
