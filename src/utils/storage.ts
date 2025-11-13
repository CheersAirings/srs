import type { Problem } from '../types';

const STORAGE_KEY = 'leetcode-srs-problems';
const EXPORT_SCHEMA_VERSION = 1 as const;

/**
 * Load problems from localStorage
 */
export function loadProblems(): Problem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading problems from storage:', error);
    return [];
  }
}

/**
 * Save problems to localStorage
 */
export function saveProblems(problems: Problem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  } catch (error) {
    console.error('Error saving problems to storage:', error);
  }
}

/**
 * Add a new problem
 */
export function addProblem(problem: Problem): void {
  const problems = loadProblems();
  problems.push(problem);
  saveProblems(problems);
}

/**
 * Update an existing problem
 */
export function updateProblem(updatedProblem: Problem): void {
  const problems = loadProblems();
  const index = problems.findIndex((p) => p.id === updatedProblem.id);
  if (index !== -1) {
    problems[index] = updatedProblem;
    saveProblems(problems);
  }
}

/**
 * Delete a problem
 */
export function deleteProblem(problemId: string): void {
  const problems = loadProblems();
  const filtered = problems.filter((p) => p.id !== problemId);
  saveProblems(filtered);
}

/**
 * Replace all problems in storage
 */
export function replaceProblems(problems: Problem[]): void {
  saveProblems(problems);
}

/**
 * Build a JSON string suitable for download that contains all problems
 * with a simple schema wrapper.
 */
export function buildExportJson(): string {
  const payload = {
    version: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    problems: loadProblems(),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse and validate imported JSON text, replace storage on success.
 * Returns number of problems imported.
 */
export function importFromJsonText(jsonText: string): number {
  try {
    const parsed = JSON.parse(jsonText);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.version !== 'number' ||
      !Array.isArray(parsed.problems)
    ) {
      throw new Error('Invalid backup format');
    }
    // In future, handle migrations by version
    const problems: Problem[] = parsed.problems;
    if (!Array.isArray(problems)) {
      throw new Error('Invalid problems array');
    }
    replaceProblems(problems);
    return problems.length;
  } catch (error) {
    console.error('Error importing problems from JSON:', error);
    throw error;
  }
}

