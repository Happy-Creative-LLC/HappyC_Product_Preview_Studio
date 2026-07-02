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
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }
        .login-anim-0 { animation: fadeInUp 0.6s ease-out both; }
        .login-anim-1 { animation: fadeInUp 0.6s ease-out 0.1s both; }
        .login-orb-1  { animation: float 8s ease-in-out infinite; }
        .login-orb-2  { animation: float 6s ease-in-out 2s infinite; }
        .login-input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        {/* Gradient orbs */}
        <div className="login-orb-1" style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.3), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div className="login-orb-2" style={{
          position: 'absolute', bottom: '10%', right: '15%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        {/* Dot grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div className="login-anim-0" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 40, position: 'relative', zIndex: 1,
        }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
            Happy Creative
          </span>
        </div>

        {/* Glass Card */}
        <div className="login-anim-1" style={{
          width: 420, maxWidth: '100%',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: 40,
          position: 'relative', zIndex: 1,
        }}>
          <h2 style={{
            fontSize: 24, fontWeight: 800, color: 'white',
            margin: '0 0 6px', textAlign: 'center',
          }}>
            Chào mừng trở lại
          </h2>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.5)',
            margin: '0 0 32px', textAlign: 'center',
          }}>
            Đăng nhập để xem preview sản phẩm
          </p>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20,
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Tài khoản
              </label>
              <input
                className="login-input"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="hc.admin"
                autoComplete="username"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 16px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  fontSize: 14, color: 'white',
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(37,99,235,0.6)';
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Mật khẩu
              </label>
              <input
                className="login-input"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 16px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  fontSize: 14, color: 'white',
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(37,99,235,0.6)';
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white', fontSize: 15, fontWeight: 700,
                border: 'none', borderRadius: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
              onMouseOver={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.5)'; } }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.4)'; }}
            >
              {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>hoặc</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => alert('Chức năng đăng nhập Google đang phát triển.')}
            style={{
              width: '100%', padding: '13px',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: 14, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
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

        {/* Footer */}
        <p style={{
          marginTop: 24, fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          position: 'relative', zIndex: 1,
        }}>
          © 2026 Happy Creative · Internal Tool
        </p>
      </div>
    </>
  );
};

export default LoginPage;
