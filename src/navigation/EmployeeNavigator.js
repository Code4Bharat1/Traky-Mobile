import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, LogOut } from 'lucide-react-native';
import useAuthStore from '../store/authStore';

import EmployeeDashboard from '../screens/Employee/EmployeeDashboard';

const Tab = createBottomTabNavigator();

export default function EmployeeNavigator() {
  const logout = useAuthStore(state => state.logout);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0f172a',
        tabBarStyle: { backgroundColor: '#ffffff' },
        tabBarActiveTintColor: '#2573e6',
        headerRight: () => (
          <TouchableOpacity onPress={() => logout()} style={{ marginRight: 16 }}>
            <LogOut color="#ef4444" size={24} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen 
        name="EmployeeDashboard" 
        component={EmployeeDashboard} 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
}
