import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Get conversations (grouped by user)
export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];

      // Get all messages involving the user
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(id, display_name, avatar_url), receiver:receiver_id(id, display_name, avatar_url)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationsMap = new Map<string, {
        partnerId: string;
        partnerName: string;
        partnerAvatar: string | null;
        lastMessage: string;
        lastMessageTime: string;
        unreadCount: number;
      }>();

      data?.forEach((message) => {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const partner = message.sender_id === user.id ? message.receiver : message.sender;

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            partnerId,
            partnerName: (partner as any)?.display_name || 'Unknown',
            partnerAvatar: (partner as any)?.avatar_url,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: 0,
          });
        }

        // Count unread messages
        if (message.receiver_id === user.id && !message.read) {
          const conv = conversationsMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });

      return Array.from(conversationsMap.values());
    },
    enabled: !!user,
  });
}

// Get messages with a specific user
export function useMessages(partnerId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', partnerId],
    queryFn: async () => {
      if (!user || !partnerId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark received messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      return data;
    },
    enabled: !!user && !!partnerId,
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !partnerId) return;

    const channel = supabase
      .channel(`messages:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${partnerId}),and(sender_id=eq.${partnerId},receiver_id=eq.${user.id}))`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', partnerId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, queryClient]);

  return query;
}

// Send a message
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      receiverId,
      content,
      flareId,
    }: {
      receiverId: string;
      content: string;
      flareId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to send a message');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          flare_id: flareId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Get unread message count
export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
