'use client';

import { useEffect, useState } from 'react';
import { QuizStateResponse } from '@/types';
import { POLL_INTERVAL_MS } from '@/lib/constants';

export function useQuizPolling(sessionId: string | null, userId: string | null) {
  const [state, setState] = useState<QuizStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    if (!sessionId || !userId) {
      setLoading(false);
      return;
    }

    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/quiz/state?sessionId=${sessionId}&userId=${userId}`
        );

        if (response.ok) {
          const data = await response.json();
          setState(data);
          setError(null);
          setSessionEnded(false);
        } else if (response.status === 404) {
          // Session not found - quiz has ended or been deleted
          setSessionEnded(true);
          setError(null);
        } else {
          setError('Failed to fetch quiz state');
          setSessionEnded(false);
        }
      } catch (err) {
        setError('Connection error');
        setSessionEnded(false);
      } finally {
        setLoading(false);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, userId]);

  return { state, loading, error, sessionEnded };
}
