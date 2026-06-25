import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { DollarSign, User, Calendar, CreditCard } from 'lucide-react-native';

export default function SalaryScreen() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalaries = async () => {
    try {
      const response = await client.get('/salary');
      setSalaries(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load salaries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <User size={18} color="#adc6ff" className="mr-2" />
          <Text className="text-white text-base font-bold">{item.user?.name || 'Unknown Employee'}</Text>
        </View>
        <Text className="text-green-400 font-bold text-lg">₹{item.finalAmount || item.amount || 0}</Text>
      </View>

      <View className="flex-row justify-between items-center mt-2 border-t border-[#ffffff1a] pt-3">
        <View className="flex-row items-center">
          <Calendar size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">
            {item.month || 'Current Month'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <CreditCard size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs uppercase font-bold">
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">SALARY</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={salaries}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No salary records found.</Text>
          }
        />
      )}
    </View>
  );
}
