import axios from 'axios';
import { useAppStore } from '../stores/appStore';

// Cấu hình base URL tới backend Spring Boot
const axiosInstance = axios.create({
  baseURL: `http://${window.location.hostname}:8081`,
});

// Interceptor để tự động đính kèm JWT token vào mọi request
axiosInstance.interceptors.request.use(
  (config) => {
    // Lấy state từ Zustand
    const token = useAppStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
