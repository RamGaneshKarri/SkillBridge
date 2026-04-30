import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineEye, HiOutlineOfficeBuilding, HiOutlineChartBar,
  HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCalendar,
  HiOutlineClipboardCheck, HiOutlineShieldCheck
} from 'react-icons/hi';

const MonitorDashboard = () => {
  const { userData } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/summary/programme/summary');
      setSummaryData(res.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-premium">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Monitoring Officer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Programme Oversight — Read Only</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-100">
          <HiOutlineShieldCheck className="w-5 h-5 text-purple-600" />
          <span className="text-xs font-black text-purple-700 uppercase tracking-widest">Auditor Mode</span>
        </div>
      </div>

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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Rate</p>
          <p className="text-3xl font-black text-slate-800 mt-2">{summaryData?.overallAttendanceRate || 0}%</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <HiOutlineEye className="text-purple-600" /> Institution Overview
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Institution</th>
                <th>Batches</th>
                <th>Students</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(summaryData?.institutionSummaries || []).map(inst => (
                <tr key={inst.institutionId} className="hover:bg-purple-50/30 transition-colors">
                  <td className="font-bold text-slate-800">{inst.institutionName}</td>
                  <td className="font-medium">{inst.totalBatches}</td>
                  <td className="font-medium">{inst.totalStudents}</td>
                  <td><span className="badge badge-present">{inst.totalPresent}</span></td>
                  <td><span className="badge badge-absent">{inst.totalAbsent}</span></td>
                  <td><span className="badge badge-primary">{inst.attendanceRate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitorDashboard;
