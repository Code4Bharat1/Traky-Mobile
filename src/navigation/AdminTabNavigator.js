import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, CheckSquare, ClipboardList, Trophy, Settings } from 'lucide-react-native';

import AdminDashboard from '../screens/Admin/AdminDashboard';
import TasksScreen from '../screens/Admin/TasksScreen';
import DailyLogsScreen from '../screens/Admin/DailyLogsScreen';
import LeaderboardScreen from '../screens/Admin/LeaderboardScreen';
import SettingsScreen from '../screens/Admin/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#131313',
          borderTopColor: '#ffffff1a',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#adc6ff',
        tabBarInactiveTintColor: '#888',
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
