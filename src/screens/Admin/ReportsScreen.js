import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import client from '../../api/client';
import { BarChart2, PieChart, TrendingUp } from 'lucide-react-native';

export default function ReportsScreen() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const response = await client.get('/reports');
      setReports(response.data.data || response.data || null);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-[#131313] items-center justify-center">
        <ActivityIndicator size="large" color="#adc6ff" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">COMPANY REPORTS</Text>
      </View>

      <View className="bg-[#1c1b1b] rounded-lg p-5 border border-[#ffffff1a] mb-4">
        <View className="flex-row items-center mb-4">
          <BarChart2 size={20} color="#adc6ff" className="mr-2" />
          <Text className="text-white font-bold text-lg">Task Completion Rate</Text>
        </View>
        <Text className="text-[#c2c6d6] text-sm mb-2">Based on current month's performance.</Text>
        <Text className="text-white text-3xl font-bold">{reports?.taskCompletionRate || '0%'}</Text>
      </View>

      <View className="bg-[#1c1b1b] rounded-lg p-5 border border-[#ffffff1a] mb-4">
        <View className="flex-row items-center mb-4">
          <TrendingUp size={20} color="#86efac" className="mr-2" />
          <Text className="text-white font-bold text-lg">Productivity Score</Text>
        </View>
        <Text className="text-[#c2c6d6] text-sm mb-2">Aggregate employee behaviour score.</Text>
        <Text className="text-white text-3xl font-bold">{reports?.productivityScore || '0'}</Text>
      </View>

      <View className="bg-[#1c1b1b] rounded-lg p-5 border border-[#ffffff1a]">
        <View className="flex-row items-center mb-4">
          <PieChart size={20} color="#fca5a5" className="mr-2" />
          <Text className="text-white font-bold text-lg">Resource Allocation</Text>
        </View>
        <Text className="text-[#c2c6d6] text-sm">Detailed resource graphs are only available on the web dashboard.</Text>
      </View>

    </ScrollView>
  );
}
