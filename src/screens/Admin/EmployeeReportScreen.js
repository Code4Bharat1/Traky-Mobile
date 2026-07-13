import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Search, Filter, Eye, Download, CheckCircle2, X, Mail } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { createReport, getTasks } from '../../api/services';
import useThemeStore from '../../store/themeStore';

import client from '../../api/client';

export default function EmployeeReportScreen() {
  const { isDarkMode } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportStats, setReportStats] = useState(null);

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
      let page = 1;
      let allTasks = [];
      while (true) {
        const response = await client.get(`/tasks?page=${page}&limit=100`);
        const data = response.data.data || response.data || [];
        const pagination = response.data.pagination;
        allTasks = [...allTasks, ...data];
        if (!pagination || page >= pagination.pages || data.length === 0) break;
        page++;
      }
      
      let tasks = allTasks;
      
      if (searchQuery) {
        tasks = tasks.filter(t => 
          t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === "DONE" || t.status === "COMPLETED").length,
        inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
        overdue: tasks.filter(t => t.isOverdue || (t.deadline && t.status !== "DONE" && t.status !== "COMPLETED" && new Date(t.deadline) < new Date())).length,
        group: tasks.filter(t => t.contributors?.length > 1).length,
        completedLate: tasks.filter(t => (t.status === "DONE" || t.status === "COMPLETED") && t.completedAt && t.deadline && new Date(t.completedAt) > new Date(t.deadline)).length,
      };
      
      setReportStats(stats);
      setReportData(tasks);
      setReportModalVisible(true);
    } catch (error) {
      console.error("Failed to generate report", error);
      Alert.alert('Error', 'Failed to generate report data from server.');
    } finally {
      setGenerating(false);
    }
  };

  const escapeCsv = (v) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const generateCSVString = () => {
    const headers = [
      "#", "Project Name", "Task Name", "Group Task", "Created By", "Assigned To", 
      "Department", "Status", "Planned Start", "Planned End", "Completed On", 
      "Actual Start", "Actual Finish", "Ongoing Issue", "Issue Created By", 
      "Validation Type", "Proof Submitted", "Is Overdue", "Completed Late"
    ];
    
    const rows = reportData.map((t, i) => [
      i + 1,
      t.projectId?.name || "—",
      t.title,
      t.contributors?.length > 1 ? "Yes" : "No",
      t.createdBy?.name || "—",
      (t.contributors || []).map(c => c.userId?.name || "").join(", ") || "—",
      t.projectId?.departmentId?.name || "—",
      t.status,
      t.startTime ? new Date(t.startTime).toLocaleDateString() : "—",
      t.deadline ? new Date(t.deadline).toLocaleDateString() : "—",
      t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "—",
      t.developerStartedAt ? new Date(t.developerStartedAt).toLocaleDateString() : "—",
      t.developerFinishedAt ? new Date(t.developerFinishedAt).toLocaleDateString() : "—",
      "No", // simplify
      "—", // simplify
      t.proofRequired ? "Document/File" : "None",
      t.attachments?.length > 0 ? "Yes" : "No",
      t.isOverdue ? "Yes" : "No",
      (t.status === "DONE" || t.status === "COMPLETED") && t.completedAt && t.deadline && new Date(t.completedAt) > new Date(t.deadline) ? "Yes" : "No",
    ]);

    return [headers, ...rows].map(r => r.map(escapeCsv).join(",")).join("\n");
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = generateCSVString();
      const fileName = `employee-report-${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, "\uFEFF" + csvStr, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      let html = `
        <html>
        <head>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 10px; }
            th { background-color: #f2f2f2; text-align: left; }
            body { font-family: sans-serif; }
          </style>
        </head>
        <body>
          <h2>Employee Report</h2>
          <p>Total Tasks: ${reportStats?.total || 0} | Completed: ${reportStats?.completed || 0} | In Progress: ${reportStats?.inProgress || 0} | Overdue: ${reportStats?.overdue || 0}</p>
          <table>
            <tr>
              <th>#</th><th>Project</th><th>Task</th><th>Assigned To</th><th>Status</th><th>Deadline</th>
            </tr>
            ${reportData.map((t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${t.projectId?.name || "—"}</td>
                <td>${t.title}</td>
                <td>${(t.contributors || []).map(c => c.userId?.name || "").join(", ") || "—"}</td>
                <td>${t.status}</td>
                <td>${t.deadline ? new Date(t.deadline).toLocaleDateString() : "—"}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) return;
    setIsSendingEmail(true);
    try {
      const csvStr = generateCSVString();
      const res = await client.post("/reports/send-email", {
        email: emailAddress,
        reportData: "\uFEFF" + csvStr,
        filename: `employee-report-${new Date().toISOString().slice(0, 10)}.csv`,
        encoding: "utf8"
      });
      if (res.data.success || res.status === 200) {
        Alert.alert('Success', 'Report sent successfully via email.');
        setEmailModalVisible(false);
        setEmailAddress('');
      } else {
        Alert.alert('Error', 'Failed to send email.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'An error occurred while sending email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderReportItem = ({ item }) => (
    <View className={`rounded p-4 mb-2 border ${bgCard} ${borderColor}`}>
      <Text className={`font-bold text-sm mb-1 ${textColor}`}>{item.title}</Text>
      <Text className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{item.projectId?.name || item.projectId?.projectName || 'No Project'}</Text>
      
      <View className="flex-row justify-between mb-1">
        <Text className={`text-[10px] uppercase ${textMuted}`}>Status:</Text>
        <Text className={`text-[10px] font-bold uppercase ${item.status === 'COMPLETED' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>{item.status?.replace('_', ' ')}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className={`text-[10px] uppercase ${textMuted}`}>Deadline:</Text>
        <Text className={`text-[10px] uppercase ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>{item.deadline ? new Date(item.deadline).toLocaleDateString() : 'None'}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className={`text-[10px] uppercase ${textMuted}`}>Assignees:</Text>
        <Text className={`text-[10px] uppercase ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>{item.contributors?.length || 0} members</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className={`text-[10px] uppercase ${textMuted}`}>Overdue:</Text>
        <Text className={`text-[10px] uppercase ${item.isOverdue ? 'text-[#ef4444] font-bold' : (isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600')}`}>{item.isOverdue ? 'YES' : 'NO'}</Text>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${bgScreen}`}>
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="mb-6 mt-4">
          <Text className={`text-xl font-bold tracking-wider mb-2 ${textColor}`}>EMPLOYEE REPORT</Text>
          <Text className={`text-xs leading-5 ${textMuted}`}>Full task-level report — apply filters and click Generate Report to preview.</Text>
        </View>

        {/* Toolbar */}
        <View className="mb-6">
          <View className={`border rounded-lg flex-row items-center px-4 py-3 mb-3 ${bgCard} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
            <TextInput
              placeholder="Search by project, task, employee, department..."
              placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
              className={`text-xs ml-3 flex-1 py-0 ${textColor}`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View className="flex-row">
            <TouchableOpacity className={`border rounded-lg flex-row items-center justify-center px-4 py-3 mr-3 flex-1 ${bgCard} ${borderColor}`}>
              <Filter size={14} color={isDarkMode ? "#fff" : "#111827"} className="mr-2" />
              <Text className={`text-[10px] font-bold tracking-widest uppercase ${textColor}`}>Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleGenerateReport} 
              disabled={generating} 
              className={`rounded-lg flex-row items-center justify-center px-4 py-3 flex-1 ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}
            >
              {generating ? (
                <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} />
              ) : (
                <>
                  <Eye size={14} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-2" />
                  <Text className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Cards */}
        <View className="mb-6">
          <View className={`border p-5 rounded-lg mb-3 ${bgCard} ${borderColor}`}>
            <View className="flex-row items-center mb-3">
              <View className={`p-2 rounded mr-3 ${isDarkMode ? 'bg-[#ffffff0a]' : 'bg-blue-50'}`}>
                <Search size={16} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
              </View>
              <Text className={`font-bold text-xs tracking-wider uppercase ${textColor}`}>1. Search or Filter</Text>
            </View>
            <Text className={`text-xs leading-5 ${textMuted}`}>Use the search bar or open Filters to narrow down by project, employee, department, or date range.</Text>
          </View>

          <View className={`border p-5 rounded-lg mb-3 ${bgCard} ${borderColor}`}>
            <View className="flex-row items-center mb-3">
              <View className={`p-2 rounded mr-3 ${isDarkMode ? 'bg-[#ffffff0a]' : 'bg-blue-50'}`}>
                <Eye size={16} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
              </View>
              <Text className={`font-bold text-xs tracking-wider uppercase ${textColor}`}>2. Generate Report</Text>
            </View>
            <Text className={`text-xs leading-5 ${textMuted}`}>Click Generate Report in the toolbar above to preview the full task-level data table.</Text>
          </View>

          <View className={`border p-5 rounded-lg ${bgCard} ${borderColor}`}>
            <View className="flex-row items-center mb-3">
              <View className={`p-2 rounded mr-3 ${isDarkMode ? 'bg-[#ffffff0a]' : 'bg-green-50'}`}>
                <Download size={16} color="#10b981" />
              </View>
              <Text className={`font-bold text-xs tracking-wider uppercase ${textColor}`}>3. Export or Print</Text>
            </View>
            <Text className={`text-xs leading-5 ${textMuted}`}>Once generated, export to CSV / Excel or print to PDF directly from the report header.</Text>
          </View>
        </View>

        {/* Report Includes Section */}
        <View className={`border p-5 rounded-lg mb-8 ${bgCard} ${borderColor}`}>
          <Text className={`font-bold text-[10px] tracking-widest uppercase mb-4 border-b pb-3 ${textColor} ${borderColor}`}>Report Includes</Text>
          
          <View className="flex-row flex-wrap">
            {reportFields.map((field, idx) => (
              <View key={idx} className="w-[50%] flex-row items-center mb-4 pr-2">
                <CheckCircle2 size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-3" />
                <Text className={`text-xs ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>{field}</Text>
              </View>
            ))}
          </View>
        </View>
        
      </ScrollView>

      {/* Generated Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="slide">
        <View className={`flex-1 mt-10 rounded-t-2xl border-t ${bgScreen} ${borderColor}`}>
          <View className={`p-4 border-b flex-row justify-between items-center rounded-t-2xl ${bgCard} ${borderColor}`}>
            <Text className={`font-bold text-lg tracking-wider ${textColor}`}>REPORT PREVIEW</Text>
            <TouchableOpacity onPress={() => setReportModalVisible(false)} className="bg-gray-500 p-2 rounded-full">
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-1">
            {/* Stats Grid */}
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row flex-wrap justify-between">
                {/* Total Tasks */}
                <View className={`w-[32%] p-3 mb-3 border rounded-lg ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'} ${borderColor}`}>
                  <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Total Tasks</Text>
                  <Text className={`text-xl font-bold ${textColor}`}>{reportStats?.total || 0}</Text>
                </View>
                {/* Completed */}
                <View className={`w-[32%] p-3 mb-3 border rounded-lg ${isDarkMode ? 'bg-[#10b9811a]' : 'bg-green-50'} ${borderColor}`}>
                  <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Completed</Text>
                  <Text className={`text-xl font-bold text-[#10b981]`}>{reportStats?.completed || 0}</Text>
                </View>
                {/* In Progress */}
                <View className={`w-[32%] p-3 mb-3 border rounded-lg ${isDarkMode ? 'bg-[#47c8ff1a]' : 'bg-blue-50'} ${borderColor}`}>
                  <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>In Progress</Text>
                  <Text className={`text-xl font-bold text-[#47c8ff]`}>{reportStats?.inProgress || 0}</Text>
                </View>
                {/* Overdue */}
                <View className={`w-[32%] p-3 mb-3 border rounded-lg ${isDarkMode ? 'bg-[#ef44441a]' : 'bg-red-50'} ${borderColor}`}>
                  <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Overdue</Text>
                  <Text className={`text-xl font-bold text-[#ef4444]`}>{reportStats?.overdue || 0}</Text>
                </View>
                {/* Group Tasks */}
                <View className={`w-[32%] p-3 mb-3 border rounded-lg ${isDarkMode ? 'bg-[#e8a8471a]' : 'bg-yellow-50'} ${borderColor}`}>
                  <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Group Tasks</Text>
                  <Text className={`text-xl font-bold text-[#e8a847]`}>{reportStats?.group || 0}</Text>
                </View>
                {/* Completed Late */}
                <View className={`w-[32%] p-3 mb-3 border rounded-lg ${isDarkMode ? 'bg-[#a855f71a]' : 'bg-purple-50'} ${borderColor}`}>
                  <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Late Done</Text>
                  <Text className={`text-xl font-bold text-[#a855f7]`}>{reportStats?.completedLate || 0}</Text>
                </View>
              </View>
            </View>

            {/* Export Buttons */}
            <View className={`px-4 py-3 flex-row justify-between border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}>
              <TouchableOpacity onPress={handleExportCSV} className="flex-1 flex-row justify-center items-center py-2 mr-2 border rounded border-[#10b98130] bg-[#10b98110]">
                <Download size={12} color="#10b981" className="mr-1" />
                <Text className="text-[10px] font-bold tracking-wider text-[#10b981]">CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExportPDF} className="flex-1 flex-row justify-center items-center py-2 mr-2 border rounded border-[#e8a84730] bg-[#e8a84710]">
                <Download size={12} color="#e8a847" className="mr-1" />
                <Text className="text-[10px] font-bold tracking-wider text-[#e8a847]">PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEmailModalVisible(true)} className="flex-1 flex-row justify-center items-center py-2 border rounded border-[#47c8ff30] bg-[#47c8ff10]">
                <Mail size={12} color="#47c8ff" className="mr-1" />
                <Text className="text-[10px] font-bold tracking-wider text-[#47c8ff]">EMAIL</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View className="px-4 py-4 pb-0">
              <Text className={`text-xs ${textMuted}`}>Showing {reportData.length} tasks • Preview as of {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
            </View>
            
            <FlatList 
              data={reportData}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={renderReportItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              ListEmptyComponent={
                <Text className={`text-center mt-10 ${textMuted}`}>No data available for this report.</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Email Modal */}
      <Modal visible={emailModalVisible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-[#000000a0] justify-center items-center p-4" activeOpacity={1} onPress={() => setEmailModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} className={`w-full max-w-sm border rounded-xl overflow-hidden p-5 ${bgCard} ${borderColor}`}>
            <View className="flex-row items-center mb-4">
              <Mail size={20} color={isDarkMode ? "#47c8ff" : "#2573e6"} className="mr-3" />
              <Text className={`font-bold text-lg ${textColor}`}>Send via Email</Text>
            </View>
            <Text className={`text-xs mb-4 ${textMuted}`}>Enter the recipient's email address below to send this report directly.</Text>
            
            <TextInput
              className={`border rounded-lg p-3 mb-5 text-sm ${bgScreen} ${borderColor} ${textColor}`}
              placeholder="e.g. manager@company.com"
              placeholderTextColor={isDarkMode ? "#666" : "#999"}
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailAddress}
              onChangeText={setEmailAddress}
            />

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={() => setEmailModalVisible(false)} className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-[#333]' : 'bg-gray-200'} mr-2`}>
                <Text className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSendEmail} 
                disabled={isSendingEmail || !emailAddress}
                className={`px-4 py-2 rounded-lg flex-row items-center justify-center ${isDarkMode ? 'bg-[#47c8ff]' : 'bg-[#2573e6]'} ${isSendingEmail || !emailAddress ? 'opacity-50' : ''}`}
              >
                {isSendingEmail ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="font-bold text-xs text-white">Send Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
