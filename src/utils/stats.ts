import type { Problem, SRSStats } from '../types';
import {
  format as formatDate,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfToday,
  subDays,
} from 'date-fns';
import { getProblemsDueToday, getMasteredProblems } from './srs';

/**
 * Calculate statistics for the SRS system
 */
export function calculateStats(problems: Problem[]): SRSStats {
  const dueToday = getProblemsDueToday(problems);
  const mastered = getMasteredProblems(problems);
  const heatmapEnd = startOfToday();
  const heatmapStart = subDays(heatmapEnd, 364); // Last 365 days inclusive
  const activityValues: Record<string, number> = {};

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

  problems.forEach((problem) => {
    problem.attempts.forEach((attempt) => {
      const parsed = parseISO(attempt.date);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }
      const attemptDay = startOfDay(parsed);
      if (
        isWithinInterval(attemptDay, {
          start: heatmapStart,
          end: heatmapEnd,
        })
      ) {
        const key = formatDate(attemptDay, 'yyyy-MM-dd');
        activityValues[key] = (activityValues[key] ?? 0) + 1;
      }
    });
  });

  return {
    totalProblems: problems.length,
    problemsDueToday: dueToday.length,
    masteredProblems: mastered.length,
    problemsByDifficulty,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    activityHeatmap: {
      startDate: heatmapStart.toISOString(),
      endDate: heatmapEnd.toISOString(),
      values: activityValues,
    },
  };
}

