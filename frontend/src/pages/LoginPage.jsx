import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from 'lucide-react';
import BrandMark from '../components/shared/BrandMark';
import GoogleSignInButton from '../components/shared/GoogleSignInButton';
import { useAppStore } from '../stores/appStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

const getLoginErrorMessage = (error) => {
  const status = error?.response?.status;
  const body = error?.response?.data;
  const backendMessage = body?.message || body?.error;

  if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;
  if (!error?.response && error?.request) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  }
  if (status === 401) return 'Tên đăng nhập hoặc mật khẩu không đúng.';
  if (status >= 500) return 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.';
  return 'Không thể đăng nhập. Vui lòng thử lại.';
};

const LoginPage = () => {
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const submittingRef = useRef(false);
  const { googleLogin, login, user } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadingProvider, setLoadingProvider] = useState(null);
  const isLoading = loadingProvider !== null;

  useEffect(() => {
    if (user) navigate('/projects', { replace: true });
  }, [user, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoadingProvider('local');

    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.');
        return;
      }
      navigate('/projects', { replace: true });
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError));
    } finally {
      submittingRef.current = false;
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async (credential) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoadingProvider('google');

    try {
      const success = await googleLogin(credential);
      if (!success) {
        setError('Không thể đăng nhập bằng Google. Vui lòng thử lại.');
        return;
      }
      navigate('/projects', { replace: true });
    } catch (googleError) {
      setError(getLoginErrorMessage(googleError));
    } finally {
      submittingRef.current = false;
      setLoadingProvider(null);
    }
  };

  const handleGoogleUnavailable = (reason) => {
    setError(reason === 'script'
      ? 'Không thể tải Google Login. Bạn vẫn có thể đăng nhập bằng tài khoản nội bộ bên dưới.'
      : 'Google Login chưa được cấu hình. Bạn có thể dùng tài khoản nội bộ bên dưới.');
  };

  return (
    <main className="grid min-h-screen bg-[#fffbf5] font-['Inter',system-ui,sans-serif] text-[#101831] lg:grid-cols-[1.05fr_0.95fr]">
      <section
        aria-label="Giới thiệu Happy Creative"
        className="flex min-h-[38vh] flex-col justify-between gap-9 bg-[#101831] px-7 py-8 text-white sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-12"
      >
        <BrandMark compact inverse className="self-start" />

        <div className="max-w-xl space-y-5">
          <p className="text-sm font-semibold tracking-wide text-[#ffc963]">Không gian nội bộ</p>
          <h1 className="font-['Roboto_Slab',Georgia,serif] text-[2.25rem] font-bold leading-[1.15] tracking-tight sm:text-5xl">
            Xem trước listing.
            <br />
            Hoàn thiện cùng team.
          </h1>
          <p className="max-w-lg text-base leading-7 text-[#d7dcea] sm:text-lg">
            Review sản phẩm Amazon và Etsy trước khi đăng.
          </p>
        </div>

        <p className="text-xs text-[#b8bfd6]">
          © 2026 Happy Creative · Product Preview Studio
        </p>
      </section>

      <section
        aria-labelledby="login-title"
        className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-14 lg:min-h-screen lg:px-12"
      >
        <div className="w-full max-w-[420px] space-y-6">
          <header className="space-y-2">
            <h2
              id="login-title"
              className="font-['Roboto_Slab',Georgia,serif] text-3xl font-bold tracking-tight"
            >
              Đăng nhập
            </h2>
            <p className="text-sm leading-6 text-[#505450]">
              Chọn tài khoản Happy Creative của bạn.
            </p>
          </header>

          <div className="space-y-4">
            <GoogleSignInButton
              active
              clientId={GOOGLE_CLIENT_ID}
              disabled={isLoading}
              onCredential={handleGoogleLogin}
              onUnavailable={handleGoogleUnavailable}
            />

            {error && (
              <div
                className="flex items-start gap-2.5 rounded-xl bg-[#fff1f2] px-3.5 py-3 text-sm leading-5 text-[#383c39]"
                role="alert"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[#ad2639]"
                  size={18}
                />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#686b67]" aria-hidden="true">
            <span className="h-px flex-1 bg-[#e5e5df]" />
            Hoặc dùng tài khoản nội bộ
            <span className="h-px flex-1 bg-[#e5e5df]" />
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block space-y-1.5 text-sm font-semibold" htmlFor="login-username">
              Tên đăng nhập
              <span className="relative block">
                <UserRound
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#686b67]"
                  size={17}
                />
                <input
                  autoComplete="username"
                  className="h-12 w-full rounded-xl border border-[#d2d2ca] bg-white py-2 pl-11 pr-3.5 text-[15px] font-normal outline-none transition focus-visible:border-[#3478f6] focus-visible:ring-4 focus-visible:ring-[#3478f6]/20 disabled:cursor-not-allowed disabled:bg-[#f1f1ec]"
                  id="login-username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  ref={usernameRef}
                  required
                  type="text"
                  value={username}
                  disabled={isLoading}
                />
              </span>
            </label>

            <label className="block space-y-1.5 text-sm font-semibold" htmlFor="login-password">
              Mật khẩu
              <span className="relative block">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#686b67]"
                  size={17}
                />
                <input
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-[#d2d2ca] bg-white py-2 pl-11 pr-12 text-[15px] font-normal outline-none transition focus-visible:border-[#3478f6] focus-visible:ring-4 focus-visible:ring-[#3478f6]/20 disabled:cursor-not-allowed disabled:bg-[#f1f1ec]"
                  id="login-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isLoading}
                />
                <button
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#686b67] outline-none hover:bg-[#f1f1ec] focus-visible:ring-4 focus-visible:ring-[#3478f6]/20 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword
                    ? <EyeOff aria-hidden="true" size={17} />
                    : <Eye aria-hidden="true" size={17} />}
                </button>
              </span>
            </label>

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#101831] px-4 text-sm font-semibold text-white transition hover:bg-[#17213f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3478f6] disabled:cursor-not-allowed disabled:opacity-65"
              disabled={isLoading}
              type="submit"
            >
              {loadingProvider === 'local'
                ? <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                : <LockKeyhole aria-hidden="true" size={17} />}
              {loadingProvider === 'local' ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
