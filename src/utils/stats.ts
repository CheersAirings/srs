import type { Problem, SRSStats } from '../types';
import {
  endOfDay,
  format as formatDate,
  isWithinInterval,
  parseISO,
  set,
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
  const today = startOfToday();
  const rollingEnd = today;
  const rollingStart = subDays(rollingEnd, 364); // Last 365 days inclusive
  const calendarStart = getCalendarYearStart(today);
  const calendarEnd = getCalendarYearEnd(today);

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

  const windowYearHeatmap = buildHeatmap(problems, rollingStart, rollingEnd);
  const calendarYearHeatmap = buildHeatmap(problems, calendarStart, calendarEnd);

  return {
    totalProblems: problems.length,
    problemsDueToday: dueToday.length,
    masteredProblems: mastered.length,
    problemsByDifficulty,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    activityHeatmap: {
      windowYear: windowYearHeatmap,
      calendarYear: calendarYearHeatmap,
    },
  };
}

function buildHeatmap(
  problems: Problem[],
  startDate: Date,
  endDate: Date
): { startDate: string; endDate: string; values: Record<string, number> } {
  const values: Record<string, number> = {};
  const normalizedStart = startOfDay(startDate);
  const normalizedEnd = endOfDay(endDate);

  problems.forEach((problem) => {
    problem.attempts.forEach((attempt) => {
      const parsed = parseISO(attempt.date);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }
      const attemptDay = startOfDay(parsed);
      if (
        isWithinInterval(attemptDay, {
          start: normalizedStart,
          end: normalizedEnd,
        })
      ) {
        const key = formatDate(attemptDay, 'yyyy-MM-dd');
        values[key] = (values[key] ?? 0) + 1;
      }
    });
  });

  return {
    startDate: normalizedStart.toISOString(),
    endDate: normalizedEnd.toISOString(),
    values,
  };
}

function getCalendarYearStart(today: Date): Date {
  const reference = startOfDay(today);
  const juneCurrentYear = set(reference, { month: 5, date: 1 });
  if (reference >= juneCurrentYear) {
    return juneCurrentYear;
  }
  return set(reference, {
    year: reference.getFullYear() - 1,
    month: 5,
    date: 1,
  });
}

function getCalendarYearEnd(today: Date): Date {
  const reference = startOfDay(today);
  const juneCurrentYear = set(reference, { month: 5, date: 1 });
  if (reference >= juneCurrentYear) {
    return set(reference, {
      year: reference.getFullYear() + 1,
      month: 4,
      date: 31,
    });
  }
  return set(reference, {
    month: 4,
    date: 31,
  });
}

