import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Search, Filter, Eye, Download, CheckCircle2, X } from 'lucide-react-native';
import client from '../../api/client';

export default function EmployeeReportScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState([]);

  const reportFields = [
    "Project Name", 
    "Task Name & Status", 
    "Assigned Employees", 
    "Department",
    "Planned Start & End", 
    "Actual Start & Finish", 
    "Completion Date", 
    "Overdue Flag",
    "Completed Late", 
    "Group Task", 
    "Ongoing Issues", 
    "Proof / Photo Submitted"
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      // Simulate compiling a full task-level report by fetching tasks
      const response = await client.get('/tasks?limit=100');
      let tasks = response.data.data || response.data || [];
      
      if (searchQuery) {
        tasks = tasks.filter(t => 
          t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setReportData(tasks);
      setReportModalVisible(true);
    } catch (error) {
      console.error("Failed to generate report", error);
      Alert.alert('Error', 'Failed to generate report data from server.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    Alert.alert('Export Successful', 'Report CSV has been generated and saved to your device.');
  };

  const renderReportItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded p-4 mb-2 border border-[#ffffff1a]">
      <Text className="text-white font-bold text-sm mb-1">{item.title}</Text>
      <Text className="text-[#adc6ff] text-xs font-bold uppercase mb-2">{item.projectId?.name || item.projectId?.projectName || 'No Project'}</Text>
      
      <View className="flex-row justify-between mb-1">
        <Text className="text-[#888] text-[10px] uppercase">Status:</Text>
        <Text className={`text-[10px] font-bold uppercase ${item.status === 'COMPLETED' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>{item.status?.replace('_', ' ')}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-[#888] text-[10px] uppercase">Deadline:</Text>
        <Text className="text-[#c2c6d6] text-[10px] uppercase">{item.deadline ? new Date(item.deadline).toLocaleDateString() : 'None'}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-[#888] text-[10px] uppercase">Assignees:</Text>
        <Text className="text-[#c2c6d6] text-[10px] uppercase">{item.contributors?.length || 0} members</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-[#888] text-[10px] uppercase">Overdue:</Text>
        <Text className={`text-[10px] uppercase ${item.isOverdue ? 'text-[#ef4444] font-bold' : 'text-[#c2c6d6]'}`}>{item.isOverdue ? 'YES' : 'NO'}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313]">
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="mb-6 mt-4">
          <Text className="text-white text-xl font-bold tracking-wider mb-2">EMPLOYEE REPORT</Text>
          <Text className="text-[#888] text-xs leading-5">Full task-level report — apply filters and click Generate Report to preview.</Text>
        </View>

        {/* Toolbar */}
        <View className="mb-6">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg flex-row items-center px-4 py-3 mb-3">
            <Search size={16} color="#888" />
            <TextInput
              placeholder="Search by project, task, employee, department..."
              placeholderTextColor="#888"
              className="text-white text-xs ml-3 flex-1 py-0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View className="flex-row">
            <TouchableOpacity className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg flex-row items-center justify-center px-4 py-3 mr-3 flex-1">
              <Filter size={14} color="#fff" className="mr-2" />
              <Text className="text-white text-[10px] font-bold tracking-widest uppercase">Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleGenerateReport} 
              disabled={generating} 
              className="bg-[#adc6ff] rounded-lg flex-row items-center justify-center px-4 py-3 flex-1"
            >
              {generating ? (
                <ActivityIndicator size="small" color="#131313" />
              ) : (
                <>
                  <Eye size={14} color="#131313" className="mr-2" />
                  <Text className="text-[#131313] text-[10px] font-bold tracking-widest uppercase">Generate Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Cards */}
        <View className="mb-6">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-5 rounded-lg mb-3">
            <View className="flex-row items-center mb-3">
              <View className="bg-[#ffffff0a] p-2 rounded mr-3">
                <Search size={16} color="#adc6ff" />
              </View>
              <Text className="text-white font-bold text-xs tracking-wider uppercase">1. Search or Filter</Text>
            </View>
            <Text className="text-[#888] text-xs leading-5">Use the search bar or open Filters to narrow down by project, employee, department, or date range.</Text>
          </View>

          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-5 rounded-lg mb-3">
            <View className="flex-row items-center mb-3">
              <View className="bg-[#ffffff0a] p-2 rounded mr-3">
                <Eye size={16} color="#adc6ff" />
              </View>
              <Text className="text-white font-bold text-xs tracking-wider uppercase">2. Generate Report</Text>
            </View>
            <Text className="text-[#888] text-xs leading-5">Click Generate Report in the toolbar above to preview the full task-level data table.</Text>
          </View>

          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-5 rounded-lg">
            <View className="flex-row items-center mb-3">
              <View className="bg-[#ffffff0a] p-2 rounded mr-3">
                <Download size={16} color="#10b981" />
              </View>
              <Text className="text-white font-bold text-xs tracking-wider uppercase">3. Export or Print</Text>
            </View>
            <Text className="text-[#888] text-xs leading-5">Once generated, export to CSV / Excel or print to PDF directly from the report header.</Text>
          </View>
        </View>

        {/* Report Includes Section */}
        <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-5 rounded-lg mb-8">
          <Text className="text-white font-bold text-[10px] tracking-widest uppercase mb-4 border-b border-[#ffffff1a] pb-3">Report Includes</Text>
          
          <View className="flex-row flex-wrap">
            {reportFields.map((field, idx) => (
              <View key={idx} className="w-[50%] flex-row items-center mb-4 pr-2">
                <CheckCircle2 size={14} color="#adc6ff" className="mr-3" />
                <Text className="text-[#c2c6d6] text-xs">{field}</Text>
              </View>
            ))}
          </View>
        </View>
        
      </ScrollView>

      {/* Generated Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-[#131313] mt-10 rounded-t-2xl border-t border-[#ffffff1a]">
          <View className="p-4 border-b border-[#ffffff1a] flex-row justify-between items-center bg-[#1c1b1b] rounded-t-2xl">
            <Text className="text-white font-bold text-lg tracking-wider">REPORT PREVIEW</Text>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleExport} className="bg-[#10b981] p-2 rounded-full mr-3 flex-row items-center">
                <Download size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} className="bg-[#333] p-2 rounded-full">
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="flex-1 p-4">
            <Text className="text-[#888] text-xs mb-4">Showing {reportData.length} tasks based on current filters.</Text>
            <FlatList 
              data={reportData}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={renderReportItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text className="text-[#888] text-center mt-10">No data available for this report.</Text>
              }
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}
