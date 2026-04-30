import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlineCalendar, HiOutlineUserGroup,
  HiOutlineClipboardCheck, HiOutlineLink, HiOutlineClock,
  HiOutlineX, HiOutlineClipboardCopy, HiOutlinePencil, HiOutlineTrash
} from 'react-icons/hi';

const TrainerDashboard = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showEditBatch, setShowEditBatch] = useState(null);
  const [showEditSession, setShowEditSession] = useState(null);
  const [showAttendance, setShowAttendance] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [inviteLinks, setInviteLinks] = useState({});
  const [sessionForm, setSessionForm] = useState({ title: '', date: '', startTime: '', endTime: '', batchId: '' });
  const [batchForm, setBatchForm] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/sessions')) return 'sessions';
    if (path.includes('/batches')) return 'batches';
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/invites')) return 'invites';
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
      ]);
      if (results[0].status === 'fulfilled') setSessions(results[0].value.data);
      if (results[1].status === 'fulfilled') setBatches(results[1].value.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    const trimmedName = batchForm.name.trim();
    if (!trimmedName) return;
    
    setSubmitting(true);
    try {
      console.log('Sending create batch request:', { name: trimmedName });
      const response = await api.post('/batches', { name: trimmedName });
      console.log('Batch created successfully:', response.data);
      toast.success('Batch created!');
      setShowCreateBatch(false);
      setBatchForm({ name: '' });
      fetchData();
    } catch (error) {
      console.error('Batch creation error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to create batch. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/sessions', sessionForm);
      toast.success('Session created!');
      setShowCreateSession(false);
      setSessionForm({ title: '', date: '', startTime: '', endTime: '', batchId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const updateBatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/batches/${showEditBatch.id}`, { name: batchForm.name });
      toast.success('Batch updated!');
      setShowEditBatch(null);
      setBatchForm({ name: '' });
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const updateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/sessions/${showEditSession.id}`, sessionForm);
      toast.success('Session updated!');
      setShowEditSession(null);
      setSessionForm({ title: '', date: '', startTime: '', endTime: '', batchId: '' });
      fetchData();
    } catch (error) {
      toast.error('Session update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this session? This will also remove attendance records.')) return;
    try {
      await api.delete(`/sessions/${id}`);
      toast.success('Session deleted');
      fetchData();
    } catch (error) {
      toast.error('Session delete failed');
    }
  };


  const deleteBatch = async (id) => {
    if (!window.confirm('Delete this batch?')) return;
    try {
      await api.delete(`/batches/${id}`);
      toast.success('Batch deleted');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const generateInvite = async (batchId) => {
    try {
      const res = await api.post(`/batches/${batchId}/invite`);
      const fullLink = `${window.location.origin}/join?token=${res.data.token}`;
      setInviteLinks(prev => ({ ...prev, [batchId]: fullLink }));
      toast.success('Invite link generated!');
    } catch (error) {
      toast.error('Failed to generate invite');
    }
  };

  const viewAttendance = async (sessionId) => {
    try {
      const res = await api.get(`/sessions/${sessionId}/attendance`);
      setAttendanceData(res.data);
      setShowAttendance(sessionId);
    } catch (error) {
      toast.error('Failed to load attendance');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Calculate Unique Students
  const allStudentIds = batches.reduce((acc, b) => [...acc, ...(b.studentIds || [])], []);
  const uniqueStudentsCount = new Set(allStudentIds).size;

  return (
    <>
      <div className="space-y-6 animate-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Trainer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, <span className="text-purple-600 font-bold">{userData?.name}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateBatch(true)} className="btn-secondary text-sm">
            <HiOutlinePlus /> New Batch
          </button>
          <button onClick={() => setShowCreateSession(true)} className="btn-primary text-sm">
            <HiOutlinePlus /> New Session
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card border-l-4 border-l-purple-600">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Batches</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{batches.length}</p>
          </div>
          <div className="stat-card border-l-4 border-l-indigo-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sessions</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{sessions.length}</p>
          </div>
          <div className="stat-card border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unique Students</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{uniqueStudentsCount}</p>
          </div>
        </div>
      )}

      {(activeTab === 'dashboard' || activeTab === 'batches') && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineUserGroup className="text-purple-600" /> My Batches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map(batch => (
              <div key={batch.id} className="p-4 rounded-2xl border border-purple-50 hover:border-purple-200 transition-all bg-white group shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{batch.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{(batch.studentIds || []).length} students</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setShowEditBatch(batch); setBatchForm({ name: batch.name }); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><HiOutlinePencil /></button>
                    <button onClick={() => deleteBatch(batch.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><HiOutlineTrash /></button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-50/50">
                  {inviteLinks[batch.id] ? (
                    <button onClick={() => { navigator.clipboard.writeText(inviteLinks[batch.id]); toast.success('Copied!'); }} className="text-[10px] font-black text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-2.5 rounded-xl w-full flex items-center justify-center gap-2 uppercase transition-colors">
                      <HiOutlineClipboardCopy className="w-4 h-4" /> Copy Invite Link
                    </button>
                  ) : (
                    <button onClick={() => generateInvite(batch.id)} className="text-[10px] font-black text-slate-500 hover:text-purple-600 w-full flex items-center justify-center gap-2 uppercase tracking-widest transition-colors">
                      <HiOutlineLink className="w-4 h-4" /> Generate Invite
                    </button>
                  )}
                </div>
              </div>
            ))}
            {batches.length === 0 && <div className="col-span-full empty-state"><HiOutlineUserGroup className="w-12 h-12 mb-3 opacity-50" /><p>No batches yet. Create one to get started.</p></div>}
          </div>
        </div>
      )}

      {(activeTab === 'dashboard' || activeTab === 'sessions') && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineCalendar className="text-purple-600" /> Recent Sessions
          </h2>
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-purple-50 hover:border-purple-200 transition-all bg-white gap-4 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-400"><HiOutlineClock className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-slate-800">{session.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>{session.date}</span>
                      <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{session.batchName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => viewAttendance(session.id)} className="text-[10px] font-black text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors px-4 py-2.5 rounded-xl uppercase tracking-wider">View Attendance</button>
                  <button onClick={() => { setShowEditSession(session); setSessionForm(session); }} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl"><HiOutlinePencil className="w-5 h-5" /></button>
                  <button onClick={() => deleteSession(session.id)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl"><HiOutlineTrash className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && <div className="empty-state"><HiOutlineCalendar className="w-12 h-12 mb-3 opacity-50" /><p>No sessions scheduled.</p></div>}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineClipboardCheck className="text-purple-600" /> Session Attendance
          </h2>
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="flex justify-between items-center p-4 rounded-2xl border border-purple-50 hover:border-purple-200 bg-white shadow-sm hover:shadow-md transition-all">
                <div>
                  <h3 className="font-bold text-slate-800">{session.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{session.date} | {session.batchName}</p>
                </div>
                <button onClick={() => viewAttendance(session.id)} className="btn-secondary py-2 px-4 text-xs">View Report</button>
              </div>
            ))}
            {sessions.length === 0 && <div className="empty-state"><HiOutlineClipboardCheck className="w-12 h-12 mb-3 opacity-50" /><p>No sessions yet.</p></div>}
          </div>
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineLink className="text-purple-600" /> Active Invite Links
          </h2>
          <div className="space-y-3">
            {batches.map(batch => (
              <div key={batch.id} className="p-4 rounded-2xl border border-purple-50 bg-white flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800">{batch.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Status: {inviteLinks[batch.id] ? <span className="text-emerald-500 font-bold">Active</span> : <span className="text-amber-500 font-bold">Not Generated</span>}
                  </p>
                </div>
                {inviteLinks[batch.id] ? (
                  <button onClick={() => { navigator.clipboard.writeText(inviteLinks[batch.id]); toast.success('Copied!'); }} className="btn-secondary py-2 px-4 text-xs flex items-center gap-2">
                    <HiOutlineClipboardCopy /> Copy Link
                  </button>
                ) : (
                  <button onClick={() => generateInvite(batch.id)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
                    <HiOutlineLink /> Generate
                  </button>
                )}
              </div>
            ))}
            {batches.length === 0 && <div className="empty-state"><HiOutlineUserGroup className="w-12 h-12 mb-3 opacity-50" /><p>Create a batch first to generate invite links.</p></div>}
          </div>
        </div>
      )}
      </div>

      {/* Modals - Placed Outside the Animation Container to fix positioning */}
      {(showCreateBatch || showEditBatch) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-8 w-full max-w-md bg-white shadow-2xl">
            <h2 className="text-xl font-black text-slate-800 mb-6">{showEditBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
            <form onSubmit={showEditBatch ? updateBatch : createBatch} className="space-y-6">
              <div>
                <label className="form-label">Batch Name</label>
                <input type="text" className="form-input" placeholder="e.g. Web Development 2026" value={batchForm.name} onChange={(e) => setBatchForm({ name: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateBatch(false); setShowEditBatch(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[120px]">{submitting ? '...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(showCreateSession || showEditSession) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-8 w-full max-w-md bg-white shadow-2xl">
            <h2 className="text-xl font-black text-slate-800 mb-6">{showEditSession ? 'Edit Session' : 'Create Session'}</h2>
            <form onSubmit={showEditSession ? updateSession : createSession} className="space-y-4">
              <div>
                <label className="form-label">Title</label>
                <input type="text" className="form-input" value={sessionForm.title} onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})} required />
              </div>
              <div>
                <label className="form-label">Batch</label>
                <select className="form-input" value={sessionForm.batchId} onChange={(e) => setSessionForm({...sessionForm, batchId: e.target.value})} required>
                  <option value="">Select Batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={sessionForm.date} onChange={(e) => setSessionForm({...sessionForm, date: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="time" className="form-input" value={sessionForm.startTime} onChange={(e) => setSessionForm({...sessionForm, startTime: e.target.value})} required />
                <input type="time" className="form-input" value={sessionForm.endTime} onChange={(e) => setSessionForm({...sessionForm, endTime: e.target.value})} required />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowCreateSession(false); setShowEditSession(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[120px]">{submitting ? '...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAttendance && attendanceData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">{attendanceData.session.title}</h2>
              <button onClick={() => setShowAttendance(null)} className="p-2 hover:bg-slate-100 rounded-lg"><HiOutlineX /></button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendanceData.attendance.map(record => (
                    <tr key={record.id}>
                      <td className="font-bold text-slate-800">{record.studentName}</td>
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
        </div>
      )}
    </>
  );
};

export default TrainerDashboard;
