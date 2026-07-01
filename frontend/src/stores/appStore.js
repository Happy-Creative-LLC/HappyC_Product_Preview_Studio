import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../api/axiosConfig';

export const useAppStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      token: null,
      projects: [],
      tasks: {},

      login: async (username, password) => {
        const response = await axiosInstance.post('/api/auth/login', {
          email: username,
          password: password,
        });

        if (response.data?.token) {
          set({
            user: response.data,
            role: response.data.role,
            token: response.data.token,
          });
          return true;
        }
        return false;
      },

      logout: () => set({ user: null, role: null, token: null, projects: [], tasks: {} }),

      fetchProjects: async () => {
        const response = await axiosInstance.get('/api/projects');
        set({ projects: response.data });
      },

      fetchTasks: async (projectId) => {
        const response = await axiosInstance.get(`/api/projects/${projectId}/tasks`);
        set((state) => ({
          tasks: { ...state.tasks, [projectId]: response.data },
        }));
      },

      createTask: async (projectId, taskData) => {
        const response = await axiosInstance.post(`/api/projects/${projectId}/tasks`, taskData);
        set((state) => ({
          tasks: {
            ...state.tasks,
            [projectId]: [...(state.tasks[projectId] || []), response.data],
          },
        }));
        return response.data;
      },

      updateTaskProductData: (projectId, taskId, newProductData) =>
        set((state) => {
          const projectTasks = state.tasks[projectId] || [];
          return {
            tasks: {
              ...state.tasks,
              [projectId]: projectTasks.map((task) =>
                task.id === taskId
                  ? { ...task, productData: { ...task.productData, ...newProductData } }
                  : task
              ),
            },
          };
        }),
    }),
    {
      name: 'amazon-preview-session',
      partialize: (state) => ({ user: state.user, role: state.role, token: state.token }),
    }
  )
);
