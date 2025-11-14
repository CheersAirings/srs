import type { Problem, Attempt } from '../types';

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

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
 * Calculate new interval based on current interval and success
 * If success: double the interval (1, 2, 4, 8, 16...)
 * If not success: reset to 1 day
 */
function calculateNewInterval(
  currentInterval: number,
  easeFactor: number,
  quality: number
): number {
  const success = quality > 0; // quality > 0 means success
  
  if (!success) {
    // If not successful, reset to next day (1 day)
    return 1;
  }

  // If successful, double the interval
  // Start at 1 if current interval is 0
  if (currentInterval === 0) {
    return 1;
  }
  
  return currentInterval * 2;
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
 * Check if a problem was attempted today
 */
function wasAttemptedToday(problem: Problem): boolean {
  if (problem.attempts.length === 0) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastAttempt = new Date(problem.attempts[problem.attempts.length - 1].date);
  lastAttempt.setHours(0, 0, 0, 0);
  
  return lastAttempt.getTime() === today.getTime();
}

/**
 * Get difficulty priority for sorting (lower number = higher priority)
 */
function getDifficultyPriority(difficulty: Problem['difficulty']): number {
  switch (difficulty) {
    case 'Easy':
      return 1;
    case 'Medium':
      return 2;
    case 'Hard':
      return 3;
  }
}

/**
 * Get problems due today
 * Includes:
 * 1. Problems that are actually due today (not mastered)
 * 2. 2 new problems (no attempts) prioritized by difficulty (Easy -> Medium -> Hard)
 * 3. Problems that were attempted today
 */
export function getProblemsDueToday(problems: Problem[]): Problem[] {
  const nonMastered = problems.filter((p) => !p.mastered);
  
  // 1. Problems actually due today
  const dueToday = nonMastered.filter((p) => isDueToday(p));
  
  // 2. Problems attempted today
  const attemptedToday = nonMastered.filter((p) => wasAttemptedToday(p));
  
  // 3. New problems (no attempts) sorted by difficulty priority
  const newProblems = nonMastered
    .filter((p) => p.attempts.length === 0)
    .sort((a, b) => getDifficultyPriority(a.difficulty) - getDifficultyPriority(b.difficulty))
    .slice(0, 2);
  
  // Combine all and remove duplicates by id
  const allProblems = [...dueToday, ...attemptedToday, ...newProblems];
  const uniqueProblems = Array.from(
    new Map(allProblems.map((p) => [p.id, p])).values()
  );
  
  return uniqueProblems;
}

/**
 * Get mastered problems
 */
export function getMasteredProblems(problems: Problem[]): Problem[] {
  return problems.filter((p) => p.mastered);
}

