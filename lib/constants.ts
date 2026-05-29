export const DEFAULT_TIME_LIMIT = 20; // seconds
export const DEFAULT_POINTS = 1000;
export const POLL_INTERVAL_MS = 1500;
export const SIMULATED_DELAY_MS = 300;

// Phase durations (milliseconds)
export const REVEALING_DURATION_MS = 5000; // 5 seconds to see correct answer + distribution
export const SCOREBOARD_DURATION_MS = 5000; // 5 seconds to see leaderboard

// Streak bonuses
export const STREAK_BONUSES: Record<number, number> = {
  2: 100,
  3: 200,
  4: 300,
  5: 500, // 5+ capped at 500
};
