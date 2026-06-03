import { create } from 'zustand';

// Mock Data
const MOCK_PROJECTS = [
  { id: 'p1', name: 'Happy Project' },
  { id: 'p2', name: 'Creative Project' },
  { id: 'p3', name: 'Pilot Project' },
  { id: 'p4', name: 'Global Project' },
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

export const useAppStore = create((set) => ({
  role: null, // 'Admin', 'Seller', 'Marvel', 'Product Design'
  projects: MOCK_PROJECTS,
  tasks: MOCK_TASKS,
  
  setRole: (role) => set({ role }),
  
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
}));
