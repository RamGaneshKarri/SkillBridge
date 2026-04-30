import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HiOutlineHome, HiOutlineCalendar, HiOutlineClipboardCheck, 
  HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineChartBar, 
  HiOutlineLink, HiOutlineOfficeBuilding, HiOutlineEye,
  HiOutlineX
} from 'react-icons/hi';

const Sidebar = ({ isOpen, onClose }) => {
  const { userData } = useAuth();

  const menuItems = {
    student: [
      { path: '/student', icon: HiOutlineHome, label: 'Dashboard' },
      { path: '/student/sessions', icon: HiOutlineCalendar, label: 'My Sessions' },
      { path: '/student/attendance', icon: HiOutlineClipboardCheck, label: 'My Attendance' },
    ],
    trainer: [
      { path: '/trainer', icon: HiOutlineHome, label: 'Dashboard' },
      { path: '/trainer/sessions', icon: HiOutlineCalendar, label: 'Sessions' },
      { path: '/trainer/batches', icon: HiOutlineUserGroup, label: 'Batches' },
      { path: '/trainer/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance' },
      { path: '/trainer/invites', icon: HiOutlineLink, label: 'Invite Links' },
    ],
    institution: [
      { path: '/institution', icon: HiOutlineHome, label: 'Dashboard' },
      { path: '/institution/batches', icon: HiOutlineUserGroup, label: 'Batches' },
      { path: '/institution/trainers', icon: HiOutlineAcademicCap, label: 'Trainers' },
      { path: '/institution/summary', icon: HiOutlineChartBar, label: 'Attendance Summary' },
    ],
    programme_manager: [
      { path: '/manager', icon: HiOutlineHome, label: 'Dashboard' },
      { path: '/manager/institutions', icon: HiOutlineOfficeBuilding, label: 'Institutions' },
      { path: '/manager/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    ],
    monitoring_officer: [
      { path: '/monitor', icon: HiOutlineHome, label: 'Dashboard' },
      { path: '/monitor/overview', icon: HiOutlineEye, label: 'Programme Overview' },
      { path: '/monitor/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    ],
  };

  const items = menuItems[userData?.role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-100 z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-3">
          <p className="px-3 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu</p>
          
          <div className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === `/${userData?.role}` || item.path === '/manager' || item.path === '/monitor'}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-300
                  ${isActive 
                    ? 'bg-purple-50 text-purple-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom info */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100/50 shadow-[0_4px_14px_0_rgba(147,51,234,0.05)]">
            <p className="text-xs font-black text-purple-700">SkillBridge v1.0</p>
            <p className="text-[10px] font-semibold text-purple-400/80 mt-0.5">Attendance System</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
