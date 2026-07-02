import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAppStore();
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
        setError('Tài khoản hoặc mật khẩu không đúng.');
      }
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-center px-16 relative overflow-hidden"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full" style={{ background: 'rgba(37,99,235,0.2)', filter: 'blur(80px)' }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3.5 mb-12">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-white font-extrabold text-2xl tracking-tight">Happy Creative</span>
          </div>

          <h1 className="text-white font-extrabold leading-tight mb-4" style={{ fontSize: 40, letterSpacing: '-1px' }}>
            Preview Product<br />trước khi publish
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Xem trước listing Amazon &amp; Etsy, review cùng team, và chỉnh sửa nội dung trước khi đăng chính thức.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-12">
            {[{ val: '4', label: 'Projects' }, { val: '10', label: 'Team Members' }, { val: '2', label: 'Platforms' }].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold" style={{ color: '#f59e0b' }}>{s.val}</div>
                <div className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12" style={{ background: '#f8fafc' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#f59e0b' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-extrabold text-lg text-slate-900">Happy Creative</span>
          </div>

          <h2 className="font-extrabold text-slate-900 mb-2" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>Đăng nhập</h2>
          <p className="text-[14px] text-slate-400 mb-9">Nhập thông tin để tiếp tục</p>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-[13px]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tài khoản</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="hc.admin"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl outline-none transition-all"
                  style={{ borderRadius: 12 }}
                  onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl outline-none transition-all"
                  onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white font-bold text-[15px] rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                borderRadius: 12,
              }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[12px] text-slate-400">hoặc</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Button — placeholder for Sprint 1B */}
          <button
            type="button"
            onClick={() => alert('Chức năng đăng nhập Google đang phát triển.')}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-colors hover:bg-slate-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Đăng nhập bằng Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
