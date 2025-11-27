import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Get user's transaction history
export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*, flares(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Get user's lantern balance
export function useLanternBalance() {
  const { profile } = useAuth();
  return profile?.lantern_balance ?? 0;
}

// Transfer lanterns to another user
export function useTransferLanterns() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      receiverId,
      amount,
      description,
    }: {
      receiverId: string;
      amount: number;
      description: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      if (!profile || profile.lantern_balance < amount) {
        throw new Error('Insufficient lantern balance');
      }

      // Deduct from sender
      const { error: senderError } = await supabase
        .from('profiles')
        .update({ lantern_balance: profile.lantern_balance - amount })
        .eq('user_id', user.id);

      if (senderError) throw senderError;

      // Get receiver's current balance
      const { data: receiver, error: receiverFetchError } = await supabase
        .from('profiles')
        .select('lantern_balance')
        .eq('user_id', receiverId)
        .single();

      if (receiverFetchError) throw receiverFetchError;

      // Add to receiver
      const { error: receiverError } = await supabase
        .from('profiles')
        .update({ lantern_balance: (receiver?.lantern_balance || 0) + amount })
        .eq('user_id', receiverId);

      if (receiverError) throw receiverError;

      // Record transactions
      await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'transfer_out',
          amount: -amount,
          description: `Sent: ${description}`,
        },
        {
          user_id: receiverId,
          type: 'transfer_in',
          amount: amount,
          description: `Received: ${description}`,
        },
      ]);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Award bonus lanterns (for completing actions)
export function useAwardLanterns() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      amount,
      reason,
      flareId,
    }: {
      amount: number;
      reason: string;
      flareId?: string;
    }) => {
      if (!user || !profile) throw new Error('Must be logged in');

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ lantern_balance: profile.lantern_balance + amount })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'bonus',
        amount,
        description: reason,
        flare_id: flareId,
      });

      if (transactionError) throw transactionError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
