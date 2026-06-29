import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useBranchStore = create((set) => ({
  activeBranchId: null,
  activeBranch: null,

  initBranch: async (branches) => {
    try {
      const stored = await AsyncStorage.getItem('activeBranchId');
      if (stored && branches && branches.some(b => b._id === stored)) {
        set({
          activeBranchId: stored,
          activeBranch: branches.find(b => b._id === stored) || null
        });
      } else {
        await AsyncStorage.removeItem('activeBranchId');
        set({ activeBranchId: null, activeBranch: null });
      }
    } catch (e) {
      console.warn("Failed to load active branch", e);
    }
  },

  switchBranch: async (branch) => {
    if (!branch) {
      // Clear branch
      await AsyncStorage.removeItem('activeBranchId');
      set({ activeBranchId: null, activeBranch: null });
    } else {
      await AsyncStorage.setItem('activeBranchId', branch._id);
      set({ activeBranchId: branch._id, activeBranch: branch });
    }
  }
}));

export default useBranchStore;
