import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getPendingCount, startSync, initSyncScheduler, stopSyncScheduler } from '@/services/api/syncService';
import { checkConnection } from '@/services/api/syncService';

export function useSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;

    // Iniciar scheduler de sincronización
    initSyncScheduler();
    
    // Actualizar estado de conexión periódicamente
    const interval = setInterval(async () => {
      const online = await checkConnection();
      setIsOnline(online);
      
      const count = await getPendingCount();
      setPendingCount(count);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      stopSyncScheduler();
    };
  }, [user]);

  const forceSync = async () => {
    setIsSyncing(true);
    await startSync();
    setIsSyncing(false);
    const count = await getPendingCount();
    setPendingCount(count);
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    forceSync,
  };
}