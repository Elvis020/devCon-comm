'use client';

import { useEffect, useState } from 'react';
import { useDeviceId } from '@/hooks/use-device-id';
import { useQuizPolling } from '@/hooks/use-quiz-polling';
import { useCountdown } from '@/hooks/use-countdown';
import confetti from 'canvas-confetti';

export default function QuizGameplayPage({ params }: { params: { code: string } }) {
  const { deviceId } = useDeviceId();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [quizAvailable, setQuizAvailable] = useState<boolean | null>(null);

  const { state, loading, error, sessionEnded } = useQuizPolling(sessionId, userId);
  const [confettiShown, setConfettiShown] = useState(false);

  useEffect(() => {
    if (deviceId && !sessionId && !joinError && quizAvailable === null) {
      checkQuizAvailability();
    }
  }, [deviceId]);

  const checkQuizAvailability = async () => {
    try {
      const response = await fetch('/api/quiz/active');
      const data = await response.json();

      if (data.has_active_quiz) {
        setQuizAvailable(true);
        // Quiz is available, proceed with nickname check
        checkNicknameAndJoin();
      } else {
        setQuizAvailable(false);
        setJoinError('No active quiz available');
        setIsJoining(false);
      }
    } catch (err) {
      console.error('Failed to check quiz availability:', err);
      setQuizAvailable(false);
      setJoinError('Failed to check quiz availability');
      setIsJoining(false);
    }
  };

  const checkNicknameAndJoin = () => {
    const nickname = localStorage.getItem('quiz-nickname');
    if (!nickname) {
      setShowNicknamePrompt(true);
      setIsJoining(false);
    } else {
      joinQuiz(nickname);
    }
  };

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;

    localStorage.setItem('quiz-nickname', nicknameInput.trim());
    setShowNicknamePrompt(false);
    setIsJoining(true);
    joinQuiz(nicknameInput.trim());
  };

  const joinQuiz = async (nickname: string) => {
    if (!deviceId) return;

    setIsJoining(true);

    try {
      const response = await fetch('/api/quiz/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          join_code: params.code.toUpperCase(),
          nickname,
          device_id: deviceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setUserId(data.user_id);
        setIsJoining(false);
      } else {
        const data = await response.json();
        setJoinError(data.error || 'Invalid quiz code or quiz not available');
        setIsJoining(false);
      }
    } catch (err) {
      console.error('Failed to join quiz:', err);
      setJoinError('Failed to join quiz. Please try again.');
      setIsJoining(false);
    }
  };

  const submitAnswer = async (answerIndex: number) => {
    if (!sessionId || !userId || submitting) return;

    setSubmitting(true);
    setSelectedAnswer(answerIndex);

    try {
      await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          answer_index: answerIndex,
        }),
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confetti for correct answers during gameplay
  useEffect(() => {
    if (state?.player_result?.is_correct && state?.session.status === 'active') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#F9E15E', '#FFD700', '#FFF4C4'],
      });
    }
  }, [state?.player_result, state?.session.status]);

  // Confetti ONCE for top 3 finishers when quiz ends
  useEffect(() => {
    if (state?.session.status === 'finished' && !confettiShown && userId) {
      const myRank = state.leaderboard.findIndex(p => p.user_id === userId) + 1;

      if (myRank <= 3 && myRank > 0) {
        // Trigger confetti for top 3
        const duration = 3000;
        const animationEnd = Date.now() + duration;

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          confetti({
            particleCount: myRank === 1 ? 10 : 5,
            angle: randomInRange(55, 125),
            spread: randomInRange(50, 70),
            origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
            colors: myRank === 1
              ? ['#FFD700', '#FFA500', '#FFFF00'] // Gold for 1st
              : myRank === 2
              ? ['#C0C0C0', '#D3D3D3', '#E8E8E8'] // Silver for 2nd
              : ['#CD7F32', '#B87333', '#C9AE5D'], // Bronze for 3rd
          });
        }, 250);

        setConfettiShown(true);
      }
    }
  }, [state?.session.status, confettiShown, userId, state?.leaderboard]);

  useEffect(() => {
    if (state?.current_question) {
      setSelectedAnswer(null);
    }
  }, [state?.current_question?.id]);

  const questionStartTime = state?.question_started_at
    ? new Date(state.question_started_at)
    : null;
  const timeLimit = state?.current_question?.time_limit_seconds || 20;
  const remaining = useCountdown(questionStartTime, timeLimit);
  const progress = (remaining / timeLimit) * 100;

  // Show nickname prompt if needed
  if (showNicknamePrompt) {
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

          <div className="bg-dc-dark-1 border-4 border-dc-yellow p-8 sm:p-12 shadow-glow">
            <div className="mb-8 text-center">
              <div className="text-6xl mb-4">👋</div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                Welcome to the <span className="text-dc-yellow">Quiz!</span>
              </h1>
              <p className="text-dc-gray-light">
                Enter your nickname to join
              </p>
            </div>

            <form onSubmit={handleNicknameSubmit} className="space-y-6">
              <div>
                <label htmlFor="nickname" className="block text-dc-yellow text-sm font-bold mb-2 uppercase tracking-wide">
                  Your Nickname
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  required
                  maxLength={20}
                  autoFocus
                  placeholder="Enter your name..."
                  className="w-full bg-dc-dark-2 border-2 border-dc-dark-3 focus:border-dc-yellow text-white text-xl px-4 py-4 outline-none transition-colors"
                />
                <p className="text-dc-gray text-xs mt-2">Max 20 characters</p>
              </div>

              <button
                type="submit"
                disabled={!nicknameInput.trim()}
                className="w-full bg-dc-yellow text-dc-dark font-bold text-lg py-4 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
              >
                Join Quiz →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show 404 if join failed (invalid code or quiz not available)
  if (joinError) {
    // When no quiz is available at all, don't encourage trying other codes (DDoS prevention)
    const showTryAgain = quizAvailable === true;

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
              Quiz Not <span className="text-dc-yellow">Found</span>
            </h2>
            <p className="text-dc-gray-light text-lg mb-2">
              {joinError}
            </p>
            {showTryAgain && (
              <p className="text-dc-gray text-sm">
                Code: <span className="text-dc-yellow font-mono">{params.code.toUpperCase()}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showTryAgain && (
              <a
                href="/play"
                className="bg-dc-yellow text-dc-dark px-8 py-4 font-bold hover:shadow-glow transition-all uppercase tracking-wide text-center"
              >
                ← Try Another Code
              </a>
            )}
            <a
              href="/"
              className="bg-dc-yellow text-dc-dark px-8 py-4 font-bold hover:shadow-glow transition-all uppercase tracking-wide text-center"
            >
              Back to Home
            </a>
          </div>

          {/* Hint - only show if a quiz is active */}
          {showTryAgain && (
            <div className="mt-12 pt-8 border-t-2 border-dc-dark-3">
              <p className="text-dc-gray text-sm">
                💡 <span className="text-dc-gray-light">Tip:</span> Make sure you have the correct code from the host's screen
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading while joining or loading quiz state
  if (isJoining || loading || !sessionId) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-20 h-20 border-4 border-dc-yellow border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-xl">
            {isJoining ? 'Joining quiz...' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  // Show friendly message if session has ended
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">👋</div>
          <h1 className="text-white font-mono text-3xl font-bold mb-4 uppercase">
            Session <span className="text-dc-yellow">Ended</span>
          </h1>
          <p className="text-dc-gray-light font-mono text-lg mb-8">
            Thanks for playing! You can close this page now.
          </p>
          <div className="inline-block px-6 py-3 bg-dc-dark-1 border-2 border-dc-yellow/30 text-dc-gray font-mono text-sm">
            See you next time! 🎮
          </div>
        </div>
      </div>
    );
  }

  // Show error only if we have a session ID and there's an actual error
  if (error || !state) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-7xl mb-6">⚠️</div>
          <p className="text-red-400 font-mono text-xl mb-2">CONNECTION ERROR</p>
          <p className="text-dc-gray font-mono">Failed to load quiz</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-dc-yellow text-dc-dark px-6 py-3 font-bold font-mono hover:shadow-glow transition-shadow uppercase"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  // WAITING STATE
  if (state.session.status === 'waiting' || state.session.status === 'draft') {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-6">
        <div className="text-center w-full max-w-sm">
          <div className="relative mb-12">
            <div className="w-40 h-40 mx-auto bg-dc-dark-1 border-4 border-dc-yellow flex items-center justify-center shadow-glow animate-pulse-glow">
              <span className="text-8xl">🎮</span>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-8 font-mono">
            WAITING...
          </h1>

          <div className="mb-8 px-8 py-6 bg-dc-dark-1 border-4 border-dc-yellow inline-block">
            <div className="font-mono text-dc-gray text-sm mb-2 uppercase tracking-wider">Players Connected</div>
            <div className="font-mono text-6xl font-bold text-dc-yellow tabular-nums">
              {state.participants_count}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-4 h-4 bg-dc-yellow animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-4 h-4 bg-dc-yellow animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-4 h-4 bg-dc-yellow animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          <p className="text-dc-gray-light font-mono">Waiting for host to start</p>
        </div>
      </div>
    );
  }

  // FINISHED STATE
  if (state.session.status === 'finished') {
    const myRank = state.leaderboard.findIndex(p => p.user_id === userId) + 1;
    const myScore = state.leaderboard.find(p => p.user_id === userId)?.total_score || 0;
    const topThree = myRank <= 3;

    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-4 py-12">
        <div className="max-w-lg w-full">
          {/* Final Score Card */}
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-3 bg-dc-yellow text-dc-dark font-mono text-sm font-bold mb-8 uppercase tracking-wide">
              Quiz Complete
            </div>

            <div className={`relative p-10 mb-6 ${topThree ? 'bg-dc-yellow shadow-glow-lg' : 'bg-dc-dark-1 border-4 border-dc-dark-3'}`}>
              {topThree && (
                <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2">
                  <div className="text-8xl drop-shadow-lg">
                    {myRank === 1 ? '👑' : myRank === 2 ? '🥈' : '🥉'}
                  </div>
                </div>
              )}

              <div className={`font-mono text-sm font-bold mb-3 uppercase tracking-wider ${topThree ? 'text-dc-dark' : 'text-dc-gray'} ${topThree ? 'mt-10' : ''}`}>
                Your Rank
              </div>
              <div className={`text-7xl font-bold mb-6 font-mono tabular-nums ${topThree ? 'text-dc-dark' : 'text-dc-yellow'}`}>
                #{myRank}
              </div>

              <div className={`font-mono text-sm font-bold mb-3 uppercase tracking-wider ${topThree ? 'text-dc-dark' : 'text-dc-gray'}`}>
                Final Score
              </div>
              <div className={`text-6xl font-bold font-mono tabular-nums ${topThree ? 'text-dc-dark' : 'text-white'}`}>
                {myScore}
              </div>
            </div>
          </div>

          {/* Final Leaderboard */}
          <div className="bg-dc-dark-1 border-4 border-dc-dark-3">
            <div className="px-6 py-4 bg-dc-dark-2 border-b-4 border-dc-dark-3">
              <h2 className="font-mono text-dc-yellow font-bold uppercase tracking-wide">Final Standings</h2>
            </div>

            <div className="divide-y-2 divide-dc-dark-3 max-h-80 overflow-y-auto">
              {state.leaderboard.map((player, index) => (
                <div
                  key={player.user_id}
                  className={`flex items-center justify-between px-6 py-5 ${
                    player.user_id === userId
                      ? 'bg-dc-yellow/10 border-l-4 border-dc-yellow'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-mono font-bold text-dc-gray tabular-nums min-w-[3rem]">
                      #{index + 1}
                    </span>
                    <span className={`font-mono font-bold text-lg ${player.user_id === userId ? 'text-dc-yellow' : 'text-white'}`}>
                      {player.nickname}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">{player.total_score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ
  const hasAnswered = state.player_result !== undefined;
  const currentQuestion = state.current_question;
  const questionPhase = state.session.question_phase;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-4">
        <p className="text-white font-mono text-2xl">LOADING...</p>
      </div>
    );
  }

  const optionColors = [
    { bg: 'bg-quiz-red', hover: 'hover:bg-red-700', text: 'text-white', label: 'A' },
    { bg: 'bg-quiz-blue', hover: 'hover:bg-blue-800', text: 'text-white', label: 'B' },
    { bg: 'bg-quiz-yellow', hover: 'hover:bg-yellow-700', text: 'text-white', label: 'C' },
    { bg: 'bg-quiz-green', hover: 'hover:bg-green-800', text: 'text-white', label: 'D' },
  ];

  // ===== SCOREBOARD PHASE =====
  if (questionPhase === 'scoreboard') {
    const myRank = state.leaderboard.findIndex(p => p.user_id === userId) + 1;
    const myEntry = state.leaderboard.find(p => p.user_id === userId);
    const topFive = state.leaderboard.slice(0, 5);

    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-3 bg-dc-yellow text-dc-dark font-mono text-sm font-bold mb-6 uppercase tracking-wide">
              Scoreboard
            </div>
            <h2 className="text-white text-3xl font-bold font-mono mb-2">RANKINGS</h2>
            <p className="text-dc-gray font-mono text-sm">After Question {state.session.current_question_index + 1}</p>
          </div>

          {/* Top 5 Leaderboard */}
          <div className="bg-dc-dark-1 border-4 border-dc-yellow/30 mb-6">
            <div className="divide-y-2 divide-dc-dark-3">
              {topFive.map((player, index) => {
                const isMe = player.user_id === userId;
                const rank = index + 1;

                return (
                  <div
                    key={player.user_id}
                    className={`flex items-center justify-between px-6 py-5 transition-all ${
                      isMe
                        ? 'bg-dc-yellow text-dc-dark shadow-glow scale-[1.02]'
                        : 'bg-dc-dark-1 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-3xl font-mono font-bold tabular-nums min-w-[3rem] ${isMe ? 'text-dc-dark' : 'text-dc-gray'}`}>
                        #{rank}
                      </span>
                      <div>
                        <div className={`font-mono font-bold text-lg ${isMe ? 'text-dc-dark' : 'text-white'}`}>
                          {player.nickname}
                          {isMe && <span className="ml-2 text-sm">(YOU)</span>}
                        </div>
                        {player.streak_count > 1 && (
                          <div className={`text-xs font-mono ${isMe ? 'text-dc-dark/70' : 'text-dc-yellow'}`}>
                            🔥 {player.streak_count} streak
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-2xl font-bold font-mono tabular-nums ${isMe ? 'text-dc-dark' : 'text-white'}`}>
                      {player.total_score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* My Position (if not in top 5) */}
          {myRank > 5 && myEntry && (
            <div className="bg-dc-yellow/10 border-4 border-dc-yellow px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-mono font-bold text-dc-yellow tabular-nums">
                    #{myRank}
                  </span>
                  <div>
                    <div className="font-mono font-bold text-white">
                      {myEntry.nickname} <span className="text-sm text-dc-gray">(YOU)</span>
                    </div>
                    {myEntry.streak_count > 1 && (
                      <div className="text-xs font-mono text-dc-yellow">
                        🔥 {myEntry.streak_count} streak
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-2xl font-bold text-white font-mono tabular-nums">
                  {myEntry.total_score}
                </span>
              </div>
            </div>
          )}

          {/* Waiting indicator */}
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-dc-yellow animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-dc-yellow animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-dc-yellow animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-dc-gray font-mono text-sm mt-3">Waiting for next question...</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== REVEALING PHASE =====
  if (questionPhase === 'revealing' && state.player_result) {
    const { is_correct, points_awarded, streak_count } = state.player_result;

    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${is_correct ? 'bg-green-600' : 'bg-red-600'}`}>
        <div className="text-center w-full max-w-lg">
          {/* Result Icon */}
          <div className="text-9xl mb-6 animate-slide-up" style={{ animationDelay: '0ms' }}>
            {is_correct ? '✓' : '✗'}
          </div>

          {/* Result Text */}
          <h1
            className="text-white text-6xl font-bold font-mono mb-8 animate-slide-up"
            style={{ animationDelay: '100ms' }}
          >
            {is_correct ? 'CORRECT!' : 'INCORRECT'}
          </h1>

          {/* Points Awarded */}
          {is_correct && (
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="inline-block bg-white text-green-600 px-12 py-6 mb-6">
                <div className="text-sm font-mono font-bold uppercase tracking-wide mb-2">Points Earned</div>
                <div className="text-7xl font-bold font-mono tabular-nums">
                  +{points_awarded}
                </div>
              </div>
            </div>
          )}

          {/* Streak Indicator */}
          {is_correct && streak_count > 1 && (
            <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="inline-block bg-dc-yellow text-dc-dark px-8 py-4">
                <div className="text-5xl font-bold font-mono">
                  🔥 {streak_count} STREAK
                </div>
              </div>
            </div>
          )}

          {/* Wrong Answer Message */}
          {!is_correct && (
            <div className="text-white/80 font-mono text-xl animate-slide-up" style={{ animationDelay: '200ms' }}>
              Better luck next time!
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== ANSWERING PHASE =====
  // Kahoot model: Players see ONLY colored buttons (A, B, C, D) - NO question text
  // They look at the admin/projected screen to read the question
  return (
    <div className="min-h-screen bg-dc-dark flex flex-col">
      {/* Timer Bar - Prominent at top */}
      <div className="h-4 bg-dc-dark-3 border-b-4 border-dc-dark-2">
        <div
          className={`h-full transition-all duration-100 ${
            progress > 50 ? 'bg-dc-yellow' : progress > 20 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 pb-6 justify-center">
        {/* Question Number + Timer */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-dc-dark-2 border-2 border-dc-yellow/30 font-mono text-xs text-dc-gray mb-6 uppercase tracking-wide">
            Question {state.session.current_question_index + 1}
          </div>

          {/* Large Timer - Mobile visibility */}
          <div className="relative inline-block">
            <div className="text-dc-yellow text-9xl font-bold font-mono tabular-nums">
              {remaining}
            </div>
            <div className="text-dc-gray font-mono text-sm uppercase tracking-wider mt-2">Seconds Remaining</div>
          </div>
        </div>

        {/* Instruction Text */}
        <div className="text-center mb-8">
          <p className="text-dc-gray-light font-mono text-sm uppercase tracking-wide">
            👀 Look at the big screen
          </p>
        </div>

        {/* Answer Locked State */}
        {hasAnswered && (
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-block px-8 py-5 bg-dc-yellow text-dc-dark font-mono font-bold text-2xl shadow-glow">
              ✓ ANSWER LOCKED IN
            </div>
            <div className="mt-4 text-dc-gray font-mono text-sm">
              {state.answers_count} / {state.participants_count} players answered
            </div>
          </div>
        )}

        {/* Answer Buttons - ONLY LETTERS (A, B, C, D) - Kahoot Style */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
          {optionColors.map((color, index) => {
            const isSelected = selectedAnswer === index;

            return (
              <button
                key={index}
                onClick={() => !hasAnswered && submitAnswer(index)}
                disabled={hasAnswered || submitting || index >= currentQuestion.options.length}
                className={`
                  aspect-square min-h-[140px] font-bold text-6xl
                  flex items-center justify-center
                  transition-all duration-200
                  ${color.bg} ${!hasAnswered && color.hover} ${color.text}
                  ${isSelected ? 'ring-8 ring-white scale-[0.95] shadow-glow-lg' : 'shadow-xl'}
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${!hasAnswered && index < currentQuestion.options.length ? 'active:scale-90 cursor-pointer hover:scale-105' : ''}
                  font-mono
                `}
              >
                {color.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
