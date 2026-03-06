import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ScanFace, Lock, User as UserIcon, ChevronRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

export default function Login({ onLogin, users }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    
    // Simulate biometric scan delay
    setTimeout(() => {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setIsScanning(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Dynamic Background Shapes */}
      <div className="bg-shape w-96 h-96 bg-[#00E5FF] top-[-10%] left-[-10%]"></div>
      <div className="bg-shape w-[500px] h-[500px] bg-[#FF00FF] bottom-[-20%] right-[-10%] opacity-40" style={{ animationDelay: '-5s' }}></div>
      <div className="bg-shape w-80 h-80 bg-[#FFD600] top-[40%] left-[30%] opacity-30" style={{ animationDelay: '-2s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center relative z-10">
        <div className="w-24 h-24 glass-card rounded-[32px] flex items-center justify-center mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF] to-[#FF00FF] opacity-20 rounded-[32px] group-hover:opacity-40 transition-opacity duration-500"></div>
          <ScanFace className={`w-12 h-12 text-[#00E5FF] relative z-10 ${isScanning ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
          {isScanning && (
            <div className="absolute inset-0 border-2 border-[#00E5FF] rounded-[32px] animate-ping opacity-75"></div>
          )}
        </div>
        <h2 className="text-center text-[34px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#FF00FF] tracking-tight mb-2">
          โรงเรียนบ้านตะโละ
        </h2>
        <p className="text-center text-[17px] text-[#3C3C43] font-medium">
          ระบบรายงานผลการศึกษา ประจำปีการศึกษา 2568
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px] relative z-10">
        <div className="glass-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#FF00FF]/10 text-[#FF00FF] border border-[#FF00FF]/30 px-4 py-3 rounded-xl text-[15px] font-medium text-center backdrop-blur-sm">
                {error}
              </div>
            )}
            <div className="space-y-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-[#8E8E93]" />
                </div>
                <input
                  type="text"
                  required
                  className="glow-input w-full pl-11"
                  placeholder="ชื่อผู้ใช้ / เลขบัตรประชาชน"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isScanning}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#8E8E93]" />
                </div>
                <input
                  type="password"
                  required
                  className="glow-input w-full pl-11"
                  placeholder="รหัสผ่าน / วดป.เกิด 6 หลัก"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isScanning}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isScanning}
                className="w-full flex justify-center items-center py-4 px-4 glow-button text-[17px] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <span className="flex items-center">
                    <ScanFace className="w-5 h-5 mr-2 animate-pulse" />
                    กำลังตรวจสอบ...
                  </span>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-[rgba(0,0,0,0.1)]">
            <h4 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-4 text-center">ข้อมูลสำหรับทดสอบระบบ</h4>
            <div className="grid grid-cols-2 gap-3 text-[13px] text-[#3C3C43]">
              <div className="bg-[rgba(255,255,255,0.5)] p-3 rounded-xl border border-[rgba(255,255,255,0.3)]">
                <span className="font-semibold text-black block mb-1">ฝ่ายวิชาการ</span>
                U: admin<br/>P: password
              </div>
              <div className="bg-[rgba(255,255,255,0.5)] p-3 rounded-xl border border-[rgba(255,255,255,0.3)]">
                <span className="font-semibold text-black block mb-1">ครูผู้สอน</span>
                U: teacher1<br/>P: password
              </div>
              <div className="bg-[rgba(255,255,255,0.5)] p-3 rounded-xl border border-[rgba(255,255,255,0.3)]">
                <span className="font-semibold text-black block mb-1">ผู้บริหาร</span>
                U: exec<br/>P: password
              </div>
              <div className="bg-[rgba(255,255,255,0.5)] p-3 rounded-xl border border-[rgba(255,255,255,0.3)]">
                <span className="font-semibold text-black block mb-1">ผู้ปกครอง (ป.1)</span>
                U: 1111111111111<br/>P: 010150
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
