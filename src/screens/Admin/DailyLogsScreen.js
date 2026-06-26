import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Share, Alert } from 'react-native';
import client from '../../api/client';
import { ClipboardList, Clock, User, Search, ChevronDown, CheckCircle, X, Download, Bot, Folder } from 'lucide-react-native';

export default function DailyLogsScreen() {
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

  // Flatten logs for granular display
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

  // Unique users approx (counting from loaded logs)
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

  const renderItem = ({ item }) => {
    const isExpanded = expandedLogId === item._id;
    return (
      <View className="bg-[#1c1b1b] rounded-lg p-5 mb-4 border border-[#ffffff1a]">
        <View className="flex-row justify-between items-start mb-3 border-b border-[#ffffff1a] pb-3">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="h-8 w-8 rounded bg-[#201f1f] items-center justify-center mr-3 border border-[#ffffff1a]">
               <User size={14} color="#adc6ff" />
            </View>
            <Text className="text-white text-sm font-bold flex-1" numberOfLines={1}>{item.userName}</Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={12} color="#888" className="mr-1" />
            <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">
              {item.logDate ? new Date(item.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
            </Text>
          </View>
        </View>

        <View className="mb-3">
           <View className="flex-row items-center mb-2">
              <Folder size={12} color="#888" className="mr-1.5" />
              <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">{item.projectName}</Text>
           </View>
           <Text className="text-white text-sm font-bold mb-2">{item.taskTitle !== '—' ? item.taskTitle : 'General Log'}</Text>
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-[#ffffff1a]">
           <TouchableOpacity 
             onPress={() => toggleExpand(item._id)}
             className="flex-row items-center bg-[#201f1f] px-3 py-1.5 rounded border border-[#ffffff1a]"
           >
             <Text className="text-[#adc6ff] text-[10px] font-bold uppercase tracking-widest mr-1">
               {isExpanded ? 'Hide View' : 'View'}
             </Text>
             <ChevronDown size={14} color="#adc6ff" style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
           </TouchableOpacity>

           <TouchableOpacity onPress={() => handleDelete(item.logId)} className="bg-[#3a1c1c] p-1.5 rounded border border-[#ef444433]">
             <X size={14} color="#ef4444" />
           </TouchableOpacity>
        </View>

        {isExpanded && item.description ? (
           <View className="mt-3 pt-3 border-t border-[#ffffff1a]">
              <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-2">Log Details</Text>
              <Text className="text-[#c2c6d6] text-xs leading-5">{item.description}</Text>
           </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className="text-[#888] text-[10px] tracking-widest uppercase mb-1 font-bold">Admin / Daily Logs</Text>
           <Text className="text-white text-2xl font-bold tracking-wider mb-1">Daily Work Logs</Text>
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
            <View className="border border-[#ffffff1a] bg-[#1c1b1b] px-3 py-2 rounded items-center justify-center mr-2">
               <Text className="text-[#888] text-[8px] font-bold uppercase tracking-widest mb-1">LOGS</Text>
               <Text className="text-white font-bold text-sm">{totalLogs}</Text>
            </View>
            <View className="border border-[#ffffff1a] bg-[#1c1b1b] px-3 py-2 rounded items-center justify-center">
               <Text className="text-[#888] text-[8px] font-bold uppercase tracking-widest mb-1">USERS</Text>
               <Text className="text-white font-bold text-sm">{uniqueUsers}</Text>
            </View>
         </View>
      </View>

      {/* Search and Filters */}
      <View className="mb-4">
         <View className="flex-row items-center bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 mb-2">
            <Search size={16} color="#888" className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search employee, project, task..."
               placeholderTextColor="#888"
               className="flex-1 text-white text-xs h-10"
            />
         </View>
         <View className="flex-row justify-between items-center mb-2">
            <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 flex-row items-center justify-between mr-2">
              <Text className="text-white text-[10px] uppercase font-bold tracking-widest">{filterProject ? projects.find(p => p._id === filterProject)?.name?.substring(0,8) + '..' || 'Unknown' : 'All Projects'}</Text>
              <ChevronDown size={14} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setDropdownType('dept'); setDropdownVisible(true); }} className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 flex-row items-center justify-between ml-2">
              <Text className="text-white text-[10px] uppercase font-bold tracking-widest">{filterDept ? departments.find(d => d._id === filterDept)?.departmentName?.substring(0,8) + '..' || 'Unknown' : 'All Depts'}</Text>
              <ChevronDown size={14} color="#888" />
            </TouchableOpacity>
         </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={flatData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#adc6ff" className="my-4" /> : null}
          ListEmptyComponent={
            <View className="items-center justify-center mt-10 p-6 border border-[#ffffff1a] bg-[#1c1b1b] rounded-lg">
               <View className="h-12 w-12 rounded-full bg-[#201f1f] items-center justify-center mb-4">
                 <ClipboardList size={24} color="#888" />
               </View>
               <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">No logs found</Text>
            </View>
          }
        />
      )}

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-5/6 max-h-[60%] p-2">
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item) => item._id || 'none'}
              renderItem={({item}) => {
                let isSelected = false;
                if (dropdownType === 'project') isSelected = filterProject === item._id;
                if (dropdownType === 'dept') isSelected = filterDept === item._id;

                return (
                  <TouchableOpacity className="py-4 px-4 border-b border-[#ffffff1a] flex-row items-center justify-between" onPress={() => selectDropdownItem(item)}>
                    <Text className="text-white text-base capitalize">{item.name || item.projectName}</Text>
                    {isSelected && <CheckCircle size={18} color="#adc6ff" />}
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
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-xl w-full max-h-[85%] overflow-hidden">
            <View className="flex-row justify-between items-center p-5 border-b border-[#ffffff1a]">
               <View>
                 <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">REPORT</Text>
                 <Text className="text-white text-base font-bold">Daily Logs Summary</Text>
               </View>
               <TouchableOpacity onPress={() => setAiModalVisible(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
               {generatingAi ? (
                  <View className="items-center py-10">
                     <ActivityIndicator size="large" color="#f472b6" className="mb-4" />
                     <Text className="text-[#888] text-xs uppercase tracking-widest font-bold">Generating AI Summary...</Text>
                  </View>
               ) : (
                  <Text className="text-white text-sm leading-6 mb-6">{aiSummary}</Text>
               )}
            </ScrollView>

            <View className="p-5 border-t border-[#ffffff1a] flex-row">
               <TouchableOpacity 
                  disabled={generatingAi || !aiSummary}
                  onPress={handleDownload} 
                  className="flex-1 bg-[#adc6ff] p-3 rounded flex-row items-center justify-center mr-3 opacity-90 disabled:opacity-50"
               >
                  <Download size={14} color="#131313" className="mr-2" />
                  <Text className="text-[#131313] font-bold text-xs uppercase tracking-widest">DOWNLOAD</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  onPress={() => setAiModalVisible(false)} 
                  className="bg-[#201f1f] border border-[#ffffff1a] p-3 rounded items-center justify-center px-6"
               >
                  <Text className="text-white font-bold text-xs uppercase tracking-widest">CLOSE</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
