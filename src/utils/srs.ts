import type { Problem, Attempt } from '../types';

/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on SuperMemo 2 algorithm
 */

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Calculate the quality of response (0-5 scale)
 * Quality is based on difficulty rating and success
 */
function calculateQuality(success: boolean, difficultyRating: number): number {
  if (!success) return 0;
  // Map difficulty rating (0-5) to quality (0-5)
  // Lower difficulty rating = higher quality
  return Math.max(0, Math.min(5, 5 - difficultyRating));
}

/**
 * Calculate new ease factor based on quality
 */
function calculateNewEaseFactor(
  currentEaseFactor: number,
  quality: number
): number {
  let newEaseFactor =
    currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (newEaseFactor < MIN_EASE_FACTOR) {
    return MIN_EASE_FACTOR;
  }

  return newEaseFactor;
}

/**
 * Calculate new interval based on current interval, ease factor, and quality
 */
function calculateNewInterval(
  currentInterval: number,
  easeFactor: number,
  quality: number
): number {
  if (quality < 3) {
    // If quality is low, reset interval to 1 day
    return 1;
  }

  if (currentInterval === 0) {
    // First review
    return 1;
  } else if (currentInterval === 1) {
    // Second review
    return 6;
  } else {
    // Subsequent reviews
    return Math.round(currentInterval * easeFactor);
  }
}

/**
 * Update problem with new attempt using SM-2 algorithm
 */
export function updateProblemWithAttempt(
  problem: Problem,
  attempt: Omit<Attempt, 'id' | 'date'>
): Problem {
  const quality = calculateQuality(attempt.success, attempt.difficultyRating);
  const newEaseFactor = calculateNewEaseFactor(problem.easeFactor, quality);
  const newInterval = calculateNewInterval(
    problem.interval,
    newEaseFactor,
    quality
  );

  const now = new Date().toISOString();
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  const newAttempt: Attempt = {
    id: `${Date.now()}-${Math.random()}`,
    date: now,
    ...attempt,
  };

  const newStatus: Problem['status'] = problem.mastered
    ? 'mastered'
    : newInterval >= 30
    ? 'mastered'
    : problem.status === 'new'
    ? 'learning'
    : 'reviewing';

  return {
    ...problem,
    attempts: [...problem.attempts, newAttempt],
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewed: now,
    status: newStatus,
    mastered: newInterval >= 30 || problem.mastered,
  };
}

/**
 * Create a new problem with default SRS values
 */
export function createNewProblem(
  name: string,
  url: string,
  difficulty: Problem['difficulty'],
  category: string
): Problem {
  const now = new Date().toISOString();
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + 1); // First review in 1 day

  return {
    id: `${Date.now()}-${Math.random()}`,
    name,
    url,
    difficulty,
    category,
    status: 'new',
    attempts: [],
    nextReviewDate: nextReviewDate.toISOString(),
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    mastered: false,
    createdAt: now,
  };
}

/**
 * Check if a problem is due for review today
 */
export function isDueToday(problem: Problem): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(problem.nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);

  return reviewDate <= today;
}

/**
 * Get problems due today
 */
export function getProblemsDueToday(problems: Problem[]): Problem[] {
  return problems.filter((p) => !p.mastered && isDueToday(p));
}

/**
 * Get mastered problems
 */
export function getMasteredProblems(problems: Problem[]): Problem[] {
  return problems.filter((p) => p.mastered);
}

