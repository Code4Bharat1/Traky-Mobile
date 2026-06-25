import React from 'react';
import { View, Text } from 'react-native';
import useAuthStore from '../../store/authStore';
import Button from '../../components/Button';

export default function DeptHeadDashboard() {
  const { logout, user } = useAuthStore();

  return (
    <View className="flex-1 bg-background items-center justify-center p-4">
      <Text className="text-2xl font-bold text-primary mb-4">Department Head Dashboard</Text>
      <Text className="text-muted-foreground mb-8 text-center">
        Welcome {user?.firstName || 'Manager'}! Oversee your team's projects and tasks here.
      </Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
