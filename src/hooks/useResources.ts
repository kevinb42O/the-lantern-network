import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorldResource, ResourceType } from '@/lib/resources';
import { 
  MINING_RANGE_METERS, 
  MIN_RESOURCE_SPACING_METERS, 
  generateRandomPointInRadius,
  arePointsApart 
} from '@/lib/geo';
import { 
  getRandomRarity, 
  calculateExpiryTime, 
  MAX_RESOURCES_PER_USER,
  MIN_SPAWN_COUNT,
  MAX_SPAWN_COUNT
} from '@/lib/resources';

interface UseResourcesOptions {
  userPosition: { lat: number; lng: number } | null;
  enabled?: boolean;
}

interface ResourcesState {
  resources: WorldResource[];
  resourceTypes: ResourceType[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing nearby resources
 */
export function useResources({ userPosition, enabled = true }: UseResourcesOptions) {
  const [state, setState] = useState<ResourcesState>({
    resources: [],
    resourceTypes: [],
    loading: true,
    error: null
  });

  // Fetch resource types
  const fetchResourceTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('resource_types')
      .select('*');

    if (error) {
      console.error('Error fetching resource types:', error);
      return [];
    }

    return data as ResourceType[];
  }, []);

  // Fetch nearby active resources
  const fetchNearbyResources = useCallback(async (position: { lat: number; lng: number }) => {
    // Using PostGIS ST_DWithin for efficient geo queries
    // For now, we'll fetch all active resources and filter client-side
    // since the location is stored as JSONB, not GEOGRAPHY
    const { data, error } = await supabase
      .from('world_resources')
      .select(`
        *,
        resource_type:resource_types(*)
      `)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching resources:', error);
      return [];
    }

    // Filter resources within mining range
    const nearbyResources = (data || []).filter((resource: { location: { lat: number; lng: number } }) => {
      if (!resource.location) return false;
      const distance = Math.sqrt(
        Math.pow(resource.location.lat - position.lat, 2) +
        Math.pow(resource.location.lng - position.lng, 2)
      ) * 111320; // Approximate meters
      return distance <= MINING_RANGE_METERS;
    });

    return nearbyResources as WorldResource[];
  }, []);

  // Spawn new resources if needed
  const spawnResources = useCallback(async (
    position: { lat: number; lng: number },
    existingResources: WorldResource[],
    resourceTypes: ResourceType[]
  ) => {
    if (existingResources.length >= MAX_RESOURCES_PER_USER || resourceTypes.length === 0) {
      return existingResources;
    }

    const spawnCount = Math.min(
      Math.floor(Math.random() * (MAX_SPAWN_COUNT - MIN_SPAWN_COUNT + 1)) + MIN_SPAWN_COUNT,
      MAX_RESOURCES_PER_USER - existingResources.length
    );

    const newResources: Array<{
      resource_type_id: string;
      location: { lat: number; lng: number };
      spawned_at: string;
      expires_at: string;
      is_active: boolean;
    }> = [];
    const allPoints = existingResources.map(r => r.location);

    for (let i = 0; i < spawnCount; i++) {
      // Generate random point
      let point: { lat: number; lng: number } | null = null;
      let attempts = 0;
      const maxAttempts = 20;

      while (!point && attempts < maxAttempts) {
        const candidate = generateRandomPointInRadius(
          position.lat,
          position.lng,
          MINING_RANGE_METERS
        );

        // Check if point is far enough from all existing points
        const isFarEnough = [...allPoints, ...newResources.map(r => r.location)].every(
          existing => arePointsApart(
            candidate.lat,
            candidate.lng,
            existing.lat,
            existing.lng,
            MIN_RESOURCE_SPACING_METERS
          )
        );

        if (isFarEnough) {
          point = candidate;
        }
        attempts++;
      }

      if (point) {
        // Get random resource type based on rarity
        const rarity = getRandomRarity();
        const matchingTypes = resourceTypes.filter(rt => rt.rarity === rarity);
        const resourceType = matchingTypes[Math.floor(Math.random() * matchingTypes.length)];

        if (resourceType) {
          const expiryTime = calculateExpiryTime(rarity);
          newResources.push({
            resource_type_id: resourceType.id,
            location: point,
            spawned_at: new Date().toISOString(),
            expires_at: expiryTime.toISOString(),
            is_active: true
          });
          allPoints.push(point);
        }
      }
    }

    if (newResources.length > 0) {
      const { data, error } = await supabase
        .from('world_resources')
        .insert(newResources)
        .select(`
          *,
          resource_type:resource_types(*)
        `);

      if (error) {
        console.error('Error spawning resources:', error);
        return existingResources;
      }

      return [...existingResources, ...(data as WorldResource[])];
    }

    return existingResources;
  }, []);

  // Main effect to fetch and manage resources
  useEffect(() => {
    if (!enabled || !userPosition) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    let isMounted = true;

    const loadResources = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Fetch resource types first
        const types = await fetchResourceTypes();
        if (!isMounted) return;

        // Fetch nearby resources
        let resources = await fetchNearbyResources(userPosition);
        if (!isMounted) return;

        // Spawn new resources if needed
        if (types.length > 0) {
          resources = await spawnResources(userPosition, resources, types);
          if (!isMounted) return;
        }

        setState({
          resources,
          resourceTypes: types,
          loading: false,
          error: null
        });
      } catch {
        if (!isMounted) return;
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load resources'
        }));
      }
    };

    loadResources();

    // Set up realtime subscription for resource updates
    const channel = supabase
      .channel('world-resources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'world_resources'
        },
        () => {
          // Refetch resources on any change
          fetchNearbyResources(userPosition).then(resources => {
            if (isMounted) {
              setState(prev => ({ ...prev, resources }));
            }
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [enabled, userPosition, fetchResourceTypes, fetchNearbyResources, spawnResources]);

  // Refresh resources manually
  const refreshResources = useCallback(async () => {
    if (!userPosition) return;

    setState(prev => ({ ...prev, loading: true }));
    const resources = await fetchNearbyResources(userPosition);
    setState(prev => ({ ...prev, resources, loading: false }));
  }, [userPosition, fetchNearbyResources]);

  return {
    ...state,
    refreshResources
  };
}
