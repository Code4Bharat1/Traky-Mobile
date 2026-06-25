import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  token: null,
  isLoading: true,
  error: null,

  // Initialize store from AsyncStorage on app start
  initAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        set({ isLoading: false, user: null, role: null, token: null });
        return;
      }

      set({ token });
      
      // Verify token and fetch user details
      const response = await client.get('/auth/me');
      const user = response.data.user || response.data.data?.user;
      
      // Extract main role (backend usually returns role inside user or from check-permissions)
      const role = user?.role?.name || user?.role || 'employee';

      set({ user, role, isLoading: false, error: null });
    } catch (error) {
      console.error('Auth initialization error:', error);
      await AsyncStorage.removeItem('token');
      set({ user: null, role: null, token: null, isLoading: false, error: 'Session expired' });
    }
  },

  // Perform login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.post('/auth/login', { email, password });
      
      const accessToken = response.data.accessToken || response.data.token;
      if (!accessToken) throw new Error("No access token returned from server");

      await AsyncStorage.setItem('token', accessToken);
      
      // Login API only returns the token, so we immediately initAuth to fetch user details
      await get().initAuth();
      
    } catch (error) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: msg });
    }
  },

  // Perform logout
  logout: async () => {
    await AsyncStorage.removeItem('token');
    // Optional: await client.get('/auth/logout');
    set({ user: null, role: null, token: null, error: null });
  }
}));

export default useAuthStore;
