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
          username: username,
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

      googleLogin: async (credential) => {
        const response = await axiosInstance.post('/api/auth/google', { credential });

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
        const projectData = response.data;
        set({ projects: projectData });
        return projectData;
      },

      fetchTasks: async (projectId) => {
        const response = await axiosInstance.get(`/api/projects/${projectId}/tasks`);
        const taskData = response.data;
        set((state) => ({
          tasks: { ...state.tasks, [projectId]: taskData },
        }));
        return taskData;
      },

      fetchTask: async (projectId, taskId) => {
        const response = await axiosInstance.get(`/api/tasks/${taskId}`);
        set((state) => {
          const existing = state.tasks[projectId] || [];
          const updated = existing.some(t => t.id === taskId)
            ? existing.map(t => t.id === taskId ? response.data : t)
            : [...existing, response.data];
          return { tasks: { ...state.tasks, [projectId]: updated } };
        });
        return response.data;
      },

      updateTaskStatus: async (taskId, status) => {
        const cachedTask = Object.values(get().tasks)
          .flat()
          .find((task) => task.id === taskId);
        const currentTask = cachedTask
          || (await axiosInstance.get(`/api/tasks/${taskId}`)).data;
        const response = await axiosInstance.put(`/api/tasks/${taskId}`, {
          title: currentTask.title,
          platform: currentTask.platform,
          category: currentTask.category,
          status,
        });
        const updatedTask = response.data;
        set((state) => {
          let replaced = false;
          const updatedTasks = Object.fromEntries(
            Object.entries(state.tasks).map(([projectId, projectTasks]) => [
              projectId,
              projectTasks.map((task) => {
                if (task.id !== taskId) return task;
                replaced = true;
                return updatedTask;
              }),
            ])
          );

          if (!replaced && updatedTask.projectId) {
            updatedTasks[updatedTask.projectId] = [
              ...(updatedTasks[updatedTask.projectId] || []),
              updatedTask,
            ];
          }

          return { tasks: updatedTasks };
        });
        return updatedTask;
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
