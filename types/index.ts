// ---- Enums ----
export type EventStatus = 'draft' | 'cfp_open' | 'cfp_closed' | 'upcoming' | 'live' | 'completed';
export type TalkStatus = 'submitted' | 'accepted' | 'rejected' | 'slides_received' | 'published';
export type QuizStatus = 'draft' | 'waiting' | 'active' | 'finished';
export type QuestionPhase = 'answering' | 'revealing' | 'scoreboard';
export type Role = 'admin' | 'speaker' | 'player';
export type SlidesType = 'url' | 'file' | null;

// ---- Entities ----
export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;          // ISO date string
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface EventSpeaker {
  id: string;
  event_id: string;
  email: string;
  name: string;
  added_at: string;
}

export interface Talk {
  id: string;
  event_id: string;
  speaker_name: string;
  speaker_email: string;
  github_username: string | null;
  title: string;
  topic: string;  // Tech topic/category (e.g., "Web Development", "AI/ML", "DevOps")
  abstract: string | null;
  bio: string | null;
  status: TalkStatus;
  slides_url: string | null;
  slides_type: SlidesType;
  storage_path: string | null;  // simulated
  slides_uploaded_at: string | null;
  reminder_sent_count: number;
  last_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  device_id: string | null;
  nickname: string | null;
  username: string | null;
  email: string | null;
  secret_question: string | null;
  secret_answer_hash: string | null;
  is_claimed: boolean;
  is_admin: boolean;
  merged_into_user_id: string | null;
  total_points: number;
  events_participated: number;
  created_at: string;
}

export interface QuizSession {
  id: string;
  event_id: string;
  join_code: string;
  status: QuizStatus;
  current_question_index: number;  // -1 means not started
  question_phase: QuestionPhase | null;  // null when not active
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  question_started_at: string | null;  // When current question started
  phase_started_at: string | null;  // When current phase started (for auto-advance)
}

export interface Question {
  id: string;
  quiz_session_id: string;
  question_text: string;
  options: string[];             // exactly 4 items
  correct_index: number;         // 0-3
  time_limit_seconds: number;
  points: number;
  order_index: number;
  created_at: string;
}

export interface Response {
  id: string;
  question_id: string;
  user_id: string;
  answer_index: number | null;   // null if timed out
  answered_at: string | null;
  time_taken_ms: number | null;
  points_awarded: number;
  is_correct: boolean | null;
  created_at: string;
}

export interface QuizParticipant {
  id: string;
  quiz_session_id: string;
  user_id: string;
  nickname_used: string;
  total_score: number;
  current_streak: number;  // consecutive correct answers
  joined_at: string;
}

// ---- API payloads ----
export interface QuizStateResponse {
  session: Pick<QuizSession, 'id' | 'status' | 'current_question_index' | 'join_code' | 'question_phase'>;
  current_question: Omit<Question, 'correct_index'> | null;  // hide answer from player
  question_started_at: string | null;                         // when this question was shown
  participants_count: number;
  answers_count: number;                                      // how many answered current Q
  leaderboard: LeaderboardEntry[];                            // top 10
  answer_distribution?: {                                     // shown in revealing/scoreboard phases
    option_index: number;
    count: number;
    percentage: number;
  }[];
  player_result?: {                                           // if player already answered
    is_correct: boolean;
    points_awarded: number;
    correct_index: number;                                    // reveal after answered
    streak_count: number;                                     // current streak
  };
}

export interface LeaderboardEntry {
  user_id: string;
  nickname: string;
  total_score: number;
  rank: number;
  streak_count: number;                                       // display streak indicator
  previous_rank?: number;                                     // for animation
}
