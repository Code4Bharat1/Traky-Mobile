import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { getAllLeaves } from '../../api/services';
import { CalendarCheck, User, Clock, Check, X } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function LeaveApprovalsScreen() {
  const { isDarkMode } = useThemeStore();
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

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => (
    <View className={`rounded-lg p-4 mb-3 border ${bgCard} ${borderColor}`}>
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <User size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
          <Text className={`text-base font-bold ${textColor}`}>{item.userId?.name || item.user?.name || 'Unknown Employee'}</Text>
        </View>
        <View className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${item.status === 'approved' ? 'bg-[#10b9811a] border-[#10b9814a]' : item.status === 'rejected' ? 'bg-[#ef44441a] border-[#ef44444a]' : 'bg-[#f59e0b1a] border-[#f59e0b4a]'}`}>
          <Text className={`text-[10px] uppercase font-bold ${item.status === 'approved' ? 'text-[#10b981]' : item.status === 'rejected' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>
      
      <Text className={`text-sm mb-3 ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>
        {item.reason || 'No reason provided'}
      </Text>

      <View className={`flex-row justify-between items-center mt-2 border-t pt-3 ${borderColor}`}>
        <View className="flex-row items-center">
          <Clock size={14} color={isDarkMode ? "#6b7280" : "#9ca3af"} className="mr-1" />
          <Text className={`text-xs ${isDarkMode ? 'text-[#6b7280]' : 'text-gray-500'}`}>
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
      <View className={`flex-1 items-center justify-center ${bgScreen}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
      </View>
    );
  }

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      <View className="mb-6 mt-4">
        <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${textMuted}`}>ATTENDANCE MANAGEMENT</Text>
        <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Leave Approvals</Text>
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

      {filteredLeaves.length === 0 ? (
        <View className={`border rounded-lg p-10 items-center justify-center mt-2 flex-1 max-h-[300px] ${isDarkMode ? 'bg-[#161616]' : 'bg-gray-100'} ${borderColor}`}>
          <CalendarCheck size={40} color={isDarkMode ? "#888" : "#9ca3af"} strokeWidth={1} className="mb-4" />
          <Text className={`font-bold text-base tracking-wider mb-2 ${textColor}`}>No leave requests found</Text>
          <Text className={`text-xs text-center ${textMuted}`}>
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
