import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { FileBarChart, User, ChevronRight } from 'lucide-react-native';

export default function EmployeeReportScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const response = await client.get('/users');
      setEmployees(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load employee reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a] flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="h-10 w-10 rounded-full bg-[#2a2a2a] items-center justify-center mr-3">
          <User size={18} color="#adc6ff" />
        </View>
        <View>
          <Text className="text-white font-bold text-base">{item.name}</Text>
          <Text className="text-[#6b7280] text-xs">{item.department?.departmentName || item.globalRole}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <Text className="text-[#adc6ff] font-bold mr-2">{item.behaviourScore || 0} pts</Text>
        <ChevronRight size={16} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">EMPLOYEE REPORTS</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={employees}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No employees found.</Text>
          }
        />
      )}
    </View>
  );
}
