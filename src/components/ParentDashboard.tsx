import React, { useMemo } from 'react';
import { GradeRecord, Subject, Student } from '../types';
import { BookOpen, Award, TrendingUp, AlertCircle, Printer, Download, User, ChevronRight } from 'lucide-react';
import { calculateTotalAccum, calculateSemesterTotal, calculateAverage, calculateGrade } from '../utils';

interface ParentDashboardProps {
  subjects: Subject[];
  students: Student[];
  grades: GradeRecord[];
  approvedClasses: string[];
  studentId: string;
}

const CircularProgress = ({ value, max, colorClass, textClass, label }: { value: number | string, max: number, colorClass: string, textClass: string, label: string }) => {
  const numValue = Number(value) || 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numValue / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center w-16 h-16 mb-1">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-[#E5E5EA]"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute text-[15px] font-semibold ${textClass}`}>
          {value}
        </div>
      </div>
      <span className="text-[11px] font-medium text-[#8E8E93]">{label}</span>
    </div>
  );
};

export default function ParentDashboard({ subjects, students, grades, approvedClasses, studentId }: ParentDashboardProps) {
  const selectedStudent = students.find(s => s.id === studentId);

  const isClassApproved = useMemo(() => {
    if (!selectedStudent) return false;
    return approvedClasses.includes(selectedStudent.gradeLevel);
  }, [approvedClasses, selectedStudent]);

  const studentGrades = useMemo(() => {
    if (!isClassApproved) return [];
    return grades.filter(g => g.studentId === studentId);
  }, [grades, studentId, isClassApproved]);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-report');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>รายงานผลการเรียน - ${selectedStudent?.name || ''}</title>
              <style>
                body { font-family: 'Sarabun', sans-serif; padding: 40px; color: black; }
                h1, h2 { text-align: center; margin: 0 0 10px 0; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th, td { border: 1px solid black; padding: 8px; text-align: center; }
                th { background-color: #f3f4f6; }
                .text-left { text-align: left; }
                .font-bold { font-weight: bold; }
                .signatures { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; text-align: center; gap: 40px; }
                .sig-line { margin-bottom: 40px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        window.print();
      }
    } else {
      window.print();
    }
  };

  if (!selectedStudent) return <div>Student not found.</div>;

  return (
    <div className="space-y-6 max-w-md mx-auto sm:max-w-3xl pb-24">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-0 print:hidden">
        <div>
          <h2 className="text-[34px] font-bold text-black tracking-tight leading-tight">ผลการเรียน</h2>
          <p className="text-[15px] text-[#8E8E93] mt-1">ปีการศึกษา 2568</p>
        </div>
        
        {isClassApproved && (
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 bg-[#F2F2F7] text-[#007AFF] text-[15px] font-medium rounded-full hover:bg-[#E5E5EA] transition-colors"
          >
            <Printer className="w-5 h-5 mr-1.5" />
            พิมพ์รายงาน
          </button>
        )}
      </div>

      {/* Student Profile Card */}
      <div className="mx-4 sm:mx-0 glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 print:hidden">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#007AFF] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#00E5FF]/20 flex-shrink-0">
          {selectedStudent.name.charAt(0)}
        </div>
        <div className="flex-1 w-full">
          <h3 className="text-[20px] font-bold text-black mb-3">{selectedStudent.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
            <div className="flex items-center text-[14px] text-[#3C3C43]">
              <span className="font-semibold w-24 text-[#8E8E93]">รหัสนักเรียน:</span>
              <span className="font-medium">{selectedStudent.id}</span>
            </div>
            <div className="flex items-center text-[14px] text-[#3C3C43]">
              <span className="font-semibold w-24 text-[#8E8E93]">ชั้นเรียน:</span>
              <span className="font-medium">{selectedStudent.gradeLevel}</span>
            </div>
            <div className="flex items-center text-[14px] text-[#3C3C43]">
              <span className="font-semibold w-24 text-[#8E8E93]">เลขบัตร ปชช:</span>
              <span className="font-medium">{selectedStudent.nationalId}</span>
            </div>
            <div className="flex items-center text-[14px] text-[#3C3C43]">
              <span className="font-semibold w-24 text-[#8E8E93]">วันเกิด:</span>
              <span className="font-medium">{new Date(selectedStudent.dob).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {!isClassApproved ? (
        <div className="mx-4 sm:mx-0 glass-card p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FFD600] to-[#FF9500] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FFD600]/20">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-[20px] font-bold text-black mb-2">รอการอนุมัติ</h3>
          <p className="text-[15px] text-[#3C3C43] leading-relaxed font-medium">
            ผลการเรียนของชั้น {selectedStudent.gradeLevel} ยังไม่ได้รับการอนุมัติจากผู้บริหาร<br/>
            กรุณาตรวจสอบอีกครั้งในภายหลัง
          </p>
        </div>
      ) : (
        <>
          {/* Grades List (Mobile View) */}
          <div className="mx-4 sm:mx-0 space-y-4 print:hidden">
            {studentGrades.map((grade) => {
              const subject = subjects.find(s => s.id === grade.subjectId);
              
              const sem1Accum = calculateTotalAccum(grade.sem1.scores);
              const sem1Final = Number(grade.sem1.finalScore) || 0;
              const sem1Total = sem1Accum + sem1Final;

              const sem2Accum = calculateTotalAccum(grade.sem2.scores);
              const sem2Final = Number(grade.sem2.finalScore) || 0;
              const sem2Total = sem2Accum + sem2Final;

              const average = calculateAverage(sem1Total, sem2Total);
              const finalGrade = calculateGrade(average);

              let gradeColor = 'text-[#FF00FF]';
              let ringColor = 'text-[#FF00FF]';
              if (Number(finalGrade) >= 3.5) {
                gradeColor = 'text-[#00E5FF]';
                ringColor = 'text-[#00E5FF]';
              } else if (Number(finalGrade) >= 2.5) {
                gradeColor = 'text-[#007AFF]';
                ringColor = 'text-[#007AFF]';
              } else if (Number(finalGrade) >= 1.5) {
                gradeColor = 'text-[#FFD600]';
                ringColor = 'text-[#FFD600]';
              }

              return (
                <div key={grade.id} className="glass-card p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[17px] font-bold text-black">{subject?.name}</h4>
                      <p className="text-[13px] text-[#3C3C43] mt-0.5 font-medium">{subject?.id}</p>
                    </div>
                    <div className={`text-[24px] font-bold ${gradeColor}`}>
                      {finalGrade}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-[rgba(0,0,0,0.1)]">
                    <CircularProgress 
                      value={sem1Total} 
                      max={100} 
                      colorClass="text-[#007AFF]" 
                      textClass="text-[#007AFF]" 
                      label="เทอม 1" 
                    />
                    <CircularProgress 
                      value={sem2Total} 
                      max={100} 
                      colorClass="text-[#FF00FF]" 
                      textClass="text-[#FF00FF]" 
                      label="เทอม 2" 
                    />
                    <CircularProgress 
                      value={average.toFixed(1)} 
                      max={100} 
                      colorClass="text-[#00E5FF]" 
                      textClass="text-[#00E5FF]" 
                      label="เฉลี่ยรวม" 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Printable Report (Hidden on screen, visible on print) */}
          <div id="printable-report" className="hidden print:block bg-white p-8">
            <div className="text-center mb-8 border-b border-black pb-6">
              <h1 className="text-2xl font-bold text-black mb-1">โรงเรียนบ้านตะโละ</h1>
              <h2 className="text-lg font-semibold text-black mb-6">รายงานผลการศึกษา ประจำปีการศึกษา 2568</h2>
              
              <div className="info-grid text-sm text-black text-left">
                <div><span className="font-bold">ชื่อ-สกุล:</span> {selectedStudent.name}</div>
                <div><span className="font-bold">รหัสนักเรียน:</span> {selectedStudent.id}</div>
                <div><span className="font-bold">ชั้นเรียน:</span> {selectedStudent.gradeLevel}</div>
                <div><span className="font-bold">เลขประจำตัวประชาชน:</span> {selectedStudent.nationalId}</div>
                <div><span className="font-bold">วันเกิด:</span> {new Date(selectedStudent.dob).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>

            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black p-2 bg-gray-100">รายวิชา</th>
                  <th colSpan={3} className="border border-black p-2 bg-gray-100">ภาคเรียนที่ 1</th>
                  <th colSpan={3} className="border border-black p-2 bg-gray-100">ภาคเรียนที่ 2</th>
                  <th rowSpan={2} className="border border-black p-2 bg-gray-100">เฉลี่ยรวม</th>
                  <th rowSpan={2} className="border border-black p-2 bg-gray-100">ระดับผลการเรียน</th>
                </tr>
                <tr>
                  <th className="border border-black p-1 bg-gray-50">เก็บ</th>
                  <th className="border border-black p-1 bg-gray-50">ปลายภาค</th>
                  <th className="border border-black p-1 bg-gray-50">รวม</th>
                  <th className="border border-black p-1 bg-gray-50">เก็บ</th>
                  <th className="border border-black p-1 bg-gray-50">ปลายภาค</th>
                  <th className="border border-black p-1 bg-gray-50">รวม</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((grade) => {
                  const subject = subjects.find(s => s.id === grade.subjectId);
                  const sem1Accum = calculateTotalAccum(grade.sem1.scores);
                  const sem1Final = Number(grade.sem1.finalScore) || 0;
                  const sem1Total = sem1Accum + sem1Final;
                  const sem2Accum = calculateTotalAccum(grade.sem2.scores);
                  const sem2Final = Number(grade.sem2.finalScore) || 0;
                  const sem2Total = sem2Accum + sem2Final;
                  const average = calculateAverage(sem1Total, sem2Total);
                  const finalGrade = calculateGrade(average);

                  return (
                    <tr key={grade.id}>
                      <td className="border border-black p-2">{subject?.name}</td>
                      <td className="border border-black p-2 text-center">{sem1Accum}</td>
                      <td className="border border-black p-2 text-center">{sem1Final}</td>
                      <td className="border border-black p-2 text-center font-bold">{sem1Total}</td>
                      <td className="border border-black p-2 text-center">{sem2Accum}</td>
                      <td className="border border-black p-2 text-center">{sem2Final}</td>
                      <td className="border border-black p-2 text-center font-bold">{sem2Total}</td>
                      <td className="border border-black p-2 text-center font-bold">{average.toFixed(1)}</td>
                      <td className="border border-black p-2 text-center font-bold">{finalGrade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="signatures">
              <div>
                <div className="sig-line">ลงชื่อ......................................................................</div>
                <div>(......................................................................)</div>
                <div className="mt-1">ครูประจำชั้น</div>
              </div>
              <div>
                <div className="sig-line">ลงชื่อ......................................................................</div>
                <div>(......................................................................)</div>
                <div className="mt-1">ผู้อำนวยการโรงเรียนบ้านตะโละ</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
