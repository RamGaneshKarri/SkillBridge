import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding, HiOutlineChartBar, HiOutlineUserGroup,
  HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineClipboardCheck,
  HiOutlineX
} from 'react-icons/hi';

const ManagerDashboard = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const [summaryData, setSummaryData] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [institutionSummary, setInstitutionSummary] = useState(null);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/institutions')) return 'institutions';
    if (path.includes('/analytics')) return 'analytics';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  useEffect(() => { 
    fetchData(); 
  }, [location.pathname]);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/summary/programme/summary'),
        api.get('/users/institutions'),
      ]);
      if (results[0].status === 'fulfilled') setSummaryData(results[0].value.data);
      if (results[1].status === 'fulfilled') setInstitutions(results[1].value.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const viewInstitutionDetail = async (instId) => {
    try {
      const res = await api.get(`/summary/institutions/${instId}/summary`);
      setInstitutionSummary(res.data);
      setSelectedInstitution(instId);
    } catch (error) {
      toast.error('Failed to load institution details');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="space-y-6 animate-premium">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programme Manager Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome, {userData?.name} — Programme Overview</p>
        </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="stat-card border-l-4 border-l-purple-600">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutions</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{summaryData?.totalInstitutions || 0}</p>
          </div>
          <div className="stat-card border-l-4 border-l-indigo-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batches</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{summaryData?.totalBatches || 0}</p>
          </div>
          <div className="stat-card border-l-4 border-l-sky-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{summaryData?.totalStudents || 0}</p>
          </div>
          <div className="stat-card border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{summaryData?.totalSessions || 0}</p>
          </div>
          <div className="stat-card border-l-4 border-l-amber-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{summaryData?.overallAttendanceRate || 0}%</p>
          </div>
        </div>
      )}

      {(activeTab === 'dashboard' || activeTab === 'institutions') && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineOfficeBuilding className="text-purple-600" /> Institutions Overview
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Batches</th>
                  <th>Students</th>
                  <th>Rate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(summaryData?.institutionSummaries || []).map(inst => (
                  <tr key={inst.institutionId} className="hover:bg-purple-50/30 transition-colors">
                    <td className="font-bold text-slate-800">{inst.institutionName}</td>
                    <td className="font-medium">{inst.totalBatches}</td>
                    <td className="font-medium">{inst.totalStudents}</td>
                    <td>
                      <span className={`badge ${inst.attendanceRate >= 75 ? 'badge-present' : 'badge-absent'}`}>
                        {inst.attendanceRate}%
                      </span>
                    </td>
                    <td>
                      <button onClick={() => viewInstitutionDetail(inst.institutionId)} className="text-purple-600 font-black text-[10px] uppercase hover:text-purple-800 flex items-center gap-1 transition-colors">Details <span>→</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineChartBar className="text-purple-600" /> System Analytics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="stat-card border-l-4 border-l-emerald-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Present</p>
              <p className="text-3xl font-black text-emerald-600 mt-2">{summaryData?.totalPresent || 0}</p>
            </div>
            <div className="stat-card border-l-4 border-l-amber-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Late</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{summaryData?.totalLate || 0}</p>
            </div>
            <div className="stat-card border-l-4 border-l-rose-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Absent</p>
              <p className="text-3xl font-black text-rose-600 mt-2">{summaryData?.totalAbsent || 0}</p>
            </div>
          </div>
          
          <h3 className="text-md font-bold text-slate-700 mb-4">Institution Performance</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Total Sessions</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(summaryData?.institutionSummaries || []).map(inst => (
                  <tr key={`analytics-${inst.institutionId}`} className="hover:bg-slate-50 transition-colors">
                    <td className="font-bold text-slate-800">{inst.institutionName}</td>
                    <td className="font-medium">{inst.totalSessions}</td>
                    <td className="text-emerald-600 font-bold">{inst.totalPresent}</td>
                    <td className="text-rose-600 font-bold">{inst.totalAbsent}</td>
                    <td className="text-amber-600 font-bold">{inst.totalLate}</td>
                    <td>
                      <span className={`badge ${inst.attendanceRate >= 75 ? 'badge-present' : inst.attendanceRate >= 50 ? 'badge-late' : 'badge-absent'}`}>
                        {inst.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {(!summaryData?.institutionSummaries || summaryData.institutionSummaries.length === 0) && (
                  <tr><td colSpan="6" className="text-center py-4 text-slate-500">No data available yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Detail Modal */}
      {selectedInstitution && institutionSummary && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-8 w-full max-w-2xl bg-white shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">{institutionSummary.institutionName}</h2>
              <button onClick={() => setSelectedInstitution(null)} className="p-2 hover:bg-slate-100 rounded-xl"><HiOutlineX /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-5 bg-purple-50/50 border border-purple-50 rounded-2xl text-center">
                <p className="text-2xl font-bold">{institutionSummary.totalBatches}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1">Batches</p>
              </div>
              <div className="p-5 bg-purple-50/50 border border-purple-50 rounded-2xl text-center">
                <p className="text-2xl font-bold">{institutionSummary.totalStudents}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase mt-1">Students</p>
              </div>
              <div className="p-5 bg-purple-50/50 border border-purple-50 rounded-2xl text-center">
                <p className="text-2xl font-bold">{institutionSummary.totalSessions}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase mt-1">Sessions</p>
              </div>
              <div className="p-5 bg-purple-100/50 border border-purple-200 rounded-2xl text-center shadow-sm">
                <p className="text-2xl font-bold text-purple-700">{institutionSummary.overallAttendanceRate}%</p>
                <p className="text-[10px] text-purple-500 font-black uppercase mt-1">Rate</p>
              </div>
            </div>
            
            <h3 className="text-md font-bold text-slate-700 mb-4">Course Batches</h3>
            <div className="table-container bg-slate-50/50 rounded-2xl border border-slate-100 p-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <th className="pb-3 px-4">Batch Name</th>
                    <th className="pb-3 px-4">Students Enrolled</th>
                    <th className="pb-3 px-4">Sessions Conducted</th>
                    <th className="pb-3 px-4">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(institutionSummary.batchSummaries || []).map(batch => (
                    <tr key={`modal-batch-${batch.batchId}`} className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{batch.batchName}</td>
                      <td className="py-3 px-4 font-medium text-indigo-600">{batch.totalStudents}</td>
                      <td className="py-3 px-4 text-slate-600">{batch.totalSessions}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${batch.attendanceRate >= 75 ? 'badge-present' : batch.attendanceRate >= 50 ? 'badge-late' : 'badge-absent'}`}>
                          {batch.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!institutionSummary.batchSummaries || institutionSummary.batchSummaries.length === 0) && (
                    <tr><td colSpan="4" className="text-center py-6 text-slate-500 italic">No batches found for this institution.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ManagerDashboard;
