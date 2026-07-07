import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  token: null,
  isLoading: true,
  error: null,
  requirePasswordChange: false,
  tempToken: null,

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

      // Verify token, fetch user details and role permissions
      const [meResponse, rolesResponse] = await Promise.all([
        client.get('/auth/me'),
        client.get('/companies/permissions/roles').catch(() => ({ data: { rolePermissions: {} } }))
      ]);
      
      const user = meResponse.data.user || meResponse.data.data?.user;
      
      // Extract main role
      let role = user?.role?.name || user?.role || user?.globalRole || 'employee';
      role = role.toLowerCase();
      let roleKey = 'employee';
      if (['department_head', 'lead'].includes(role)) roleKey = role;

      const rolePerms = rolesResponse.data?.rolePermissions?.[roleKey] || {};
      const customPerms = user?.customPermissions || {};
      
      // Merge permissions
      const mergedPermissions = {};
      const allResources = new Set([...Object.keys(rolePerms), ...Object.keys(customPerms)]);
      allResources.forEach(resource => {
        mergedPermissions[resource] = {
          ...(rolePerms[resource] || { create: false, read: false, update: false, delete: false }),
          ...(customPerms[resource] || {})
        };
      });
      user.permissions = mergedPermissions;

      set({ user, role, isLoading: false, error: null });
    } catch (error) {
      const isNetworkError = error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
      if (isNetworkError) {
        // Server unreachable — clear stale token and go to login
        console.warn('Server unreachable on startup, clearing session:', error.message);
      } else {
        console.warn('Auth initialization session ended or invalid:', error.message);
      }
      await AsyncStorage.removeItem('token');
      set({ user: null, role: null, token: null, isLoading: false, error: null });
    }
  },

  // Perform login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.post('/auth/login', { email: email.trim(), password: password.trim() });

      if (response.data.requirePasswordChange) {
        set({ 
          isLoading: false, 
          requirePasswordChange: true, 
          tempToken: response.data.tempToken 
        });
        return;
      }

      const accessToken = response.data.accessToken || response.data.token;
      if (!accessToken) throw new Error("No access token returned from server");

      await AsyncStorage.setItem('token', accessToken);

      // Login API only returns the token, so we immediately initAuth to fetch user details
      await get().initAuth();

    } catch (error) {
      console.error("Login Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      let msg;
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        msg = 'Request timed out. Check that the server is running.';
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        msg = 'Cannot reach server. Make sure the backend is running and your device is on the same Wi-Fi network.';
      } else {
        msg = error.response?.data?.error || error.response?.data?.message || 'Login failed. Please try again.';
      }

      set({ isLoading: false, error: msg });
    }
  },

  changePassword: async (newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const { tempToken } = get();
      const response = await client.post('/auth/change-password', 
        { newPassword }, 
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      set({ requirePasswordChange: false, tempToken: null, isLoading: false, error: null });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to change password';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  cancelPasswordChange: () => {
    set({ requirePasswordChange: false, tempToken: null, error: null });
  },

  // Perform logout
  logout: async () => {
    await AsyncStorage.removeItem('token');
    // Optional: await client.get('/auth/logout');
    set({ user: null, role: null, token: null, error: null });
  }
}));

export default useAuthStore;
