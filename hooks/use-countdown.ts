'use client';

import { useEffect, useState } from 'react';

export function useCountdown(targetTime: Date | null, duration: number) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (!targetTime) {
      setRemaining(duration);
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const target = new Date(targetTime).getTime();
      const elapsed = now - target;
      const timeLeft = Math.max(0, duration * 1000 - elapsed);
      setRemaining(Math.floor(timeLeft / 1000));
    };

    // Update immediately
    updateRemaining();

    // Update every 100ms for smooth animation
    const interval = setInterval(updateRemaining, 100);

    return () => clearInterval(interval);
  }, [targetTime, duration]);

  return remaining;
}
