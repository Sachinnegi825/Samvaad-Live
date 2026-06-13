import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
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
      navigate('/chat');
    }
  };

  const toggleMode = () => {
    clearError();
    setFormData({ username: '', email: '', password: '' });
    setIsLoginMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 comic-halftone font-[var(--font-comic)]">
      
      <div className="w-full max-w-md relative z-10 transform -rotate-1">
        {/* Title Bubble */}
        <div className="mb-8 comic-border bg-yellow-400 p-4 text-center transform rotate-2 relative">
          <h1 className="text-4xl font-extrabold text-black uppercase tracking-widest" style={{ textShadow: '3px 3px 0 white' }}>Samvaad</h1>
          <h2 className="text-2xl font-bold text-white uppercase bg-black inline-block px-2 transform -skew-x-12">Live</h2>
          <p className="text-black font-bold mt-2">
            {isLoginMode ? 'WELCOME BACK, HERO!' : 'JOIN THE ACTION!'}
          </p>
          <div className="comic-bubble-tail left bg-yellow-400"></div>
        </div>

        {/* Form Card */}
        <div className="comic-border bg-white p-8">
          {/* Tab Switcher */}
          <div className="flex border-4 border-black mb-8 bg-gray-200">
            <button
              onClick={() => isLoginMode || toggleMode()}
              className={`flex-1 py-3 text-lg font-bold transition-all uppercase border-r-4 border-black cursor-pointer ${isLoginMode ? 'bg-secondary text-white' : 'text-black hover:bg-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => !isLoginMode || toggleMode()}
              className={`flex-1 py-3 text-lg font-bold transition-all uppercase cursor-pointer ${!isLoginMode ? 'bg-secondary text-white' : 'text-black hover:bg-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {!isLoginMode && (
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-black stroke-[3px] h-5 w-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Hero Name (Username)"
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full comic-border bg-white pl-12 pr-4 py-4 text-lg font-bold text-black placeholder-gray-500 focus:outline-none focus:bg-yellow-100 transition-all"
                />
              </div>
            )}

            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-black stroke-[3px] h-5 w-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Secret Identity (Email)"
                required
                className="w-full comic-border bg-white pl-12 pr-4 py-4 text-lg font-bold text-black placeholder-gray-500 focus:outline-none focus:bg-yellow-100 transition-all"
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-black stroke-[3px] h-5 w-5" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Passcode"
                required
                minLength={6}
                className="w-full comic-border bg-white pl-12 pr-4 py-4 text-lg font-bold text-black placeholder-gray-500 focus:outline-none focus:bg-yellow-100 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 font-bold text-black bg-red-400 border-4 border-black px-4 py-3 transform rotate-1">
                <FiAlertCircle className="h-5 w-5 flex-shrink-0 stroke-[3px]" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full comic-border bg-primary text-white font-black text-2xl py-4 uppercase hover:bg-red-500 active:translate-y-2 transition-transform mt-2 flex items-center justify-center gap-2 cursor-pointer"
              style={{ textShadow: '2px 2px 0 black' }}
            >
              {isLoading ? (
                'LOADING...'
              ) : (
                isLoginMode ? 'ENTER!' : 'JOIN NOW!'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
