// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useIncrementTrustLevel } from '@/hooks/useCircle';
import type { HelpRequest, Message } from '@/lib/types';
import {
  LANTERN_TRANSFER_AMOUNT,
  REPUTATION_GAIN_HELPER,
  REPUTATION_GAIN_OWNER,
  HOARD_LIMIT,
  ELDER_HELP_THRESHOLD,
  ELDER_TRUST_THRESHOLD,
} from '@/lib/economy';
import { toast } from 'sonner';

interface FlareData {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  creator_name?: string;
  flare_type?: 'request' | 'offer';
}

/**
 * Fetch all help requests involving the current user
 * (as either the helper or the flare owner).
 */
export function useHelpRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['help-requests'],
    queryFn: async () => {
      if (!user) return [];

      // Get all help requests
      const { data: participantsData, error } = await supabase
        .from('flare_participants')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) throw error;
      if (!participantsData?.length) return [];

      // Get flare details
      const flareIds = [...new Set(participantsData.map(p => p.flare_id))];
      const { data: flaresData } = await supabase
        .from('flares')
        .select('*')
        .in('id', flareIds);

      // Get user profiles
      const userIds = [...new Set([
        ...participantsData.map(p => p.user_id),
        ...(flaresData?.map(f => f.creator_id) || []),
      ])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach(p => { profileMap[p.user_id] = p.display_name; });

      const flareMap: Record<string, FlareData> = {};
      flaresData?.forEach(f => { flareMap[f.id] = f as FlareData; });

      // Filter to only requests involving current user
      const relevantRequests = participantsData.filter(p => {
        const flare = flareMap[p.flare_id];
        return p.user_id === user.id || flare?.creator_id === user.id;
      });

      // Format as HelpRequest type
      const formattedRequests: HelpRequest[] = relevantRequests
        .filter(p => {
          const flare = flareMap[p.flare_id];
          return flare && flare.creator_id;
        })
        .map(p => {
          const flare = flareMap[p.flare_id];
          return {
            id: p.id,
            flareId: p.flare_id,
            helperId: p.user_id,
            helperUsername: profileMap[p.user_id] || 'Onbekende buur',
            flareOwnerId: flare!.creator_id,
            flareOwnerUsername: profileMap[flare!.creator_id] || 'Onbekende buur',
            message: p.message || '',
            status: p.status as 'pending' | 'accepted' | 'denied',
            createdAt: new Date(p.joined_at).getTime(),
          };
        });

      return formattedRequests;
    },
    enabled: !!user,
  });
}

/**
 * Accept a help request.
 */
export function useAcceptHelp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (helpRequestId: string) => {
      const { error } = await supabase
        .from('flare_participants')
        .update({ status: 'accepted' })
        .eq('id', helpRequestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Hulpaanbod geaccepteerd! Je kan nu chatten.');
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
    },
    onError: () => {
      toast.error('Hulpaanbod accepteren mislukt');
    },
  });
}

/**
 * Deny a help request.
 */
export function useDenyHelp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (helpRequestId: string) => {
      const { error } = await supabase
        .from('flare_participants')
        .update({ status: 'denied' })
        .eq('id', helpRequestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Hulpaanbod geweigerd');
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
    },
    onError: () => {
      toast.error('Hulpaanbod weigeren mislukt');
    },
  });
}

/**
 * Send a chat message in a help request conversation.
 */
export function useSendHelpChatMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ helpRequestId, content, helpRequests, mediaUrl, mediaType, replyToId }: {
      helpRequestId: string;
      content: string;
      helpRequests: HelpRequest[];
      mediaUrl?: string;
      mediaType?: string;
      replyToId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const helpRequest = helpRequests.find(hr => hr.id === helpRequestId);
      if (!helpRequest) throw new Error('Gesprek niet gevonden');

      const receiverId = helpRequest.helperId === user.id
        ? helpRequest.flareOwnerId
        : helpRequest.helperId;

      // Validate UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!receiverId || !uuidRegex.test(receiverId)) {
        throw new Error('Invalid receiver ID');
      }

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        flare_id: helpRequest.flareId,
        media_url: mediaUrl,
        media_type: mediaType,
        reply_to_id: replyToId,
        read: false,
      });

      if (error) throw error;
    },
    onError: () => {
      toast.error('Bericht versturen mislukt. Probeer opnieuw.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-messages'] });
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
    },
  });
}

/**
 * Complete a flare: update status, transfer lanterns, increment trust.
 */
export function useCompleteFlare() {
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile } = useAuth();
  const incrementTrustLevel = useIncrementTrustLevel();

  return useMutation({
    mutationFn: async ({ flareId, helperId }: { flareId: string; helperId: string }) => {
      if (!user || !profile) throw new Error('Must be logged in');

      if (profile.lantern_balance < LANTERN_TRANSFER_AMOUNT) {
        throw new Error('Niet genoeg lichtpuntjes om deze taak af te ronden');
      }

      // Update flare status
      await supabase
        .from('flares')
        .update({ status: 'completed' })
        .eq('id', flareId);

      // Update participant status
      await supabase
        .from('flare_participants')
        .update({ status: 'completed' })
        .eq('flare_id', flareId)
        .eq('user_id', helperId);

      // Deduct from owner
      await supabase
        .from('profiles')
        .update({
          lantern_balance: profile.lantern_balance - LANTERN_TRANSFER_AMOUNT,
          trust_score: (profile.trust_score || 0) + REPUTATION_GAIN_OWNER,
        })
        .eq('user_id', user.id);

      // Get helper's current balance
      const { data: helperProfile } = await supabase
        .from('profiles')
        .select('lantern_balance, trust_score')
        .eq('user_id', helperId)
        .single();

      // Add to helper (max hoard limit)
      const newBalance = Math.min(
        (helperProfile?.lantern_balance || 0) + LANTERN_TRANSFER_AMOUNT,
        HOARD_LIMIT
      );
      await supabase
        .from('profiles')
        .update({
          lantern_balance: newBalance,
          trust_score: (helperProfile?.trust_score || 0) + REPUTATION_GAIN_HELPER,
        })
        .eq('user_id', helperId);

      // Record transactions
      await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'transfer_out',
          amount: -LANTERN_TRANSFER_AMOUNT,
          description: 'Sent as thanks for help',
          flare_id: flareId,
        },
        {
          user_id: helperId,
          type: 'transfer_in',
          amount: LANTERN_TRANSFER_AMOUNT,
          description: 'Received for helping',
          flare_id: flareId,
        },
      ]);

      // Check for elder promotion
      const { count } = await supabase
        .from('flare_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', helperId)
        .eq('status', 'completed');

      const isElderCandidate = (count || 0) >= ELDER_HELP_THRESHOLD
        && (helperProfile?.trust_score || 0) + REPUTATION_GAIN_HELPER >= ELDER_TRUST_THRESHOLD;

      // Increment trust level for circle connections (non-blocking)
      try {
        await incrementTrustLevel.mutateAsync(helperId);
      } catch {
        // Silently fail — optional enhancement
      }

      return { isElderCandidate };
    },
    onSuccess: (data) => {
      toast.success(`🏮 Taak voltooid! ${LANTERN_TRANSFER_AMOUNT} Lichtpuntje verzonden als bedankje!`);
      if (data.isElderCandidate) {
        toast.success('🌟 Proficiat! Je bent nu een Buurheld!');
      }
      queryClient.invalidateQueries({ queryKey: ['flares'] });
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['help-count'] });
      refreshProfile();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Taak afronden mislukt';
      toast.error(message);
    },
  });
}

/**
 * Offer help on a flare (join as participant).
 */
export function useOfferHelp() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ flareId, message, flareCreatorId }: {
      flareId: string;
      message: string;
      flareCreatorId: string;
    }) => {
      if (!user || !profile) throw new Error('Must be logged in');

      // Check if already offered
      const { data: existing } = await supabase
        .from('flare_participants')
        .select('*')
        .eq('flare_id', flareId)
        .eq('user_id', user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('Je hebt al aangeboden om te helpen');
      }

      // Create help request
      const { error } = await supabase.from('flare_participants').insert({
        flare_id: flareId,
        user_id: user.id,
        status: 'pending',
        message,
      });

      if (error) throw error;

      // Send notification message to flare owner (if not self)
      if (flareCreatorId && flareCreatorId !== user.id) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: flareCreatorId,
          content: message,
          flare_id: flareId,
          read: false,
        }).then(({ error: msgError }) => {
          if (msgError) {
            console.error('Error sending notification message:', msgError);
          }
        });
      }
    },
    onSuccess: () => {
      toast.success('Hulpaanbod verstuurd! We wachten op reactie...');
      queryClient.invalidateQueries({ queryKey: ['help-requests'] });
      queryClient.invalidateQueries({ queryKey: ['flares'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Hulpaanbod versturen mislukt';
      toast.error(message);
    },
  });
}

/**
 * Fetch mission/chat messages for help requests.
 */
export function useMissionMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mission-messages'],
    queryFn: async () => {
      if (!user) return [] as Message[];

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*, message_reactions(*), reply_to:reply_to_id(id, content, sender:sender_id(display_name))')
        .not('flare_id', 'is', null)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!messagesData?.length) return [] as Message[];

      // Get sender profiles
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', senderIds);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach(p => { profileMap[p.user_id] = p.display_name; });

      // Get flare -> participant mapping
      const flareIds = [...new Set(messagesData.map(m => m.flare_id).filter(Boolean) as string[])];

      const { data: participantsData } = await supabase
        .from('flare_participants')
        .select('id, flare_id, user_id')
        .in('flare_id', flareIds);

      const { data: flaresData } = await supabase
        .from('flares')
        .select('id, creator_id')
        .in('id', flareIds);

      const flareOwnerMap: Record<string, string> = {};
      flaresData?.forEach(f => { flareOwnerMap[f.id] = f.creator_id; });

      const participantMap: Record<string, string> = {};
      participantsData?.forEach(p => {
        participantMap[`${p.flare_id}:${p.user_id}`] = p.id;
      });

      const formatted: Message[] = messagesData.map(m => {
        const flareId = m.flare_id || '';
        const flareOwnerId = flareOwnerMap[flareId] || '';
        const helperId = m.sender_id === flareOwnerId ? m.receiver_id : m.sender_id;
        const chatId = participantMap[`${flareId}:${helperId}`] || flareId;

        return {
          id: m.id,
          userId: m.sender_id,
          username: profileMap[m.sender_id] || 'Onbekende buur',
          content: m.content,
          mediaUrl: m.media_url,
          mediaType: m.media_type,
          replyToId: m.reply_to_id,
          replyToContext: m.reply_to ? {
            id: m.reply_to.id,
            content: m.reply_to.content,
            username: m.reply_to.sender?.display_name || 'Onbekende buur'
          } : undefined,
          reactions: (m.message_reactions || []).reduce((acc: Record<string, string[]>, r: any) => {
            if (!acc[r.reaction]) acc[r.reaction] = [];
            acc[r.reaction].push(r.user_id);
            return acc;
          }, {}),
          timestamp: new Date(m.created_at).getTime(),
          type: 'dm' as const,
          chatId,
          read: m.read,
          isEdited: m.is_edited,
          deletedAt: m.deleted_at ? new Date(m.deleted_at).getTime() : null,
        };
      });

      return formatted;
    },
    enabled: !!user,
    refetchInterval: 5000,
  });
}
