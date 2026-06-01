import { useEffect, useState } from "react";
import { checkConnection } from "@/services/api/syncService";

export function useOnline() {
  const [online, setOnline] = useState(true);
  const [forced, setForced] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const update = async () => {
      const isConnected = await checkConnection();
      setOnline(isConnected);
    };
    
    update();
    
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    
    // Verificar cada 10 segundos
    const interval = setInterval(update, 10000);
    
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      clearInterval(interval);
    };
  }, []);

  const effective = forced ?? online;
  return { online: effective, toggleForce: () => setForced((f) => (f === null ? !online : !f)) };
}