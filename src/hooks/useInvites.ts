import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Generate a unique invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get user's invites
export function useMyInvites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-invites'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('invites')
        .select('*, used_by:used_by_id(display_name)')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Create a new invite
export function useCreateInvite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expiresInDays: number = 7) => {
      if (!user) throw new Error('Must be logged in to create an invite');

      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data, error } = await supabase
        .from('invites')
        .insert({
          inviter_id: user.id,
          code,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invites'] });
    },
  });
}

// Validate an invite code
export function useValidateInvite() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from('invites')
        .select('*, inviter:inviter_id(display_name)')
        .eq('code', code.toUpperCase())
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Invalid or expired invite code');
      }

      return data;
    },
  });
}

// Redeem an invite code
export function useRedeemInvite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error('Must be logged in to redeem an invite');

      // First validate
      const { data: invite, error: validateError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (validateError || !invite) {
        throw new Error('Invalid or expired invite code');
      }

      // Mark as used
      const { error: updateError } = await supabase
        .from('invites')
        .update({ used: true, used_by_id: user.id })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      // Create connection between inviter and new user
      await supabase.from('connections').insert([
        {
          user_id: user.id,
          connected_user_id: invite.inviter_id,
          trust_level: 2, // Higher initial trust for invited users
        },
        {
          user_id: invite.inviter_id,
          connected_user_id: user.id,
          trust_level: 2,
        },
      ]);

      // Award bonus lanterns to both users
      const bonusAmount = 10;

      // Award to new user
      const { data: newUserProfile } = await supabase
        .from('profiles')
        .select('lantern_balance')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('profiles')
        .update({ lantern_balance: (newUserProfile?.lantern_balance || 0) + bonusAmount })
        .eq('user_id', user.id);

      // Award to inviter
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('lantern_balance')
        .eq('user_id', invite.inviter_id)
        .single();

      await supabase
        .from('profiles')
        .update({ lantern_balance: (inviterProfile?.lantern_balance || 0) + bonusAmount })
        .eq('user_id', invite.inviter_id);

      // Record transactions
      await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'invite_bonus',
          amount: bonusAmount,
          description: 'Welcome bonus for joining The Lantern Network',
        },
        {
          user_id: invite.inviter_id,
          type: 'referral_bonus',
          amount: bonusAmount,
          description: 'Referral bonus for inviting a new member',
        },
      ]);

      return { success: true, inviterId: invite.inviter_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
