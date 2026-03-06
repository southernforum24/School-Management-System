import { SemesterGrade } from './types';

export const calculateTotalAccum = (scores: (number | string)[]): number => {
  return scores.reduce((sum: number, score) => sum + (Number(score) || 0), 0) as number;
};

export const calculateSemesterTotal = (sem: SemesterGrade): number => {
  return calculateTotalAccum(sem.scores) + (Number(sem.finalScore) || 0);
};

export const calculateAverage = (sem1Total: number, sem2Total: number): number => {
  return (sem1Total + sem2Total) / 2;
};

export const calculateGrade = (average: number): string => {
  const rounded = Math.round(average);
  if (rounded >= 80) return '4';
  if (rounded >= 75) return '3.5';
  if (rounded >= 70) return '3';
  if (rounded >= 65) return '2.5';
  if (rounded >= 60) return '2';
  if (rounded >= 55) return '1.5';
  if (rounded >= 50) return '1';
  return '0';
};
