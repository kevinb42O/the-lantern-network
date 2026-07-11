import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      if (!user) throw new Error('Must be logged in to react');

      // Check if reaction already exists
      const { data: existingReaction, error: fetchError } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingReaction) {
        // Remove reaction
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
        
        if (deleteError) throw deleteError;
        return { action: 'removed', messageId, reaction };
      } else {
        // Add reaction
        const { error: insertError } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction,
          });

        if (insertError) throw insertError;
        return { action: 'added', messageId, reaction };
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['mission-messages'] });
    },
    onError: () => {
      toast.error('Reactie mislukt');
    }
  });
}
