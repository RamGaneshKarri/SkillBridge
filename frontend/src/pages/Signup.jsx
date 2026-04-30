import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGraduationCap } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff, HiOutlineOfficeBuilding } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../utils/api';

const roles = [
  { value: 'student', label: 'Student', desc: 'Mark attendance for your sessions', icon: '🎓' },
  { value: 'trainer', label: 'Trainer', desc: 'Create sessions & manage batches', icon: '👨‍🏫' },
  { value: 'institution', label: 'Institution', desc: 'Manage trainers & view summaries', icon: '🏛️' },
  { value: 'programme_manager', label: 'Programme Manager', desc: 'Oversee all institutions', icon: '📊' },
  { value: 'monitoring_officer', label: 'Monitoring Officer', desc: 'Read-only programme access', icon: '👁️' },
];

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '', institutionId: '' });
  const [institutions, setInstitutions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const dashboardMap = {
    student: '/student',
    trainer: '/trainer',
    institution: '/institution',
    programme_manager: '/manager',
    monitoring_officer: '/monitor',
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await api.get('/users/public/institutions');
        setInstitutions(res.data);
      } catch (err) {
        console.error('Failed to load institutions');
      }
    };
    fetchInstitutions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, role, institutionId } = formData;

    if (!role) {
      toast.error('Please select a role');
      return;
    }
    if ((role === 'student' || role === 'trainer') && !institutionId) {
      toast.error('Please select your institution');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, name.trim(), role, institutionId || null);
      toast.success('Account created successfully!');
      navigate(dashboardMap[role] || '/login');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password is too weak (min 6 chars)',
      };
      toast.error(errorMessages[error.code] || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 text-center text-white max-w-sm">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <FaGraduationCap className="text-4xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Join SkillBridge</h1>
          <p className="text-lg text-white/80 mb-6">Create your account and select your role to get started.</p>
          
          <div className="space-y-3 text-left">
            {roles.map(r => (
              <div key={r.value} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{r.label}</p>
                  <p className="text-xs text-white/60">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50 relative overflow-hidden min-h-screen lg:min-h-0">
        
        {/* Mobile Background Decoration */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-80 bg-gradient-primary rounded-b-[3rem] shadow-inner z-0"></div>
        <div className="lg:hidden absolute top-8 left-8 w-32 h-32 bg-white/10 rounded-full blur-xl z-0"></div>
        <div className="lg:hidden absolute top-24 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl z-0"></div>

        {/* Mobile Header (Outside the card) */}
        <div className="lg:hidden relative z-10 flex flex-col items-center text-white mb-8 mt-2 animate-fade-in">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl mb-3 border border-white/20">
            <FaGraduationCap className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight drop-shadow-md">SkillBridge</h1>
          <p className="text-sm text-white/90 mt-1 drop-shadow-md">Create Account</p>
        </div>

        <div className="w-full max-w-lg animate-fade-in relative z-10 bg-white lg:bg-transparent p-8 lg:p-0 rounded-[2rem] shadow-xl lg:shadow-none border border-slate-100 lg:border-none">

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800">Create your account</h2>
            <p className="text-slate-500 mt-1 text-sm">Fill in the details below to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  className="form-input pl-10"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  className="form-input pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="form-label">Select Your Role</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: r.value }))}
                    className={`
                      p-3 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer
                      ${formData.role === r.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="text-xl block mb-1">{r.icon}</span>
                    <span className={`text-xs font-semibold block ${formData.role === r.value ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Institution Dropdown for Student & Trainer */}
            {(formData.role === 'student' || formData.role === 'trainer') && (
              <div className="animate-fade-in">
                <label className="form-label">Select Your Institution</label>
                <div className="relative">
                  <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    name="institutionId"
                    className="form-input pl-10"
                    value={formData.institutionId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Choose an Institution --</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input pl-10"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="form-input pl-10"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
