import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Folder,
  Image,
  LockKeyhole,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Type,
  Upload,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import BrandMark from '../components/shared/BrandMark';
import GoogleSignInButton from '../components/shared/GoogleSignInButton';
import { useAppStore } from '../stores/appStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

const WORKFLOW = [
  {
    icon: Folder,
    title: 'Tạo task theo project',
    description: 'Chọn Amazon hoặc Etsy và layout cần review ngay từ đầu.',
  },
  {
    icon: Upload,
    title: 'Bổ sung đúng phần việc',
    description: 'Hình ảnh, video và nội dung được phân vùng rõ theo vai trò.',
  },
  {
    icon: MessageSquare,
    title: 'Review trong ngữ cảnh',
    description: 'Cả team kiểm tra cùng một listing trước khi gửi duyệt.',
  },
  {
    icon: Eye,
    title: 'Xem như trên sàn thật',
    description: 'Đối chiếu desktop và mobile mà không cần publish sản phẩm.',
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const usernameRef = useRef(null);
  const { googleLogin, login, user } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const isLoading = loadingProvider !== null;

  useEffect(() => {
    if (user) navigate('/projects', { replace: true });
  }, [user, navigate]);

  const openLogin = () => {
    setError('');
    setIsLoginOpen(true);
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
      requestAnimationFrame(() => usernameRef.current?.focus());
    }
  };

  const closeLogin = () => {
    if (!isLoading) dialogRef.current?.close();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoadingProvider('local');

    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError('Tài khoản hoặc mật khẩu không đúng.');
        return;
      }

      dialogRef.current?.close();
      navigate('/projects', { replace: true });
    } catch (loginError) {
      const status = loginError?.response?.status;
      setError(
        status === 401
          ? 'Tài khoản hoặc mật khẩu không đúng.'
          : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setError('');
    setLoadingProvider('google');

    try {
      const success = await googleLogin(credential);
      if (!success) {
        setError('Không thể đăng nhập bằng Google. Vui lòng thử lại.');
        return;
      }

      dialogRef.current?.close();
      navigate('/projects', { replace: true });
    } catch (googleError) {
      setError(
        googleError?.response?.data?.message
        || googleError?.response?.data?.error
        || 'Không thể đăng nhập bằng Google. Vui lòng thử lại.',
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleUnavailable = () => {
    setError(
      GOOGLE_CLIENT_ID
        ? 'Không thể tải Google Login. Vui lòng kiểm tra kết nối và thử lại.'
        : 'Google Login chưa được cấu hình cho môi trường này. Vui lòng dùng tài khoản demo.',
    );
  };

  return (
    <div className="hc-landing">
      <a className="hc-skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>

      <header className="hc-landing__header">
        <a href="#top" aria-label="Happy Creative - Trang chủ">
          <BrandMark />
        </a>
        <button className="hc-button hc-button--secondary" type="button" onClick={openLogin}>
          Đăng nhập
        </button>
      </header>

      <main id="main-content">
        <section className="hc-hero" id="top">
          <div className="hc-hero__copy">
            <div className="hc-hero__eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              Không gian review listing nội bộ
            </div>
            <h1>
              Review rõ ràng.
              <br />
              <span>Publish tự tin hơn.</span>
            </h1>
            <p>
              Nơi để Product Design, Marvel Labs và Seller cùng hoàn thiện hình ảnh,
              video và nội dung trước khi sản phẩm xuất hiện trên Amazon hoặc Etsy.
            </p>
            <div className="hc-hero__actions">
              <button
                className="hc-button hc-button--primary hc-button--large"
                type="button"
                onClick={openLogin}
              >
                Mở không gian làm việc
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <a className="hc-button hc-button--secondary hc-button--large" href="#workflow">
                Xem quy trình
              </a>
            </div>
            <div className="hc-hero__proof" aria-label="Đặc điểm chính">
              <span><Check size={15} aria-hidden="true" />Desktop và mobile</span>
              <span><Check size={15} aria-hidden="true" />Theo đúng vai trò</span>
              <span><Check size={15} aria-hidden="true" />Không cần publish thật</span>
            </div>
          </div>

          <div className="hc-hero__visual" aria-label="Minh họa quy trình làm listing">
            <div
              className="hc-hero__photo"
              role="img"
              aria-label="Đội ngũ Happy Creative đang phối hợp làm việc"
            />
            <div className="hc-flow-card">
              <div className="hc-flow-card__head">
                <div>
                  <small>Listing workflow</small>
                  <strong>Một luồng review thống nhất</strong>
                </div>
                <span className="hc-status hc-status--review">Đang phối hợp</span>
              </div>
              <div className="hc-flow-card__steps">
                {[
                  { icon: Image, label: 'Hình ảnh', state: 'done' },
                  { icon: Video, label: 'Video', state: 'done' },
                  { icon: Type, label: 'Nội dung', state: 'current' },
                  { icon: Eye, label: 'Preview', state: '' },
                ].map(({ icon: Icon, label, state }) => (
                  <div
                    className={`hc-flow-step ${state ? `hc-flow-step--${state}` : ''}`}
                    key={label}
                  >
                    <span><Icon size={15} aria-hidden="true" /></span>
                    <strong>{label}</strong>
                    <small>{state === 'done' ? 'Sẵn sàng' : state === 'current' ? 'Review' : 'Tiếp theo'}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="hc-landing__metrics" aria-label="Phạm vi hệ thống">
          <div><strong>04</strong><span>Project nội bộ</span></div>
          <div><strong>03</strong><span>Bộ phận phối hợp</span></div>
          <div><strong>02</strong><span>Nền tảng preview</span></div>
          <div><strong>01</strong><span>Luồng review thống nhất</span></div>
        </section>

        <section className="hc-landing__section" id="workflow">
          <div className="hc-landing__section-heading">
            <div>
              <span className="hc-eyebrow">Quy trình</span>
              <h2>Từ task mới đến listing sẵn sàng</h2>
            </div>
            <p>
              Trạng thái rõ ràng hơn và mỗi thành viên luôn biết phần việc tiếp theo của mình.
            </p>
          </div>
          <div className="hc-workflow-grid">
            {WORKFLOW.map(({ icon: Icon, title, description }, index) => (
              <article className="hc-workflow-card" key={title}>
                <span className="hc-workflow-card__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="hc-workflow-card__icon"><Icon size={21} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

      </main>s

      <footer className="hc-landing__footer">
        <BrandMark compact />
        <p>© 2026 Happy Creative · Internal Product Preview Studio</p>
      </footer>

      <dialog
        className="hc-dialog hc-login-dialog"
        ref={dialogRef}
        aria-labelledby="login-title"
        onClose={() => setIsLoginOpen(false)}
        onCancel={(event) => {
          if (isLoading) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeLogin();
        }}
      >
        <div className="hc-dialog__inner">
          <button
            className="hc-icon-button hc-dialog__close"
            type="button"
            aria-label="Đóng hộp thoại đăng nhập"
            onClick={closeLogin}
            disabled={isLoading}
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div className="hc-login-dialog__brand"><BrandMark compact /></div>
          <h2 id="login-title">Chào mừng bạn trở lại</h2>
          <p className="hc-dialog__intro">
            Đăng nhập để tiếp tục công việc trong Product Preview Studio.
          </p>

          {error && <div className="hc-alert hc-alert--error" role="alert">{error}</div>}

          <form className="hc-dialog__form hc-login-form" onSubmit={handleLogin}>
            <label className="hc-field hc-login-field" htmlFor="login-username">
              <span>Tài khoản demo</span>
              <div className="hc-login-input">
                <UserRound size={17} aria-hidden="true" />
                <input
                  className="hc-input"
                  id="login-username"
                  ref={usernameRef}
                  type="text"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập tài khoản của bạn"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </label>
            <label className="hc-field hc-login-field" htmlFor="login-password">
              <span>Mật khẩu</span>
              <div className="hc-login-input hc-login-input--password">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  className="hc-input"
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={isLoading}
                >
                  {showPassword
                    ? <EyeOff size={17} aria-hidden="true" />
                    : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
            </label>
            <button
              className="hc-button hc-button--block hc-login-submit"
              type="submit"
              disabled={isLoading}
            >
              {loadingProvider === 'local'
                ? <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                : <ShieldCheck size={18} aria-hidden="true" />}
              {loadingProvider === 'local' ? 'Đang đăng nhập...' : 'Đăng nhập'}
              {loadingProvider !== 'local' && <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </form>

          <p className="hc-login-dialog__demo-note">
            Tài khoản nội bộ chỉ dùng trong giai đoạn demo.
          </p>

          <div className="hc-login-divider"><span>Hoặc</span></div>

          <GoogleSignInButton
            active={isLoginOpen}
            clientId={GOOGLE_CLIENT_ID}
            disabled={isLoading}
            onCredential={handleGoogleLogin}
            onUnavailable={handleGoogleUnavailable}
          />
          <p className="hc-login-dialog__google-note">
            Dành cho nhân sự — email phải được Admin cấp phép trước.
          </p>
        </div>
      </dialog>
    </div>
  );
};

export default LoginPage;
