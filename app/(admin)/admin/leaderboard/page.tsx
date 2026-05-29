'use client';

import { useEffect, useState } from 'react';
import { Event, QuizSession } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  total_score: number;
  events_participated?: number;
  is_claimed?: boolean;
  user_id: string;
  device_id?: string | null;
}

interface EventWithSession extends Event {
  quizSession?: QuizSession;
}

type ViewMode = 'all-time' | 'by-event';

export default function AdminLeaderboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all-time');
  const [pastEvents, setPastEvents] = useState<EventWithSession[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    fetchPastEvents();
    if (viewMode === 'all-time') {
      fetchAllTimeLeaderboard();
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'all-time') {
      fetchAllTimeLeaderboard();
    } else if (selectedEventId) {
      fetchEventLeaderboard(selectedEventId);
    }
  }, [viewMode, selectedEventId]);

  const fetchAllTimeLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await fetch('/api/leaderboard?type=all-time');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching all-time leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchPastEvents = async () => {
    try {
      const eventsResponse = await fetch('/api/events');
      if (!eventsResponse.ok) return;

      const events: Event[] = await eventsResponse.json();

      // Get current month and year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Filter events to only include those from previous months
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.event_date);
        const eventYear = eventDate.getFullYear();
        const eventMonth = eventDate.getMonth();

        return eventYear < currentYear ||
               (eventYear === currentYear && eventMonth < currentMonth);
      });

      // Fetch quiz sessions for each past event
      const eventsWithSessions = await Promise.all(
        filteredEvents.map(async (event) => {
          try {
            const sessionsResponse = await fetch(`/api/quiz/sessions?eventId=${event.id}`);
            if (sessionsResponse.ok) {
              const sessions: QuizSession[] = await sessionsResponse.json();
              const finishedSession = sessions.find(s => s.status === 'finished');
              return {
                ...event,
                quizSession: finishedSession,
              };
            }
          } catch (err) {
            console.error(`Failed to fetch sessions for event ${event.id}`, err);
          }
          return event;
        })
      );

      setPastEvents(eventsWithSessions);

      // Auto-select most recent event with quiz data
      const eventWithQuiz = eventsWithSessions.find(e => e.quizSession);
      if (eventWithQuiz) {
        setSelectedEventId(eventWithQuiz.id);
      } else if (eventsWithSessions.length > 0) {
        setSelectedEventId(eventsWithSessions[0].id);
      }
    } catch (error) {
      console.error('Error fetching past events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventLeaderboard = async (eventId: string) => {
    setLoadingLeaderboard(true);
    try {
      const event = pastEvents.find(e => e.id === eventId);
      if (!event?.quizSession) {
        setLeaderboard([]);
        setLoadingLeaderboard(false);
        return;
      }

      const response = await fetch(
        `/api/leaderboard?type=per-event&sessionId=${event.quizSession.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching event leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white font-mono">LOADING...</p>
      </div>
    );
  }

  const selectedEvent = pastEvents.find(e => e.id === selectedEventId);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-white mb-2 font-mono flex items-center gap-3">
          <span className="text-dc-yellow">$</span> LEADERBOARD_MANAGEMENT
        </h1>
        <p className="text-dc-gray-light">View all-time rankings or filter by event</p>
      </div>

      {/* View Mode Tabs */}
      <div className="shrink-0 flex gap-2 border-2 border-dc-dark-3 bg-dc-dark-1 p-2">
        <button
          onClick={() => setViewMode('all-time')}
          className={`flex-1 px-6 py-3 font-mono font-bold uppercase tracking-wider transition-all ${
            viewMode === 'all-time'
              ? 'bg-dc-yellow text-dc-dark shadow-glow-sm'
              : 'bg-dc-dark-2 text-dc-gray hover:text-white hover:bg-dc-dark-3'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setViewMode('by-event')}
          className={`flex-1 px-6 py-3 font-mono font-bold uppercase tracking-wider transition-all ${
            viewMode === 'by-event'
              ? 'bg-dc-yellow text-dc-dark shadow-glow-sm'
              : 'bg-dc-dark-2 text-dc-gray hover:text-white hover:bg-dc-dark-3'
          }`}
        >
          By Event
        </button>
      </div>

      {/* Event Filter (only shown in by-event mode) */}
      {viewMode === 'by-event' && (
        <div className="shrink-0 overflow-visible">
          {pastEvents.length > 0 ? (
            <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="shrink-0">
                  <span className="text-dc-yellow font-mono text-sm uppercase tracking-wider font-bold">
                    Select Event
                  </span>
                </label>

                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pastEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {formatMonthYear(event.event_date)} — {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvent && (
                <>
                  {selectedEvent.quizSession ? (
                    <div className="flex flex-row items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-dc-gray font-mono">Session:</span>
                        <span className="text-white font-mono bg-dc-dark-2 px-2 py-1 border border-dc-dark-3">
                          {selectedEvent.quizSession.id.substring(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-dc-gray font-mono">Join Code:</span>
                        <span className="text-dc-yellow font-mono font-bold bg-dc-dark-2 px-2 py-1 border border-dc-yellow/30">
                          {selectedEvent.quizSession.join_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-dc-gray font-mono">Players:</span>
                        <span className="text-green-400 font-mono font-bold">
                          {leaderboard.length}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-dc-dark-2 border border-dc-dark-3 px-4 py-3">
                      <p className="text-dc-gray font-mono text-sm">
                        ⚠️ No quiz session data available for this event
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-dc-dark-1 border-2 border-dc-dark-3 p-8 text-center">
              <p className="text-dc-gray font-mono">No past events found</p>
              <p className="text-dc-gray-light font-mono text-sm mt-2">
                Events from the current month (February 2026) are not shown
              </p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="flex-1 bg-dc-dark-1 border-2 border-dc-dark-3 flex flex-col overflow-hidden">
        {/* Header Row */}
        <div className={`shrink-0 grid ${viewMode === 'all-time' ? 'grid-cols-10' : 'grid-cols-8'} gap-4 px-6 py-4 border-b-2 border-dc-dark-3 bg-dc-dark-2`}>
          <div className="col-span-1 font-mono text-xs text-dc-yellow font-bold uppercase">
            Rank
          </div>
          <div className={viewMode === 'all-time' ? 'col-span-4' : 'col-span-5'}>
            <span className="font-mono text-xs text-dc-yellow font-bold uppercase">Nickname</span>
          </div>
          <div className="col-span-2 font-mono text-xs text-dc-yellow font-bold uppercase">
            Score
          </div>
          {viewMode === 'all-time' && (
            <>
              <div className="col-span-2 font-mono text-xs text-dc-yellow font-bold uppercase">
                Events
              </div>
              <div className="col-span-1 font-mono text-xs text-dc-yellow font-bold uppercase">
                Status
              </div>
            </>
          )}
        </div>

        {/* Data Rows - Scrollable */}
        {loadingLeaderboard ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white font-mono">LOADING LEADERBOARD...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-dc-gray font-mono">
              {viewMode === 'all-time' ? 'No players yet' : 'No players in this event'}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y-2 divide-dc-dark-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`grid ${viewMode === 'all-time' ? 'grid-cols-10' : 'grid-cols-8'} gap-4 px-6 py-4 hover:bg-dc-dark-2 transition-colors`}
              >
                <div className="col-span-1 flex items-center">
                  {index < 3 ? (
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-dc-yellow font-mono">#{entry.rank}</span>
                  )}
                </div>

                <div className={`${viewMode === 'all-time' ? 'col-span-4' : 'col-span-5'} flex items-center`}>
                  <span className="font-medium text-white font-mono">{entry.nickname}</span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="text-xl font-bold text-green-400 font-mono">
                    {entry.total_score} pts
                  </span>
                </div>

                {viewMode === 'all-time' && (
                  <>
                    <div className="col-span-2 flex items-center">
                      <span className="text-dc-gray-light font-mono">{entry.events_participated || 0}</span>
                    </div>

                    <div className="col-span-1 flex items-center">
                      {entry.is_claimed ? (
                        <span className="px-2 py-1 text-xs font-mono font-bold bg-green-900/30 text-green-400 border border-green-400/30">
                          CLAIMED
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-mono font-bold bg-dc-dark-2 text-dc-gray border border-dc-dark-3">
                          ANON
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
