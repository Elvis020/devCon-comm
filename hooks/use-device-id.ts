'use client';

import { useEffect, useState } from 'react';
import { generateId } from '@/lib/utils';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get or create device ID
    const stored = localStorage.getItem('devcon-comm-device-id');

    if (stored) {
      setDeviceId(stored);
    } else {
      const newId = generateId();
      localStorage.setItem('devcon-comm-device-id', newId);
      setDeviceId(newId);
    }

    setLoading(false);
  }, []);

  return { deviceId, loading };
}
