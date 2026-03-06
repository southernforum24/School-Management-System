import React, { useState, useMemo } from 'react';
import { GradeRecord, Subject, Student } from '../types';
import { Save, Send, CheckCircle, AlertCircle, Clock, BookOpen, Settings } from 'lucide-react';
import { calculateTotalAccum, calculateSemesterTotal, calculateAverage, calculateGrade } from '../utils';

interface TeacherDashboardProps {
  subjects: Subject[];
  students: Student[];
  grades: GradeRecord[];
  onUpdateGrades: (updatedGrades: GradeRecord[]) => void;
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
  teacherId: string;
}

export default function TeacherDashboard({ subjects, students, grades, onUpdateGrades, onUpdateSubjects, teacherId }: TeacherDashboardProps) {
  const teacherSubjects = useMemo(() => subjects.filter(s => s.teacherId === teacherId), [subjects, teacherId]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(teacherSubjects[0]?.id || '');
  const [selectedSemester, setSelectedSemester] = useState<'sem1' | 'sem2' | 'summary'>('sem1');
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  const selectedSubject = teacherSubjects.find(s => s.id === selectedSubjectId);
  const subjectGrades = grades.filter(g => g.subjectId === selectedSubjectId);

  const handleScoreChange = (gradeId: string, type: 'scores' | 'finalScore', index: number | null, value: string) => {
    if (selectedSemester === 'summary') return;
    const updatedGrades = grades.map(g => {
      if (g.id === gradeId) {
        const currentSem = { ...g[selectedSemester] };
        if (type === 'scores' && index !== null) {
          const newScores = [...currentSem.scores];
          newScores[index] = value;
          currentSem.scores = newScores;
        } else if (type === 'finalScore') {
          currentSem.finalScore = value;
        }
        return { ...g, [selectedSemester]: currentSem };
      }
      return g;
    });
    onUpdateGrades(updatedGrades);
  };

  const handleConfigChange = (type: 'maxScores' | 'finalMax', index: number | null, value: string) => {
    if (!selectedSubject || selectedSemester === 'summary') return;
    const configKey = selectedSemester === 'sem1' ? 'sem1MaxScores' : 'sem2MaxScores';
    const finalKey = selectedSemester === 'sem1' ? 'sem1FinalMax' : 'sem2FinalMax';
    
    const updatedConfig = { ...selectedSubject.config };
    if (type === 'maxScores' && index !== null) {
      const newMaxScores = [...updatedConfig[configKey]];
      newMaxScores[index] = value;
      updatedConfig[configKey] = newMaxScores;
    } else if (type === 'finalMax') {
      updatedConfig[finalKey] = Number(value) || 0;
    }

    const updatedSubjects = subjects.map(s => s.id === selectedSubjectId ? { ...s, config: updatedConfig } : s);
    onUpdateSubjects(updatedSubjects);
  };

  const handleSubmitToAdmin = () => {
    if (!selectedSubject) return;
    const updatedSubjects = subjects.map(s => s.id === selectedSubjectId ? { ...s, status: 'Pending Admin Verification' as const } : s);
    onUpdateSubjects(updatedSubjects);
    alert('ส่งข้อมูลให้ฝ่ายวิชาการรับรองเรียบร้อยแล้ว');
  };

  if (!selectedSubject) return <div>No subjects assigned.</div>;

  const currentConfig = selectedSemester === 'summary' ? [] : (selectedSemester === 'sem1' ? selectedSubject.config.sem1MaxScores : selectedSubject.config.sem2MaxScores);
  const currentFinalMax = selectedSemester === 'summary' ? 0 : (selectedSemester === 'sem1' ? selectedSubject.config.sem1FinalMax : selectedSubject.config.sem2FinalMax);
  const totalAccumMax = selectedSemester === 'summary' ? 0 : calculateTotalAccum(currentConfig);
  const totalMax = totalAccumMax + currentFinalMax;

  const isReadOnly = selectedSubject.status !== 'Draft' && selectedSubject.status !== 'Rejected';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[34px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#007AFF] tracking-tight">สำหรับครูผู้สอน</h2>
          <p className="text-[15px] text-[#3C3C43] mt-1 font-medium">บันทึกผลการเรียนและส่งฝ่ายวิชาการ</p>
        </div>
        
        {/* Segmented Control for Subjects */}
        <div className="segmented-control w-full overflow-x-auto">
          {teacherSubjects.map(subject => (
            <div
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
              className={`segmented-control-item whitespace-nowrap ${selectedSubjectId === subject.id ? 'active' : ''}`}
            >
              {subject.name}
            </div>
          ))}
        </div>

        {/* Segmented Control for Semesters */}
        <div className="segmented-control w-full sm:w-[400px]">
          <div
            onClick={() => setSelectedSemester('sem1')}
            className={`segmented-control-item ${selectedSemester === 'sem1' ? 'active' : ''}`}
          >
            เทอม 1
          </div>
          <div
            onClick={() => setSelectedSemester('sem2')}
            className={`segmented-control-item ${selectedSemester === 'sem2' ? 'active' : ''}`}
          >
            เทอม 2
          </div>
          <div
            onClick={() => setSelectedSemester('summary')}
            className={`segmented-control-item ${selectedSemester === 'summary' ? 'active' : ''}`}
          >
            สรุปผลทั้งปี
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-[#00E5FF] to-[#007AFF] text-white p-3 rounded-[16px] mr-4 shadow-lg shadow-[#00E5FF]/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[22px] font-bold text-black tracking-tight">{selectedSubject.name}</h3>
              <div className="flex items-center mt-1 space-x-2">
                <span className="text-[13px] font-semibold text-[#3C3C43] bg-[rgba(255,255,255,0.5)] border border-[rgba(255,255,255,0.3)] px-2.5 py-1 rounded-lg">ชั้น {selectedSubject.className}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold ${
                  selectedSubject.status === 'Verified' ? 'badge-success' :
                  selectedSubject.status === 'Pending Admin Verification' ? 'badge-warning' :
                  selectedSubject.status === 'Rejected' ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30' :
                  'badge-draft'
                }`}>
                  {selectedSubject.status === 'Verified' ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> :
                   selectedSubject.status === 'Pending Admin Verification' ? <Clock className="w-3.5 h-3.5 mr-1" /> :
                   selectedSubject.status === 'Rejected' ? <AlertCircle className="w-3.5 h-3.5 mr-1" /> :
                   <Save className="w-3.5 h-3.5 mr-1" />}
                  {selectedSubject.status === 'Draft' ? 'ฉบับร่าง' : 
                   selectedSubject.status === 'Pending Admin Verification' ? 'รอฝ่ายวิชาการรับรอง' : 
                   selectedSubject.status === 'Rejected' ? 'ถูกตีกลับให้แก้ไข' : 'รับรองแล้ว'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 w-full sm:w-auto">
            {selectedSemester !== 'summary' && (
              <button
                onClick={() => setIsEditingConfig(!isEditingConfig)}
                disabled={isReadOnly}
                className={`flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2.5 text-[15px] font-semibold rounded-[14px] transition-all ${
                  isEditingConfig ? 'bg-[#1C1C1E] text-white shadow-lg' : 'bg-[rgba(255,255,255,0.8)] text-[#1C1C1E] hover:bg-white border border-[rgba(0,0,0,0.1)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Settings className="w-4 h-4 mr-1.5" />
                ตั้งค่าคะแนน
              </button>
            )}
            <button
              onClick={handleSubmitToAdmin}
              disabled={isReadOnly}
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-5 py-2.5 text-[15px] font-semibold rounded-[14px] glow-button disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Send className="w-4 h-4 mr-1.5" />
              ส่งให้ฝ่ายวิชาการ
            </button>
          </div>
        </div>

        {selectedSubject.status === 'Rejected' && (
          <div className="bg-[#FF3B30]/10 border-b border-[#FF3B30]/20 px-6 py-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-[#FF3B30] mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[15px] font-bold text-[#FF3B30]">รายวิชานี้ถูกตีกลับให้แก้ไข</h4>
              <p className="text-[13px] text-[#FF3B30]/80 mt-0.5">กรุณาตรวจสอบและแก้ไขคะแนนให้ถูกต้อง จากนั้นกดปุ่ม "ส่งให้ฝ่ายวิชาการ" อีกครั้ง</p>
            </div>
          </div>
        )}

        {isEditingConfig && !isReadOnly && selectedSemester !== 'summary' && (
          <div className="bg-[rgba(255,255,255,0.3)] p-6 border-b border-[rgba(0,0,0,0.1)]">
            <h4 className="text-[15px] font-semibold text-black mb-4 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-[#FF00FF]" />
              กำหนดคะแนนเต็ม (เทอม {selectedSemester === 'sem1' ? '1' : '2'})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-3 items-end">
              {currentConfig.map((max, idx) => (
                <div key={idx}>
                  <label className="block text-[12px] font-semibold text-[#3C3C43] mb-1 text-center">ช่อง {idx + 1}</label>
                  <input
                    type="number"
                    value={max}
                    onChange={(e) => handleConfigChange('maxScores', idx, e.target.value)}
                    className="glow-input w-full text-center py-2 px-2 text-[15px]"
                    placeholder="-"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[12px] font-semibold text-[#FF00FF] mb-1 text-center">ปลายภาค</label>
                <input
                  type="number"
                  value={currentFinalMax}
                  disabled
                  className="glow-input w-full text-center py-2 px-2 text-[15px] bg-[#FF00FF]/5 text-[#FF00FF] border-[#FF00FF]/30 font-semibold cursor-not-allowed"
                  title="กำหนดโดยฝ่ายวิชาการ"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between bg-[rgba(255,255,255,0.7)] backdrop-blur-md p-4 rounded-[16px] border border-[rgba(255,255,255,0.5)] shadow-sm">
              <div className="flex space-x-8">
                <div>
                  <span className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider block">รวมคะแนนเก็บ</span>
                  <span className="text-[22px] font-bold text-black">{totalAccumMax}</span>
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider block">ปลายภาค</span>
                  <span className="text-[22px] font-bold text-[#FF00FF]">{currentFinalMax}</span>
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider block">คะแนนรวมทั้งหมด</span>
                  <span className={`text-[22px] font-bold ${totalMax === 100 ? 'text-[#00E5FF]' : 'text-[#FFD600]'}`}>
                    {totalMax} / 100
                  </span>
                </div>
              </div>
              {totalMax !== 100 && (
                <div className="flex items-center text-[#FFD600] text-[13px] font-semibold bg-[#FFD600]/10 border border-[#FFD600]/30 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  คะแนนรวมควรเท่ากับ 100
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse glass-table">
            <thead>
              {selectedSemester !== 'summary' ? (
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider sticky left-0 z-10 border-r border-[rgba(0,0,0,0.05)] border-b border-[rgba(0,0,0,0.1)]">นักเรียน</th>
                  {[...Array(8)].map((_, i) => (
                    <th key={i} scope="col" className="px-2 py-4 text-center text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider border-b border-[rgba(0,0,0,0.1)]">
                      เก็บ {i + 1}<br/>
                      <span className="text-[10px] text-[#8E8E93]">({currentConfig[i] || '-'})</span>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-4 text-center text-[12px] font-bold text-black uppercase tracking-wider bg-[rgba(0,229,255,0.05)] border-b border-[rgba(0,0,0,0.1)]">
                    รวมเก็บ<br/>
                    <span className="text-[10px] text-[#00E5FF]">({totalAccumMax})</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-[12px] font-bold text-[#FF00FF] uppercase tracking-wider bg-[rgba(255,0,255,0.05)] border-b border-[rgba(0,0,0,0.1)]">
                    ปลายภาค<br/>
                    <span className="text-[10px] text-[#FF00FF]/70">({currentFinalMax})</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-[12px] font-bold text-[#00E5FF] uppercase tracking-wider bg-[rgba(0,229,255,0.1)] border-b border-[rgba(0,0,0,0.1)]">
                    รวม<br/>
                    <span className="text-[10px] text-[#00E5FF]/70">(100)</span>
                  </th>
                </tr>
              ) : (
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[12px] font-semibold text-[#3C3C43] uppercase tracking-wider sticky left-0 z-10 border-r border-[rgba(0,0,0,0.05)] border-b border-[rgba(0,0,0,0.1)]">นักเรียน</th>
                  <th scope="col" className="px-6 py-4 text-center text-[12px] font-bold text-black uppercase tracking-wider bg-[rgba(255,255,255,0.5)] border-b border-[rgba(0,0,0,0.1)]">
                    รวมเทอม 1<br/>
                    <span className="text-[10px] text-[#8E8E93]">(100)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-[12px] font-bold text-black uppercase tracking-wider bg-[rgba(255,255,255,0.5)] border-b border-[rgba(0,0,0,0.1)]">
                    รวมเทอม 2<br/>
                    <span className="text-[10px] text-[#8E8E93]">(100)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-[12px] font-bold text-black uppercase tracking-wider bg-[rgba(0,229,255,0.05)] border-b border-[rgba(0,0,0,0.1)]">
                    เฉลี่ยรวม<br/>
                    <span className="text-[10px] text-[#00E5FF]">(100)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-[12px] font-bold text-[#FF00FF] uppercase tracking-wider bg-[rgba(255,0,255,0.05)] border-b border-[rgba(0,0,0,0.1)]">
                    ระดับผลการเรียน<br/>
                    <span className="text-[10px] text-[#FF00FF]/70">(8 เกรด)</span>
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {subjectGrades.map((grade, index) => {
                const student = students.find(s => s.id === grade.studentId);
                
                if (selectedSemester !== 'summary') {
                  const currentSem = grade[selectedSemester];
                  const totalAccum = calculateTotalAccum(currentSem.scores);
                  const total = calculateSemesterTotal(currentSem);
                  
                  return (
                    <tr key={grade.id} className="transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap sticky left-0 bg-[rgba(255,255,255,0.8)] backdrop-blur-md z-10 border-r border-[rgba(0,0,0,0.05)]">
                        <div className="text-[15px] font-semibold text-black">{student?.name}</div>
                        <div className="text-[12px] text-[#8E8E93] mt-0.5">{student?.nationalId}</div>
                      </td>
                      {[...Array(8)].map((_, i) => (
                        <td key={i} className="px-1 py-3 whitespace-nowrap text-center">
                          <input
                            type="number"
                            value={currentSem.scores[i] || ''}
                            onChange={(e) => handleScoreChange(grade.id, 'scores', i, e.target.value)}
                            disabled={isReadOnly || !currentConfig[i]}
                            className="w-12 text-center border border-[rgba(0,0,0,0.1)] rounded-[10px] focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent text-[15px] py-1.5 disabled:bg-[rgba(0,0,0,0.05)] disabled:text-[#8E8E93] transition-all bg-[rgba(255,255,255,0.5)]"
                            placeholder="-"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-center bg-[rgba(0,229,255,0.02)]">
                        <div className="text-[16px] font-bold text-black">{totalAccum}</div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center bg-[rgba(255,0,255,0.02)]">
                        <input
                          type="number"
                          value={currentSem.finalScore || ''}
                          onChange={(e) => handleScoreChange(grade.id, 'finalScore', null, e.target.value)}
                          disabled={isReadOnly}
                          className="w-14 text-center border border-[#FF00FF]/30 rounded-[10px] focus:ring-2 focus:ring-[#FF00FF] focus:border-transparent text-[15px] py-1.5 font-bold text-[#FF00FF] disabled:bg-[#FF00FF]/5 transition-all bg-[rgba(255,255,255,0.5)]"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center bg-[rgba(0,229,255,0.05)]">
                        <div className="text-[16px] font-bold text-[#00E5FF]">{total}</div>
                      </td>
                    </tr>
                  );
                } else {
                  // Summary View
                  const sem1Total = calculateSemesterTotal(grade.sem1);
                  const sem2Total = calculateSemesterTotal(grade.sem2);
                  const average = calculateAverage(sem1Total, sem2Total);
                  const finalGrade = calculateGrade(average);

                  return (
                    <tr key={grade.id} className="transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-[rgba(255,255,255,0.8)] backdrop-blur-md z-10 border-r border-[rgba(0,0,0,0.05)]">
                        <div className="text-[15px] font-semibold text-black">{student?.name}</div>
                        <div className="text-[12px] text-[#8E8E93] mt-0.5">{student?.nationalId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center bg-[rgba(255,255,255,0.2)]">
                        <div className="text-[16px] font-bold text-black">{sem1Total}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center bg-[rgba(255,255,255,0.2)]">
                        <div className="text-[16px] font-bold text-black">{sem2Total}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center bg-[rgba(0,229,255,0.02)]">
                        <div className="text-[18px] font-bold text-black">{average.toFixed(1)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center bg-[rgba(255,0,255,0.02)]">
                        <div className={`text-[18px] font-bold py-1.5 px-4 rounded-[12px] inline-block ${
                          Number(finalGrade) >= 3.5 ? 'badge-success' :
                          Number(finalGrade) >= 2.5 ? 'bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/30 shadow-[0_0_10px_rgba(0,122,255,0.2)]' :
                          Number(finalGrade) >= 1.5 ? 'badge-draft' :
                          'badge-warning'
                        }`}>
                          {finalGrade}
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
