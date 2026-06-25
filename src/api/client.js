import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 192.168.11.117 is your physical machine's local Wi-Fi IP address
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.11.117:5000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
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
