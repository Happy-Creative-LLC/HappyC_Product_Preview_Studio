import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GoogleSignInButton from './GoogleSignInButton';

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    document.getElementById('google-identity-services')?.remove();
    delete window.google;
  });

  it('báo lỗi khi Google script tải hỏng và vẫn để lại nút dự phòng', async () => {
    const onUnavailable = vi.fn();
    render(
      <GoogleSignInButton
        active
        clientId="test-client-id"
        onCredential={vi.fn()}
        onUnavailable={onUnavailable}
      />,
    );

    const script = await waitFor(() => {
      const element = document.getElementById('google-identity-services');
      expect(element).toBeInTheDocument();
      return element;
    });

    fireEvent.error(script);

    await waitFor(() => expect(onUnavailable).toHaveBeenCalledWith('script'));
    expect(screen.getByRole('button', { name: 'Đăng nhập bằng Google' })).toBeEnabled();
  });
});
