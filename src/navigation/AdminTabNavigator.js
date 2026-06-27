import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, CheckSquare, ClipboardList, Trophy, Settings } from 'lucide-react-native';
import useThemeStore from '../store/themeStore';

import AdminDashboard from '../screens/Admin/AdminDashboard';
import TasksScreen from '../screens/Admin/TasksScreen';
import DailyLogsScreen from '../screens/Admin/DailyLogsScreen';
import LeaderboardScreen from '../screens/Admin/LeaderboardScreen';
import SettingsScreen from '../screens/Admin/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  const { isDarkMode } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#131313' : '#ffffff',
          borderTopColor: isDarkMode ? '#ffffff1a' : '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isDarkMode ? '#adc6ff' : '#2573e6',
        tabBarInactiveTintColor: isDarkMode ? '#888' : '#6b7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={AdminDashboard} 
        options={{ 
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="DailyLogs" 
        component={DailyLogsScreen} 
        options={{ 
          title: 'Daily Logs',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> 
        }} 
      />
    </Tab.Navigator>
  );
}
