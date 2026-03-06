import React, { useState } from 'react';
import { User, GradeRecord, Subject, Student } from './types';
import { initialSubjects, students as initialStudents, initialGrades, users as initialUsers } from './data';
import Login from './components/Login';
import Layout from './components/Layout';
import TeacherDashboard from './components/TeacherDashboard';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import ParentDashboard from './components/ParentDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [grades, setGrades] = useState<GradeRecord[]>(initialGrades);
  const [approvedClasses, setApprovedClasses] = useState<string[]>([]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdateGrades = (updatedGrades: GradeRecord[]) => {
    setGrades(updatedGrades);
  };

  const handleUpdateSubjects = (updatedSubjects: Subject[]) => {
    setSubjects(updatedSubjects);
  };

  const handleUpdateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  };

  const handleUpdateStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
  };

  const handleApproveClass = (className: string) => {
    if (!approvedClasses.includes(className)) {
      setApprovedClasses([...approvedClasses, className]);
    }
  };

  const handleRejectClass = (className: string) => {
    const updatedSubjects = subjects.map(s => s.className === className ? { ...s, status: 'Rejected' as const } : s);
    setSubjects(updatedSubjects);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  return (
    <Layout role={currentUser.role} userName={currentUser.name} onLogout={handleLogout}>
      {currentUser.role === 'admin' && (
        <AdminDashboard 
          subjects={subjects} 
          students={students} 
          grades={grades} 
          users={users}
          onUpdateSubjects={handleUpdateSubjects} 
          onUpdateUsers={handleUpdateUsers}
          onUpdateStudents={handleUpdateStudents}
          onUpdateGrades={handleUpdateGrades}
        />
      )}
      {currentUser.role === 'teacher' && (
        <TeacherDashboard 
          subjects={subjects} 
          students={students} 
          grades={grades} 
          onUpdateGrades={handleUpdateGrades} 
          onUpdateSubjects={handleUpdateSubjects}
          teacherId={currentUser.id}
        />
      )}
      {currentUser.role === 'executive' && (
        <ExecutiveDashboard 
          subjects={subjects} 
          students={students} 
          grades={grades} 
          approvedClasses={approvedClasses}
          onApproveClass={handleApproveClass}
          onRejectClass={handleRejectClass}
        />
      )}
      {currentUser.role === 'parent' && (
        <ParentDashboard 
          subjects={subjects} 
          students={students} 
          grades={grades} 
          approvedClasses={approvedClasses}
          studentId={currentUser.studentId!}
        />
      )}
    </Layout>
  );
}

