'use client';

import { useEffect, useState } from 'react';
import { QuizSession, Question } from '@/types';
import { QuizQuestionForm } from '@/components/admin/quiz-question-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QuizBuilderPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<(QuizSession & { questions: Question[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchSession();
  }, [params.eventId]);

  const fetchSession = async () => {
    try {
      // Get quiz sessions for this event
      const sessionsResponse = await fetch(`/api/quiz/sessions?eventId=${params.eventId}`);

      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();

        if (sessions.length > 0) {
          const sessionResponse = await fetch(`/api/quiz/sessions/${sessions[0].id}`);
          if (sessionResponse.ok) {
            const data = await sessionResponse.json();
            setSession(data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    const response = await fetch('/api/quiz/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: params.eventId }),
    });

    if (response.ok) {
      fetchSession();
    }
  };

  const addQuestion = async (data: any) => {
    if (!session) return;

    const response = await fetch('/api/quiz/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_session_id: session.id,
        ...data,
        order_index: session.questions.length,
      }),
    });

    if (response.ok) {
      setShowForm(false);
      fetchSession();
    }
  };

  const updateQuestion = async (data: any) => {
    if (!editingQuestion) return;

    const response = await fetch(`/api/quiz/questions/${editingQuestion.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setEditingQuestion(null);
      fetchSession();
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const response = await fetch(`/api/quiz/questions/${questionId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      fetchSession();
    }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!session) return;

    const questions = [...session.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Swap
    [questions[index], questions[targetIndex]] = [questions[targetIndex], questions[index]];

    // Reorder
    const questionIds = questions.map(q => q.id);

    const response = await fetch('/api/quiz/questions/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        question_ids: questionIds,
      }),
    });

    if (response.ok) {
      fetchSession();
    }
  };

  const startQuiz = async () => {
    if (!session) return;

    const response = await fetch(`/api/quiz/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'waiting' }),
    });

    if (response.ok) {
      router.push(`/admin/events/${params.eventId}/quiz/live`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white font-mono">LOADING...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href={`/admin/events/${params.eventId}`}
            className="inline-flex items-center gap-2 text-dc-yellow hover:text-dc-yellow-glow font-mono transition-colors"
          >
            <span>←</span> BACK TO EVENT
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-dc-yellow">🎯</span> Quiz Builder
        </h1>

        <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-dc-yellow/20" />
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-dc-gray font-mono mb-8">No quiz has been created for this event yet.</p>
          <button
            onClick={createSession}
            className="bg-dc-yellow text-dc-dark px-8 py-4 font-bold hover:shadow-glow transition-shadow uppercase tracking-wide"
          >
            Create Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/events/${params.eventId}`}
          className="inline-flex items-center gap-2 text-dc-yellow hover:text-dc-yellow-glow transition-colors"
        >
          <span>←</span> Back to Event
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-dc-yellow">🎯</span> Quiz Builder
          </h1>
          <p className="text-dc-gray-light mt-2">
            Join Code: <span className="font-bold text-xl text-dc-yellow">{session.join_code}</span>
          </p>
        </div>
        {session.questions.length > 0 && session.status === 'draft' && (
          <button
            onClick={startQuiz}
            className="bg-green-900/30 text-green-400 border-2 border-green-400/30 px-6 py-3 font-bold hover:bg-green-900/50 transition-all uppercase tracking-wide"
          >
            🎮 OPEN LOBBY (Activate Play)
          </button>
        )}
        {session.status === 'waiting' && (
          <div className="flex gap-3 items-center">
            <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-bold uppercase tracking-wide">Lobby Active - Players Can Join!</span>
            <Link
              href={`/admin/events/${params.eventId}/quiz/live`}
              className="bg-green-900/30 text-green-400 border-2 border-green-400/30 px-6 py-3 font-bold hover:bg-green-900/50 transition-all uppercase tracking-wide"
            >
              Go to Lobby →
            </Link>
          </div>
        )}
      </div>

      {(showForm || editingQuestion) && (
        <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-dc-yellow/20" />
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-dc-yellow">></span>
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </h2>
          <QuizQuestionForm
            question={editingQuestion || undefined}
            onSubmit={editingQuestion ? updateQuestion : addQuestion}
            onCancel={() => {
              setShowForm(false);
              setEditingQuestion(null);
            }}
          />
        </div>
      )}

      {!showForm && !editingQuestion && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-dc-yellow text-dc-dark px-4 py-4 font-bold hover:shadow-glow transition-shadow mb-6 uppercase tracking-wide"
        >
          + Add Question
        </button>
      )}

      <div className="space-y-4">
        {session.questions.map((question, index) => (
          <div key={question.id} className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6 hover:border-dc-yellow/30 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 border-l-2 border-b-2 border-dc-yellow/10 group-hover:border-dc-yellow/20 transition-colors" />

            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-sm font-bold text-dc-yellow font-mono">Q{index + 1}</span>
                  <span className="text-xs bg-dc-dark-2 border border-dc-dark-3 text-white px-2 py-1 font-mono">
                    {question.time_limit_seconds}s
                  </span>
                  <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-400/30 px-2 py-1 font-mono font-bold">
                    {question.points} PTS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white font-mono">{question.question_text}</h3>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => moveQuestion(index, 'up')}
                  disabled={index === 0}
                  className="p-2 text-dc-yellow hover:bg-dc-dark-2 border border-dc-dark-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveQuestion(index, 'down')}
                  disabled={index === session.questions.length - 1}
                  className="p-2 text-dc-yellow hover:bg-dc-dark-2 border border-dc-dark-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => setEditingQuestion(question)}
                  className="p-2 text-blue-400 hover:bg-blue-900/30 border border-blue-400/30 transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="p-2 text-red-400 hover:bg-red-900/30 border border-red-400/30 transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((option, optIndex) => {
                const colors = [
                  'border-red-400/30 bg-red-900/20',
                  'border-blue-400/30 bg-blue-900/20',
                  'border-yellow-400/30 bg-yellow-900/20',
                  'border-green-400/30 bg-green-900/20',
                ];

                return (
                  <div
                    key={optIndex}
                    className={`p-3 border-2 ${
                      optIndex === question.correct_index
                        ? 'border-green-400 bg-green-900/30'
                        : colors[optIndex]
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {optIndex === question.correct_index && (
                        <span className="text-green-400 font-bold">✓</span>
                      )}
                      <span className="text-sm text-white font-mono">{option}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {session.questions.length === 0 && !showForm && (
        <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-12 text-center">
          <div className="text-6xl mb-4">❓</div>
          <p className="text-dc-gray font-mono">No questions added yet. Click "ADD QUESTION" to get started!</p>
        </div>
      )}
    </div>
  );
}
