import axios from 'axios';
import { useAppStore } from '../stores/appStore';

// Mặc định gọi cùng origin để Vite/Nginx proxy request đến backend. Nhờ đó
// frontend hoạt động với localhost, IP LAN hoặc domain mà không hard-code host.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || '',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAppStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Phiên hết hạn ở API nghiệp vụ phải quay về đăng nhập. Lỗi từ chính API
// đăng nhập được giữ lại để form hiển thị thông báo tiếng Việt tại chỗ.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/api/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      useAppStore.getState().logout();
      if (window.location.pathname !== '/') window.location.assign('/');
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
