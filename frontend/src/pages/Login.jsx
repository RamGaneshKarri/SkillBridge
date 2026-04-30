import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGraduationCap } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const dashboardMap = {
    student: '/student',
    trainer: '/trainer',
    institution: '/institution',
    programme_manager: '/manager',
    monitoring_officer: '/monitor',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { profile } = await login(email, password);
      toast.success(`Welcome back, ${profile?.name || 'User'}!`);
      
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate(dashboardMap[profile?.role] || '/login');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      toast.error(errorMessages[error.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden items-center justify-center p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-2xl rotate-45"></div>

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <FaGraduationCap className="text-4xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4">SkillBridge</h1>
          <p className="text-xl text-white/80 mb-2">Attendance Management System</p>
          <p className="text-sm text-white/60 leading-relaxed mt-6">
            A comprehensive platform for managing attendance across institutions, 
            batches, and sessions in state-level skilling programmes.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-white/70 mt-1">User Roles</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-2xl font-bold">Real</p>
              <p className="text-xs text-white/70 mt-1">Time Data</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-2xl font-bold">RBAC</p>
              <p className="text-xs text-white/70 mt-1">Access Control</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50 relative overflow-hidden min-h-screen lg:min-h-0">
        
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
          <p className="text-sm text-white/90 mt-1 drop-shadow-md">Attendance System</p>
        </div>

        <div className="w-full max-w-md animate-fade-in relative z-10 bg-white lg:bg-transparent p-8 lg:p-0 rounded-[2rem] shadow-xl lg:shadow-none border border-slate-100 lg:border-none">

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 mt-1.5 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  className="form-input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pl-10 pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 transition">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
