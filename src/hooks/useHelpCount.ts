import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Fetch count of completed helps for the current user.
 * Used on the profile page for badge progress.
 */
export function useHelpCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['help-count'],
    queryFn: async () => {
      if (!user) return 0;

      const { count } = await supabase
        .from('flare_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      return count || 0;
    },
    enabled: !!user,
  });
}
