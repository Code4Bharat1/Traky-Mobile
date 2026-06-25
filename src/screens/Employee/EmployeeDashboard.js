import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import useAuthStore from '../../store/authStore';

export default function EmployeeDashboard() {
  const [testInput, setTestInput] = useState('');
  const { logout, user } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-surface p-4">
      <Text className="text-2xl font-bold text-foreground mb-6">Employee Dashboard</Text>
      
      <Card className="mb-6">
        <Text className="text-lg font-bold text-foreground mb-2">UI Component Showcase</Text>
        <Text className="text-foreground-muted mb-4">
          These components use the shared design tokens from globals.css.
        </Text>
        
        <Input 
          label="Test Input" 
          placeholder="Enter something..." 
          value={testInput}
          onChangeText={setTestInput}
        />
        
        <View className="flex-row justify-between mt-2">
          <Button title="Primary" variant="primary" style="flex-1 mr-2" />
          <Button title="Outline" variant="outline" style="flex-1" />
        </View>
      </Card>
      
    </ScrollView>
  );
}
