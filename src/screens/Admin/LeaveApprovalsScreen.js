import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { CalendarCheck, User, Clock, Check, X } from 'lucide-react-native';

export default function LeaveApprovalsScreen() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const response = await client.get('/leave/approvals');
      setLeaves(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load leave requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <User size={18} color="#adc6ff" className="mr-2" />
          <Text className="text-white text-base font-bold">{item.user?.name || 'Unknown Employee'}</Text>
        </View>
        <View className={`px-2 py-1 rounded text-xs ${item.status === 'approved' ? 'bg-green-900/50' : item.status === 'rejected' ? 'bg-red-900/50' : 'bg-yellow-900/50'}`}>
          <Text className={`text-xs uppercase font-bold ${item.status === 'approved' ? 'text-green-400' : item.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>
      
      <Text className="text-[#c2c6d6] text-sm mb-3">
        {item.reason || 'No reason provided'}
      </Text>

      <View className="flex-row justify-between items-center mt-2 border-t border-[#ffffff1a] pt-3">
        <View className="flex-row items-center">
          <Clock size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">
            {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} - {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        
        {item.status === 'pending' && (
          <View className="flex-row">
            <TouchableOpacity className="bg-red-900/80 p-1.5 rounded-full mr-2">
              <X size={16} color="#fca5a5" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-green-900/80 p-1.5 rounded-full">
              <Check size={16} color="#86efac" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">LEAVE APPROVALS</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={leaves}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No leave requests found.</Text>
          }
        />
      )}
    </View>
  );
}
