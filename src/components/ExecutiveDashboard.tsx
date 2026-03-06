import React, { useMemo, useState } from 'react';
import { Subject, Student, GradeRecord } from '../types';
import { CheckCircle, AlertCircle, ShieldCheck, Users, Layers, BarChart3, TrendingUp, BookOpen, X } from 'lucide-react';
import { calculateSemesterTotal, calculateAverage, calculateGrade } from '../utils';

interface ExecutiveDashboardProps {
  subjects: Subject[];
  students: Student[];
  grades: GradeRecord[];
  approvedClasses: string[];
  onApproveClass: (className: string) => void;
  onRejectClass: (className: string) => void;
}

export default function ExecutiveDashboard({ subjects, students, grades, approvedClasses, onApproveClass, onRejectClass }: ExecutiveDashboardProps) {
  const [activeTab, setActiveTab] = useState<'approve' | 'stats'>('approve');
  const [viewingClass, setViewingClass] = useState<string | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null);

  // Group subjects by class
  const classesData = useMemo(() => {
    const classMap = new Map<string, { totalSubjects: number, verifiedSubjects: number, studentCount: number }>();
    
    subjects.forEach(subject => {
      const cls = subject.className;
      if (!classMap.has(cls)) {
        classMap.set(cls, { totalSubjects: 0, verifiedSubjects: 0, studentCount: 0 });
      }
      const data = classMap.get(cls)!;
      data.totalSubjects++;
      if (subject.status === 'Verified') {
        data.verifiedSubjects++;
      }
    });

    // Calculate unique students per class
    students.forEach(student => {
      const cls = student.gradeLevel;
      if (classMap.has(cls)) {
        classMap.get(cls)!.studentCount++;
      }
    });

    return Array.from(classMap.entries()).map(([className, data]) => ({
      className,
      ...data,
      isReadyForApproval: data.totalSubjects > 0 && data.totalSubjects === data.verifiedSubjects,
      isApproved: approvedClasses.includes(className)
    }));
  }, [subjects, students, approvedClasses]);

  const pendingClasses = classesData.filter(c => c.isReadyForApproval && !c.isApproved);
  const approvedClassesList = classesData.filter(c => c.isApproved);

  const handleApproveAll = () => {
    pendingClasses.forEach(c => onApproveClass(c.className));
    alert('อนุมัติผลการเรียนทุกชั้นเรียบร้อยแล้ว');
  };

  // Calculate Grade Statistics
  const gradeStats = useMemo(() => {
    const stats: Record<string, { total: number, grades: Record<string, number> }> = {
      'All': { total: 0, grades: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 } }
    };

    // Initialize classes
    classesData.forEach(c => {
      stats[c.className] = { total: 0, grades: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 } };
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
    });

    return stats;
  }, [grades, subjects, classesData]);

  const subjectStats = useMemo(() => {
    const stats: Record<string, { total: number, grades: Record<string, number>, name: string, className: string }> = {};

    subjects.forEach(s => {
      stats[s.id] = { total: 0, grades: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 }, name: s.name, className: s.className };
    });

    grades.forEach(grade => {
      const subject = subjects.find(s => s.id === grade.subjectId);
      if (!subject) return;

      const sem1Total = calculateSemesterTotal(grade.sem1);
      const sem2Total = calculateSemesterTotal(grade.sem2);
      const average = calculateAverage(sem1Total, sem2Total);
      const finalGrade = calculateGrade(average);

      if (stats[subject.id]) {
        stats[subject.id].total++;
        if (stats[subject.id].grades[finalGrade] !== undefined) {
          stats[subject.id].grades[finalGrade]++;
        }
      }
    });

    return Object.values(stats).sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));
  }, [grades, subjects]);

  const gradeLabels = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[34px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD600] to-[#FF9500] tracking-tight">สำหรับผู้บริหาร</h2>
          <p className="text-[15px] text-[#3C3C43] mt-1 font-medium">อนุมัติและสรุปผลการเรียนภาพรวม</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="segmented-control flex p-1 bg-[rgba(0,0,0,0.05)] rounded-[14px] backdrop-blur-md">
            <button
              onClick={() => setActiveTab('approve')}
              className={`flex-1 sm:flex-none px-6 py-2 text-[15px] font-semibold rounded-[10px] transition-all duration-300 ${
                activeTab === 'approve' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              อนุมัติผลการเรียน
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 sm:flex-none px-6 py-2 text-[15px] font-semibold rounded-[10px] transition-all duration-300 ${
                activeTab === 'stats' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              สถิติผลการเรียน
            </button>
          </div>

          {activeTab === 'approve' && pendingClasses.length > 0 && (
            <button
              onClick={handleApproveAll}
              className="inline-flex items-center justify-center px-5 py-2.5 text-[15px] font-semibold rounded-[14px] glow-button"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              อนุมัติทุกชั้น
            </button>
          )}
        </div>
      </div>

      {activeTab === 'approve' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 flex items-center">
          <div className="bg-gradient-to-br from-[#FFD600] to-[#FF9500] p-3 rounded-[16px] mr-4 text-white shadow-lg shadow-[#FFD600]/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">รออนุมัติ</p>
            <p className="text-[28px] font-bold text-black">{pendingClasses.length} <span className="text-[17px] font-medium text-[#3C3C43]">ชั้น</span></p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center">
          <div className="bg-gradient-to-br from-[#00E5FF] to-[#007AFF] p-3 rounded-[16px] mr-4 text-white shadow-lg shadow-[#00E5FF]/20">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">อนุมัติแล้ว</p>
            <p className="text-[28px] font-bold text-black">{approvedClassesList.length} <span className="text-[17px] font-medium text-[#3C3C43]">ชั้น</span></p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center">
          <div className="bg-gradient-to-br from-[#FF00FF] to-[#AF52DE] p-3 rounded-[16px] mr-4 text-white shadow-lg shadow-[#FF00FF]/20">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider">ชั้นเรียนทั้งหมด</p>
            <p className="text-[28px] font-bold text-black">{classesData.length} <span className="text-[17px] font-medium text-[#3C3C43]">ชั้น</span></p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center">
          <h3 className="text-[17px] font-bold text-black flex items-center">
            <span className="bg-[#FFD600]/10 text-[#FFD600] p-1.5 rounded-lg mr-2 border border-[#FFD600]/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
            ชั้นเรียนที่รอการอนุมัติ ({pendingClasses.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse glass-table">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชั้นเรียน</th>
                <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จำนวนวิชา</th>
                <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จำนวนนักเรียน</th>
                <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">สถานะ</th>
                <th scope="col" className="px-6 py-4 text-right text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pendingClasses.map((cls, index) => {
                const isLast = index === pendingClasses.length - 1;
                const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';
                
                return (
                  <tr key={cls.className} className={`hover:bg-[#F2F2F7]/50 transition-colors ${borderClass}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[17px] font-semibold text-black flex items-center">
                        <Layers className="w-5 h-5 mr-2 text-[#8E8E93]" />
                        {cls.className}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-[15px] font-medium text-black">
                        {cls.verifiedSubjects} / {cls.totalSubjects} วิชา
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center text-[15px] font-medium text-black">
                        <Users className="w-4 h-4 mr-1.5 text-[#8E8E93]" />
                        {cls.studentCount} คน
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold badge-warning">
                        รออนุมัติ
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => setViewingClass(cls.className)}
                        className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 mr-1.5" />
                        ดูรายละเอียด
                      </button>
                      <button
                        onClick={() => setRejectConfirm(cls.className)}
                        className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 mr-1.5" />
                        ตีกลับ
                      </button>
                      <button
                        onClick={() => onApproveClass(cls.className)}
                        className="inline-flex items-center px-4 py-2 text-[13px] font-semibold rounded-[12px] glow-button"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        อนุมัติรายชั้น
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pendingClasses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93]">
                    <ShieldCheck className="w-16 h-16 text-[#34C759] mx-auto mb-4 opacity-50" />
                    <p className="text-[17px] font-semibold text-black">ไม่มีชั้นเรียนที่รออนุมัติ</p>
                    <p className="text-[15px] mt-1">ชั้นเรียนทั้งหมดได้รับการอนุมัติเรียบร้อยแล้ว หรือยังไม่มีชั้นเรียนที่ฝ่ายวิชาการรับรองครบทุกวิชา</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
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

          <div className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)]">
              <h3 className="text-[17px] font-bold text-black flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-[#FFD600]" />
                สถิติผลการเรียนแยกตามรายวิชา
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse glass-table">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">รายวิชา</th>
                    <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">ชั้นเรียน</th>
                    <th scope="col" className="px-6 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">จำนวนเกรดทั้งหมด</th>
                    {gradeLabels.map(grade => (
                      <th key={`th-subj-${grade}`} scope="col" className="px-4 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">
                        เกรด {grade}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjectStats.map((stats, index) => {
                    if (stats.total === 0) return null;
                    
                    const isLast = index === subjectStats.length - 1;
                    const borderClass = isLast ? '' : 'border-b border-[#E5E5EA]';

                    return (
                      <tr key={`${stats.name}-${stats.className}`} className={`hover:bg-[#F2F2F7]/50 transition-colors ${borderClass}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[15px] font-bold text-black">{stats.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[13px] font-medium text-[#8E8E93]">{stats.className}</div>
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
                            <td key={`td-subj-${stats.name}-${grade}`} className="px-4 py-4 whitespace-nowrap text-center">
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
      {/* Class Details Modal */}
      {viewingClass && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-3xl p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-black flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-[#007AFF]" />
                รายละเอียดผลการเรียน: ชั้น {viewingClass}
              </h3>
              <button onClick={() => setViewingClass(null)} className="text-[#8E8E93] hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {gradeStats[viewingClass] ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {gradeLabels.map(grade => {
                    const count = gradeStats[viewingClass].grades[grade] || 0;
                    const total = gradeStats[viewingClass].total || 1;
                    const percentage = ((count / total) * 100).toFixed(1);
                    
                    let colorClass = 'from-[#FF3B30] to-[#FF453A]';
                    if (grade === '4' || grade === '3.5') colorClass = 'from-[#00E5FF] to-[#007AFF]';
                    else if (grade === '3' || grade === '2.5') colorClass = 'from-[#34C759] to-[#28a745]';
                    else if (grade === '2' || grade === '1.5') colorClass = 'from-[#FFD600] to-[#FF9500]';

                    return (
                      <div key={`modal-${grade}`} className="bg-white/60 backdrop-blur-md rounded-[16px] p-4 text-center border border-white/50 shadow-sm">
                        <div className="text-[13px] font-semibold text-[#8E8E93] mb-1">เกรด {grade}</div>
                        <div className={`text-[24px] font-bold text-transparent bg-clip-text bg-gradient-to-r ${colorClass}`}>
                          {percentage}%
                        </div>
                        <div className="text-[12px] font-medium text-[#3C3C43] mt-1">{count} คน</div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6">
                  <h4 className="text-[15px] font-bold text-black mb-3">รายวิชาในชั้นเรียนนี้</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse glass-table">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#3C3C43] uppercase border-b border-[rgba(0,0,0,0.1)]">รายวิชา</th>
                          <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#3C3C43] uppercase border-b border-[rgba(0,0,0,0.1)]">จำนวนเกรด</th>
                          <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#3C3C43] uppercase border-b border-[rgba(0,0,0,0.1)]">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.filter(s => s.className === viewingClass).map(subject => {
                          const stats = subjectStats.find(s => s.name === subject.name && s.className === subject.className);
                          return (
                            <tr key={subject.id} className="border-b border-[#E5E5EA] hover:bg-[#F2F2F7]/50">
                              <td className="px-4 py-3 text-[14px] font-semibold text-black">{subject.name}</td>
                              <td className="px-4 py-3 text-center text-[14px] text-[#3C3C43]">{stats?.total || 0}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-[12px] font-semibold badge-success">
                                  <CheckCircle className="w-3 h-3 mr-1" /> รับรองแล้ว
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-[#8E8E93] py-8">ไม่มีข้อมูลผลการเรียน</p>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setViewingClass(null)}
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-[#3C3C43] bg-[#E5E5EA] hover:bg-[#D1D1D6] transition-colors"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  setRejectConfirm(viewingClass);
                  setViewingClass(null);
                }}
                className="inline-flex items-center px-5 py-2 text-[15px] font-semibold rounded-[12px] text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 transition-colors"
              >
                <AlertCircle className="w-4 h-4 mr-1.5" />
                ตีกลับให้แก้ไข
              </button>
              <button
                onClick={() => {
                  onApproveClass(viewingClass);
                  setViewingClass(null);
                }}
                className="inline-flex items-center px-5 py-2 text-[15px] font-semibold rounded-[12px] glow-button"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                อนุมัติชั้นเรียนนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-black mb-2 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-[#FF3B30]" />
              ยืนยันการตีกลับ
            </h3>
            <p className="text-[15px] text-[#3C3C43] mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการตีกลับผลการเรียนของชั้น {rejectConfirm}? สถานะของทุกรายวิชาในชั้นนี้จะกลับไปเป็น "ถูกตีกลับให้แก้ไข" เพื่อให้ครูผู้สอนดำเนินการแก้ไข
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRejectConfirm(null)}
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-[#3C3C43] bg-[#E5E5EA] hover:bg-[#D1D1D6] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onRejectClass(rejectConfirm);
                  setRejectConfirm(null);
                  alert('ตีกลับให้ครูผู้สอนแก้ไขเรียบร้อยแล้ว');
                }}
                className="px-4 py-2 rounded-[12px] text-[15px] font-semibold text-white bg-[#FF3B30] hover:bg-[#FF3B30]/90 transition-colors shadow-lg shadow-[#FF3B30]/30"
              >
                ยืนยันการตีกลับ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
