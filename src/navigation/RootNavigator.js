import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';

import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import DeptHeadNavigator from './DeptHeadNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import LeadNavigator from './LeadNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { role, token, isLoading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#2573e6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <Stack.Screen name="AuthRoot" component={AuthNavigator} />
      ) : role === 'admin' ? (
        <Stack.Screen name="AdminRoot" component={AdminNavigator} />
      ) : role === 'department_head' || role === 'dept_head' ? (
        <Stack.Screen name="DeptHeadRoot" component={DeptHeadNavigator} />
      ) : role === 'lead' ? (
        <Stack.Screen name="LeadRoot" component={LeadNavigator} />
      ) : (
        <Stack.Screen name="EmployeeRoot" component={EmployeeNavigator} />
      )}
    </Stack.Navigator>
  );
}
