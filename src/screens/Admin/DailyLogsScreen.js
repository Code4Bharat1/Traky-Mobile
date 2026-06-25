import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import client from '../../api/client';
import { ClipboardList, Clock, User } from 'lucide-react-native';

export default function DailyLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await client.get('/daily-logs');
      setLogs(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load daily logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <ClipboardList size={18} color="#adc6ff" className="mr-2" />
          <Text className="text-white text-base font-bold">{item.taskTitle || 'General Log'}</Text>
        </View>
        <Text className="text-[#adc6ff] font-bold">{item.hoursSpent ? `${item.hoursSpent} hrs` : ''}</Text>
      </View>

      {item.description && (
        <Text className="text-[#c2c6d6] text-sm mb-3">{item.description}</Text>
      )}

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
        <Text className="text-white text-2xl font-bold tracking-wider">DAILY LOGS</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={logs}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No logs found.</Text>
          }
        />
      )}
    </View>
  );
}
