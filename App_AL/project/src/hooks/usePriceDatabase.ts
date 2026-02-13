import { useState, useEffect } from 'react';

interface Profile {
  name: string;
  colors: {
    [key: string]: {
      price6m: string;
      pricePerM: string;
    };
  };
}

interface Hardware {
  name: string;
  pricePerPackage: string;
  pricePerPiece: string;
}

interface Glass {
  name: string;
  pricePerPiece: string;
  pricePerM2: string;
}

export function usePriceDatabase() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [glass, setGlass] = useState<Glass[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const loadData = () => {
    try {
      const savedProfiles = localStorage.getItem('windowProfiles');
      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }

      const savedHardware = localStorage.getItem('windowHardware');
      if (savedHardware) {
        setHardware(JSON.parse(savedHardware));
      }

      const savedGlass = localStorage.getItem('windowGlass');
      if (savedGlass) {
        setGlass(JSON.parse(savedGlass));
      }

      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error loading price database:', error);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'windowProfiles' || e.key === 'windowHardware' || e.key === 'windowGlass') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(() => {
      const currentProfiles = localStorage.getItem('windowProfiles');
      const currentHardware = localStorage.getItem('windowHardware');
      const currentGlass = localStorage.getItem('windowGlass');

      const currentProfilesData = currentProfiles ? JSON.parse(currentProfiles) : [];
      const currentHardwareData = currentHardware ? JSON.parse(currentHardware) : [];
      const currentGlassData = currentGlass ? JSON.parse(currentGlass) : [];

      if (
        JSON.stringify(currentProfilesData) !== JSON.stringify(profiles) ||
        JSON.stringify(currentHardwareData) !== JSON.stringify(hardware) ||
        JSON.stringify(currentGlassData) !== JSON.stringify(glass)
      ) {
        loadData();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [profiles, hardware, glass]);

  return {
    profiles,
    hardware,
    glass,
    lastUpdate
  };
}
