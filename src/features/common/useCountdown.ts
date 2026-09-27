import { useEffect, useState } from 'react';

/** Tempo até o prazo, atualizado a cada 30 s. Prazo em horário local. */
export function useCountdown(deadline: string | undefined): { hours: number; minutes: number; ms: number } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const ms = deadline ? Math.max(0, new Date(deadline).getTime() - now) : 0;
  return { hours: Math.floor(ms / 3600_000), minutes: Math.floor((ms % 3600_000) / 60_000), ms };
}
