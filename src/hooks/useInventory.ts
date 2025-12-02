import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { InventoryItem, ResourceType } from '@/lib/resources';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing user's resource inventory
 */
export function useInventory() {
  const { user } = useAuth();
  const [state, setState] = useState<InventoryState>({
    items: [],
    loading: true,
    error: null
  });

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    if (!user) {
      setState({ items: [], loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase
      .from('user_inventory')
      .select(`
        *,
        resource_type:resource_types(*)
      `)
      .eq('user_id', user.id)
      .order('acquired_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to load inventory' }));
      return;
    }

    setState({
      items: data as InventoryItem[],
      loading: false,
      error: null
    });
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Subscribe to inventory changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_inventory',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchInventory]);

  /**
   * Sell a resource for lanterns
   */
  const sellResource = useCallback(async (resourceTypeId: string, quantity: number = 1): Promise<boolean> => {
    if (!user) return false;

    // Find the inventory item
    const item = state.items.find(i => i.resource_type_id === resourceTypeId);
    if (!item || item.quantity < quantity) {
      setState(prev => ({ ...prev, error: 'Not enough resources to sell' }));
      return false;
    }

    const resourceType = item.resource_type as ResourceType;
    const totalValue = resourceType.base_value * quantity;

    try {
      // Update inventory
      if (item.quantity === quantity) {
        // Delete the item if selling all
        await supabase
          .from('user_inventory')
          .delete()
          .eq('id', item.id);
      } else {
        // Decrement quantity
        await supabase
          .from('user_inventory')
          .update({ quantity: item.quantity - quantity })
          .eq('id', item.id);
      }

      // Add lanterns to user's balance
      const { data: profileData } = await supabase
        .from('profiles')
        .select('lantern_balance')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            lantern_balance: profileData.lantern_balance + totalValue
          })
          .eq('user_id', user.id);
      }

      // Log transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'transfer_in',
          amount: totalValue,
          description: `Sold ${quantity}x ${resourceType.name}`
        });

      // Refresh inventory
      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Error selling resource:', err);
      setState(prev => ({ ...prev, error: 'Failed to sell resource' }));
      return false;
    }
  }, [user, state.items, fetchInventory]);

  /**
   * Get total inventory value in lanterns
   */
  const getTotalValue = useCallback(() => {
    return state.items.reduce((total, item) => {
      const resourceType = item.resource_type as ResourceType;
      return total + (resourceType?.base_value || 0) * item.quantity;
    }, 0);
  }, [state.items]);

  /**
   * Get total item count
   */
  const getTotalCount = useCallback(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);

  return {
    ...state,
    refreshInventory: fetchInventory,
    sellResource,
    getTotalValue,
    getTotalCount
  };
}
