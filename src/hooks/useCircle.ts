import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ConnectionRequest, CircleConnection, CircleMessage } from '@/lib/types';

// Maximum trust level for circle connections
export const MAX_TRUST_LEVEL = 5;

// Get user's circle connections with trust levels
export function useCircleConnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['circle-connections'],
    queryFn: async (): Promise<CircleConnection[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user_id', user.id)
        .order('trust_level', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Get connected user profiles
      const connectedUserIds = data.map(c => c.connected_user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', connectedUserIds);

      const profileMap: Record<string, { name: string; avatar: string | null }> = {};
      profilesData?.forEach(p => {
        profileMap[p.user_id] = { name: p.display_name, avatar: p.avatar_url };
      });

      // Get flare names for met_through_flare_id
      const flareIds = data.filter(c => c.met_through_flare_id).map(c => c.met_through_flare_id);
      const flareMap: Record<string, string> = {};
      if (flareIds.length > 0) {
        const { data: flaresData } = await supabase
          .from('flares')
          .select('id, title')
          .in('id', flareIds);
        flaresData?.forEach(f => {
          flareMap[f.id] = f.title;
        });
      }

      // Get last messages for all connections in parallel
      const lastMessages: Record<string, { content: string; created_at: string }> = {};
      if (connectedUserIds.length > 0) {
        // Fetch all recent messages for circle members in one query
        const { data: allMessages } = await supabase
          .from('messages')
          .select('sender_id, receiver_id, content, created_at')
          .is('flare_id', null)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .in('sender_id', [user.id, ...connectedUserIds])
          .in('receiver_id', [user.id, ...connectedUserIds])
          .order('created_at', { ascending: false });

        // Group by conversation partner and take the most recent
        if (allMessages) {
          for (const msg of allMessages) {
            const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            if (connectedUserIds.includes(partnerId) && !lastMessages[partnerId]) {
              lastMessages[partnerId] = { content: msg.content, created_at: msg.created_at };
            }
          }
        }
      }

      return data.map(c => ({
        id: c.id,
        connectedUserId: c.connected_user_id,
        connectedUserName: profileMap[c.connected_user_id]?.name || 'Onbekende buur',
        connectedUserAvatar: profileMap[c.connected_user_id]?.avatar || null,
        trustLevel: c.trust_level,
        metThroughFlareId: c.met_through_flare_id || null,
        metThroughFlareName: c.met_through_flare_id ? flareMap[c.met_through_flare_id] || null : null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        lastMessage: lastMessages[c.connected_user_id]?.content || null,
        lastMessageAt: lastMessages[c.connected_user_id]?.created_at || null,
      }));
    },
    enabled: !!user,
  });
}

// Get connection requests (both sent and received)
export function useConnectionRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['connection-requests'],
    queryFn: async (): Promise<{ incoming: ConnectionRequest[]; outgoing: ConnectionRequest[] }> => {
      if (!user) return { incoming: [], outgoing: [] };

      const { data, error } = await supabase
        .from('connection_requests')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return { incoming: [], outgoing: [] };

      // Get all user IDs involved
      const userIds = [...new Set([...data.map(r => r.from_user_id), ...data.map(r => r.to_user_id)])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap: Record<string, { name: string; avatar: string | null }> = {};
      profilesData?.forEach(p => {
        profileMap[p.user_id] = { name: p.display_name, avatar: p.avatar_url };
      });

      // Get flare names
      const flareIds = data.filter(r => r.flare_id).map(r => r.flare_id);
      const flareMap: Record<string, string> = {};
      if (flareIds.length > 0) {
        const { data: flaresData } = await supabase
          .from('flares')
          .select('id, title')
          .in('id', flareIds);
        flaresData?.forEach(f => {
          flareMap[f.id] = f.title;
        });
      }

      const formatted: ConnectionRequest[] = data.map(r => ({
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        message: r.message,
        flareId: r.flare_id,
        status: r.status,
        createdAt: r.created_at,
        fromUserName: profileMap[r.from_user_id]?.name || 'Onbekende buur',
        fromUserAvatar: profileMap[r.from_user_id]?.avatar || null,
        toUserName: profileMap[r.to_user_id]?.name || 'Onbekende buur',
        toUserAvatar: profileMap[r.to_user_id]?.avatar || null,
        flareName: r.flare_id ? flareMap[r.flare_id] || null : null,
      }));

      const incoming = formatted.filter(r => r.toUserId === user.id && r.status === 'pending');
      const outgoing = formatted.filter(r => r.fromUserId === user.id);

      return { incoming, outgoing };
    },
    enabled: !!user,
  });
}

// Send a connection request
export function useSendConnectionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      toUserId,
      message,
      flareId,
    }: {
      toUserId: string;
      message?: string;
      flareId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('connected_user_id', toUserId)
        .single();

      if (existingConnection) {
        throw new Error('Already in your circle');
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('connection_requests')
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('to_user_id', toUserId)
        .single();

      if (existingRequest) {
        throw new Error('Request already sent');
      }

      // Check if they sent us a request - if so, auto-accept it
      const { data: theirRequest } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('from_user_id', toUserId)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (theirRequest) {
        // Auto-accept their request (mutual connection)
        await acceptConnectionRequestDirect(user.id, theirRequest.id, flareId);
        return { autoAccepted: true };
      }

      // Create new request
      const { error } = await supabase.from('connection_requests').insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        message,
        flare_id: flareId,
        status: 'pending',
      });

      if (error) throw error;
      return { autoAccepted: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['circle-connections'] });
    },
  });
}

// Accept a connection request (creates bidirectional connection)
async function acceptConnectionRequestDirect(userId: string, requestId: string, flareId?: string | null) {
  // Call the database function with SECURITY DEFINER to create bidirectional connections
  // This bypasses RLS restrictions that would otherwise prevent inserting connections for other users
  const { data, error } = await supabase.rpc('accept_connection_request', {
    request_id: requestId
  });

  if (error) throw error;
  
  // If a custom flare_id was provided (e.g., when auto-accepting), update the connections
  if (flareId && data?.success) {
    // Update both connections with the custom flare_id
    const { data: request } = await supabase
      .from('connection_requests')
      .select('from_user_id, to_user_id')
      .eq('id', requestId)
      .single();
    
    if (request) {
      // Update connection from_user -> to_user
      await supabase
        .from('connections')
        .update({ met_through_flare_id: flareId })
        .eq('user_id', request.from_user_id)
        .eq('connected_user_id', request.to_user_id);
      
      // Update connection to_user -> from_user
      await supabase
        .from('connections')
        .update({ met_through_flare_id: flareId })
        .eq('user_id', request.to_user_id)
        .eq('connected_user_id', request.from_user_id);
    }
  }
}

// Accept a connection request
export function useAcceptConnectionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Must be logged in');
      await acceptConnectionRequestDirect(user.id, requestId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['circle-connections'] });
    },
  });
}

// Decline a connection request
export function useDeclineConnectionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('to_user_id', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    },
  });
}

// Remove a connection from circle
export function useRemoveFromCircle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (connectedUserId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Remove both directions of the connection using separate queries
      // This avoids string interpolation in the .or() clause
      const [result1, result2] = await Promise.all([
        supabase
          .from('connections')
          .delete()
          .eq('user_id', user.id)
          .eq('connected_user_id', connectedUserId),
        supabase
          .from('connections')
          .delete()
          .eq('user_id', connectedUserId)
          .eq('connected_user_id', user.id)
      ]);

      if (result1.error) throw result1.error;
      if (result2.error) throw result2.error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-connections'] });
    },
  });
}

// Get connection status with a specific user
export function useConnectionStatus(targetUserId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['connection-status', targetUserId],
    queryFn: async (): Promise<{
      isConnected: boolean;
      requestSent: boolean;
      requestReceived: boolean;
      requestId?: string;
    }> => {
      if (!user || !targetUserId) {
        return { isConnected: false, requestSent: false, requestReceived: false };
      }

      // Check if already connected
      const { data: connection } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('connected_user_id', targetUserId)
        .single();

      if (connection) {
        return { isConnected: true, requestSent: false, requestReceived: false };
      }

      // Check for pending requests
      const { data: sentRequest } = await supabase
        .from('connection_requests')
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('to_user_id', targetUserId)
        .eq('status', 'pending')
        .single();

      if (sentRequest) {
        return { isConnected: false, requestSent: true, requestReceived: false };
      }

      const { data: receivedRequest } = await supabase
        .from('connection_requests')
        .select('id, status')
        .eq('from_user_id', targetUserId)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (receivedRequest) {
        return { isConnected: false, requestSent: false, requestReceived: true, requestId: receivedRequest.id };
      }

      return { isConnected: false, requestSent: false, requestReceived: false };
    },
    enabled: !!user && !!targetUserId,
  });
}

// Get circle messages with a specific user (messages with flare_id = null)
export function useCircleMessages(partnerId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['circle-messages', partnerId],
    queryFn: async (): Promise<CircleMessage[]> => {
      if (!user || !partnerId) return [];

      // Fetch messages in both directions separately and combine
      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .is('flare_id', null)
          .eq('sender_id', user.id)
          .eq('receiver_id', partnerId)
          .order('created_at', { ascending: true }),
        supabase
          .from('messages')
          .select('*')
          .is('flare_id', null)
          .eq('sender_id', partnerId)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: true })
      ]);

      if (sentResult.error) throw sentResult.error;
      if (receivedResult.error) throw receivedResult.error;

      // Combine and sort by created_at
      const allMessages = [...(sentResult.data || []), ...(receivedResult.data || [])]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (allMessages.length === 0) return [];

      // Get sender profiles
      const senderIds = [...new Set(allMessages.map(m => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds);

      const profileMap: Record<string, { name: string; avatar: string | null }> = {};
      profilesData?.forEach(p => {
        profileMap[p.user_id] = { name: p.display_name, avatar: p.avatar_url };
      });

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .is('flare_id', null)
        .eq('read', false);

      return allMessages.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: profileMap[m.sender_id]?.name || 'Onbekende buur',
        senderAvatar: profileMap[m.sender_id]?.avatar || null,
        receiverId: m.receiver_id,
        content: m.content,
        createdAt: m.created_at,
        read: m.read,
      }));
    },
    enabled: !!user && !!partnerId,
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !partnerId) return;

    const channel = supabase
      .channel(`circle-messages:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as { sender_id: string; receiver_id: string; flare_id: string | null };
          // Only refresh if it's a circle message (no flare_id) involving these two users
          if (
            msg.flare_id === null &&
            ((msg.sender_id === user.id && msg.receiver_id === partnerId) ||
             (msg.sender_id === partnerId && msg.receiver_id === user.id))
          ) {
            queryClient.invalidateQueries({ queryKey: ['circle-messages', partnerId] });
            queryClient.invalidateQueries({ queryKey: ['circle-connections'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, queryClient]);

  return query;
}

// Send a circle message (direct message with no flare)
export function useSendCircleMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      receiverId,
      content,
    }: {
      receiverId: string;
      content: string;
    }) => {
      if (!user) throw new Error('Must be logged in to send a message');

      // Verify the user is in our circle
      const { data: connection } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('connected_user_id', receiverId)
        .single();

      if (!connection) {
        throw new Error('You can only message people in your circle');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          flare_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['circle-messages', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['circle-connections'] });
    },
  });
}

// Increment trust level when users complete a flare together
export function useIncrementTrustLevel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (connectedUserId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Get current trust level
      const { data: connection, error: fetchError } = await supabase
        .from('connections')
        .select('id, trust_level')
        .eq('user_id', user.id)
        .eq('connected_user_id', connectedUserId)
        .single();

      if (fetchError || !connection) {
        // Not connected - nothing to update
        return { updated: false };
      }

      const newTrustLevel = Math.min(connection.trust_level + 1, MAX_TRUST_LEVEL);
      if (newTrustLevel === connection.trust_level) {
        return { updated: false }; // Already at max
      }

      // Update both directions using separate queries
      const [result1, result2] = await Promise.all([
        supabase
          .from('connections')
          .update({ trust_level: newTrustLevel, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('connected_user_id', connectedUserId),
        supabase
          .from('connections')
          .update({ trust_level: newTrustLevel, updated_at: new Date().toISOString() })
          .eq('user_id', connectedUserId)
          .eq('connected_user_id', user.id)
      ]);

      if (result1.error) throw result1.error;
      if (result2.error) throw result2.error;
      return { updated: true, newLevel: newTrustLevel };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-connections'] });
    },
  });
}

// Get circle member IDs for filtering circle-only flares
export function useCircleMemberIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['circle-member-ids'],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('connections')
        .select('connected_user_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(c => c.connected_user_id) || [];
    },
    enabled: !!user,
  });
}
