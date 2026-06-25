import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { CreditCard, User, Clock, Check, X } from 'lucide-react-native';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const response = await client.get('/expenses');
      setExpenses(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <CreditCard size={18} color="#adc6ff" className="mr-2" />
          <Text className="text-white text-base font-bold flex-1">{item.title || 'Expense Request'}</Text>
        </View>
        <Text className="text-white font-bold text-lg">₹{item.amount || 0}</Text>
      </View>

      <Text className="text-[#c2c6d6] text-sm mb-3">
        {item.description || 'No description provided'}
      </Text>

      <View className="flex-row justify-between items-center mt-2 border-t border-[#ffffff1a] pt-3">
        <View className="flex-row items-center">
          <User size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">
            {item.user?.name || 'Unknown User'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Clock size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">
            {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">EXPENSES</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={expenses}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No expenses found.</Text>
          }
        />
      )}
    </View>
  );
}
