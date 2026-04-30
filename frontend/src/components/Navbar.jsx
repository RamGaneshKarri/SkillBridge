import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineLogout, HiOutlineMenu, HiOutlineAcademicCap } from 'react-icons/hi';

const roleLabels = {
  student: 'Student',
  trainer: 'Trainer',
  institution: 'Institution',
  programme_manager: 'Manager',
  monitoring_officer: 'Monitor',
};

const roleBadgeClasses = {
  student: 'badge-primary',
  trainer: 'badge-present',
  institution: 'badge-primary',
  programme_manager: 'badge-late',
  monitoring_officer: 'bg-slate-100 text-slate-700',
};

const Navbar = ({ onToggleSidebar }) => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-purple-50 px-4 flex items-center justify-between">
      {/* Left: Logo & Toggle */}
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-purple-50 text-slate-500 transition-all">
          <HiOutlineMenu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-[0_4px_14px_0_rgba(147,51,234,0.39)]">
            <HiOutlineAcademicCap className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none">SkillBridge</h1>
            <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mt-1">Attendance</p>
          </div>
        </div>
      </div>

      {/* Right: User Info & Logout */}
      <div className="flex items-center gap-4">
        {userData && (
          <div className="hidden sm:flex items-center gap-3">
            <span className={`badge ${roleBadgeClasses[userData.role] || 'bg-slate-100 text-slate-600'}`}>
              {roleLabels[userData.role] || userData.role}
            </span>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">{userData.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{userData.email}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-black text-sm">
            {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <HiOutlineLogout className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
