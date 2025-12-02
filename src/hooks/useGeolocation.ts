import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Hook for tracking user's GPS position in real-time
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    error: null,
    loading: true,
    permissionDenied: false
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0
  } = options;

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      },
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
      permissionDenied: false
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unknown error occurred';
    let permissionDenied = false;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location permissions.';
        permissionDenied = true;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable. Please check your GPS settings.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
      permissionDenied
    }));
  }, []);

  const requestPermission = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge
    });
  }, [updatePosition, handleError, enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    // Initial position request
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge
    });

    // Watch position for real-time updates
    const watchId = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updatePosition, handleError, enableHighAccuracy, timeout, maximumAge]);

  return {
    ...state,
    requestPermission
  };
}
