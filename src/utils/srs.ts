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
  const newEaseFactor =
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
 * Count how many attempts were made today
 */
function getAttemptsToday(problem: Problem): number {
  if (problem.attempts.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return problem.attempts.filter((attempt) => {
    const attemptDate = new Date(attempt.date);
    attemptDate.setHours(0, 0, 0, 0);
    return attemptDate.getTime() === today.getTime();
  }).length;
}

/**
 * Check if a problem is new (has no attempts)
 */
function isNewProblem(problem: Problem): boolean {
  return problem.attempts.length === 0;
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
 * 1. Problems that are actually due today (not mastered) that haven't reached their attempt limit:
 *    - Repeated problems (has previous attempts): show until they have 1 attempt today
 * 2. New problems (0 total attempts) that haven't reached 2 attempts today:
 *    - Show up to 2 new problems that haven't been attempted today yet
 *    - Show new problems that have been attempted today but haven't reached 2 attempts yet
 *    Prioritized by difficulty (Easy -> Medium -> Hard)
 */
export function getProblemsDueToday(problems: Problem[]): Problem[] {
  const nonMastered = problems.filter((p) => !p.mastered);
  
  // 1. Repeated problems (has previous attempts) that are due today
  // Show until they have 1 attempt today
  const repeatedDueToday = nonMastered.filter((p) => {
    if (isNewProblem(p)) return false; // Skip new problems here
    if (!isDueToday(p)) return false;
    
    const attemptsToday = getAttemptsToday(p);
    return attemptsToday < 1;
  });
  
  // 2. New problems (0 total attempts) that haven't reached 2 attempts today
  // Prioritize: in-progress new problems (1 attempt today) first, then not attempted today
  const newProblems = nonMastered
    .filter((p) => {
      if (!isNewProblem(p)) return false;
      const attemptsToday = getAttemptsToday(p);
      return attemptsToday < 2; // Show until 2 attempts today
    })
    .sort((a, b) => {
      const aAttemptsToday = getAttemptsToday(a);
      const bAttemptsToday = getAttemptsToday(b);
      
      // Prioritize in-progress problems (1 attempt today) over not attempted
      if (aAttemptsToday > 0 && bAttemptsToday === 0) return -1;
      if (aAttemptsToday === 0 && bAttemptsToday > 0) return 1;
      
      // Then sort by difficulty (Easy -> Medium -> Hard)
      return getDifficultyPriority(a.difficulty) - getDifficultyPriority(b.difficulty);
    });
  
  // Limit to 2 new problems total
  const selectedNewProblems = newProblems.slice(0, 2);
  
  // Combine all and remove duplicates by id
  const allProblems = [...repeatedDueToday, ...selectedNewProblems];
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

