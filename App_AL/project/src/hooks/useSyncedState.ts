import { useState, useEffect, useCallback } from 'react';

// Canal dedicado para sincronización entre pestañas
const channel = new BroadcastChannel('window_calculator_sync');

export function useSyncedState<T>(key: string, initialValue: T) {
  // Inicializar estado priorizando localStorage para persistencia
  const [value, setValue] = useState<T>(() => {
    // Siempre intentar cargar desde localStorage primero para persistencia
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(`Error loading state for key "${key}":`, error);
    }
    
    // Si no hay valor en localStorage, usar el valor inicial
    return initialValue;
  });

  // Manejar cambios en localStorage
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === key && event.newValue !== null && event.newValue !== 'undefined') {
      try {
        const newValue = JSON.parse(event.newValue);
        setValue(newValue);
      } catch (error) {
        console.error(`Error parsing storage value for key "${key}":`, error);
      }
    }
  }, [key]);

  // Manejar mensajes del canal de broadcast
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.key === key) {
      try {
        setValue(event.data.value);
      } catch (error) {
        console.error(`Error handling broadcast message for key "${key}":`, error);
      }
    }
  }, [key]);

  // Configurar listeners
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    channel.addEventListener('message', handleMessage);

    // Solicitar estado actual al abrir nueva pestaña
    channel.postMessage({ type: 'REQUEST_STATE', key });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      channel.removeEventListener('message', handleMessage);
    };
  }, [key, handleStorageChange, handleMessage]);

  // Función para actualizar el estado
  const setSyncedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const actualNewValue = newValue instanceof Function ? newValue(value) : newValue;
      
      // Actualizar estado local
      setValue(actualNewValue);
      
      // Persistir en localStorage, pero remover si es undefined
      if (actualNewValue === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(actualNewValue));
      }
      
      // Notificar a otras pestañas
      channel.postMessage({ key, value: actualNewValue });
    } catch (error) {
      console.error(`Error saving state for key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setSyncedValue] as const;
}