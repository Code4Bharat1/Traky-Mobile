import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import client from '../../api/client';
import { Activity, Clock } from 'lucide-react-native';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await client.get('/activity-logs?limit=50');
      setLogs(response.data.data || []);
    } catch (error) {
      console.error("Failed to load activity logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row items-center mb-2">
        <Activity size={14} color="#adc6ff" className="mr-2" />
        <Text className="text-white text-xs font-bold uppercase tracking-widest flex-1">
          {item.action || 'ACTIVITY'}
        </Text>
        <View className="flex-row items-center">
          <Clock size={12} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-[10px]">{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Text className="text-[#c2c6d6] text-sm leading-5">
        <Text className="font-bold text-white">{item.userId?.name || 'System'}</Text> {item.details || `performed an action on ${item.entity}`}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <Text className="text-white text-2xl font-bold mb-6 mt-4 tracking-wider">SYSTEM AUDIT LOGS</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No activity logs recorded yet.</Text>
          }
        />
      )}
    </View>
  );
}
