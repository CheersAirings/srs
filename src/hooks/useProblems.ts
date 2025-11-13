import { useState, useEffect } from 'react';
import type { Problem, Attempt } from '../types';
import {
  loadProblems,
  addProblem as addProblemToStorage,
  updateProblem as updateProblemInStorage,
  deleteProblem as deleteProblemFromStorage,
  replaceProblems as replaceProblemsInStorage,
} from '../utils/storage';
import {
  createNewProblem,
  updateProblemWithAttempt,
} from '../utils/srs';

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loaded = loadProblems();
    setProblems(loaded);
    setLoading(false);
  }, []);

  const addProblem = (
    name: string,
    url: string,
    difficulty: Problem['difficulty'],
    category: string
  ) => {
    const newProblem = createNewProblem(name, url, difficulty, category);
    addProblemToStorage(newProblem);
    setProblems((prev) => [...prev, newProblem]);
    return newProblem;
  };

  const updateProblem = (problem: Problem) => {
    updateProblemInStorage(problem);
    setProblems((prev) =>
      prev.map((p) => (p.id === problem.id ? problem : p))
    );
  };

  const recordAttempt = (
    problemId: string,
    attempt: Omit<Attempt, 'id' | 'date'>
  ) => {
    const problem = problems.find((p) => p.id === problemId);
    if (!problem) return;

    const updated = updateProblemWithAttempt(problem, attempt);
    updateProblem(updated);
  };

  const deleteProblem = (problemId: string) => {
    deleteProblemFromStorage(problemId);
    setProblems((prev) => prev.filter((p) => p.id !== problemId));
  };

  const reloadProblems = () => {
    const loaded = loadProblems();
    setProblems(loaded);
  };

  const replaceAllProblems = (next: Problem[]) => {
    replaceProblemsInStorage(next);
    setProblems(next);
  };

  return {
    problems,
    loading,
    addProblem,
    updateProblem,
    recordAttempt,
    deleteProblem,
    reloadProblems,
    replaceAllProblems,
  };
}

