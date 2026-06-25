import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { Bell, Clock, CheckCircle } from 'lucide-react-native';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await client.get('/notifications');
      setNotifications(response.data.notifications || response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => (
    <View className={`rounded-lg p-4 mb-3 border ${item.read ? 'bg-[#131313] border-[#ffffff0a]' : 'bg-[#1c1b1b] border-[#adc6ff50]'}`}>
      <View className="flex-row items-start">
        <View className={`h-2 w-2 rounded-full mt-1.5 mr-3 ${item.read ? 'bg-transparent' : 'bg-[#adc6ff]'}`} />
        <View className="flex-1">
          <Text className={`text-base font-bold mb-1 ${item.read ? 'text-[#c2c6d6]' : 'text-white'}`}>
            {item.title || 'System Notification'}
          </Text>
          <Text className="text-[#888] text-sm leading-5 mb-2">
            {item.message || item.body || 'No details provided.'}
          </Text>
          <View className="flex-row items-center">
            <Clock size={12} color="#6b7280" className="mr-1" />
            <Text className="text-[#6b7280] text-xs">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">NOTIFICATIONS</Text>
        <TouchableOpacity className="flex-row items-center">
          <CheckCircle size={16} color="#adc6ff" className="mr-1" />
          <Text className="text-[#adc6ff] font-bold text-xs">Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={notifications}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Bell size={48} color="#333" className="mb-4" />
              <Text className="text-[#c2c6d6] text-center">You have no notifications.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
