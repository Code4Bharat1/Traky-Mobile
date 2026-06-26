import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import client from '../../api/client';
import { CalendarCheck, User, Clock, Check, X } from 'lucide-react-native';

export default function LeaveApprovalsScreen() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  const fetchLeaves = async () => {
    try {
      const response = await client.get('/leave/all');
      setLeaves(response.data.records || response.data.data || []);
    } catch (error) {
      console.error("Failed to load leave requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

  const filteredLeaves = leaves.filter(leave => {
    if (activeTab === 'ALL') return true;
    return leave.status?.toUpperCase() === activeTab;
  });

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <User size={18} color="#adc6ff" className="mr-2" />
          <Text className="text-white text-base font-bold">{item.userId?.name || item.user?.name || 'Unknown Employee'}</Text>
        </View>
        <View className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${item.status === 'approved' ? 'bg-[#10b9811a] border-[#10b9814a] text-[#10b981]' : item.status === 'rejected' ? 'bg-[#ef44441a] border-[#ef44444a] text-[#ef4444]' : 'bg-[#f59e0b1a] border-[#f59e0b4a] text-[#f59e0b]'}`}>
          <Text className={`text-[10px] uppercase font-bold ${item.status === 'approved' ? 'text-[#10b981]' : item.status === 'rejected' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
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
            <TouchableOpacity className="bg-[#ef44441a] border border-[#ef44444a] p-1.5 rounded mr-2">
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#10b9811a] border border-[#10b9814a] p-1.5 rounded">
              <Check size={16} color="#10b981" />
            </TouchableOpacity>
          </View>
        )}
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
        <Text className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-1">ATTENDANCE MANAGEMENT</Text>
        <Text className="text-white text-2xl font-bold tracking-wider">Leave Approvals</Text>
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

      {filteredLeaves.length === 0 ? (
        <View className="bg-[#161616] border border-[#ffffff1a] rounded-lg p-10 items-center justify-center mt-2 flex-1 max-h-[300px]">
          <CalendarCheck size={40} color="#888" strokeWidth={1} className="mb-4" />
          <Text className="text-white font-bold text-base tracking-wider mb-2">No leave requests found</Text>
          <Text className="text-[#888] text-xs text-center">
            {activeTab === 'ALL' 
              ? 'There are no leave requests to show.'
              : `There are no ${activeTab.toLowerCase()} leave requests.`}
          </Text>
        </View>
      ) : (
        <FlatList 
          data={filteredLeaves}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
