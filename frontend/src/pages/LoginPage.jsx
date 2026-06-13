import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiMessageCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';

function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    clearError();
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password } = formData;

    let result;
    if (isLoginMode) {
      result = await login(email, password);
    } else {
      result = await register(username, email, password);
    }

    if (result.success) {
      navigate('/chat'); // redirect to chat on success
    }
  };

  const toggleMode = () => {
    clearError();
    setFormData({ username: '', email: '', password: '' });
    setIsLoginMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 mb-4">
            <FiMessageCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Chatwave</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLoginMode ? 'Welcome back! Sign in to continue.' : 'Create your account and join the wave.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Tab Switcher */}
          <div className="flex bg-slate-900/60 rounded-xl p-1 mb-8 border border-white/5">
            <button
              onClick={() => isLoginMode || toggleMode()}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer ${isLoginMode ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => !isLoginMode || toggleMode()}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer ${!isLoginMode ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username field (register only) */}
            {!isLoginMode && (
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                minLength={6}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 transition-all"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {isLoginMode ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLoginMode ? 'Sign In' : 'Create Account'}
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          By using Chatwave, you agree to learn something new today 🚀
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
