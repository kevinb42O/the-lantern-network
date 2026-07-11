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

      // Fetch message reactions safely (in case table doesn't exist yet)
      let reactionsByMessage: Record<string, any[]> = {};
      try {
        const messageIds = campfireMessages.map(m => m.id);
        if (messageIds.length > 0) {
          const { data: reactionsData } = await supabase
            .from('message_reactions')
            .select('*')
            .in('message_id', messageIds);
            
          if (reactionsData) {
            reactionsData.forEach(r => {
              if (!reactionsByMessage[r.message_id]) reactionsByMessage[r.message_id] = [];
              reactionsByMessage[r.message_id].push(r);
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch reactions. Schema might need updating.', e);
      }

      // Get all unique sender IDs and reaction user IDs
      const userIds = new Set<string>();
      campfireMessages.forEach(m => {
        userIds.add(m.sender_id);
        const mReactions = reactionsByMessage[m.id];
        if (mReactions) {
          mReactions.forEach((r: any) => userIds.add(r.user_id));
        }
      });
      const senderIds = Array.from(userIds);

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
      const messages: Message[] = campfireMessages.map(m => {
        const reactionsMap: Record<string, { userId: string, username: string }[]> = {};
        const mReactions = reactionsByMessage[m.id];
        if (mReactions) {
          mReactions.forEach((r: any) => {
            if (!reactionsMap[r.reaction]) reactionsMap[r.reaction] = [];
            reactionsMap[r.reaction].push({
              userId: r.user_id,
              username: profileMap[r.user_id] || 'Onbekende buur'
            });
          });
        }
        
        return {
          id: m.id,
          userId: m.sender_id,
          username: profileMap[m.sender_id] || 'Onbekende buur',
          content: m.content,
          mediaUrl: m.media_url,
          mediaType: m.media_type as 'image' | 'gif' | null,
          timestamp: new Date(m.created_at).getTime(),
          type: 'campfire' as const,
          chatId: 'campfire',
          reactions: reactionsMap as any,
          replyToId: m.reply_to_id,
          read: m.read,
          isEdited: m.is_edited,
          deletedAt: m.deleted_at ? new Date(m.deleted_at).getTime() : null,
        };
      });

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
    mutationFn: async ({ content, mediaUrl, mediaType }: { content: string; mediaUrl?: string | null; mediaType?: 'image' | 'gif' | null }) => {
      if (!user || !profile) throw new Error('Must be logged in');

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: user.id, // campfire convention
        content,
        flare_id: null,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;
      return { success: true };
    },
    onMutate: async (payload) => {
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
            content: payload.content,
            mediaUrl: payload.mediaUrl,
            mediaType: payload.mediaType,
            timestamp: Date.now(),
            type: 'campfire',
            chatId: 'campfire',
            reactions: {},
            replyToId: null,
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
