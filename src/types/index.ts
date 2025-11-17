export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ProblemStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface Problem {
  id: string;
  name: string;
  url: string;
  difficulty: Difficulty;
  category: string;
  status: ProblemStatus;
  attempts: Attempt[];
  nextReviewDate: string; // ISO date string
  easeFactor: number; // SM-2 ease factor (default 2.5)
  interval: number; // Days until next review
  lastReviewed?: string; // ISO date string
  mastered: boolean;
  createdAt: string; // ISO date string
}

export interface Attempt {
  id: string;
  date: string; // ISO date string
  success: boolean;
  difficultyRating: number; // 0-5 scale
  notes?: string;
}

export interface ActivityHeatmap {
  startDate: string; // ISO date string marking the beginning of the window
  endDate: string; // ISO date string marking the end of the window
  values: Record<string, number>; // YYYY-MM-DD -> attempt count
}

export interface SRSStats {
  totalProblems: number;
  problemsDueToday: number;
  masteredProblems: number;
  problemsByDifficulty: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  averageEaseFactor: number;
  activityHeatmap: ActivityHeatmap;
}





