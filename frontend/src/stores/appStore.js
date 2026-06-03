import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock Data
const MOCK_PROJECTS = [
  { id: 'p1', key: 'happy', name: 'Happy Project' },
  { id: 'p2', key: 'creative', name: 'Creative Project' },
  { id: 'p3', key: 'pilot', name: 'Pilot Project' },
  { id: 'p4', key: 'global', name: 'Global Project' },
];

const MOCK_USERS = [
  { username: 'happyc.admin', password: '123456', role: 'Admin', projectKey: 'all' },
  { username: 'happyc.marvel', password: '123456', role: 'Marvel', projectKey: 'all' },
  { username: 'happyc.seller.happy', password: '123456', role: 'Seller', projectKey: 'happy' },
  { username: 'happyc.seller.creative', password: '123456', role: 'Seller', projectKey: 'creative' },
  { username: 'happyc.seller.pilot', password: '123456', role: 'Seller', projectKey: 'pilot' },
  { username: 'happyc.seller.global', password: '123456', role: 'Seller', projectKey: 'global' },
  { username: 'happyc.pd.happy', password: '123456', role: 'Product Design', projectKey: 'happy' },
  { username: 'happyc.pd.creative', password: '123456', role: 'Product Design', projectKey: 'creative' },
  { username: 'happyc.pd.pilot', password: '123456', role: 'Product Design', projectKey: 'pilot' },
  { username: 'happyc.pd.global', password: '123456', role: 'Product Design', projectKey: 'global' },
];

// Initial dummy data for testing
const defaultProductData = {
  images: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80'
  ],
  videos: [],
  title: "Mock Product",
  brand: "Mock Brand",
  price: 19.99,
  description: "This is a mock description.",
  bulletPoints: ["Feature 1", "Feature 2"],
  aPlusImages: []
};

const MOCK_TASKS = {
  'p1': [
    { id: 't1', title: 'Task 1: Hanes Undershirts Preview', type: 'Amazon', status: 'Pending Uploads', productData: defaultProductData }
  ],
  'p2': [],
  'p3': [],
  'p4': []
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      user: null, // The current logged in user object
      role: null, // 'Admin', 'Seller', 'Marvel', 'Product Design'
      projects: MOCK_PROJECTS,
      tasks: MOCK_TASKS,
      
      login: (username, password) => {
        const user = MOCK_USERS.find(u => u.username === username && u.password === password);
        if (user) {
          set({ user, role: user.role });
          return true;
        }
        return false;
      },
      
      logout: () => set({ user: null, role: null }),
      
      addTask: (projectId, taskData) => set((state) => {
        const projectTasks = state.tasks[projectId] || [];
        return {
          tasks: {
            ...state.tasks,
            [projectId]: [...projectTasks, { ...taskData, id: `t${Date.now()}`, status: 'Pending Uploads', productData: defaultProductData }]
          }
        };
      }),
      
      updateTaskProductData: (projectId, taskId, newProductData) => set((state) => {
        const projectTasks = state.tasks[projectId] || [];
        const updatedTasks = projectTasks.map(task => 
          task.id === taskId 
            ? { ...task, productData: { ...task.productData, ...newProductData } }
            : task
        );
        return {
          tasks: {
            ...state.tasks,
            [projectId]: updatedTasks
          }
        };
      }),
    }),
    {
      name: 'amazon-preview-session', // name of the item in the storage (must be unique)
      partialize: (state) => ({ user: state.user, role: state.role, tasks: state.tasks }), // persist user session and tasks
    }
  )
);
