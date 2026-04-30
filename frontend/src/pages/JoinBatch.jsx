import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FaGraduationCap } from 'react-icons/fa';
import { HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const JoinBatch = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { currentUser, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [batchName, setBatchName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = async () => {
    if (!token) {
      setErrorMsg('No invite token found in the URL.');
      setStatus('error');
      return;
    }

    if (!currentUser) {
      toast.error('Please login first to join a batch');
      navigate(`/login?redirect=/join?token=${token}`);
      return;
    }

    if (userData?.role !== 'student') {
      setErrorMsg('Only students can join batches via invite links.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await api.post('/batches/join-by-token', { token });
      setBatchName(res.data.batchName);
      setStatus('success');
      toast.success('Successfully joined batch!');
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Failed to join batch');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!authLoading && token && currentUser && userData?.role === 'student') {
      handleJoin();
    }
  }, [authLoading, token, currentUser, userData]);

  if (authLoading) return <LoadingSpinner message="Checking authentication..." />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center animate-fade-in">
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <FaGraduationCap className="text-white text-2xl" />
        </div>

        {!token ? (
          <>
            <HiOutlineExclamationCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Invite Link</h2>
            <p className="text-slate-500 text-sm mb-6">No invite token was found in this URL.</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Go to Login
            </button>
          </>
        ) : !currentUser ? (
          <>
            <HiOutlineUserGroup className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Join a Batch</h2>
            <p className="text-slate-500 text-sm mb-6">Please sign in as a Student to join this batch.</p>
            <button onClick={() => navigate(`/signup`)} className="btn-primary mr-3">
              Sign Up
            </button>
            <button onClick={() => navigate(`/login`)} className="btn-secondary">
              Log In
            </button>
          </>
        ) : status === 'loading' ? (
          <>
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Joining Batch...</h2>
            <p className="text-slate-500 text-sm">Please wait while we add you to the batch.</p>
          </>
        ) : status === 'success' ? (
          <>
            <HiOutlineCheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Successfully Joined!</h2>
            <p className="text-slate-500 text-sm mb-2">You've been added to:</p>
            <p className="text-lg font-semibold text-indigo-600 mb-6">{batchName}</p>
            <button onClick={() => navigate('/student')} className="btn-primary">
              Go to Dashboard
            </button>
          </>
        ) : status === 'error' ? (
          <>
            <HiOutlineExclamationCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Couldn't Join Batch</h2>
            <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
            <button onClick={() => navigate('/student')} className="btn-primary">
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <HiOutlineUserGroup className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Join a Batch</h2>
            <p className="text-slate-500 text-sm mb-6">Click below to join the batch.</p>
            <button onClick={handleJoin} className="btn-primary">
              Join Batch
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinBatch;
