import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, TextInput, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { Search, ChevronDown } from 'lucide-react-native';

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!searchQuery.trim()) {
      setFilteredReports(reports);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = reports.filter(r => {
      const nameMatch = r.createdBy?.name?.toLowerCase().includes(lowerQuery);
      const notesMatch = r.notes?.toLowerCase().includes(lowerQuery);
      const projMatch = r.projectId?.name?.toLowerCase().includes(lowerQuery);
      return nameMatch || notesMatch || projMatch;
    });
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

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

  const renderItem = ({ item }) => {
    const typeLabel = Array.isArray(item.types) ? item.types.join(', ') : (item.types || 'DEMO');
    
    return (
      <View className="flex-row border-b border-[#ffffff1a] py-4 px-4 bg-[#131313] items-center">
        <Text className="w-24 text-[#888] text-xs">{formatDate(item.date || item.createdAt)}</Text>
        <Text className="w-32 text-white text-xs font-bold" numberOfLines={1}>{item.createdBy?.name || '—'}</Text>
        
        <View className="w-32 pr-2 items-start">
          <View className="bg-[#f59e0b2a] border border-[#f59e0b4a] px-2 py-1 rounded">
            <Text className="text-[#f59e0b] text-[10px] font-bold uppercase">{typeLabel}</Text>
          </View>
        </View>

        <Text className="w-48 text-white text-xs" numberOfLines={2}>{item.notes || '—'}</Text>
        <Text className="w-32 text-[#888] text-xs" numberOfLines={2}>{item.clientResponse || '—'}</Text>

        <View className="w-24 items-center">
          <View className={`border px-2 py-1 rounded ${item.weeklyIncluded ? 'border-[#10b9814a] bg-[#10b9811a]' : 'border-[#ef44444a] bg-[#ef44441a]'}`}>
             <Text className={`text-[10px] font-bold ${item.weeklyIncluded ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
               {item.weeklyIncluded ? '✓ Yes' : '× No'}
             </Text>
          </View>
        </View>

        <View className="w-24 items-center">
          <View className={`border px-2 py-1 rounded ${item.monthlyIncluded ? 'border-[#10b9814a] bg-[#10b9811a]' : 'border-[#ef44444a] bg-[#ef44441a]'}`}>
             <Text className={`text-[10px] font-bold ${item.monthlyIncluded ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
               {item.monthlyIncluded ? '✓ Yes' : '× No'}
             </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#131313] items-center justify-center">
        <ActivityIndicator size="large" color="#adc6ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="mb-4 mt-4">
        <Text className="text-[#888] text-[10px] font-bold tracking-widest uppercase mb-1">ACTIVITY</Text>
        <Text className="text-white text-2xl font-bold tracking-wider">Reports</Text>
      </View>

      {/* Stats Cards */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 flex-row">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg mr-3 min-w-[140px]">
            <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-4">Total Reports</Text>
            <Text className="text-white text-2xl font-bold">{totalReports}</Text>
          </View>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg mr-3 min-w-[140px]">
            <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-4">This Month</Text>
            <Text className="text-[#38bdf8] text-2xl font-bold">{thisMonth}</Text>
          </View>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg mr-3 min-w-[140px]">
            <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-4">In Weekly</Text>
            <Text className="text-[#4ade80] text-2xl font-bold">{inWeekly}</Text>
          </View>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg min-w-[140px]">
            <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-4">In Monthly</Text>
            <Text className="text-[#f59e0b] text-2xl font-bold">{inMonthly}</Text>
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg min-w-[180px]">
            <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-4">Appr. Expenses</Text>
            <Text className="text-[#ef4444] text-2xl font-bold">₹0</Text>
          </View>
        </ScrollView>
      </View>

      {/* Filters Area */}
      <View className="flex-row mb-4">
        <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded flex-row items-center px-3 py-1 flex-1 mr-2 h-10">
          <Search size={14} color="#888" />
          <TextInput
            placeholder="Search by member, notes, project..."
            placeholderTextColor="#888"
            className="text-white text-xs ml-2 flex-1 py-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="flex-row mb-4">
        <TouchableOpacity className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 py-2 flex-row items-center justify-between flex-1 mr-2 h-10">
          <Text className="text-white text-[10px] font-bold">All Types</Text>
          <ChevronDown size={14} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 py-2 flex-row items-center justify-between flex-1 mr-2 h-10">
          <Text className="text-white text-[10px] font-bold">Weekly: All</Text>
          <ChevronDown size={14} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 py-2 flex-row items-center justify-between flex-1 h-10">
          <Text className="text-white text-[10px] font-bold">Monthly: All</Text>
          <ChevronDown size={14} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Table */}
      <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg overflow-hidden">
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{ minWidth: 800 }}>
            <View className="flex-row border-b border-[#ffffff1a] bg-[#161616] py-3 px-4">
              <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase">Date</Text>
              <Text className="w-32 text-[#888] text-[10px] font-bold tracking-widest uppercase">Submitted By</Text>
              <Text className="w-32 text-[#888] text-[10px] font-bold tracking-widest uppercase">Update Type</Text>
              <Text className="w-48 text-[#888] text-[10px] font-bold tracking-widest uppercase">Update</Text>
              <Text className="w-32 text-[#888] text-[10px] font-bold tracking-widest uppercase">Client Response</Text>
              <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Weekly</Text>
              <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Monthly</Text>
            </View>
            <FlatList 
              data={filteredReports}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <Text className="text-[#888] text-center py-6 text-xs">No reports found.</Text>
              }
            />
          </View>
        </ScrollView>
      </View>

    </View>
  );
}
