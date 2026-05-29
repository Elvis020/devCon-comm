'use client';

import { useEffect, useState } from 'react';
import { QuizSession, Question } from '@/types';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

interface AdminQuizState {
  session: QuizSession;
  questions: Question[];
  participantCount: number;
  answerCount: number;
  leaderboard?: Array<{
    user_id: string;
    nickname: string;
    total_score: number;
    streak_count: number;
    rank: number;
  }>;
  answer_distribution?: Array<{
    option_index: number;
    count: number;
    percentage: number;
  }>;
}

export default function QuizLivePage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [state, setState] = useState<AdminQuizState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500); // Poll every 1.5s
    return () => clearInterval(interval);
  }, [params.eventId]);

  const fetchState = async () => {
    try {
      // Get quiz sessions for this event
      const sessionsResponse = await fetch(`/api/quiz/sessions?eventId=${params.eventId}`);
      if (!sessionsResponse.ok) return;

      const sessions = await sessionsResponse.json();
      if (sessions.length === 0) return;

      // Get full session data
      const sessionResponse = await fetch(`/api/quiz/sessions/${sessions[0].id}`);
      if (!sessionResponse.ok) return;

      const data = await sessionResponse.json();

      // Get live leaderboard and distribution from quiz state endpoint
      const stateResponse = await fetch(`/api/quiz/state?sessionId=${sessions[0].id}`);
      if (stateResponse.ok) {
        const stateData = await stateResponse.json();
        setState({
          ...data,
          session: data,
          leaderboard: stateData.leaderboard,
          answer_distribution: stateData.answer_distribution,
        });
      } else {
        setState(data);
      }
    } catch (error) {
      console.error('Error fetching state:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!state) return;

    await fetch(`/api/quiz/sessions/${state.session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'active',
        current_question_index: 0,
        question_phase: 'answering',
        started_at: new Date().toISOString(),
        question_started_at: new Date().toISOString(),
        phase_started_at: new Date().toISOString(),
      }),
    });

    fetchState();
  };

  const transitionToScoreboard = async () => {
    if (!state) return;

    await fetch(`/api/quiz/sessions/${state.session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_phase: 'scoreboard',
        phase_started_at: new Date().toISOString(),
      }),
    });

    fetchState();
  };

  const nextQuestion = async () => {
    if (!state) return;

    const nextIndex = state.session.current_question_index + 1;

    if (nextIndex >= state.questions.length) {
      // Quiz finished
      await fetch(`/api/quiz/sessions/${state.session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'finished',
          question_phase: null,
          finished_at: new Date().toISOString(),
        }),
      });
    } else {
      // Next question
      await fetch(`/api/quiz/sessions/${state.session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_question_index: nextIndex,
          question_phase: 'answering',
          question_started_at: new Date().toISOString(),
          phase_started_at: new Date().toISOString(),
        }),
      });
    }

    fetchState();
  };

  const endQuiz = async () => {
    if (!state || !confirm('Are you sure you want to end the quiz?')) return;

    await fetch(`/api/quiz/sessions/${state.session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'finished',
        question_phase: null,
        finished_at: new Date().toISOString(),
      }),
    });

    router.push(`/admin/events/${params.eventId}/quiz`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center">
        <p className="text-white font-mono text-2xl">LOADING...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center">
        <p className="text-dc-gray font-mono text-2xl">NO QUIZ SESSION FOUND</p>
      </div>
    );
  }

  const playUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/play/${state.session.join_code}`;

  // WAITING/JOIN SCREEN
  if (state.session.status === 'waiting' || state.session.status === 'draft') {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center p-8">
        <div className="text-center max-w-4xl w-full">
          <h1 className="text-white text-6xl sm:text-7xl font-bold mb-12 font-mono uppercase tracking-tight">
            <span className="text-dc-yellow">$</span> JOIN_THE_QUIZ
          </h1>

          <div className="bg-white p-12 mb-8 inline-block border-4 border-dc-yellow shadow-glow-lg">
            <QRCodeSVG value={playUrl} size={280} />
          </div>

          <div className="bg-dc-dark-1 border-4 border-dc-yellow p-10 inline-block mb-10 shadow-glow">
            <p className="text-dc-gray-light text-xl mb-3 font-mono uppercase tracking-wide">Join Code:</p>
            <p className="text-8xl font-bold text-dc-yellow font-mono tracking-widest animate-pulse-glow">
              {state.session.join_code}
            </p>
          </div>

          <div className="text-white text-4xl mb-10 font-mono">
            <span className="text-dc-yellow font-bold">{state.participantCount}</span>{' '}
            <span className="text-dc-gray-light uppercase">
              {state.participantCount === 1 ? 'player' : 'players'} joined
            </span>
          </div>

          <button
            onClick={startQuiz}
            disabled={state.participantCount === 0}
            className="bg-dc-yellow text-dc-dark px-16 py-6 text-3xl font-bold font-mono hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
          >
            START QUIZ →
          </button>
        </div>
      </div>
    );
  }

  // FINISHED - Show final leaderboard with medals
  if (state.session.status === 'finished') {
    return (
      <div className="min-h-screen bg-dc-dark p-8 flex items-center justify-center">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <div className="text-8xl mb-6">🎉</div>
            <h1 className="text-white text-6xl sm:text-7xl font-bold mb-4 font-mono uppercase">
              <span className="text-dc-yellow">QUIZ_</span>COMPLETE!
            </h1>
            <p className="text-dc-gray-light font-mono text-xl">Final Results</p>
          </div>

          {/* Top 3 Podium with Medals */}
          {state.leaderboard && state.leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-6 mb-12">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-3 animate-bounce" style={{ animationDelay: '200ms' }}>🥈</div>
                <div className="bg-dc-dark-1 border-4 border-dc-yellow/50 p-8 text-center w-56 shadow-glow">
                  <div className="text-dc-yellow font-mono text-sm mb-2 uppercase tracking-wide">2nd Place</div>
                  <div className="text-white font-mono font-bold text-2xl mb-2">{state.leaderboard[1].nickname}</div>
                  <div className="text-dc-yellow font-mono text-4xl font-bold">{state.leaderboard[1].total_score}</div>
                </div>
              </div>

              {/* 1st Place - Elevated */}
              <div className="flex flex-col items-center -mt-12">
                <div className="text-8xl mb-4 animate-bounce">🥇</div>
                <div className="bg-dc-yellow border-4 border-dc-yellow-glow p-10 text-center w-64 shadow-glow-lg">
                  <div className="text-dc-dark font-mono text-lg mb-3 uppercase tracking-wide font-bold">👑 Winner 👑</div>
                  <div className="text-dc-dark font-mono font-bold text-3xl mb-3">{state.leaderboard[0].nickname}</div>
                  <div className="text-dc-dark font-mono text-5xl font-bold">{state.leaderboard[0].total_score}</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-3 animate-bounce" style={{ animationDelay: '400ms' }}>🥉</div>
                <div className="bg-dc-dark-1 border-4 border-dc-dark-3 p-8 text-center w-56">
                  <div className="text-dc-gray font-mono text-sm mb-2 uppercase tracking-wide">3rd Place</div>
                  <div className="text-white font-mono font-bold text-2xl mb-2">{state.leaderboard[2].nickname}</div>
                  <div className="text-dc-yellow font-mono text-4xl font-bold">{state.leaderboard[2].total_score}</div>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          {state.leaderboard && state.leaderboard.length > 3 && (
            <div className="bg-dc-dark-1 border-2 border-dc-yellow/30 p-6 mb-8">
              <h3 className="text-dc-yellow font-mono font-bold uppercase mb-4 border-b-2 border-dc-dark-3 pb-2">
                Full Rankings
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {state.leaderboard.slice(3).map((entry, idx) => (
                  <div
                    key={entry.user_id}
                    className="p-4 bg-dc-dark-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-dc-yellow font-mono font-bold text-xl w-12">#{entry.rank}</span>
                      <span className="text-white font-mono text-lg">{entry.nickname}</span>
                    </div>
                    <span className="text-dc-yellow font-mono font-bold text-xl">{entry.total_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => router.push(`/admin/events/${params.eventId}/quiz`)}
              className="bg-dc-yellow text-dc-dark px-12 py-5 text-2xl font-bold font-mono hover:shadow-glow-lg transition-all uppercase tracking-wide"
            >
              ← BACK TO BUILDER
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ - Get current question
  const currentQuestion = state.questions.find(
    q => q.order_index === state.session.current_question_index
  );

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-dc-dark flex items-center justify-center">
        <p className="text-dc-gray font-mono text-2xl">NO CURRENT QUESTION</p>
      </div>
    );
  }

  const optionColors = [
    'bg-red-600 border-red-400',
    'bg-blue-600 border-blue-400',
    'bg-yellow-600 border-yellow-400',
    'bg-green-600 border-green-400',
  ];

  const optionLetters = ['A', 'B', 'C', 'D'];

  // PHASE: ANSWERING
  if (state.session.question_phase === 'answering') {
    return (
      <div className="min-h-screen bg-dc-dark p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-white font-mono">
              <p className="text-sm text-dc-gray mb-1 uppercase">
                Question {state.session.current_question_index + 1} of {state.questions.length}
              </p>
              <p className="text-2xl font-bold">
                <span className="text-dc-yellow">{state.answerCount}</span>
                <span className="text-dc-gray-light"> / {state.participantCount}</span>
                <span className="text-white uppercase text-lg ml-2">answered</span>
              </p>
            </div>

            <button
              onClick={endQuiz}
              className="bg-red-900/30 text-red-400 border-2 border-red-400/30 px-6 py-3 font-bold font-mono hover:bg-red-900/50 transition-all uppercase tracking-wide"
            >
              END QUIZ
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Main Question Area */}
            <div className="col-span-2">
              <div className="bg-dc-dark-1 border-4 border-dc-yellow p-8 mb-6 shadow-glow">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-white font-mono leading-tight">
                    {currentQuestion.question_text}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`${optionColors[index]} border-4 text-white p-6 text-2xl font-bold text-center flex items-center justify-center min-h-[120px] font-mono uppercase shadow-lg`}
                    >
                      <span className="mr-3 text-3xl">{optionLetters[index]}</span>
                      {option}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-4">
                <div className="text-white font-mono text-center">
                  <span className="text-dc-gray text-sm uppercase">Time Limit: </span>
                  <span className="text-dc-yellow font-bold text-xl">{currentQuestion.time_limit_seconds}s</span>
                  <span className="text-dc-gray text-sm uppercase ml-6">Points: </span>
                  <span className="text-dc-yellow font-bold text-xl">{currentQuestion.points}</span>
                </div>
              </div>
            </div>

            {/* Live Leaderboard Sidebar */}
            <div className="col-span-1">
              <div className="bg-dc-dark-1 border-2 border-dc-yellow p-4">
                <h3 className="text-dc-yellow font-mono font-bold text-sm uppercase mb-4 border-b-2 border-dc-dark-3 pb-2">
                  Live Leaderboard
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {state.leaderboard?.map((entry, idx) => (
                    <div
                      key={entry.user_id}
                      className={`p-3 ${idx < 3 ? 'bg-dc-yellow/20 border-2 border-dc-yellow/50' : 'bg-dc-dark-2'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-dc-yellow font-mono font-bold text-lg">#{entry.rank}</span>
                          <span className="text-white font-mono text-sm truncate max-w-[150px]">
                            {entry.nickname}
                          </span>
                        </div>
                        <span className="text-dc-yellow font-mono font-bold">{entry.total_score}</span>
                      </div>
                      {entry.streak_count >= 2 && (
                        <div className="text-xs text-green-400 font-mono mt-1">
                          🔥 {entry.streak_count} streak
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PHASE: REVEALING
  if (state.session.question_phase === 'revealing') {
    const isLastQuestion = state.session.current_question_index === state.questions.length - 1;

    return (
      <div className="min-h-screen bg-dc-dark p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-6">
            <button
              onClick={nextQuestion}
              className="bg-dc-yellow text-dc-dark px-8 py-4 text-xl font-bold font-mono hover:shadow-glow transition-all uppercase tracking-wide"
            >
              {isLastQuestion ? 'FINISH QUIZ 🎉' : 'NEXT QUESTION →'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Answer Reveal */}
            <div className="col-span-2">
              <div className="bg-dc-dark-1 border-4 border-green-400 p-8 mb-6 shadow-glow-lg">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-white font-mono leading-tight">
                    {currentQuestion.question_text}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = index === currentQuestion.correct_index;
                    const distribution = state.answer_distribution?.find(d => d.option_index === index);

                    return (
                      <div
                        key={index}
                        className={`${
                          isCorrect
                            ? 'bg-green-600 border-green-400 shadow-glow'
                            : 'bg-dc-dark-2 border-dc-dark-3 opacity-60'
                        } border-4 text-white p-6 text-2xl font-bold text-center min-h-[120px] font-mono uppercase relative`}
                      >
                        <div className="flex items-center justify-center gap-3">
                          {isCorrect && <span className="text-4xl">✓</span>}
                          <span className="text-3xl">{optionLetters[index]}</span>
                          <span>{option}</span>
                        </div>
                        {distribution && (
                          <div className="absolute bottom-2 right-2 text-sm bg-black/50 px-2 py-1">
                            {distribution.percentage}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Answer Distribution Chart */}
              {state.answer_distribution && (
                <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6">
                  <h3 className="text-dc-yellow font-mono font-bold mb-4">ANSWER DISTRIBUTION</h3>
                  <div className="space-y-3">
                    {state.answer_distribution.map((dist, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-white font-mono w-8">{optionLetters[dist.option_index]}:</span>
                        <div className="flex-1 bg-dc-dark-2 h-8 relative">
                          <div
                            className={`${optionColors[dist.option_index]} h-full transition-all`}
                            style={{ width: `${dist.percentage}%` }}
                          />
                          <span className="absolute right-2 top-1 text-white font-mono text-sm">
                            {dist.count} ({dist.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="col-span-1">
              <div className="bg-dc-dark-1 border-2 border-dc-yellow p-4">
                <h3 className="text-dc-yellow font-mono font-bold text-sm uppercase mb-4 border-b-2 border-dc-dark-3 pb-2">
                  Current Standings
                </h3>
                <div className="space-y-2">
                  {state.leaderboard?.slice(0, 10).map((entry, idx) => (
                    <div
                      key={entry.user_id}
                      className={`p-3 ${idx < 3 ? 'bg-dc-yellow/20 border-2 border-dc-yellow/50' : 'bg-dc-dark-2'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-dc-yellow font-mono font-bold">#{entry.rank}</span>
                          <span className="text-white font-mono text-sm truncate max-w-[150px]">
                            {entry.nickname}
                          </span>
                        </div>
                        <span className="text-dc-yellow font-mono font-bold">{entry.total_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PHASE: SCOREBOARD
  if (state.session.question_phase === 'scoreboard') {
    const isLastQuestion = state.session.current_question_index === state.questions.length - 1;

    return (
      <div className="min-h-screen bg-dc-dark p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white font-mono uppercase mb-4">
              <span className="text-dc-yellow">LEADERBOARD</span>
            </h1>
            <p className="text-dc-gray-light font-mono">
              After Question {state.session.current_question_index + 1} of {state.questions.length}
            </p>
          </div>

          {/* Top 3 Podium */}
          {state.leaderboard && state.leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-12">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="text-4xl mb-2">🥈</div>
                <div className="bg-dc-dark-1 border-2 border-dc-yellow/50 p-6 text-center w-48">
                  <div className="text-dc-yellow font-mono text-sm mb-2">2ND PLACE</div>
                  <div className="text-white font-mono font-bold text-xl mb-1">{state.leaderboard[1].nickname}</div>
                  <div className="text-dc-yellow font-mono text-3xl font-bold">{state.leaderboard[1].total_score}</div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-8">
                <div className="text-6xl mb-2">👑</div>
                <div className="bg-dc-yellow border-4 border-dc-yellow-glow p-8 text-center w-56 shadow-glow-lg">
                  <div className="text-dc-dark font-mono text-sm mb-2">1ST PLACE</div>
                  <div className="text-dc-dark font-mono font-bold text-2xl mb-1">{state.leaderboard[0].nickname}</div>
                  <div className="text-dc-dark font-mono text-4xl font-bold">{state.leaderboard[0].total_score}</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="text-4xl mb-2">🥉</div>
                <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6 text-center w-48">
                  <div className="text-dc-gray font-mono text-sm mb-2">3RD PLACE</div>
                  <div className="text-white font-mono font-bold text-xl mb-1">{state.leaderboard[2].nickname}</div>
                  <div className="text-dc-yellow font-mono text-3xl font-bold">{state.leaderboard[2].total_score}</div>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="bg-dc-dark-1 border-2 border-dc-yellow p-6 mb-8">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {state.leaderboard?.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`p-4 flex items-center justify-between ${
                    entry.rank <= 3 ? 'bg-dc-yellow/20 border-2 border-dc-yellow/50' : 'bg-dc-dark-2'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-dc-yellow font-mono font-bold text-2xl w-12">#{entry.rank}</span>
                    <span className="text-white font-mono text-lg">{entry.nickname}</span>
                    {entry.streak_count >= 2 && (
                      <span className="text-green-400 font-mono text-sm">🔥 {entry.streak_count}</span>
                    )}
                  </div>
                  <span className="text-dc-yellow font-mono font-bold text-2xl">{entry.total_score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={nextQuestion}
              className="bg-dc-yellow text-dc-dark px-12 py-5 text-2xl font-bold font-mono hover:shadow-glow-lg transition-all uppercase tracking-wide"
            >
              {isLastQuestion ? 'FINISH QUIZ 🎉' : 'NEXT QUESTION →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
