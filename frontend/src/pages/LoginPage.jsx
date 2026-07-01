import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { KeyRound, User, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user, fetchProjects } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/projects');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/projects');
      } else {
        setError('Email hoặc mật khẩu không đúng.');
      }
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 scale-105"
        style={{
          backgroundImage: "url('/bg-login.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)'
        }}
      ></div>
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="text-center mb-24 relative z-10 w-full px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-xl">
          <span className="text-orange-500">Happy Creative</span> Preview Product
        </h1>
        <p className="text-lg text-gray-200 drop-shadow-md">Đăng nhập để tiếp tục</p>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-8 py-12 max-w-md w-full relative z-10 border border-white">
        <form onSubmit={handleLogin} className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">Tài khoản</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/50"
                placeholder="hc.admin"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
