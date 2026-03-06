import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Subject, Student, GradeRecord, User } from '../types';
import { CheckCircle, AlertCircle, ShieldCheck, Users, BookOpen, UserCog, GraduationCap, Settings, Edit2, Save, X, Eye, UploadCloud, FileSpreadsheet, BarChart3, TrendingUp, Layers, Trash2 } from 'lucide-react';
import { calculateSemesterTotal, calculateAverage, calculateGrade } from '../utils';

interface AdminDashboardProps {
  subjects: Subject[];
  students: Student[];
  grades: GradeRecord[];
  users: User[];
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
  onUpdateUsers: (updatedUsers: User[]) => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
  onUpdateGrades: (updatedGrades: GradeRecord[]) => void;
}

export default function AdminDashboard({ subjects, students, grades, users, onUpdateSubjects, onUpdateUsers, onUpdateStudents, onUpdateGrades }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'verify' | 'users' | 'students' | 'subjects' | 'stats'>('verify');
  
  // Edit Subject State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<Partial<Subject>>({});

  // Edit User State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<Partial<User>>({});

  // Edit Student State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<Partial<Student>>({});

  // Add Student State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});

  // Add User State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'teacher' });

  // View Grades State
  const [viewingSubjectId, setViewingSubjectId] = useState<string | null>(null);

  const viewingSubjectStats = useMemo(() => {
    if (!viewingSubjectId) return null;
    const subjectGrades = grades.filter(g => g.subjectId === viewingSubjectId);
    const stats: Record<string, number> = { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 };
    let total = 0;

    subjectGrades.forEach(grade => {
      const sem1Total = calculateSemesterTotal(grade.sem1);
      const sem2Total = calculateSemesterTotal(grade.sem2);
      const average = calculateAverage(sem1Total, sem2Total);
      const finalGrade = calculateGrade(average);
      if (stats[finalGrade] !== undefined) {
        stats[finalGrade]++;
        total++;
      }
    });

    return { stats, total };
  }, [viewingSubjectId, grades]);

  // Import Data State
  const [isImportingData, setIsImportingData] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const [importType, setImportType] = useState<'users' | 'students' | 'subjects'>('users');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Add Subject State
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    config: { sem1FinalMax: 30, sem2FinalMax: 30 }
  });

  // Custom Modal States
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'user' | 'student' | 'subject', id: string} | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{type: 'unverify' | 'reject', id: string} | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(json);
        setImportStep('preview');
      } catch (error) {
        setAlertMessage('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบรูปแบบไฟล์');
        setSelectedFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (importType === 'users') {
      const newUsers: User[] = parsedData.map((row: any, index) => ({
        id: `u${Date.now()}${index}`,
        name: row.Name || row.name || row['ชื่อ-สกุล'] || '',
        username: row.Username || row.username || '',
        password: row.Password || row.password || '123456',
        role: (row.Role || row.role || 'teacher').toLowerCase() as any,
      })).filter(u => u.name && u.username);
      
      if (newUsers.length > 0) {
        onUpdateUsers([...users, ...newUsers]);
        setAlertMessage(`นำเข้าข้อมูลผู้ใช้สำเร็จ ${newUsers.length} รายการ`);
      } else {
        setAlertMessage('ไม่พบข้อมูลที่ถูกต้องในไฟล์');
      }
    } else if (importType === 'students') {
      const newStudents: Student[] = parsedData.map((row: any, index) => ({
        id: `s${Date.now()}${index}`,
        nationalId: row.NationalId || row.nationalId || row['เลขประจำตัวประชาชน'] || row['Student ID'] || '',
        name: row.Name || row.name || row['ชื่อ-สกุล'] || '',
        gradeLevel: row.Grade || row.grade || row.gradeLevel || row['ชั้นเรียน'] || '',
        dob: row.DOB || row.dob || row['วันเดือนปีเกิด'] || ''
      })).filter(s => s.name && s.nationalId);

      if (newStudents.length > 0) {
        onUpdateStudents([...students, ...newStudents]);
        setAlertMessage(`นำเข้าข้อมูลนักเรียนสำเร็จ ${newStudents.length} รายการ`);
      } else {
        setAlertMessage('ไม่พบข้อมูลที่ถูกต้องในไฟล์');
      }
    } else if (importType === 'subjects') {
      const newSubjects: Subject[] = parsedData.map((row: any, index) => ({
        id: row.Id || row.id || row['รหัสวิชา'] || `SUBJ${Date.now()}${index}`,
        name: row.Name || row.name || row['ชื่อวิชา'] || '',
        className: row.ClassName || row.className || row['ชั้นเรียน'] || '',
        teacherId: row.TeacherId || row.teacherId || row['รหัสครูผู้สอน'] || '',
        status: 'Pending Admin Verification',
        config: {
          sem1FinalMax: Number(row.Sem1FinalMax || row.sem1FinalMax || row['คะแนนปลายภาคเทอม1']) || 30,
          sem2FinalMax: Number(row.Sem2FinalMax || row.sem2FinalMax || row['คะแนนปลายภาคเทอม2']) || 30
        }
      })).filter(s => s.name && s.className);

      if (newSubjects.length > 0) {
        onUpdateSubjects([...subjects, ...newSubjects]);
        setAlertMessage(`นำเข้าข้อมูลรายวิชาสำเร็จ ${newSubjects.length} รายการ`);
      } else {
        setAlertMessage('ไม่พบข้อมูลที่ถูกต้องในไฟล์');
      }
    }
    
    setIsImportingData(false);
    setImportStep('upload');
    setSelectedFile(null);
    setParsedData([]);
  };

  const pendingSubjects = useMemo(() => {
    return subjects.filter(s => s.status === 'Pending Admin Verification' || s.status === 'Rejected');
  }, [subjects]);

  const verifiedSubjects = useMemo(() => {
    return subjects.filter(s => s.status === 'Verified');
  }, [subjects]);

  // Group subjects by class for stats
  const classesData = useMemo(() => {
    const classSet = new Set<string>();
    subjects.forEach(s => classSet.add(s.className));
    return Array.from(classSet).map(className => ({ className }));
  }, [subjects]);

  // Calculate Grade Statistics
  const gradeStats = useMemo(() => {
    const stats: Record<string, { total: number, grades: Record<string, number> }> = {
      'All': { total: 0, grades: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 } }
    };

    // Initialize classes
    classesData.forEach(c => {
      stats[c.className] = { total: 0, grades: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 } };
    });

    // Initialize subjects
    subjects.forEach(s => {
      stats[`subject_${s.id}`] = { total: 0, grades: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 } };
    });

    grades.forEach(grade => {
      const subject = subjects.find(s => s.id === grade.subjectId);
      if (!subject) return;

      const sem1Total = calculateSemesterTotal(grade.sem1);
      const sem2Total = calculateSemesterTotal(grade.sem2);
      const average = calculateAverage(sem1Total, sem2Total);
      const finalGrade = calculateGrade(average);

      // Add to overall
      stats['All'].total++;
      if (stats['All'].grades[finalGrade] !== undefined) {
        stats['All'].grades[finalGrade]++;
      }

      // Add to class
      const className = subject.className;
      if (stats[className]) {
        stats[className].total++;
        if (stats[className].grades[finalGrade] !== undefined) {
          stats[className].grades[finalGrade]++;
        }
      }

      // Add to subject
      const subjectKey = `subject_${subject.id}`;
      if (stats[subjectKey]) {
        stats[subjectKey].total++;
        if (stats[subjectKey].grades[finalGrade] !== undefined) {
          stats[subjectKey].grades[finalGrade]++;
        }
      }
    });

    return stats;
  }, [grades, subjects, classesData]);

  const gradeLabels = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'];

  const handleVerify = (subjectId: string) => {
    const updated = subjects.map(s => s.id === subjectId ? { ...s, status: 'Verified' as const } : s);
    onUpdateSubjects(updated);
  };

  const handleUnverify = (subjectId: string) => {
    setActionConfirm({ type: 'unverify', id: subjectId });
  };

  const handleRejectToTeacher = (subjectId: string) => {
    setActionConfirm({ type: 'reject', id: subjectId });
  };

  const handleVerifyAll = () => {
    const updated = subjects.map(s => s.status === 'Pending Admin Verification' ? { ...s, status: 'Verified' as const } : s);
    onUpdateSubjects(updated);
    setAlertMessage('รับรองผลการเรียนทั้งหมดเรียบร้อยแล้ว');
  };

  const startEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditSubject(subject);
  };

  const saveEditSubject = () => {
    if (!editingSubjectId) return;
    const updated = subjects.map(s => s.id === editingSubjectId ? { ...s, ...editSubject } as Subject : s);
    onUpdateSubjects(updated);
    setEditingSubjectId(null);
  };

  const cancelEditSubject = () => {
    setEditingSubjectId(null);
  };

  const deleteSubject = (id: string) => {
    setDeleteConfirm({ type: 'subject', id });
  };

  const startEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUser(user);
  };

  const saveEditUser = () => {
    if (!editingUserId) return;
    const updated = users.map(u => u.id === editingUserId ? { ...u, ...editUser } as User : u);
    onUpdateUsers(updated);
    setEditingUserId(null);
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
  };

  const deleteUser = (id: string) => {
    setDeleteConfirm({ type: 'user', id });
  };

  const startEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setEditStudent(student);
  };

  const saveEditStudent = () => {
    if (!editingStudentId) return;
    const updated = students.map(s => s.id === editingStudentId ? { ...s, ...editStudent } as Student : s);
    onUpdateStudents(updated);
    setEditingStudentId(null);
  };

  const cancelEditStudent = () => {
    setEditingStudentId(null);
  };

  const deleteStudent = (id: string) => {
    setDeleteConfirm({ type: 'student', id });
  };

  const handleSaveNewStudent = () => {
    if (newStudent.name && newStudent.nationalId && newStudent.gradeLevel) {
      const student: Student = {
        id: `s${Date.now()}`,
        name: newStudent.name,
        nationalId: newStudent.nationalId,
        gradeLevel: newStudent.gradeLevel,
        dob: newStudent.dob || ''
      };
      onUpdateStudents([...students, student]);
      setIsAddingStudent(false);
      setNewStudent({});
      setAlertMessage('เพิ่มนักเรียนเรียบร้อยแล้ว');
    } else {
      setAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  };

  const handleSaveNewUser = () => {
    if (!newUser.name || !newUser.username || !newUser.password || !newUser.role) {
      setAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    const newUserObj: User = {
      id: `u${Date.now()}`,
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role as any,
      studentId: newUser.role === 'parent' ? newUser.studentId : undefined,
    };
    onUpdateUsers([...users, newUserObj]);
    setIsAddingUser(false);
    setNewUser({ role: 'teacher' });
  };

  const handleSaveNewSubject = () => {
    if (!newSubject.id || !newSubject.name || !newSubject.className || !newSubject.teacherId) {
      setAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    const newSubjectObj: Subject = {
      id: newSubject.id,
      name: newSubject.name,
      className: newSubject.className,
      teacherId: newSubject.teacherId,
      status: 'Pending Admin Verification',
      config: newSubject.config || { sem1FinalMax: 30, sem2FinalMax: 30 }
    };
    onUpdateSubjects([...subjects, newSubjectObj]);
    setIsAddingSubject(false);
    setNewSubject({ config: { sem1FinalMax: 30, sem2FinalMax: 30 } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[34px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#007AFF] tracking-tight">Admin (ฝ่ายวิชาการ)</h2>
          <p className="text-[15px] text-[#3C3C43] mt-1 font-medium">จัดการข้อมูลระบบและรับรองผลการเรียน</p>
        </div>
        
        {/* Segmented Control for Tabs */}
        <div className="segmented-control w-full overflow-x-auto">
          <div
            onClick={() => setActiveTab('verify')}
            className={`segmented-control-item whitespace-nowrap ${activeTab === 'verify' ? 'active' : ''}`}
          >
            <ShieldCheck className="w-4 h-4 inline-block mr-1.5" />
            รับรองผลการเรียน
          </div>
          <div
            onClick={() => setActiveTab('users')}
            className={`segmented-control-item whitespace-nowrap ${activeTab === 'users' ? 'active' : ''}`}
          >
            <UserCog className="w-4 h-4 inline-block mr-1.5" />
            จัดการผู้ใช้งาน
          </div>
          <div
            onClick={() => setActiveTab('students')}
            className={`segmented-control-item whitespace-nowrap ${activeTab === 'students' ? 'active' : ''}`}
          >
            <Users className="w-4 h-4 inline-block mr-1.5" />
            จัดการนักเรียน
          </div>
          <div
            onClick={() => setActiveTab('subjects')}
            className={`segmented-control-item whitespace-nowrap ${activeTab === 'subjects' ? 'active' : ''}`}
          >
            <BookOpen className="w-4 h-4 inline-block mr-1.5" />
            จัดการรายวิชา
          </div>
          <div
            onClick={() => setActiveTab('stats')}
            className={`segmented-control-item whitespace-nowrap ${activeTab === 'stats' ? 'active' : ''}`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-1.5" />
            สถิติผลการเรียน
          </div>
        </div>
      </div>

      {activeTab === 'verify' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-5 flex items-center">
              <div className="bg-gradient-to-br from-[#FFD600] to-[#FF9500] p-3 rounded-[16px] mr-4 text-white shadow-lg shadow-[#FFD600]/20">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">รอการรับรอง</p>
                <p className="text-[28px] font-bold text-black">{pendingSubjects.length}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center">
              <div className="bg-gradient-to-br from-[#00E5FF] to-[#007AFF] p-3 rounded-[16px] mr-4 text-white shadow-lg shadow-[#00E5FF]/20">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">รับรองแล้ว</p>
                <p className="text-[28px] font-bold text-black">{verifiedSubjects.length}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center">
              <div className="bg-gradient-to-br from-[#FF00FF] to-[#AF52DE] p-3 rounded-[16px] mr-4 text-white shadow-lg shadow-[#FF00FF]/20">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">วิชาทั้งหมด</p>
                <p className="text-[28px] font-bold text-black">{subjects.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center">
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <span className="bg-[#FFD600]/10 text-[#FFD600] p-1.5 rounded-lg mr-2 border border-[#FFD600]/30">
                  <AlertCircle className="w-4 h-4" />
                </span>
                รายวิชาที่รอการรับรอง ({pendingSubjects.length})
              </h3>
              {pendingSubjects.length > 0 && (
                <button
                  onClick={handleVerifyAll}
                  className="inline-flex items-center px-5 py-2.5 text-[15px] font-semibold rounded-[14px] glow-button"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  รับรองทั้งหมด
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse glass-table">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">รหัส/ชื่อวิชา</th>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชั้นเรียน</th>
                    <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จำนวนนักเรียน</th>
                    <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">สถานะ</th>
                    <th scope="col" className="px-6 py-4 text-right text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSubjects.map((subject, index) => {
                    const studentCount = grades.filter(g => g.subjectId === subject.id).length;
                    const isLast = index === pendingSubjects.length - 1;
                    const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';
                    
                    return (
                      <tr key={subject.id} className={`hover:bg-[#F2F2F7]/50 transition-colors ${borderClass}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[15px] font-medium text-black">{subject.name}</div>
                          <div className="text-[13px] text-[#8E8E93] mt-0.5">รหัส: {subject.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium bg-[#F2F2F7] text-[#8E8E93]">
                            {subject.className}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center text-[15px] font-medium text-black">
                            <Users className="w-4 h-4 mr-1.5 text-[#8E8E93]" />
                            {studentCount} คน
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold ${
                            subject.status === 'Rejected' ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30' : 'badge-warning'
                          }`}>
                            {subject.status === 'Rejected' ? 'ผู้บริหารตีกลับ' : 'รอรับรอง'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setViewingSubjectId(subject.id)}
                            className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 transition-colors mr-2"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            ตรวจสอบคะแนน
                          </button>
                          <button
                            onClick={() => handleVerify(subject.id)}
                            className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] glow-button"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            รับรองรายวิชา
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pendingSubjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93]">
                        <ShieldCheck className="w-16 h-16 text-[#34C759] mx-auto mb-4 opacity-50" />
                        <p className="text-[17px] font-semibold text-black">ไม่มีรายวิชาที่รอรับรอง</p>
                        <p className="text-[15px] mt-1">รายวิชาทั้งหมดได้รับการรับรองเรียบร้อยแล้ว</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="glass-card overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center">
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <span className="bg-[#34C759]/10 text-[#34C759] p-1.5 rounded-lg mr-2 border border-[#34C759]/30">
                  <CheckCircle className="w-4 h-4" />
                </span>
                รายวิชาที่รับรองแล้ว ({verifiedSubjects.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse glass-table">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">รหัส/ชื่อวิชา</th>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชั้นเรียน</th>
                    <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จำนวนนักเรียน</th>
                    <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">สถานะ</th>
                    <th scope="col" className="px-6 py-4 text-right text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedSubjects.map((subject, index) => {
                    const studentCount = grades.filter(g => g.subjectId === subject.id).length;
                    const isLast = index === verifiedSubjects.length - 1;
                    const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';
                    
                    return (
                      <tr key={subject.id} className={`hover:bg-[#F2F2F7]/50 transition-colors ${borderClass}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[15px] font-medium text-black">{subject.name}</div>
                          <div className="text-[13px] text-[#8E8E93] mt-0.5">รหัส: {subject.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium bg-[#F2F2F7] text-[#8E8E93]">
                            {subject.className}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center text-[15px] font-medium text-black">
                            <Users className="w-4 h-4 mr-1.5 text-[#8E8E93]" />
                            {studentCount} คน
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold badge-success">
                            รับรองแล้ว
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setViewingSubjectId(subject.id)}
                            className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 transition-colors mr-2"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            ดูคะแนน
                          </button>
                          <button
                            onClick={() => handleUnverify(subject.id)}
                            className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] text-[#FF9500] bg-[#FF9500]/10 hover:bg-[#FF9500]/20 transition-colors mr-2"
                          >
                            <AlertCircle className="w-4 h-4 mr-1.5" />
                            ยกเลิกการรับรอง
                          </button>
                          <button
                            onClick={() => handleRejectToTeacher(subject.id)}
                            className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 transition-colors"
                          >
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            ตีกลับให้แก้ไข
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {verifiedSubjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93]">
                        <BookOpen className="w-16 h-16 text-[#8E8E93] mx-auto mb-4 opacity-50" />
                        <p className="text-[17px] font-semibold text-black">ไม่มีรายวิชาที่รับรองแล้ว</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <UserCog className="w-5 h-5 mr-2 text-[#00E5FF]" />
                จัดการผู้ใช้งานระบบ
              </h3>
              <p className="text-[13px] text-[#3C3C43] mt-1 font-medium">กำหนด Username, Password และสิทธิ์การเข้าถึง</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setImportType('users');
                  setIsImportingData(true);
                }}
                className="inline-flex items-center px-4 py-2 text-[15px] font-semibold rounded-[12px] text-white bg-gradient-to-r from-[#00E5FF] to-[#007AFF] hover:opacity-90 transition-all shadow-lg shadow-[#00E5FF]/20"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                นำเข้าข้อมูล (Excel)
              </button>
              <button 
                onClick={() => setIsAddingUser(true)}
                className="inline-flex items-center px-4 py-2 text-[15px] font-semibold rounded-[12px] text-[#1C1C1E] bg-[rgba(255,255,255,0.8)] hover:bg-white border border-[rgba(0,0,0,0.1)] transition-all"
              >
                + เพิ่มผู้ใช้งาน
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse glass-table">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชื่อ-สกุล</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">Username</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">Password</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">บทบาท</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ข้อมูลเพิ่มเติม</th>
                  <th scope="col" className="px-6 py-4 text-right text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const isLast = index === users.length - 1;
                  const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';
                  const isEditing = editingUserId === user.id;

                  return (
                    <tr key={user.id} className={`transition-colors ${isEditing ? 'bg-[#007AFF]/5' : 'hover:bg-[#F2F2F7]/50'} ${borderClass}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] font-medium text-black">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editUser.name || ''}
                            onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#8E8E93] font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editUser.username || ''}
                            onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#8E8E93] font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editUser.password || ''}
                            onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : user.password}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editUser.role || 'teacher'}
                            onChange={(e) => setEditUser({ ...editUser, role: e.target.value as any })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          >
                            <option value="admin">Admin</option>
                            <option value="executive">Executive</option>
                            <option value="teacher">Teacher</option>
                            <option value="parent">Parent</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium ${
                            user.role === 'admin' ? 'bg-[#AF52DE]/10 text-[#AF52DE]' :
                            user.role === 'teacher' ? 'bg-[#007AFF]/10 text-[#007AFF]' :
                            user.role === 'executive' ? 'bg-[#34C759]/10 text-[#34C759]' :
                            'bg-[#F2F2F7] text-[#8E8E93]'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#8E8E93]">
                        {isEditing && editUser.role === 'parent' ? (
                          <input
                            type="text"
                            placeholder="รหัสนักเรียน"
                            value={editUser.studentId || ''}
                            onChange={(e) => setEditUser({ ...editUser, studentId: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : (
                          user.role === 'parent' && user.studentId ? `รหัสนักเรียน: ${user.studentId}` : '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={saveEditUser} className="p-1.5 text-[#34C759] hover:bg-[#34C759]/10 rounded-lg transition-colors">
                              <Save className="w-5 h-5" />
                            </button>
                            <button onClick={cancelEditUser} className="p-1.5 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => startEditUser(user)} className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteUser(user.id)} className="p-1.5 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#FF00FF]" />
                จัดการนักเรียนและชั้นเรียน
              </h3>
              <p className="text-[13px] text-[#3C3C43] mt-1 font-medium">กำหนดชั้นเรียนและข้อมูลนักเรียน</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setImportType('students');
                  setIsImportingData(true);
                }}
                className="inline-flex items-center px-4 py-2 text-[15px] font-semibold rounded-[12px] text-white bg-gradient-to-r from-[#FF00FF] to-[#AF52DE] hover:opacity-90 transition-all shadow-lg shadow-[#FF00FF]/20"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                นำเข้าข้อมูล (Excel)
              </button>
              <button 
                onClick={() => setIsAddingStudent(true)}
                className="inline-flex items-center px-4 py-2 text-[15px] font-semibold rounded-[12px] text-[#1C1C1E] bg-[rgba(255,255,255,0.8)] hover:bg-white border border-[rgba(0,0,0,0.1)] transition-all"
              >
                + เพิ่มนักเรียน
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse glass-table">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">เลขประจำตัวประชาชน</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชื่อ-สกุล</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชั้นเรียน</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">วันเดือนปีเกิด (DDMMYY)</th>
                  <th scope="col" className="px-6 py-4 text-right text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const isLast = index === students.length - 1;
                  const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';
                  const isEditing = editingStudentId === student.id;

                  return (
                    <tr key={student.id} className={`transition-colors ${isEditing ? 'bg-[#007AFF]/5' : 'hover:bg-[#F2F2F7]/50'} ${borderClass}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#8E8E93] font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStudent.nationalId || ''}
                            onChange={(e) => setEditStudent({ ...editStudent, nationalId: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : student.nationalId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] font-medium text-black">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStudent.name || ''}
                            onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStudent.gradeLevel || ''}
                            onChange={(e) => setEditStudent({ ...editStudent, gradeLevel: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium bg-[#F2F2F7] text-[#8E8E93]">
                            {student.gradeLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#8E8E93] font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStudent.dob || ''}
                            onChange={(e) => setEditStudent({ ...editStudent, dob: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : student.dob}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={saveEditStudent} className="p-1.5 text-[#34C759] hover:bg-[#34C759]/10 rounded-lg transition-colors">
                              <Save className="w-5 h-5" />
                            </button>
                            <button onClick={cancelEditStudent} className="p-1.5 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => startEditStudent(student)} className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-colors">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteStudent(student.id)} className="p-1.5 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-[#00E5FF]" />
                จัดการรายวิชา
              </h3>
              <p className="text-[13px] text-[#3C3C43] mt-1 font-medium">กำหนดรายวิชา ครูผู้สอน และสัดส่วนคะแนนปลายภาค</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setImportType('subjects');
                  setIsImportingData(true);
                }}
                className="inline-flex items-center px-4 py-2 text-[15px] font-semibold rounded-[12px] text-white bg-gradient-to-r from-[#00E5FF] to-[#007AFF] hover:opacity-90 transition-all shadow-lg shadow-[#00E5FF]/20"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                นำเข้าข้อมูล (Excel)
              </button>
              <button 
                onClick={() => setIsAddingSubject(true)}
                className="inline-flex items-center px-4 py-2 text-[15px] font-semibold rounded-[12px] text-[#1C1C1E] bg-[rgba(255,255,255,0.8)] hover:bg-white border border-[rgba(0,0,0,0.1)] transition-all"
              >
                + เพิ่มรายวิชา
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse glass-table">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">รหัส/ชื่อวิชา</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชั้นเรียน</th>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ครูผู้สอน</th>
                  <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">คะแนนปลายภาค (T1/T2)</th>
                  <th scope="col" className="px-6 py-4 text-right text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => {
                  const teacher = users.find(u => u.id === subject.teacherId);
                  const isEditing = editingSubjectId === subject.id;
                  const isLast = index === subjects.length - 1;
                  const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';
                  
                  return (
                    <tr key={subject.id} className={`transition-colors ${isEditing ? 'bg-[#007AFF]/5' : 'hover:bg-[#F2F2F7]/50'} ${borderClass}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editSubject.name || ''}
                              onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
                              className="glow-input w-full py-1.5 px-3 text-[15px]"
                              placeholder="ชื่อวิชา"
                            />
                            <input
                              type="text"
                              value={editSubject.id || ''}
                              onChange={(e) => setEditSubject({ ...editSubject, id: e.target.value })}
                              className="glow-input w-full py-1.5 px-3 text-[13px] text-[#8E8E93] font-mono"
                              placeholder="รหัสวิชา"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-[15px] font-medium text-black">{subject.name}</div>
                            <div className="text-[13px] text-[#8E8E93] mt-0.5">รหัส: {subject.id}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editSubject.className || ''}
                            onChange={(e) => setEditSubject({ ...editSubject, className: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium bg-[#F2F2F7] text-[#8E8E93]">
                            {subject.className}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[15px] text-black">
                        {isEditing ? (
                          <select
                            value={editSubject.teacherId || ''}
                            onChange={(e) => setEditSubject({ ...editSubject, teacherId: e.target.value })}
                            className="glow-input w-full py-1.5 px-3 text-[15px]"
                          >
                            <option value="">เลือกครูผู้สอน</option>
                            {users.filter(u => u.role === 'teacher').map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        ) : (
                          teacher?.name || 'ไม่ระบุ'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="number"
                              value={editSubject.config?.sem1FinalMax || 0}
                              onChange={(e) => setEditSubject({
                                ...editSubject,
                                config: { ...editSubject.config!, sem1FinalMax: Number(e.target.value) }
                              })}
                              className="glow-input w-16 text-center py-1.5 text-[15px]"
                            />
                            <span className="text-[#8E8E93] font-bold">/</span>
                            <input
                              type="number"
                              value={editSubject.config?.sem2FinalMax || 0}
                              onChange={(e) => setEditSubject({
                                ...editSubject,
                                config: { ...editSubject.config!, sem2FinalMax: Number(e.target.value) }
                              })}
                              className="glow-input w-16 text-center py-1.5 text-[15px]"
                            />
                          </div>
                        ) : (
                          <span className="text-[15px] font-bold text-[#FF00FF] bg-[#FF00FF]/10 border border-[#FF00FF]/30 px-3 py-1.5 rounded-lg">
                            {subject.config.sem1FinalMax} / {subject.config.sem2FinalMax}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={saveEditSubject} className="text-[#34C759] hover:bg-[#34C759]/10 p-1.5 rounded-md transition-colors">
                              <Save className="w-5 h-5" />
                            </button>
                            <button onClick={cancelEditSubject} className="text-[#FF3B30] hover:bg-[#FF3B30]/10 p-1.5 rounded-md transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => startEditSubject(subject)} className="text-[#007AFF] hover:bg-[#007AFF]/10 p-1.5 rounded-md transition-colors">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteSubject(subject.id)} className="text-[#FF3B30] hover:bg-[#FF3B30]/10 p-1.5 rounded-md transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card p-6">
            <h3 className="text-[20px] font-bold text-black flex items-center mb-6">
              <TrendingUp className="w-6 h-6 mr-2 text-[#FF00FF]" />
              ภาพรวมผลการเรียนทั้งโรงเรียน
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {gradeLabels.map(grade => {
                const count = gradeStats['All'].grades[grade] || 0;
                const total = gradeStats['All'].total || 1; // Prevent division by zero
                const percentage = ((count / total) * 100).toFixed(1);
                
                let colorClass = 'from-[#FF3B30] to-[#FF453A]'; // Grade 0
                if (grade === '4' || grade === '3.5') colorClass = 'from-[#00E5FF] to-[#007AFF]';
                else if (grade === '3' || grade === '2.5') colorClass = 'from-[#34C759] to-[#28a745]';
                else if (grade === '2' || grade === '1.5') colorClass = 'from-[#FFD600] to-[#FF9500]';

                return (
                  <div key={`all-${grade}`} className="bg-white/60 backdrop-blur-md rounded-[16px] p-4 text-center border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[13px] font-semibold text-[#8E8E93] mb-1">เกรด {grade}</div>
                    <div className={`text-[24px] font-bold text-transparent bg-clip-text bg-gradient-to-r ${colorClass}`}>
                      {percentage}%
                    </div>
                    <div className="text-[12px] font-medium text-[#3C3C43] mt-1">{count} คน</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)]">
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-[#00E5FF]" />
                สถิติผลการเรียนแยกตามชั้นเรียน
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse glass-table">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชั้นเรียน</th>
                    <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จำนวนเกรดทั้งหมด</th>
                    {gradeLabels.map(grade => (
                      <th key={`th-${grade}`} scope="col" className="px-4 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">
                        เกรด {grade}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classesData.map((cls, index) => {
                    const stats = gradeStats[cls.className];
                    if (!stats || stats.total === 0) return null;
                    
                    const isLast = index === classesData.length - 1;
                    const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';

                    return (
                      <tr key={cls.className} className={`hover:bg-[#F2F2F7]/50 transition-colors ${borderClass}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[15px] font-bold text-black flex items-center">
                            <Layers className="w-4 h-4 mr-2 text-[#8E8E93]" />
                            {cls.className}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-[15px] font-medium text-[#3C3C43]">
                            {stats.total}
                          </div>
                        </td>
                        {gradeLabels.map(grade => {
                          const count = stats.grades[grade] || 0;
                          const percentage = ((count / stats.total) * 100).toFixed(1);
                          return (
                            <td key={`td-${cls.className}-${grade}`} className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="text-[15px] font-bold text-black">{percentage}%</div>
                              <div className="text-[12px] font-medium text-[#8E8E93]">{count} คน</div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)]">
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-[#AF52DE]" />
                สถิติผลการเรียนแยกตามรายวิชา
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse glass-table">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">รายวิชา</th>
                    <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จำนวนเกรดทั้งหมด</th>
                    {gradeLabels.map(grade => (
                      <th key={`th-subj-${grade}`} scope="col" className="px-4 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">
                        เกรด {grade}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, index) => {
                    const stats = gradeStats[`subject_${subject.id}`];
                    if (!stats || stats.total === 0) return null;
                    
                    const isLast = index === subjects.length - 1;
                    const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';

                    return (
                      <tr key={subject.id} className={`hover:bg-[#F2F2F7]/50 transition-colors ${borderClass}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[15px] font-bold text-black">
                            {subject.name}
                          </div>
                          <div className="text-[13px] text-[#8E8E93] mt-0.5">
                            {subject.className} | รหัส: {subject.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-[15px] font-medium text-[#3C3C43]">
                            {stats.total}
                          </div>
                        </td>
                        {gradeLabels.map(grade => {
                          const count = stats.grades[grade] || 0;
                          const percentage = ((count / stats.total) * 100).toFixed(1);
                          return (
                            <td key={`td-subj-${subject.id}-${grade}`} className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="text-[15px] font-bold text-black">{percentage}%</div>
                              <div className="text-[12px] font-medium text-[#8E8E93]">{count} คน</div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-black mb-4 flex items-center">
              <UserCog className="w-5 h-5 mr-2 text-[#00E5FF]" />
              เพิ่มผู้ใช้งานใหม่
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">ชื่อ-สกุล</label>
                <input 
                  type="text" 
                  className="glow-input w-full py-2 px-3 text-[15px]" 
                  value={newUser.name || ''} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})} 
                  placeholder="เช่น สมชาย ใจดี"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">Username</label>
                <input 
                  type="text" 
                  className="glow-input w-full py-2 px-3 text-[15px]" 
                  value={newUser.username || ''} 
                  onChange={e => setNewUser({...newUser, username: e.target.value})} 
                  placeholder="เช่น somchai"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">Password</label>
                <input 
                  type="text" 
                  className="glow-input w-full py-2 px-3 text-[15px]" 
                  value={newUser.password || ''} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  placeholder="รหัสผ่าน"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">บทบาท</label>
                <select 
                  className="glow-input w-full py-2 px-3 text-[15px] bg-white/50" 
                  value={newUser.role || 'teacher'} 
                  onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                >
                  <option value="teacher">ครูผู้สอน</option>
                  <option value="admin">ฝ่ายวิชาการ</option>
                  <option value="executive">ผู้บริหาร</option>
                  <option value="parent">ผู้ปกครอง</option>
                </select>
              </div>
              {newUser.role === 'parent' && (
                <div>
                  <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">รหัสนักเรียน (สำหรับผู้ปกครอง)</label>
                  <input 
                    type="text" 
                    className="glow-input w-full py-2 px-3 text-[15px]" 
                    value={newUser.studentId || ''} 
                    onChange={e => setNewUser({...newUser, studentId: e.target.value})} 
                    placeholder="เช่น 1111111111111"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddingUser(false)} 
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-[#3C3C43] bg-[rgba(255,255,255,0.5)] hover:bg-white border border-[rgba(0,0,0,0.1)] transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSaveNewUser} 
                className="px-5 py-2 rounded-[12px] text-[15px] font-semibold glow-button flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Grades Modal */}
      {viewingSubjectId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center bg-white/50 rounded-t-[24px]">
              <h3 className="text-[20px] font-bold text-black flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-[#007AFF]" />
                ตรวจสอบคะแนน: {subjects.find(s => s.id === viewingSubjectId)?.name}
              </h3>
              <button 
                onClick={() => setViewingSubjectId(null)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-6 h-6 text-[#3C3C43]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {viewingSubjectStats && viewingSubjectStats.total > 0 && (
                <div className="mb-6 bg-white/60 backdrop-blur-md rounded-[16px] p-4 border border-white/50 shadow-sm">
                  <h4 className="text-[15px] font-bold text-black mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1.5 text-[#FF00FF]" />
                    สรุปผลการเรียน (นักเรียนทั้งหมด {viewingSubjectStats.total} คน)
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {gradeLabels.map(grade => {
                      const count = viewingSubjectStats.stats[grade] || 0;
                      const percentage = ((count / viewingSubjectStats.total) * 100).toFixed(1);
                      return (
                        <div key={`modal-stat-${grade}`} className="text-center p-2 bg-white/40 rounded-lg">
                          <div className="text-[11px] font-semibold text-[#8E8E93]">เกรด {grade}</div>
                          <div className="text-[15px] font-bold text-black">{percentage}%</div>
                          <div className="text-[10px] font-medium text-[#3C3C43]">{count} คน</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <table className="min-w-full border-collapse glass-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">เลขประจำตัว</th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชื่อ-สกุล</th>
                    <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">เทอม 1</th>
                    <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">เทอม 2</th>
                    <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">เฉลี่ยรวม</th>
                    <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">เกรด</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.filter(g => g.subjectId === viewingSubjectId).map(grade => {
                    const student = students.find(s => s.id === grade.studentId);
                    const sem1Total = calculateSemesterTotal(grade.sem1);
                    const sem2Total = calculateSemesterTotal(grade.sem2);
                    const average = calculateAverage(sem1Total, sem2Total);
                    const finalGrade = calculateGrade(average);
                    
                    let gradeColor = 'text-[#FF00FF]';
                    if (Number(finalGrade) >= 3.5) gradeColor = 'text-[#00E5FF]';
                    else if (Number(finalGrade) >= 2.5) gradeColor = 'text-[#007AFF]';
                    else if (Number(finalGrade) >= 1.5) gradeColor = 'text-[#FFD600]';

                    return (
                      <tr key={grade.id} className="hover:bg-white/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-[15px] font-mono text-[#3C3C43]">{student?.nationalId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-[15px] font-medium text-black">{student?.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-[15px] font-medium text-[#3C3C43]">{sem1Total}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-[15px] font-medium text-[#3C3C43]">{sem2Total}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-[15px] font-bold text-black">{average.toFixed(1)}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-center text-[17px] font-bold ${gradeColor}`}>{finalGrade}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-[rgba(0,0,0,0.1)] bg-white/50 rounded-b-[24px] flex justify-end">
              <button 
                onClick={() => {
                  handleVerify(viewingSubjectId);
                  setViewingSubjectId(null);
                }}
                className="inline-flex items-center px-6 py-2.5 text-[15px] font-semibold rounded-[14px] glow-button"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                รับรองรายวิชานี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Data Import Portal Modal */}
      {isImportingData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center bg-white/50">
              <div>
                <h3 className="text-[22px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#007AFF] flex items-center">
                  <UploadCloud className="w-6 h-6 mr-2 text-[#007AFF]" />
                  {importType === 'users' ? 'User Data Import' : importType === 'students' ? 'Student Data Import' : 'Subject Data Import'}
                </h3>
                <p className="text-[13px] text-[#3C3C43] mt-0.5 font-medium">โรงเรียนบ้านตาโละ • Admin</p>
              </div>
              <button 
                onClick={() => {
                  setIsImportingData(false);
                  setImportStep('upload');
                  setSelectedFile(null);
                }}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-6 h-6 text-[#3C3C43]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-br from-[#E3F2FD]/50 to-[#FFF3E0]/50">
              {importStep === 'upload' ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div 
                    className={`w-full max-w-2xl border-2 border-dashed rounded-[24px] backdrop-blur-md p-12 text-center transition-all cursor-pointer group ${isDragging ? 'bg-white/90 border-[#00E5FF] scale-[1.02]' : 'bg-white/60 border-[#007AFF]/40 hover:bg-white/80 hover:border-[#007AFF]'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileInputChange} 
                      accept=".xlsx, .xls, .csv" 
                      className="hidden" 
                    />
                    <div className="w-20 h-20 bg-gradient-to-br from-[#34C759] to-[#28a745] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#34C759]/30 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-[20px] font-bold text-black mb-2">
                      {isDragging ? 'Drop file here' : 'Drag and drop Excel file here'}
                    </h4>
                    <p className="text-[15px] text-[#3C3C43] mb-6">or click to browse from your computer (.xlsx, .csv)</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAlertMessage('กำลังดาวน์โหลดเทมเพลต...');
                      }}
                      className="inline-flex items-center px-5 py-2.5 text-[15px] font-semibold rounded-[14px] text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 transition-colors"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-white/50 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.05)] flex justify-between items-center">
                    <div>
                      <h4 className="text-[17px] font-bold text-black">Data Validation Preview</h4>
                      {selectedFile && <p className="text-[13px] text-[#8E8E93] mt-0.5">File: {selectedFile.name}</p>}
                    </div>
                    <span className="text-[13px] font-medium text-[#3C3C43] bg-black/5 px-3 py-1 rounded-full">{parsedData.length} rows found</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-black/5">
                        <tr>
                          {importType === 'users' ? (
                            <>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Username</th>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Role</th>
                            </>
                          ) : importType === 'students' ? (
                            <>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Student ID</th>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Grade</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Subject ID</th>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Class</th>
                              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Teacher ID</th>
                            </>
                          )}
                          <th className="px-6 py-3 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
                        {parsedData.slice(0, 10).map((row, index) => {
                          let isValid = false;
                          if (importType === 'users') {
                            const name = row.Name || row.name || row['ชื่อ-สกุล'];
                            const username = row.Username || row.username;
                            isValid = !!(name && username);
                            
                            return (
                              <tr key={index} className={isValid ? "hover:bg-white/50 transition-colors" : "bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 transition-colors"}>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] font-medium text-black">{name || <span className="text-[#FF3B30] font-bold">Missing</span>}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] font-mono text-[#3C3C43]">{username || <span className="text-[#FF3B30] font-bold">Missing</span>}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#3C3C43]">{row.Role || row.role || 'teacher'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {isValid ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Valid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          } else if (importType === 'students') {
                            const nationalId = row.NationalId || row.nationalId || row['เลขประจำตัวประชาชน'] || row['Student ID'];
                            const name = row.Name || row.name || row['ชื่อ-สกุล'];
                            isValid = !!(nationalId && name);
                            
                            return (
                              <tr key={index} className={isValid ? "hover:bg-white/50 transition-colors" : "bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 transition-colors"}>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] font-mono text-[#3C3C43]">{nationalId || <span className="text-[#FF3B30] font-bold">Missing</span>}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] font-medium text-black">{name || <span className="text-[#FF3B30] font-bold">Missing</span>}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#3C3C43]">{row.Grade || row.grade || row.gradeLevel || row['ชั้นเรียน'] || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {isValid ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Valid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          } else {
                            const id = row.Id || row.id || row['รหัสวิชา'];
                            const name = row.Name || row.name || row['ชื่อวิชา'];
                            const className = row.ClassName || row.className || row['ชั้นเรียน'];
                            isValid = !!(name && className);
                            
                            return (
                              <tr key={index} className={isValid ? "hover:bg-white/50 transition-colors" : "bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 transition-colors"}>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] font-mono text-[#3C3C43]">{id || <span className="text-[#8E8E93] italic">Auto</span>}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] font-medium text-black">{name || <span className="text-[#FF3B30] font-bold">Missing</span>}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#3C3C43]">{className || <span className="text-[#FF3B30] font-bold">Missing</span>}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] text-[#3C3C43]">{row.TeacherId || row.teacherId || row['รหัสครูผู้สอน'] || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {isValid ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Valid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        })}
                        {parsedData.length > 10 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-[13px] text-[#8E8E93] font-medium">
                              And {parsedData.length - 10} more rows...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[rgba(0,0,0,0.1)] bg-white/50 flex justify-between items-center">
              {importStep === 'preview' ? (
                <button 
                  onClick={() => setImportStep('upload')}
                  className="px-5 py-2.5 rounded-[14px] text-[15px] font-semibold text-[#3C3C43] bg-[rgba(255,255,255,0.5)] hover:bg-white border border-[rgba(0,0,0,0.1)] transition-colors"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    setIsImportingData(false);
                    setImportStep('upload');
                    setSelectedFile(null);
                  }}
                  className="px-5 py-2.5 rounded-[14px] text-[15px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 rounded-[14px] text-[15px] font-semibold text-white bg-[#007AFF] shadow-lg shadow-[#007AFF]/30 transition-all hover:bg-[#0056b3]"
                >
                  Confirm & Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-black mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-[#FF00FF]" />
              เพิ่มนักเรียนใหม่
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1.5 uppercase tracking-wider">เลขประจำตัวประชาชน</label>
                <input
                  type="text"
                  value={newStudent.nationalId || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, nationalId: e.target.value })}
                  className="glow-input w-full py-2.5 px-4 text-[15px]"
                  placeholder="1100112233445"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1.5 uppercase tracking-wider">ชื่อ-สกุล</label>
                <input
                  type="text"
                  value={newStudent.name || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="glow-input w-full py-2.5 px-4 text-[15px]"
                  placeholder="ด.ช. สมชาย ใจดี"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1.5 uppercase tracking-wider">ชั้นเรียน</label>
                <input
                  type="text"
                  value={newStudent.gradeLevel || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, gradeLevel: e.target.value })}
                  className="glow-input w-full py-2.5 px-4 text-[15px]"
                  placeholder="ป.1"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1.5 uppercase tracking-wider">วันเดือนปีเกิด (DDMMYY)</label>
                <input
                  type="text"
                  value={newStudent.dob || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                  className="glow-input w-full py-2.5 px-4 text-[15px]"
                  placeholder="010150"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsAddingStudent(false);
                  setNewStudent({});
                }}
                className="px-5 py-2 rounded-[12px] text-[15px] font-semibold text-[#3C3C43] bg-[#E5E5EA] hover:bg-[#D1D1D6] transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSaveNewStudent} 
                className="px-5 py-2 rounded-[12px] text-[15px] font-semibold glow-button flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddingSubject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-black mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-[#00E5FF]" />
              เพิ่มรายวิชาใหม่
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">รหัสวิชา</label>
                <input 
                  type="text" 
                  className="glow-input w-full py-2 px-3 text-[15px]" 
                  value={newSubject.id || ''} 
                  onChange={e => setNewSubject({...newSubject, id: e.target.value})} 
                  placeholder="เช่น TH101"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">ชื่อวิชา</label>
                <input 
                  type="text" 
                  className="glow-input w-full py-2 px-3 text-[15px]" 
                  value={newSubject.name || ''} 
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})} 
                  placeholder="เช่น ภาษาไทย"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">ชั้นเรียน</label>
                <select 
                  className="glow-input w-full py-2 px-3 text-[15px] bg-white/50" 
                  value={newSubject.className || ''} 
                  onChange={e => setNewSubject({...newSubject, className: e.target.value})}
                >
                  <option value="" disabled>เลือกชั้นเรียน</option>
                  <option value="ป.1">ป.1</option>
                  <option value="ป.2">ป.2</option>
                  <option value="ป.3">ป.3</option>
                  <option value="ป.4">ป.4</option>
                  <option value="ป.5">ป.5</option>
                  <option value="ป.6">ป.6</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">ครูผู้สอน</label>
                <select 
                  className="glow-input w-full py-2 px-3 text-[15px] bg-white/50" 
                  value={newSubject.teacherId || ''} 
                  onChange={e => setNewSubject({...newSubject, teacherId: e.target.value})}
                >
                  <option value="" disabled>เลือกครูผู้สอน</option>
                  {users.filter(u => u.role === 'teacher').map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">คะแนนปลายภาค (เทอม 1)</label>
                  <input 
                    type="number" 
                    className="glow-input w-full py-2 px-3 text-[15px]" 
                    value={newSubject.config?.sem1FinalMax || 30} 
                    onChange={e => setNewSubject({...newSubject, config: { ...newSubject.config!, sem1FinalMax: Number(e.target.value) }})} 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[13px] font-semibold text-[#3C3C43] mb-1">คะแนนปลายภาค (เทอม 2)</label>
                  <input 
                    type="number" 
                    className="glow-input w-full py-2 px-3 text-[15px]" 
                    value={newSubject.config?.sem2FinalMax || 30} 
                    onChange={e => setNewSubject({...newSubject, config: { ...newSubject.config!, sem2FinalMax: Number(e.target.value) }})} 
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddingSubject(false)} 
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-[#3C3C43] bg-[rgba(255,255,255,0.5)] hover:bg-white border border-[rgba(0,0,0,0.1)] transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSaveNewSubject} 
                className="px-5 py-2 rounded-[12px] text-[15px] font-semibold glow-button flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-black mb-2 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-[#FF3B30]" />
              ยืนยันการลบ
            </h3>
            <p className="text-[15px] text-[#3C3C43] mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-[#3C3C43] bg-[#E5E5EA] hover:bg-[#D1D1D6] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'user') {
                    onUpdateUsers(users.filter(u => u.id !== deleteConfirm.id));
                  } else if (deleteConfirm.type === 'student') {
                    onUpdateStudents(students.filter(s => s.id !== deleteConfirm.id));
                  } else if (deleteConfirm.type === 'subject') {
                    onUpdateSubjects(subjects.filter(s => s.id !== deleteConfirm.id));
                  }
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-white bg-[#FF3B30] hover:bg-[#FF453A] transition-colors shadow-lg shadow-[#FF3B30]/30"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-black mb-2 flex items-center">
              {actionConfirm.type === 'unverify' ? (
                <AlertCircle className="w-6 h-6 mr-2 text-[#FF9500]" />
              ) : (
                <Edit2 className="w-6 h-6 mr-2 text-[#FF3B30]" />
              )}
              {actionConfirm.type === 'unverify' ? 'ยืนยันการยกเลิกการรับรอง' : 'ยืนยันการตีกลับให้แก้ไข'}
            </h3>
            <p className="text-[15px] text-[#3C3C43] mb-6">
              {actionConfirm.type === 'unverify' 
                ? 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการรับรองรายวิชานี้? สถานะจะกลับไปเป็น "รอการรับรองจากฝ่ายวิชาการ"' 
                : 'คุณแน่ใจหรือไม่ว่าต้องการตีกลับรายวิชานี้? สถานะจะกลับไปเป็น "รอครูผู้สอนส่งข้อมูล" และครูผู้สอนจะสามารถแก้ไขคะแนนได้'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActionConfirm(null)}
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-[#3C3C43] bg-[#E5E5EA] hover:bg-[#D1D1D6] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (actionConfirm.type === 'unverify') {
                    const updated = subjects.map(s => s.id === actionConfirm.id ? { ...s, status: 'Pending Admin Verification' as const } : s);
                    onUpdateSubjects(updated);
                    setAlertMessage('ยกเลิกการรับรองเรียบร้อยแล้ว');
                  } else if (actionConfirm.type === 'reject') {
                    const updated = subjects.map(s => s.id === actionConfirm.id ? { ...s, status: 'Rejected' as const } : s);
                    onUpdateSubjects(updated);
                    setAlertMessage('ตีกลับให้ครูผู้สอนแก้ไขเรียบร้อยแล้ว');
                  }
                  setActionConfirm(null);
                }}
                className={`px-4 py-2 rounded-[12px] text-[15px] font-semibold text-white transition-colors shadow-lg ${
                  actionConfirm.type === 'unverify' 
                    ? 'bg-[#FF9500] hover:bg-[#FF9500]/90 shadow-[#FF9500]/30' 
                    : 'bg-[#FF3B30] hover:bg-[#FF3B30]/90 shadow-[#FF3B30]/30'
                }`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Message Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-black mb-2 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-[#007AFF]" />
              แจ้งเตือน
            </h3>
            <p className="text-[15px] text-[#3C3C43] mb-6">
              {alertMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlertMessage(null)}
                className="px-5 py-2 rounded-[12px] text-[15px] font-semibold text-white bg-[#007AFF] hover:bg-[#0056b3] transition-colors shadow-lg shadow-[#007AFF]/30"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
