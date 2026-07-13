import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, TextInput, TouchableOpacity, Modal } from 'react-native';
import { getReports } from '../../api/services';
import { Search, ChevronDown } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

import client from '../../api/client';

export default function ReportsScreen() {
  const { isDarkMode } = useThemeStore();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedWeekly, setSelectedWeekly] = useState('All');
  const [selectedMonthly, setSelectedMonthly] = useState('All');

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState(''); 

  const fetchReports = async () => {
    try {
      const response = await client.get('/reports');
      const data = response.data.data || response.data || [];
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    let filtered = reports;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const nameMatch = r.createdBy?.name?.toLowerCase().includes(lowerQuery);
        const notesMatch = r.notes?.toLowerCase().includes(lowerQuery);
        const projMatch = r.projectId?.name?.toLowerCase().includes(lowerQuery);
        return nameMatch || notesMatch || projMatch;
      });
    }

    if (selectedType !== 'All Types') {
      filtered = filtered.filter(r => {
        const typeLabel = Array.isArray(r.types) ? r.types.join(', ') : (r.types || 'DEMO');
        return typeLabel.includes(selectedType);
      });
    }

    if (selectedWeekly !== 'All') {
      const isYes = selectedWeekly === 'Yes';
      filtered = filtered.filter(r => Boolean(r.weeklyIncluded) === isYes);
    }

    if (selectedMonthly !== 'All') {
      const isYes = selectedMonthly === 'Yes';
      filtered = filtered.filter(r => Boolean(r.monthlyIncluded) === isYes);
    }

    setFilteredReports(filtered);
  }, [searchQuery, selectedType, selectedWeekly, selectedMonthly, reports]);

  const totalReports = reports.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonth = reports.filter(r => {
    const d = new Date(r.date || r.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const inWeekly = reports.filter(r => r.weeklyIncluded).length;
  const inMonthly = reports.filter(r => r.monthlyIncluded).length;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgRow = isDarkMode ? 'bg-[#161616]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const openFilter = (type) => {
    setActiveFilterType(type);
    setFilterModalVisible(true);
  };

  const getFilterOptions = () => {
    if (activeFilterType === 'Type') return ['All Types', 'Call', 'Email', 'Demo', 'WhatsApp Update', 'Review Meeting'];
    if (activeFilterType === 'Weekly') return ['All', 'Yes', 'No'];
    if (activeFilterType === 'Monthly') return ['All', 'Yes', 'No'];
    return [];
  };

  const selectFilterOption = (option) => {
    if (activeFilterType === 'Type') setSelectedType(option);
    if (activeFilterType === 'Weekly') setSelectedWeekly(option);
    if (activeFilterType === 'Monthly') setSelectedMonthly(option);
    setFilterModalVisible(false);
  };

  const renderItem = ({ item }) => {
    const typeLabel = Array.isArray(item.types) ? item.types.join(', ') : (item.types || 'DEMO');
    
    return (
      <View className={`border rounded-xl mb-3 p-4 ${bgCard} ${borderColor}`}>
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className={`text-sm font-bold ${textColor}`}>{item.createdBy?.name || '—'}</Text>
            <Text className={`text-[10px] font-bold tracking-widest ${textMuted}`}>{formatDate(item.date || item.createdAt)}</Text>
          </View>
          <View className="bg-[#f59e0b2a] border border-[#f59e0b4a] px-2 py-1 rounded">
            <Text className="text-[#f59e0b] text-[10px] font-bold uppercase">{typeLabel}</Text>
          </View>
        </View>
        
        <View className="mb-3">
          <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${textMuted}`}>Update</Text>
          <Text className={`text-xs leading-5 ${textColor}`}>{item.notes || '—'}</Text>
        </View>
        
        <View className="mb-4">
          <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${textMuted}`}>Client Response</Text>
          <Text className={`text-xs leading-5 ${textColor}`}>{item.clientResponse || '—'}</Text>
        </View>
        
        <View className={`flex-row justify-between border-t pt-3 ${borderColor}`}>
          <View className="flex-row items-center">
            <Text className={`text-[10px] font-bold tracking-widest uppercase mr-2 ${textMuted}`}>Weekly</Text>
            <View className={`border px-2 py-0.5 rounded ${item.weeklyIncluded ? 'border-[#10b9814a] bg-[#10b9811a]' : 'border-[#ef44444a] bg-[#ef44441a]'}`}>
               <Text className={`text-[10px] font-bold ${item.weeklyIncluded ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                 {item.weeklyIncluded ? '✓ Yes' : '× No'}
               </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Text className={`text-[10px] font-bold tracking-widest uppercase mr-2 ${textMuted}`}>Monthly</Text>
            <View className={`border px-2 py-0.5 rounded ${item.monthlyIncluded ? 'border-[#10b9814a] bg-[#10b9811a]' : 'border-[#ef44444a] bg-[#ef44441a]'}`}>
               <Text className={`text-[10px] font-bold ${item.monthlyIncluded ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                 {item.monthlyIncluded ? '✓ Yes' : '× No'}
               </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${bgScreen}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
      </View>
    );
  }

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="mb-4 mt-4">
        <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${textMuted}`}>ACTIVITY</Text>
        <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Reports</Text>
      </View>

      {/* Stats Cards */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 flex-row">
          <View className={`border p-4 rounded-lg mr-3 min-w-[140px] ${bgCard} ${borderColor}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-4 ${textMuted}`}>Total Reports</Text>
            <Text className={`text-2xl font-bold ${textColor}`}>{totalReports}</Text>
          </View>
          <View className={`border p-4 rounded-lg mr-3 min-w-[140px] ${bgCard} ${borderColor}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-4 ${textMuted}`}>This Month</Text>
            <Text className="text-[#38bdf8] text-2xl font-bold">{thisMonth}</Text>
          </View>
          <View className={`border p-4 rounded-lg mr-3 min-w-[140px] ${bgCard} ${borderColor}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-4 ${textMuted}`}>In Weekly</Text>
            <Text className="text-[#4ade80] text-2xl font-bold">{inWeekly}</Text>
          </View>
          <View className={`border p-4 rounded-lg min-w-[140px] ${bgCard} ${borderColor}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-4 ${textMuted}`}>In Monthly</Text>
            <Text className="text-[#f59e0b] text-2xl font-bold">{inMonthly}</Text>
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
          <View className={`border p-4 rounded-lg min-w-[180px] ${bgCard} ${borderColor}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-4 ${textMuted}`}>Appr. Expenses</Text>
            <Text className="text-[#ef4444] text-2xl font-bold">₹0</Text>
          </View>
        </ScrollView>
      </View>

      {/* Filters Area */}
      <View className="flex-row mb-4">
        <View className={`border rounded flex-row items-center px-3 py-1 flex-1 mr-2 h-10 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
          <TextInput
            placeholder="Search by member, notes, project..."
            placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
            className={`text-xs ml-2 flex-1 py-0 ${textColor}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="flex-row mb-4">
        <TouchableOpacity onPress={() => openFilter('Type')} className={`border rounded px-3 py-2 flex-row items-center justify-between flex-1 mr-2 h-10 ${bgCard} ${borderColor}`}>
          <Text className={`text-[10px] font-bold ${textColor}`} numberOfLines={1}>
            {selectedType === 'All Types' ? 'All Types' : selectedType}
          </Text>
          <ChevronDown size={14} color={isDarkMode ? "#888" : "#6b7280"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openFilter('Weekly')} className={`border rounded px-3 py-2 flex-row items-center justify-between flex-1 mr-2 h-10 ${bgCard} ${borderColor}`}>
          <Text className={`text-[10px] font-bold ${textColor}`} numberOfLines={1}>
            {selectedWeekly === 'All' ? 'Weekly: All' : `Weekly: ${selectedWeekly}`}
          </Text>
          <ChevronDown size={14} color={isDarkMode ? "#888" : "#6b7280"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openFilter('Monthly')} className={`border rounded px-3 py-2 flex-row items-center justify-between flex-1 h-10 ${bgCard} ${borderColor}`}>
          <Text className={`text-[10px] font-bold ${textColor}`} numberOfLines={1}>
            {selectedMonthly === 'All' ? 'Monthly: All' : `Monthly: ${selectedMonthly}`}
          </Text>
          <ChevronDown size={14} color={isDarkMode ? "#888" : "#6b7280"} />
        </TouchableOpacity>
      </View>

      {/* Cards List */}
      <FlatList 
        data={filteredReports}
        keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text className={`text-center py-6 text-xs ${textMuted}`}>No reports found.</Text>
        }
      />

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="fade">
        <TouchableOpacity 
          className="flex-1 bg-[#000000a0] justify-center items-center p-4" 
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} className={`w-full max-w-xs border rounded-lg overflow-hidden shadow-lg ${bgCard} ${borderColor}`}>
            <View className={`p-4 border-b ${bgRow} ${borderColor}`}>
              <Text className={`font-bold text-center tracking-wider ${textColor}`}>SELECT {activeFilterType.toUpperCase()}</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {getFilterOptions().map((opt, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => selectFilterOption(opt)}
                  className={`p-4 border-b flex-row justify-between items-center ${borderColor}`}
                >
                  <Text className={`text-sm ${textColor}`}>{opt}</Text>
                  {((activeFilterType === 'Type' && selectedType === opt) ||
                    (activeFilterType === 'Weekly' && selectedWeekly === opt) ||
                    (activeFilterType === 'Monthly' && selectedMonthly === opt)) && (
                    <View className="w-2 h-2 rounded-full bg-[#10b981]" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
