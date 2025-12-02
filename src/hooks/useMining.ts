import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { WorldResource } from '@/lib/resources';
import { RARITY_CONFIG, type ResourceRarity } from '@/lib/resources';
import { getDistanceMeters, MINING_PROXIMITY_METERS } from '@/lib/geo';

interface MiningState {
  isMining: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

/**
 * Hook for handling mining actions
 */
export function useMining() {
  const { user, refreshProfile } = useAuth();
  const [state, setState] = useState<MiningState>({
    isMining: false,
    progress: 0,
    error: null,
    success: false
  });

  /**
   * Check if user is close enough to mine a resource
   */
  const canMine = useCallback((
    userPosition: { lat: number; lng: number },
    resourcePosition: { lat: number; lng: number }
  ): { canMine: boolean; distance: number } => {
    const distance = getDistanceMeters(
      userPosition.lat,
      userPosition.lng,
      resourcePosition.lat,
      resourcePosition.lng
    );
    return {
      canMine: distance <= MINING_PROXIMITY_METERS,
      distance
    };
  }, []);

  /**
   * Mine a resource
   */
  const mineResource = useCallback(async (
    resource: WorldResource,
    userPosition: { lat: number; lng: number }
  ): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'You must be logged in to mine' }));
      return false;
    }

    // Check distance
    const { canMine: isCloseEnough, distance } = canMine(userPosition, resource.location);
    if (!isCloseEnough) {
      setState(prev => ({ 
        ...prev, 
        error: `Get closer to mine! You are ${Math.round(distance)}m away (need to be within ${MINING_PROXIMITY_METERS}m)` 
      }));
      return false;
    }

    // Get rarity for mining time
    const rarity = (resource.resource_type?.rarity || 'common') as ResourceRarity;
    const miningTimeMs = RARITY_CONFIG[rarity].miningTimeMs;
    const xpReward = RARITY_CONFIG[rarity].xpReward;

    setState({ isMining: true, progress: 0, error: null, success: false });

    // Animate progress
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / miningTimeMs) * 100, 100);
      setState(prev => ({ ...prev, progress }));
    }, 50);

    // Wait for mining time
    await new Promise(resolve => setTimeout(resolve, miningTimeMs));
    clearInterval(progressInterval);

    try {
      // Mark resource as mined
      const { error: updateError } = await supabase
        .from('world_resources')
        .update({
          mined_by: user.id,
          mined_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', resource.id)
        .eq('is_active', true); // Ensure it hasn't been mined by someone else

      if (updateError) {
        setState({ isMining: false, progress: 0, error: 'Failed to mine resource', success: false });
        return false;
      }

      // Add to inventory (upsert to handle existing items)
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .upsert(
          {
            user_id: user.id,
            resource_type_id: resource.resource_type_id,
            quantity: 1
          },
          {
            onConflict: 'user_id,resource_type_id',
            ignoreDuplicates: false
          }
        );

      // If upsert fails, try to increment existing quantity
      if (inventoryError) {
        const { data: existing } = await supabase
          .from('user_inventory')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('resource_type_id', resource.resource_type_id)
          .single();

        if (existing) {
          await supabase
            .from('user_inventory')
            .update({ quantity: existing.quantity + 1 })
            .eq('user_id', user.id)
            .eq('resource_type_id', resource.resource_type_id);
        }
      }

      // Log mining action
      await supabase
        .from('mining_log')
        .insert({
          user_id: user.id,
          world_resource_id: resource.id,
          resource_type_id: resource.resource_type_id,
          location: resource.location
        });

      // Update user stats (increment total_mined and add XP)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_mined, mining_xp')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            total_mined: (profileData.total_mined || 0) + 1,
            mining_xp: (profileData.mining_xp || 0) + xpReward
          })
          .eq('user_id', user.id);
      }

      // Refresh profile to update UI
      await refreshProfile();

      setState({ isMining: false, progress: 100, error: null, success: true });
      return true;
    } catch (err) {
      console.error('Mining error:', err);
      setState({ isMining: false, progress: 0, error: 'An error occurred while mining', success: false });
      return false;
    }
  }, [user, canMine, refreshProfile]);

  /**
   * Reset mining state
   */
  const resetState = useCallback(() => {
    setState({ isMining: false, progress: 0, error: null, success: false });
  }, []);

  return {
    ...state,
    canMine,
    mineResource,
    resetState
  };
}
