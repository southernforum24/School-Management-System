export type Role = 'admin' | 'teacher' | 'executive' | 'parent';

export type SubjectStatus = 'Draft' | 'Pending Admin Verification' | 'Verified' | 'Rejected';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  name: string;
  studentId?: string;
}

export interface Student {
  id: string;
  nationalId: string;
  name: string;
  gradeLevel: string;
  dob: string;
}

export interface SubjectConfig {
  sem1MaxScores: (number | string)[]; // 8 slots
  sem2MaxScores: (number | string)[]; // 8 slots
  sem1FinalMax: number;
  sem2FinalMax: number;
}

export interface Subject {
  id: string;
  name: string;
  className: string;
  teacherId: string;
  config: SubjectConfig;
  status: SubjectStatus;
}

export interface SemesterGrade {
  scores: (number | string)[]; // 8 slots
  finalScore: number | string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: string;
  sem1: SemesterGrade;
  sem2: SemesterGrade;
}
