import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Admin: Remove a flare.
 */
export function useRemoveFlare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flareId: string) => {
      const { error } = await supabase
        .from('flares')
        .delete()
        .eq('id', flareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flares'] });
    },
  });
}
