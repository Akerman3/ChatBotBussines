import { useState, useEffect, useCallback } from 'react';
import {
  loadProfilesFromSupabase,
  loadHardwareFromSupabase,
  loadGlassFromSupabase,
  subscribeToProfileChanges,
  subscribeToHardwareChanges,
  subscribeToGlassChanges
} from '../utils/supabasePriceSync';

interface PriceData {
  profiles: any[];
  hardware: any[];
  glass: any[];
  materialIvaPercentage: number;
  timestamp: number;
}

const PRICE_UPDATE_CHANNEL = new BroadcastChannel('price_updates');

export function usePriceUpdates() {
  const [priceData, setPriceData] = useState<PriceData>(() => ({
    profiles: JSON.parse(localStorage.getItem('windowProfiles') || '[]'),
    hardware: JSON.parse(localStorage.getItem('windowHardware') || '[]'),
    glass: JSON.parse(localStorage.getItem('windowGlass') || '[]'),
    materialIvaPercentage: JSON.parse(localStorage.getItem('materialIvaPercentage') || '16'),
    timestamp: Date.now()
  }));

  const [hasUpdates, setHasUpdates] = useState(false);

  const loadPriceData = useCallback(async () => {
    try {
      let profiles = JSON.parse(localStorage.getItem('windowProfiles') || '[]');
      let hardware = JSON.parse(localStorage.getItem('windowHardware') || '[]');
      let glass = JSON.parse(localStorage.getItem('windowGlass') || '[]');
      let materialIvaPercentage = JSON.parse(localStorage.getItem('materialIvaPercentage') || '16');

      const supabaseProfiles = await loadProfilesFromSupabase();
      if (supabaseProfiles && supabaseProfiles.length > 0) {
        profiles = supabaseProfiles;
        localStorage.setItem('windowProfiles', JSON.stringify(profiles));
        console.log('✅ Profiles loaded from Supabase and synced to localStorage');
      }

      const supabaseHardware = await loadHardwareFromSupabase();
      if (supabaseHardware && supabaseHardware.length > 0) {
        hardware = supabaseHardware;
        localStorage.setItem('windowHardware', JSON.stringify(hardware));
        console.log('✅ Hardware loaded from Supabase and synced to localStorage');
      }

      const supabaseGlass = await loadGlassFromSupabase();
      if (supabaseGlass && supabaseGlass.length > 0) {
        glass = supabaseGlass;
        localStorage.setItem('windowGlass', JSON.stringify(glass));
        console.log('✅ Glass loaded from Supabase and synced to localStorage');
      }

      const newPriceData: PriceData = {
        profiles,
        hardware,
        glass,
        materialIvaPercentage,
        timestamp: Date.now()
      };

      setPriceData(newPriceData);
      setHasUpdates(true);

      setTimeout(() => {
        setHasUpdates(false);
      }, 5000);

      return newPriceData;
    } catch (error) {
      console.error('Error loading price data:', error);
      return null;
    }
  }, []);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (
      event.key === 'windowProfiles' ||
      event.key === 'windowHardware' ||
      event.key === 'windowGlass' ||
      event.key === 'materialIvaPercentage'
    ) {
      loadPriceData();
    }
  }, [loadPriceData]);

  const handleBroadcastMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'PRICE_UPDATE') {
      loadPriceData();
    }
  }, [loadPriceData]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    PRICE_UPDATE_CHANNEL.addEventListener('message', handleBroadcastMessage);

    const profileSub = subscribeToProfileChanges(() => {
      console.log('🔔 Detected profile change from Supabase, reloading...');
      loadPriceData();
    });

    const hardwareSub = subscribeToHardwareChanges(() => {
      console.log('🔔 Detected hardware change from Supabase, reloading...');
      loadPriceData();
    });

    const glassSub = subscribeToGlassChanges(() => {
      console.log('🔔 Detected glass change from Supabase, reloading...');
      loadPriceData();
    });

    loadPriceData();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      PRICE_UPDATE_CHANNEL.removeEventListener('message', handleBroadcastMessage);

      if (profileSub) {
        profileSub.unsubscribe();
      }
      if (hardwareSub) {
        hardwareSub.unsubscribe();
      }
      if (glassSub) {
        glassSub.unsubscribe();
      }
    };
  }, [handleStorageChange, handleBroadcastMessage, loadPriceData]);

  const resetUpdateFlag = useCallback(() => {
    setHasUpdates(false);
  }, []);

  return {
    priceData,
    hasUpdates,
    resetUpdateFlag,
    refreshPriceData: loadPriceData
  };
}

export function emitPriceUpdate() {
  PRICE_UPDATE_CHANNEL.postMessage({
    type: 'PRICE_UPDATE',
    timestamp: Date.now()
  });
}
