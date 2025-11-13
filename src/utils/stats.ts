import type { Problem, SRSStats } from '../types';
import { getProblemsDueToday, getMasteredProblems } from './srs';

/**
 * Calculate statistics for the SRS system
 */
export function calculateStats(problems: Problem[]): SRSStats {
  const dueToday = getProblemsDueToday(problems);
  const mastered = getMasteredProblems(problems);

  const problemsByDifficulty = problems.reduce(
    (acc, problem) => {
      acc[problem.difficulty]++;
      return acc;
    },
    { Easy: 0, Medium: 0, Hard: 0 }
  );

  const totalEaseFactor = problems.reduce(
    (sum, p) => sum + p.easeFactor,
    0
  );
  const averageEaseFactor =
    problems.length > 0 ? totalEaseFactor / problems.length : 0;

  return {
    totalProblems: problems.length,
    problemsDueToday: dueToday.length,
    masteredProblems: mastered.length,
    problemsByDifficulty,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
  };
}

