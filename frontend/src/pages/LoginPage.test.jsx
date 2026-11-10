import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
import { useAppStore } from '../stores/appStore';

vi.mock('../stores/appStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../components/shared/GoogleSignInButton', () => ({
  default: ({ disabled, onCredential, onUnavailable }) => (
    <div>
      <button type="button" disabled={disabled} onClick={() => onCredential('google-credential')}>
        Google Sign in
      </button>
      <button type="button" disabled={disabled} onClick={() => onUnavailable('script')}>
        Google script failed
      </button>
    </div>
  ),
}));

const renderLoginPage = () => render(
  <MemoryRouter>
    <LoginPage />
  </MemoryRouter>,
);

const getBackendError = (status, message) => ({
  response: {
    status,
    data: { message },
  },
});

describe('LoginPage', () => {
  let login;
  let googleLogin;

  beforeEach(() => {
    login = vi.fn();
    googleLogin = vi.fn();
    useAppStore.mockReturnValue({ login, googleLogin, user: null });
  });

  it.each([
    ['Email này chưa được Admin cấp quyền truy cập hệ thống.', 403],
    ['Tài khoản đang chờ Admin phê duyệt.', 403],
    ['Tài khoản đã bị khóa. Vui lòng liên hệ Admin.', 403],
  ])('hiển thị đúng lỗi Google từ backend: %s', async (message, status) => {
    const user = userEvent.setup();
    googleLogin.mockRejectedValueOnce(getBackendError(status, message));
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: 'Google Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('hiển thị đúng lỗi sai tên đăng nhập hoặc mật khẩu từ backend', async () => {
    const user = userEvent.setup();
    const message = 'Tên đăng nhập hoặc mật khẩu không đúng.';
    login.mockRejectedValueOnce({
      response: { status: 401, data: { error: message } },
    });
    renderLoginPage();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'seller');
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('hiển thị lỗi kết nối khi máy chủ không phản hồi', async () => {
    const user = userEvent.setup();
    login.mockRejectedValueOnce({ request: {} });
    renderLoginPage();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'seller');
    await user.type(screen.getByLabelText('Mật khẩu'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.',
    );
  });

  it('hiển thị thông báo máy chủ từ backend khi có lỗi 5xx', async () => {
    const user = userEvent.setup();
    const message = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.';
    googleLogin.mockRejectedValueOnce(getBackendError(500, message));
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: 'Google Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('giữ form nội bộ dùng được khi Google script lỗi', async () => {
    const user = userEvent.setup();
    login.mockResolvedValueOnce(true);
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: 'Google script failed' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tải Google Login. Bạn vẫn có thể đăng nhập bằng tài khoản nội bộ bên dưới.',
    );
    expect(screen.getByLabelText('Tên đăng nhập')).toBeVisible();
    expect(screen.getByLabelText('Mật khẩu')).toBeVisible();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'seller');
    await user.type(screen.getByLabelText('Mật khẩu'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(login).toHaveBeenCalledWith('seller', 'correct-password');
  });

  it('khóa nút và các trường trong lúc gửi, không gửi hai lần', async () => {
    const user = userEvent.setup();
    let resolveLogin;
    login.mockReturnValueOnce(new Promise((resolve) => { resolveLogin = resolve; }));
    renderLoginPage();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'seller');
    await user.type(screen.getByLabelText('Mật khẩu'), 'correct-password');
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByLabelText('Tên đăng nhập')).toBeDisabled();
    expect(screen.getByLabelText('Mật khẩu')).toBeDisabled();
    fireEvent.click(submitButton);
    expect(login).toHaveBeenCalledTimes(1);

    resolveLogin(false);
    await waitFor(() => expect(submitButton).toBeEnabled());
  });

  it('gửi form khi nhấn Enter trong ô mật khẩu', async () => {
    const user = userEvent.setup();
    login.mockResolvedValueOnce(false);
    renderLoginPage();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'seller');
    await user.type(screen.getByLabelText('Mật khẩu'), 'password{Enter}');

    await waitFor(() => expect(login).toHaveBeenCalledWith('seller', 'password'));
  });
});
