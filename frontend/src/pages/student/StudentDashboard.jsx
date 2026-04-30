import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineClipboardCheck, HiOutlineUserGroup,
  HiOutlineClock, HiOutlineCheckCircle
} from 'react-icons/hi';

const StudentDashboard = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingSession, setMarkingSession] = useState(null);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/sessions')) return 'sessions';
    if (path.includes('/attendance')) return 'attendance';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/sessions'),
        api.get('/batches'),
        api.get('/attendance/my'),
      ]);
      if (results[0].status === 'fulfilled') setSessions(results[0].value.data);
      if (results[1].status === 'fulfilled') setBatches(results[1].value.data);
      if (results[2].status === 'fulfilled') setMyAttendance(results[2].value.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (sessionId, status = 'present') => {
    setMarkingSession(sessionId);
    try {
      await api.post('/attendance/mark', { sessionId, status });
      toast.success(`Marked as ${status}!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setMarkingSession(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const attendanceRate = myAttendance.length > 0 
    ? Math.round((myAttendance.filter(a => a.status === 'present').length / myAttendance.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-premium">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {userData?.name} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Track your attendance and join sessions</p>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card border-l-4 border-l-purple-600">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Batches</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{batches.length}</p>
          </div>
          <div className="stat-card border-l-4 border-l-indigo-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Sessions</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{sessions.length}</p>
          </div>
          <div className="stat-card border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marked Attendance</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{myAttendance.length}</p>
          </div>
          <div className="stat-card border-l-4 border-l-amber-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Rate</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{attendanceRate}%</p>
          </div>
        </div>
      )}

      {(activeTab === 'dashboard' || activeTab === 'sessions') && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineCalendar className="text-purple-600" /> Upcoming & Current Sessions
          </h2>
          <div className="space-y-3">
            {sessions.map(session => {
              const attendance = myAttendance.find(a => a.sessionId === session.id);
              return (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-purple-50 hover:border-purple-200 bg-white gap-4 transition-all hover:shadow-md">
                  <div>
                    <h3 className="font-bold text-slate-800">{session.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>{session.date}</span>
                      <span>{session.startTime} - {session.endTime}</span>
                      <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{session.batchName}</span>
                    </div>
                  </div>
                  {attendance ? (
                    <span className={`badge ${attendance.status === 'present' ? 'badge-present' : attendance.status === 'absent' ? 'badge-absent' : 'badge-late'}`}>
                      {attendance.status}
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => markAttendance(session.id, 'present')} disabled={markingSession === session.id} className="btn-success py-2 px-5 text-[11px] uppercase tracking-wider">Present</button>
                      <button onClick={() => markAttendance(session.id, 'late')} disabled={markingSession === session.id} className="btn-secondary py-2 px-5 text-[11px] uppercase tracking-wider">Late</button>
                    </div>
                  )}
                </div>
              );
            })}
            {sessions.length === 0 && <div className="empty-state"><HiOutlineCalendar className="w-12 h-12 mb-3 opacity-50" /><p>No sessions scheduled.</p></div>}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineClipboardCheck className="text-purple-600" /> My Attendance History
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {myAttendance.map(record => (
                  <tr key={record.id}>
                    <td className="font-bold text-slate-800">{sessions.find(s => s.id === record.sessionId)?.title || 'Session'}</td>
                    <td className="text-xs text-slate-500 font-semibold">{new Date(record.markedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${record.status === 'present' ? 'badge-present' : record.status === 'absent' ? 'badge-absent' : 'badge-late'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
