import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:8081/api/comments';

export const useCommentStore = create((set, get) => ({
  comments: [],
  currentRole: 'SELLER', // default role
  loading: false,

  setRole: (role) => {
    set({ currentRole: role });
    // Refetch comments if needed, but usually handled by components
  },

  fetchComments: async (component) => {
    set({ loading: true });
    try {
      const { currentRole } = get();
      const response = await axios.get(`${API_URL}?role=${currentRole}${component ? `&component=${component}` : ''}`);
      set({ comments: response.data, loading: false });
    } catch (error) {
      console.error("Failed to fetch comments", error);
      set({ comments: [], loading: false });
    }
  },

  addComment: async (content, component) => {
    try {
      const { currentRole } = get();
      const newComment = {
        content,
        authorRole: currentRole,
        targetComponent: component
      };
      const response = await axios.post(API_URL, newComment);
      set((state) => ({ comments: [response.data, ...state.comments] }));
    } catch (error) {
      console.error("Failed to add comment", error);
      alert("You do not have permission to comment on this component.");
    }
  }
}));
