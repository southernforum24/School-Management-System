import React from 'react';
import { Role } from '../types';
import { LogOut, GraduationCap, UserCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: Role;
  userName: string;
  onLogout: () => void;
}

export default function Layout({ children, role, userName, onLogout }: LayoutProps) {
  const getRoleTitle = (role: Role) => {
    switch (role) {
      case 'admin': return 'Admin (ฝ่ายวิชาการ)';
      case 'teacher': return 'สำหรับครูผู้สอน';
      case 'executive': return 'สำหรับผู้บริหาร';
      case 'parent': return 'สำหรับผู้ปกครอง';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen font-sans text-black relative overflow-hidden">
      {/* Dynamic Background Shapes */}
      <div className="bg-shape w-96 h-96 bg-[#00E5FF] top-[-10%] left-[-10%]"></div>
      <div className="bg-shape w-[500px] h-[500px] bg-[#FF00FF] bottom-[-20%] right-[-10%] opacity-40" style={{ animationDelay: '-5s' }}></div>
      <div className="bg-shape w-80 h-80 bg-[#FFD600] top-[40%] left-[30%] opacity-30" style={{ animationDelay: '-2s' }}></div>

      <nav className="glass-card rounded-none border-t-0 border-l-0 border-r-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[60px]">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-9 h-9 bg-gradient-to-br from-[#00E5FF] to-[#007AFF] rounded-[10px] flex items-center justify-center shadow-sm">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 flex flex-col justify-center">
                  <span className="text-[17px] font-semibold text-black leading-tight tracking-tight">
                    โรงเรียนบ้านตะโละ
                  </span>
                  <span className="text-[12px] font-medium text-[#8E8E93] mt-0.5">
                    {getRoleTitle(role)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-[15px] font-medium text-[#3C3C43]">
                <UserCircle className="w-5 h-5 mr-1.5 text-[#8E8E93]" />
                {userName}
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center text-[15px] font-semibold text-[#00E5FF] hover:text-[#007AFF] transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
      
      {role !== 'parent' && (
        <footer className="mt-auto py-8 text-center relative z-10">
          <p className="text-[13px] text-[#8E8E93] font-medium">
            &copy; 2569 โรงเรียนบ้านตะโละ - พัฒนาโดย นางสาวฟิรดาวส์ ตะโละมีแย.
          </p>
        </footer>
      )}
    </div>
  );
}
