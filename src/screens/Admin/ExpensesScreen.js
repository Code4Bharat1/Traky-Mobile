import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import client from '../../api/client';
import { CreditCard } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function ExpensesScreen() {
  const { isDarkMode } = useThemeStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  const fetchExpenses = async () => {
    try {
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

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => (
    <View className={`rounded-lg p-4 mb-3 border ${bgCard} ${borderColor}`}>
      <View className="flex-row justify-between mb-2">
        <Text className={`font-bold ${textColor}`}>{item.title}</Text>
        <Text className={`font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>₹{item.amount}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className={`text-xs ${isDarkMode ? 'text-[#6b7280]' : 'text-gray-500'}`}>{item.category}</Text>
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
      <View className={`flex-1 items-center justify-center ${bgScreen}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
      </View>
    );
  }

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      <View className="mb-6 mt-4">
        <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${textMuted}`}>ADMIN APPROVALS</Text>
        <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Expense Requests</Text>
      </View>

      <View className="flex-row mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${activeTab === tab ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : `${bgCard} ${borderColor}`}`}
            >
              <Text className={`text-[10px] font-bold tracking-widest ${activeTab === tab ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredExpenses.length === 0 ? (
        <View className={`border rounded-lg p-10 items-center justify-center mt-2 flex-1 max-h-[300px] ${isDarkMode ? 'bg-[#161616]' : 'bg-gray-100'} ${borderColor}`}>
          <CreditCard size={40} color={isDarkMode ? "#888" : "#9ca3af"} strokeWidth={1} className="mb-4" />
          <Text className={`font-bold text-base tracking-wider mb-2 ${textColor}`}>No expense requests</Text>
          <Text className={`text-xs text-center ${textMuted}`}>
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
