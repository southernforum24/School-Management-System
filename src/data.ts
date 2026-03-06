import { User, Student, Subject, GradeRecord } from './types';

export const users: User[] = [
  { id: 'u1', username: 'admin', password: 'password', role: 'admin', name: 'ฝ่ายวิชาการ' },
  { id: 'u2', username: 'teacher1', password: 'password', role: 'teacher', name: 'ครูสมศรี ใจดี' },
  { id: 'u3', username: 'exec', password: 'password', role: 'executive', name: 'ผู้อำนวยการ' },
  // Parents will use nationalId and dob
  { id: 'u4', username: '1111111111111', password: '010150', role: 'parent', name: 'ผู้ปกครองสมชาย', studentId: 'st1' },
  { id: 'u5', username: '2222222222222', password: '020250', role: 'parent', name: 'ผู้ปกครองสมหญิง', studentId: 'st2' },
  { id: 'u6', username: '3333333333333', password: '030348', role: 'parent', name: 'ผู้ปกครองมานะ', studentId: 'st3' },
];

export const students: Student[] = [
  { id: 'st1', nationalId: '1111111111111', name: 'เด็กชายสมชาย รักเรียน', gradeLevel: 'ป.1', dob: '010150' },
  { id: 'st2', nationalId: '2222222222222', name: 'เด็กหญิงสมหญิง ขยันดี', gradeLevel: 'ป.1', dob: '020250' },
  { id: 'st3', nationalId: '3333333333333', name: 'เด็กชายมานะ อดทน', gradeLevel: 'ป.3', dob: '030348' },
];

export const initialSubjects: Subject[] = [
  {
    id: 'sub1',
    name: 'คณิตศาสตร์ ป.1',
    className: 'ป.1',
    teacherId: 'u2',
    status: 'Draft',
    config: {
      sem1MaxScores: [10, 10, 10, 10, 10, 10, 10, ''],
      sem2MaxScores: [10, 10, 10, 10, 10, 10, 10, ''],
      sem1FinalMax: 30,
      sem2FinalMax: 30,
    }
  },
  {
    id: 'sub2',
    name: 'เตรียมความพร้อมประเมิน NT ป.3',
    className: 'ป.3',
    teacherId: 'u2',
    status: 'Pending Admin Verification',
    config: {
      sem1MaxScores: [10, 10, 10, 10, 10, 10, 10, ''],
      sem2MaxScores: [10, 10, 10, 10, 10, 10, 10, ''],
      sem1FinalMax: 30,
      sem2FinalMax: 30,
    }
  },
  {
    id: 'sub3',
    name: 'ติวสอบ O-NET ป.6',
    className: 'ป.6',
    teacherId: 'u2',
    status: 'Verified',
    config: {
      sem1MaxScores: [10, 10, 10, 10, 10, 10, 10, ''],
      sem2MaxScores: [10, 10, 10, 10, 10, 10, 10, ''],
      sem1FinalMax: 30,
      sem2FinalMax: 30,
    }
  }
];

export const initialGrades: GradeRecord[] = [
  {
    id: 'g1',
    studentId: 'st1',
    subjectId: 'sub1',
    sem1: { scores: [8, 9, 7, 8, 9, 8, 7, ''], finalScore: 25 },
    sem2: { scores: [9, 9, 8, 8, 9, 8, 8, ''], finalScore: 26 },
  },
  {
    id: 'g2',
    studentId: 'st2',
    subjectId: 'sub1',
    sem1: { scores: [10, 9, 10, 9, 10, 9, 10, ''], finalScore: 28 },
    sem2: { scores: [10, 10, 10, 10, 10, 10, 10, ''], finalScore: 30 },
  },
  {
    id: 'g3',
    studentId: 'st1',
    subjectId: 'sub2',
    sem1: { scores: [7, 7, 8, 8, 7, 7, 8, ''], finalScore: 20 },
    sem2: { scores: [8, 8, 8, 8, 8, 8, 8, ''], finalScore: 22 },
  },
  {
    id: 'g4',
    studentId: 'st2',
    subjectId: 'sub2',
    sem1: { scores: [9, 9, 9, 9, 9, 9, 9, ''], finalScore: 27 },
    sem2: { scores: [9, 9, 9, 9, 9, 9, 9, ''], finalScore: 28 },
  },
  {
    id: 'g5',
    studentId: 'st3',
    subjectId: 'sub3',
    sem1: { scores: [8, 8, 8, 8, 8, 8, 8, ''], finalScore: 24 },
    sem2: { scores: [9, 9, 9, 9, 9, 9, 9, ''], finalScore: 25 },
  }
];
