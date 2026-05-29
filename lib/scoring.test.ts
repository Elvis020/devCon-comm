import { describe, expect, it } from 'vitest';
import { calculatePoints, calculateStreakBonus } from '@/lib/scoring';

describe('calculatePoints', () => {
  it('returns 0 for incorrect answers', () => {
    expect(calculatePoints(1000, 20000, 0, false)).toBe(0);
  });

  it('awards full base points for instant correct answers', () => {
    expect(calculatePoints(1000, 20000, 0, true)).toBe(1000);
  });

  it('awards half base points at the time limit', () => {
    expect(calculatePoints(1000, 20000, 20000, true)).toBe(500);
  });

  it('scales linearly by speed between full and half points', () => {
    // Halfway through timer: speed factor = 0.5 => multiplier = 0.75
    expect(calculatePoints(1000, 20000, 10000, true)).toBe(750);
  });

  it('clamps late answers to minimum 50% (for correct answers)', () => {
    expect(calculatePoints(1000, 20000, 25000, true)).toBe(500);
  });
});

describe('calculateStreakBonus', () => {
  it('gives no bonus below 2 streak', () => {
    expect(calculateStreakBonus(0)).toBe(0);
    expect(calculateStreakBonus(1)).toBe(0);
  });

  it('applies configured bonus values for 2-4 streaks', () => {
    expect(calculateStreakBonus(2)).toBe(100);
    expect(calculateStreakBonus(3)).toBe(200);
    expect(calculateStreakBonus(4)).toBe(300);
  });

  it('caps bonus at 500 for 5+ streaks', () => {
    expect(calculateStreakBonus(5)).toBe(500);
    expect(calculateStreakBonus(9)).toBe(500);
  });
});
