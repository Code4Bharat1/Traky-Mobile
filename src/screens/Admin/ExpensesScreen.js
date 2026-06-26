import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { CreditCard } from 'lucide-react-native';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  const fetchExpenses = async () => {
    try {
      // Changed to /expenses/all instead of /expenses
      const response = await client.get('/expenses/all');
      setExpenses(response.data.records || response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

  const filteredExpenses = expenses.filter(expense => {
    if (activeTab === 'ALL') return true;
    return expense.status?.toUpperCase() === activeTab;
  });

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between mb-2">
        <Text className="text-white font-bold">{item.title}</Text>
        <Text className="text-[#adc6ff] font-bold">₹{item.amount}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-[#6b7280] text-xs">{item.category}</Text>
        <Text className={`text-xs font-bold ${
          item.status === 'approved' ? 'text-[#10b981]' : 
          item.status === 'rejected' ? 'text-[#ef4444]' : 
          'text-[#f59e0b]'
        }`}>
          {item.status?.toUpperCase() || 'PENDING'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#131313] items-center justify-center">
        <ActivityIndicator size="large" color="#adc6ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="mb-6 mt-4">
        <Text className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-1">ADMIN APPROVALS</Text>
        <Text className="text-white text-2xl font-bold tracking-wider">Expense Requests</Text>
      </View>

      <View className="flex-row mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${activeTab === tab ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#1c1b1b] border-[#ffffff1a]'}`}
            >
              <Text className={`text-[10px] font-bold tracking-widest ${activeTab === tab ? 'text-[#131313]' : 'text-white'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredExpenses.length === 0 ? (
        <View className="bg-[#161616] border border-[#ffffff1a] rounded-lg p-10 items-center justify-center mt-2 flex-1 max-h-[300px]">
          <CreditCard size={40} color="#888" strokeWidth={1} className="mb-4" />
          <Text className="text-white font-bold text-base tracking-wider mb-2">No expense requests</Text>
          <Text className="text-[#888] text-xs text-center">
            {activeTab === 'ALL' 
              ? 'There are no expense requests to show.'
              : `There are no ${activeTab.toLowerCase()} expense requests to show.`}
          </Text>
        </View>
      ) : (
        <FlatList 
          data={filteredExpenses}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
