import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Share, Alert } from 'react-native';
import { deleteDailyLog, generateSummary, getAllLogs, getDepartments, getProjects } from '../../api/services';
import { ClipboardList, Clock, User, Search, ChevronDown, CheckCircle, X, Download, Bot, Folder } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

import client from '../../api/client';

export default function DailyLogsScreen() {
  const { isDarkMode } = useThemeStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Dropdown States
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState('');

  // Stats
  const [totalLogs, setTotalLogs] = useState(0);

  // AI Summary State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  const fetchFilters = async () => {
    try {
      const [projRes, depRes] = await Promise.all([
        client.get('/projects?limit=500'),
        client.get('/departments?limit=100')
      ]);
      setProjects(projRes.data.data || projRes.data || []);
      setDepartments(depRes.data.allDepartments || depRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = { page: pageNum, limit: 20 };
      if (filterProject) params.projectId = filterProject;
      if (filterDept) params.departmentId = filterDept;

      const response = await client.get('/daily-logs', { params });
      const newLogs = response.data.data || response.data || [];
      const pagination = response.data.pagination || {};

      if (reset) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }

      setTotalLogs(pagination.total || newLogs.length);
      setHasMore(pageNum < (pagination.pages || 1));
      setPage(pageNum);

    } catch (error) {
      console.error("Failed to load daily logs", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchLogs(1, true);
  }, [filterProject, filterDept]);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchLogs(page + 1);
    }
  };

  const handleGenerateAi = async () => {
    setAiModalVisible(true);
    setGeneratingAi(true);
    setAiSummary('');
    try {
      const payload = {};
      if (filterProject) payload.projectId = filterProject;
      if (filterDept) payload.departmentId = filterDept;
      
      const response = await client.post('/daily-logs/summaries', payload);
      setAiSummary(response.data.summary || 'No summary could be generated.');
    } catch (err) {
      console.error(err);
      let errMsg = err.response?.data?.error || err.message;
      if(errMsg.includes('429')) errMsg = 'Rate limit exceeded. Please try again later.';
      setAiSummary(`Error generating AI summary: ${errMsg}`);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleDownload = async () => {
    if (!aiSummary) return;
    try {
      await Share.share({
        message: aiSummary,
        title: 'Daily Logs Summary',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to share summary');
    }
  };

  const getDropdownOptions = () => {
    if (dropdownType === 'project') return [{_id: '', name: 'All Projects'}, ...projects.map(p => ({_id: p._id, name: p.name || p.projectName}))];
    if (dropdownType === 'dept') return [{_id: '', name: 'All Depts'}, ...departments.map(d => ({_id: d._id, name: d.departmentName}))];
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'project') setFilterProject(item._id);
    if (dropdownType === 'dept') setFilterDept(item._id);
    setDropdownVisible(false);
  };

  const getFlatEntries = () => {
    let flat = [];
    logs.forEach(log => {
      (log.entries || []).forEach((e, idx) => {
        flat.push({
          _id: e._id || `${log._id}-${idx}`,
          logId: log._id,
          userName: log.userName || log.userId?.name || 'Unknown User',
          logDate: log.logDate,
          projectName: e.projectName || e.projectId?.name || '—',
          taskTitle: e.taskTitle || e.taskId?.title || '—',
          description: e.description || '',
          logType: e.logType
        });
      });
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      flat = flat.filter(e => 
        e.userName.toLowerCase().includes(q) || 
        e.projectName.toLowerCase().includes(q) || 
        e.taskTitle.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return flat;
  };

  const flatData = getFlatEntries();

  const uniqueUsers = new Set(logs.map(l => (typeof l.userId === 'object' ? l.userId._id : l.userId))).size;

  const [expandedLogId, setExpandedLogId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  const handleDelete = (logId) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this log? This will remove all entries for this day.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await client.delete(`/daily-logs/${logId}`);
              fetchLogs(1, true);
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete log');
            }
          }
        }
      ]
    );
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => {
    const isExpanded = expandedLogId === item._id;
    return (
      <View className={`rounded-lg p-5 mb-4 border ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-start mb-3 border-b pb-3 ${borderColor}`}>
          <View className="flex-row items-center flex-1 mr-2">
            <View className={`h-8 w-8 rounded items-center justify-center mr-3 border ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100'} ${borderColor}`}>
               <User size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
            </View>
            <Text className={`text-sm font-bold flex-1 ${textColor}`} numberOfLines={1}>{item.userName}</Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-1" />
            <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>
              {item.logDate ? new Date(item.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
            </Text>
          </View>
        </View>

        <View className="mb-3">
           <View className="flex-row items-center mb-2">
              <Folder size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-1.5" />
              <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{item.projectName}</Text>
           </View>
           <Text className={`text-sm font-bold mb-2 ${textColor}`}>{item.taskTitle !== '—' ? item.taskTitle : 'General Log'}</Text>
        </View>

        <View className={`flex-row items-center justify-between mt-2 pt-3 border-t ${borderColor}`}>
           <TouchableOpacity 
             onPress={() => toggleExpand(item._id)}
             className={`flex-row items-center px-3 py-1.5 rounded border ${isDarkMode ? 'bg-[#201f1f]' : 'bg-blue-50'} ${borderColor}`}
           >
             <Text className={`text-[10px] font-bold uppercase tracking-widest mr-1 ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>
               {isExpanded ? 'Hide View' : 'View'}
             </Text>
             <ChevronDown size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
           </TouchableOpacity>

           <TouchableOpacity onPress={() => handleDelete(item.logId)} className="bg-[#3a1c1c] p-1.5 rounded border border-[#ef444433]">
             <X size={14} color="#ef4444" />
           </TouchableOpacity>
        </View>

        {isExpanded && item.description ? (
           <View className={`mt-3 pt-3 border-t ${borderColor}`}>
              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Log Details</Text>
              <Text className={`text-xs leading-5 ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>{item.description}</Text>
           </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin / Daily Logs</Text>
           <Text className={`text-2xl font-bold tracking-wider mb-1 ${textColor}`}>Daily Work Logs</Text>
        </View>
      </View>

      {/* Top Actions & Stats */}
      <View className="flex-row justify-between items-center mb-6">
         <View className="flex-row flex-1 mr-4">
            <TouchableOpacity onPress={handleGenerateAi} className="bg-[#f472b6] px-3 py-2.5 rounded flex-row items-center justify-center flex-1 mr-2 border border-[#f472b6]">
               <Bot size={14} color="#fff" className="mr-1.5" />
               <Text className="text-white font-bold text-[10px] uppercase tracking-widest">AI SUMMARY</Text>
            </TouchableOpacity>
         </View>
         <View className="flex-row items-center">
            <View className={`border px-3 py-2 rounded items-center justify-center mr-2 ${bgCard} ${borderColor}`}>
               <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>LOGS</Text>
               <Text className={`font-bold text-sm ${textColor}`}>{totalLogs}</Text>
            </View>
            <View className={`border px-3 py-2 rounded items-center justify-center ${bgCard} ${borderColor}`}>
               <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>USERS</Text>
               <Text className={`font-bold text-sm ${textColor}`}>{uniqueUsers}</Text>
            </View>
         </View>
      </View>

      {/* Search and Filters */}
      <View className="mb-4">
         <View className={`border rounded px-3 h-10 mb-2 flex-row items-center ${bgInput} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search employee, project, task..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
         <View className="flex-row justify-between items-center mb-2">
            <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className={`flex-1 border rounded px-3 h-10 flex-row items-center justify-between mr-2 ${bgInput} ${borderColor}`}>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterProject ? projects.find(p => p._id === filterProject)?.name?.substring(0,8) + '..' || 'Unknown' : 'All Projects'}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setDropdownType('dept'); setDropdownVisible(true); }} className={`flex-1 border rounded px-3 h-10 flex-row items-center justify-between ml-2 ${bgInput} ${borderColor}`}>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterDept ? departments.find(d => d._id === filterDept)?.departmentName?.substring(0,8) + '..' || 'Unknown' : 'All Depts'}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
         </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={flatData}
          keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="my-4" /> : null}
          ListEmptyComponent={
            <View className={`items-center justify-center mt-10 p-6 border rounded-lg ${bgCard} ${borderColor}`}>
               <View className={`h-12 w-12 rounded-full items-center justify-center mb-4 ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100'}`}>
                 <ClipboardList size={24} color={isDarkMode ? "#888" : "#9ca3af"} />
               </View>
               <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>No logs found</Text>
            </View>
          }
        />
      )}

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className={`border rounded-lg w-5/6 max-h-[60%] p-2 ${bgCard} ${borderColor}`}>
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
              renderItem={({item}) => {
                let isSelected = false;
                if (dropdownType === 'project') isSelected = filterProject === item._id;
                if (dropdownType === 'dept') isSelected = filterDept === item._id;

                return (
                  <TouchableOpacity className={`py-4 px-4 border-b flex-row items-center justify-between ${borderColor}`} onPress={() => selectDropdownItem(item)}>
                    <Text className={`text-base capitalize ${textColor}`}>{item.name || item.projectName}</Text>
                    {isSelected && <CheckCircle size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI Summary Modal */}
      <Modal visible={aiModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className={`border rounded-xl w-full max-h-[85%] overflow-hidden ${bgCard} ${borderColor}`}>
            <View className={`flex-row justify-between items-center p-5 border-b ${borderColor}`}>
               <View>
                 <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>REPORT</Text>
                 <Text className={`text-base font-bold ${textColor}`}>Daily Logs Summary</Text>
               </View>
               <TouchableOpacity onPress={() => setAiModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
               {generatingAi ? (
                  <View className="items-center py-10">
                     <ActivityIndicator size="large" color="#f472b6" className="mb-4" />
                     <Text className={`text-xs uppercase tracking-widest font-bold ${textMuted}`}>Generating AI Summary...</Text>
                  </View>
               ) : (
                  <Text className={`text-sm leading-6 mb-6 ${textColor}`}>{aiSummary}</Text>
               )}
            </ScrollView>

            <View className={`p-5 border-t flex-row ${borderColor}`}>
               <TouchableOpacity 
                  disabled={generatingAi || !aiSummary}
                  onPress={handleDownload} 
                  className={`flex-1 p-3 rounded flex-row items-center justify-center mr-3 opacity-90 disabled:opacity-50 ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}
               >
                  <Download size={14} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-2" />
                  <Text className={`font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>DOWNLOAD</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  onPress={() => setAiModalVisible(false)} 
                  className={`border p-3 rounded items-center justify-center px-6 ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100'} ${borderColor}`}
               >
                  <Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>CLOSE</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
