'use client';

import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  total_score: number;
  events_participated?: number;
  is_claimed?: boolean;
  user_id?: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [merging, setMerging] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [claimForm, setClaimForm] = useState({
    userId: '',
    deviceId: '',
    username: '',
    email: '',
    secretQuestion: '',
    secretAnswer: '',
  });
  const [mergeForm, setMergeForm] = useState({
    targetUserId: '',
    sourceUserId: '',
    secretAnswer: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const response = await fetch('/api/leaderboard?type=all-time');
    if (response.ok) {
      const data = await response.json();
      setLeaderboard(data);
    }

    setLoading(false);
  };

  const handleClaimSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClaiming(true);
    setAccountError(null);
    setAccountMessage(null);

    try {
      const response = await fetch('/api/users/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: claimForm.userId,
          device_id: claimForm.deviceId,
          username: claimForm.username,
          email: claimForm.email || null,
          secret_question: claimForm.secretQuestion,
          secret_answer: claimForm.secretAnswer,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAccountError(data.error || 'Failed to claim profile');
        return;
      }

      setAccountMessage(`Claimed ${data.username} successfully.`);
      setClaimForm({
        userId: '',
        deviceId: '',
        username: '',
        email: '',
        secretQuestion: '',
        secretAnswer: '',
      });
      fetchData();
    } catch {
      setAccountError('Failed to claim profile');
    } finally {
      setClaiming(false);
    }
  };

  const handleMergeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMerging(true);
    setAccountError(null);
    setAccountMessage(null);

    try {
      const response = await fetch('/api/users/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: mergeForm.targetUserId,
          source_user_id: mergeForm.sourceUserId,
          secret_answer: mergeForm.secretAnswer,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAccountError(data.error || 'Failed to merge profiles');
        return;
      }

      setAccountMessage(`Merged account ${data.source_user_id} into ${data.merged_into_user_id}.`);
      setMergeForm({
        targetUserId: '',
        sourceUserId: '',
        secretAnswer: '',
      });
      fetchData();
    } catch {
      setAccountError('Failed to merge profiles');
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-dc-yellow border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: '👑', label: 'CHAMPION' };
    if (rank === 2) return { icon: '🥈', label: 'RUNNER-UP' };
    if (rank === 3) return { icon: '🥉', label: 'THIRD PLACE' };
    return { icon: `#${rank}`, label: '' };
  };

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-dc-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 flex items-center gap-3">
            <span className="text-dc-yellow">🏆</span> All-Time Leaderboard
          </h1>
          <p className="text-dc-gray-light text-lg">Top players across all quiz sessions</p>
        </div>

        {/* Podium - Top 3 */}
        {topThree.length === 3 && (
          <div className="mb-12">
            <div className="grid grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
              {/* 2nd Place */}
              <div className="relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-dc-dark-1 border-2 border-dc-gray-light p-6 text-center h-64 flex flex-col justify-end">
                  <div className="text-5xl mb-3">🥈</div>
                  <div className="text-xs text-dc-gray mb-2 font-semibold uppercase tracking-wider">2nd Place</div>
                  <div className="font-bold text-lg text-white mb-2 truncate">
                    {topThree[1]?.nickname}
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-black text-white">{topThree[1]?.total_score}</span>
                    <span className="text-dc-gray text-xs uppercase">pts</span>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="relative animate-slide-up" style={{ animationDelay: '0s' }}>
                <div className="bg-dc-yellow border-4 border-dc-yellow-glow p-6 text-center h-80 flex flex-col justify-end shadow-glow-lg">
                  <div className="text-6xl mb-3 animate-pulse-glow">👑</div>
                  <div className="text-xs text-dc-dark font-bold mb-2 uppercase tracking-wider">Champion</div>
                  <div className="font-black text-2xl text-dc-dark mb-2 truncate">
                    {topThree[0]?.nickname}
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-dc-dark">{topThree[0]?.total_score}</span>
                    <span className="text-dc-dark text-sm uppercase">pts</span>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="bg-dc-dark-1 border-2 border-dc-gray p-6 text-center h-56 flex flex-col justify-end">
                  <div className="text-5xl mb-3">🥉</div>
                  <div className="text-xs text-dc-gray mb-2 font-semibold uppercase tracking-wider">3rd Place</div>
                  <div className="font-bold text-lg text-white mb-2 truncate">
                    {topThree[2]?.nickname}
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-black text-white">{topThree[2]?.total_score}</span>
                    <span className="text-dc-gray text-xs uppercase">pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="bg-dc-dark-1 border-2 border-dc-dark-3">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b-2 border-dc-dark-3 bg-dc-dark-2">
            <div className="col-span-2 text-xs text-dc-yellow font-bold uppercase tracking-wider">Rank</div>
            <div className="col-span-6 text-xs text-dc-yellow font-bold uppercase tracking-wider">Player</div>
            <div className="col-span-4 text-xs text-dc-yellow font-bold text-right uppercase tracking-wider">Score</div>
          </div>

          {/* All Rankings */}
          <div className="divide-y-2 divide-dc-dark-3">
            {leaderboard.map((entry, index) => {
              const rankInfo = getRankDisplay(entry.rank);
              const isTopThree = entry.rank <= 3;

              return (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 transition-colors ${
                    isTopThree
                      ? 'bg-dc-yellow/5 hover:bg-dc-yellow/10'
                      : 'hover:bg-dc-dark-2'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <span className={`text-2xl ${isTopThree ? '' : 'font-bold text-dc-gray'}`}>
                      {rankInfo.icon}
                    </span>
                  </div>

                  <div className="col-span-6 flex flex-col justify-center">
                    <div className={`font-bold text-lg ${isTopThree ? 'text-dc-yellow' : 'text-white'}`}>
                      {entry.nickname}
                    </div>
                    {entry.user_id && (
                      <div className="text-xs text-dc-gray mt-1 font-mono">
                        ID: {entry.user_id}
                      </div>
                    )}
                    {entry.events_participated && (
                      <div className="text-sm text-dc-gray mt-1">
                        {entry.events_participated} {entry.events_participated === 1 ? 'event' : 'events'}
                      </div>
                    )}
                  </div>

                  <div className="col-span-4 flex items-center justify-end gap-2">
                    <span className={`text-3xl font-black ${isTopThree ? 'text-dc-yellow' : 'text-white'}`}>
                      {entry.total_score}
                    </span>
                    <span className="text-dc-gray text-xs uppercase">pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-dc-gray text-lg">No scores yet. Be the first!</p>
            </div>
          )}
        </div>

        <div className="mt-10 bg-dc-dark-1 border-2 border-dc-dark-3 p-6">
          <h2 className="text-2xl font-black text-white mb-2">Account Tools (Prototype)</h2>
          <p className="text-dc-gray mb-6">
            Claim a leaderboard profile, then merge duplicate profiles into one account.
          </p>

          {accountMessage && (
            <div className="mb-4 border border-green-500/50 bg-green-500/10 text-green-200 px-4 py-3 text-sm">
              {accountMessage}
            </div>
          )}
          {accountError && (
            <div className="mb-4 border border-red-500/50 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
              {accountError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <form className="space-y-3" onSubmit={handleClaimSubmit}>
              <h3 className="text-lg font-bold text-dc-yellow">Claim Profile</h3>
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="User ID" value={claimForm.userId} onChange={(e) => setClaimForm(prev => ({ ...prev, userId: e.target.value }))} required />
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Device ID" value={claimForm.deviceId} onChange={(e) => setClaimForm(prev => ({ ...prev, deviceId: e.target.value }))} required />
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Username" value={claimForm.username} onChange={(e) => setClaimForm(prev => ({ ...prev, username: e.target.value }))} required />
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Email (optional)" value={claimForm.email} onChange={(e) => setClaimForm(prev => ({ ...prev, email: e.target.value }))} />
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Secret Question" value={claimForm.secretQuestion} onChange={(e) => setClaimForm(prev => ({ ...prev, secretQuestion: e.target.value }))} required />
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Secret Answer" type="password" value={claimForm.secretAnswer} onChange={(e) => setClaimForm(prev => ({ ...prev, secretAnswer: e.target.value }))} required />
              <button type="submit" disabled={claiming} className="bg-dc-yellow text-dc-dark font-bold px-4 py-2 disabled:opacity-60">
                {claiming ? 'Claiming...' : 'Claim Profile'}
              </button>
            </form>

            <form className="space-y-3" onSubmit={handleMergeSubmit}>
              <h3 className="text-lg font-bold text-dc-yellow">Merge Duplicate</h3>
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Target Claimed User ID" value={mergeForm.targetUserId} onChange={(e) => setMergeForm(prev => ({ ...prev, targetUserId: e.target.value }))} required />
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Source Duplicate User ID" value={mergeForm.sourceUserId} onChange={(e) => setMergeForm(prev => ({ ...prev, sourceUserId: e.target.value }))} required />
              <input className="w-full bg-dc-dark-2 border border-dc-dark-3 px-3 py-2 text-white" placeholder="Target Secret Answer" type="password" value={mergeForm.secretAnswer} onChange={(e) => setMergeForm(prev => ({ ...prev, secretAnswer: e.target.value }))} required />
              <button type="submit" disabled={merging} className="bg-dc-yellow text-dc-dark font-bold px-4 py-2 disabled:opacity-60">
                {merging ? 'Merging...' : 'Merge Profiles'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
