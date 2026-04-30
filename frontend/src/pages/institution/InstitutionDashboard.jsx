import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineChartBar,
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash
} from 'react-icons/hi';

const InstitutionDashboard = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showEditBatch, setShowEditBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({ name: '', trainerIds: [], studentIds: [] });
  const [submitting, setSubmitting] = useState(false);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/batches')) return 'batches';
    if (path.includes('/trainers')) return 'trainers';
    if (path.includes('/summary')) return 'summary';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  useEffect(() => {
    if (userData) {
      fetchData();
    }
  }, [location.pathname, userData]);

  const fetchData = async () => {
    try {
      if (!userData) return;
      const [batchesRes, trainersRes, studentsRes, summaryRes] = await Promise.all([
        api.get('/batches'),
        api.get('/users/trainers'),
        api.get('/users/students'),
        api.get(`/summary/institutions/${userData.uid}/summary`)
      ]);
      setBatches(batchesRes.data);
      setTrainers(trainersRes.data);
      setStudents(studentsRes.data);
      setSummaryData(summaryRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/batches', batchForm);
      toast.success('Batch created!');
      setShowCreateBatch(false);
      setBatchForm({ name: '', trainerIds: [], studentIds: [] });
      fetchData();
    } catch (error) {
      toast.error('Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const updateBatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/batches/${showEditBatch.id}`, batchForm);
      toast.success('Batch updated!');
      setShowEditBatch(null);
      setBatchForm({ name: '', trainerIds: [], studentIds: [] });
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setSubmitting(false);
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

  if (loading) return <LoadingSpinner />;

  // Unique Students Count
  const allStudentIds = batches.reduce((acc, b) => [...acc, ...(b.studentIds || [])], []);
  const uniqueStudentsCount = new Set(allStudentIds).size;

  return (
    <>
      <div className="space-y-6 animate-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Institution Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Managing: <span className="text-purple-600 font-bold">{userData?.name}</span></p>
          </div>
          <button onClick={() => { setShowCreateBatch(true); setBatchForm({ name: '', trainerIds: [], studentIds: [] }); }} className="btn-primary">
            <HiOutlinePlus /> New Batch
          </button>
        </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card border-l-4 border-l-purple-600">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Batches</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{batches.length}</p>
          </div>
          <div className="stat-card border-l-4 border-l-indigo-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Trainers</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{trainers.length}</p>
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
            <HiOutlineUserGroup className="text-purple-600" /> All Batches
          </h2>
          <div className="space-y-3">
            {batches.map(batch => (
              <div key={batch.id} className="p-4 rounded-2xl border border-purple-50 flex justify-between items-center hover:border-purple-200 transition-all bg-white hover:shadow-md">
                <div>
                  <p className="font-bold text-slate-800">{batch.name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md mr-1">{(batch.studentIds || []).length} Students</span> 
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{(batch.trainerIds || []).length} Trainers</span>
                  </p>
                  
                  {/* Expanded Details showing assigned users */}
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-500 mb-1">Assigned Trainers:</p>
                      <ul className="text-slate-600 space-y-0.5 list-disc list-inside">
                        {(batch.trainerIds || []).map(tId => {
                          const trainer = trainers.find(t => t.id === tId);
                          return <li key={tId}>{trainer ? trainer.name : 'Unknown Trainer'}</li>;
                        })}
                        {(!batch.trainerIds || batch.trainerIds.length === 0) && <li className="italic text-slate-400">None</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 mb-1">Enrolled Students:</p>
                      <ul className="text-slate-600 space-y-0.5 list-disc list-inside">
                        {(batch.studentIds || []).map(sId => {
                          const student = students.find(s => s.id === sId);
                          return <li key={sId}>{student ? student.name : 'Unknown Student'}</li>;
                        })}
                        {(!batch.studentIds || batch.studentIds.length === 0) && <li className="italic text-slate-400">None</li>}
                      </ul>
                    </div>
                  </div>
                  
                </div>
                <div className="flex gap-2 self-start mt-1">
                  <button onClick={() => { setShowEditBatch(batch); setBatchForm({ name: batch.name, trainerIds: batch.trainerIds || [], studentIds: batch.studentIds || [] }); }} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl"><HiOutlinePencil /></button>
                  <button onClick={() => deleteBatch(batch.id)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl"><HiOutlineTrash /></button>
                </div>
              </div>
            ))}
            {batches.length === 0 && <div className="empty-state"><HiOutlineUserGroup className="w-12 h-12 mb-3 opacity-50" /><p>No batches yet.</p></div>}
          </div>
        </div>
      )}

      {activeTab === 'trainers' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineAcademicCap className="text-purple-600" /> Our Trainers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trainers.map(trainer => (
              <div key={trainer.id} className="p-4 rounded-2xl border border-purple-50 hover:shadow-md transition-all">
                <p className="font-bold text-slate-800">{trainer.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{trainer.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'summary' && summaryData && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineChartBar className="text-purple-600" /> Attendance Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="stat-card">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sessions</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{summaryData.totalSessions}</p>
            </div>
            <div className="stat-card">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Rate</p>
              <p className="text-3xl font-black text-purple-600 mt-2">{summaryData.overallAttendanceRate}%</p>
            </div>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Batch Name</th>
                  <th>Sessions</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaryData.batchSummaries.map((batch, index) => (
                  <tr key={index}>
                    <td className="font-bold text-slate-800">{batch.batchName}</td>
                    <td>{batch.totalSessions}</td>
                    <td>
                      <span className={`badge ${batch.attendanceRate >= 75 ? 'badge-present' : batch.attendanceRate >= 50 ? 'badge-late' : 'badge-absent'}`}>
                        {batch.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {summaryData.batchSummaries.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-4 text-slate-500">No attendance data available yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Modals */}
      {(showCreateBatch || showEditBatch) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-8 w-full max-w-md bg-white shadow-2xl">
            <h2 className="text-xl font-black text-slate-800 mb-6">{showEditBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
            <form onSubmit={showEditBatch ? updateBatch : createBatch} className="space-y-6">
              <div>
                <label className="form-label">Batch Name</label>
                <input type="text" className="form-input" value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} required />
              </div>
              
              <div>
                <label className="form-label">Assign Trainers</label>
                <div className="max-h-32 overflow-y-auto border-2 border-purple-50 rounded-2xl p-2 bg-slate-50/50">
                  {trainers.map(t => (
                    <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={batchForm.trainerIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setBatchForm({ ...batchForm, trainerIds: [...batchForm.trainerIds, t.id] });
                          else setBatchForm({ ...batchForm, trainerIds: batchForm.trainerIds.filter(id => id !== t.id) });
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{t.name}</span>
                    </label>
                  ))}
                  {trainers.length === 0 && <p className="text-xs text-slate-400 p-2">No trainers found.</p>}
                </div>
              </div>

              <div>
                <label className="form-label">Assign Students</label>
                <div className="max-h-40 overflow-y-auto border-2 border-purple-50 rounded-2xl p-2 bg-slate-50/50">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={batchForm.studentIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setBatchForm({ ...batchForm, studentIds: [...batchForm.studentIds, s.id] });
                          else setBatchForm({ ...batchForm, studentIds: batchForm.studentIds.filter(id => id !== s.id) });
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{s.name}</span>
                    </label>
                  ))}
                  {students.length === 0 && <p className="text-xs text-slate-400 p-2">No students found.</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateBatch(false); setShowEditBatch(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[120px]">{submitting ? '...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default InstitutionDashboard;
