import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * URL resolution strategy:
 *  - EXPO_PUBLIC_API_URL env var always wins (set this for physical devices)
 *  - Web (browser)       → localhost  (browser runs on same machine as backend)
 *  - Android emulator    → 10.0.2.2   (AVD's alias for the host machine)
 *  - iOS simulator       → localhost  (shares host network)
 *  - Physical device     → set EXPO_PUBLIC_API_URL to your LAN IP e.g.
 *                          http://192.168.11.117:5000/api/v1
 */
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1'; // Default for Android Emulator
  }
  return 'http://192.168.2.118:5000/api/v1'; // Hardcoded for physical device testing
}

const BASE_URL = resolveBaseUrl();

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout — fail fast instead of hanging
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject token on requests
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global 401s
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g., token expired)
      // The authStore will handle the actual logout logic by clearing state
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default client;
