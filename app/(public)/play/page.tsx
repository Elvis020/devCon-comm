'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeviceId } from '@/hooks/use-device-id';

export default function JoinQuizPage() {
  const router = useRouter();
  const { deviceId, loading: deviceLoading } = useDeviceId();
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizAvailable, setQuizAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if quiz is available
    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/quiz/active');
        if (response.ok) {
          const data = await response.json();
          setQuizAvailable(data.available);
        } else {
          setQuizAvailable(false);
        }
      } catch (error) {
        console.error('Failed to check quiz availability:', error);
        setQuizAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) return;

    setJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/quiz/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          join_code: joinCode.toUpperCase(),
          nickname,
          device_id: deviceId,
        }),
      });

      if (response.ok) {
        router.push(`/play/${joinCode.toUpperCase()}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to join quiz');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (deviceLoading || quizAvailable === null) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-dc-yellow border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show 404 if quiz is not active
  if (!quizAvailable) {
    return (
      <div className="h-full overflow-hidden bg-dc-dark flex items-center justify-center px-4">
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(249, 225, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(249, 225, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative text-center max-w-2xl">
          {/* Large 404 */}
          <div className="mb-8">
            <h1 className="text-9xl sm:text-[12rem] font-black text-dc-yellow/20 leading-none select-none">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Page Not <span className="text-dc-yellow">Found</span>
            </h2>
            <p className="text-dc-gray-light text-lg mb-2">
              This page is only available when there's an active quiz session.
            </p>
            <p className="text-dc-gray text-sm">
              The host hasn't started a quiz yet. Come back when the game is live!
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="bg-dc-yellow text-dc-dark px-8 py-4 font-bold hover:shadow-glow transition-all uppercase tracking-wide"
            >
              ← Back to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-dc-dark-1 border-2 border-dc-yellow text-dc-yellow px-8 py-4 font-bold hover:shadow-glow-sm transition-all uppercase tracking-wide"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Hint */}
          <div className="mt-12 pt-8 border-t-2 border-dc-dark-3">
            <p className="text-dc-gray text-sm">
              💡 <span className="text-dc-gray-light">Tip:</span> Watch the navigation bar - a "Play" link will appear when the quiz goes live!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dc-dark flex items-center justify-center px-4">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249, 225, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 225, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Decorative Corners */}
        <div className="absolute -top-4 -left-4 w-20 h-20 border-t-4 border-l-4 border-dc-yellow/50" />
        <div className="absolute -top-4 -right-4 w-20 h-20 border-t-4 border-r-4 border-dc-yellow/50" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 border-b-4 border-l-4 border-dc-yellow/50" />
        <div className="absolute -bottom-4 -right-4 w-20 h-20 border-b-4 border-r-4 border-dc-yellow/50" />

        <div className="bg-dc-dark-1 border-2 border-dc-yellow p-8 sm:p-12 shadow-glow">
          <div className="mb-8 text-center">
            <div className="inline-block px-3 py-1 bg-dc-yellow text-dc-dark font-mono text-xs font-bold mb-4">
              QUIZ ENTRY POINT
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-mono">
              JOIN <span className="text-dc-yellow">QUIZ</span>
            </h1>
            <p className="text-dc-gray font-mono text-sm">
              Enter the code displayed on screen
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="join_code" className="block text-dc-yellow font-mono text-xs font-bold mb-2 uppercase">
                Quiz Code
              </label>
              <input
                type="text"
                id="join_code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                placeholder="ABC123"
                className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 focus:border-dc-yellow text-white text-center text-3xl font-bold font-mono uppercase tracking-widest px-4 py-4 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="nickname" className="block text-dc-yellow font-mono text-xs font-bold mb-2 uppercase">
                Your Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                maxLength={20}
                placeholder="QuizMaster"
                className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 focus:border-dc-yellow text-white font-mono px-4 py-3 outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border-2 border-red-500 p-4">
                <p className="text-red-400 text-sm font-mono">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={joining || !joinCode || !nickname}
              className="w-full bg-dc-yellow text-dc-dark font-bold font-mono text-lg py-4 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-dc-yellow-glow opacity-0 group-hover:opacity-20 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                {joining ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-dc-dark border-t-transparent rounded-full animate-spin" />
                    JOINING...
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 bg-dc-dark" />
                    ENTER QUIZ
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
