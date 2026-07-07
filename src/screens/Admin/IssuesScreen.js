import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { createBug, deleteBug, getAllBugs, getProjects, getUsers, updateBug } from '../../api/services';
import { AlertCircle, Plus, Clock, Tag, Edit2, Trash2, X, ChevronDown, CheckCircle, Search, Bug, User } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function IssuesScreen() {
  const { isDarkMode } = useThemeStore();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', severity: 'MEDIUM', projectId: '' });
  const [saving, setSaving] = useState(false);
  
  // Dropdown States
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState(''); // 'project', 'filterStatus', 'filterSeverity'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bugRes, projRes, userRes] = await Promise.all([
        client.get('/bugs?limit=500'),
        client.get('/projects?limit=500'),
        client.get('/users?limit=500')
      ]);
      setIssues(bugRes.data.data || bugRes.data || []);
      setProjects(projRes.data.data || projRes.data || []);
      setUsers(userRes.data.data || userRes.data.users || []);
    } catch (error) {
      console.error("Failed to load issues data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (issue = null) => {
    if (issue) {
      setEditingIssue(issue);
      setFormData({
        title: issue.title || '',
        description: issue.description || '',
        severity: issue.severity || 'MEDIUM',
        projectId: issue.projectId?._id || issue.projectId || ''
      });
    } else {
      setEditingIssue(null);
      setFormData({ title: '', description: '', severity: 'MEDIUM', projectId: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.projectId) {
      Alert.alert('Error', 'Issue Title and Project are required');
      return;
    }
    setSaving(true);
    try {
      if (editingIssue) {
        await client.patch(`/bugs/${editingIssue._id}`, formData);
      } else {
        await client.post('/bugs', formData);
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save issue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Issue', 'Are you sure you want to delete this issue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/bugs/${id}`);
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete issue');
          }
      }}
    ]);
  };

  const changeStatus = async (id, currentStatus) => {
    const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const newStatus = statuses[nextIdx];
    try {
      await client.patch(`/bugs/${id}/status`, { status: newStatus });
      fetchData();
    } catch (e) {
      try {
        await client.patch(`/bugs/${id}`, { status: newStatus });
        fetchData();
      } catch (err) {
        Alert.alert('Error', 'Failed to update status');
      }
    }
  };

  // Processing Data
  const safeIssues = Array.isArray(issues) ? issues : [];
  
  const stats = {
    total: safeIssues.length,
    open: safeIssues.filter(i => i.status === 'OPEN').length,
    inProgress: safeIssues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: safeIssues.filter(i => i.status === 'RESOLVED').length
  };

  const filteredIssues = safeIssues.filter(i => {
    if (filterStatus !== 'ALL' && i.status !== filterStatus) return false;
    if (filterSeverity !== 'ALL' && i.severity !== filterSeverity) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (i.title || i.name || '').toLowerCase();
      const projName = (i.projectId?.name || i.projectId?.projectName || '').toLowerCase();
      if (!title.includes(q) && !projName.includes(q)) return false;
    }
    
    return true;
  });

  const getDropdownOptions = () => {
    if (dropdownType === 'project') return projects;
    if (dropdownType === 'filterStatus') return [
      {_id: 'ALL', name: 'All Statuses'}, {_id: 'OPEN', name: 'Open'}, 
      {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'RESOLVED', name: 'Resolved'}, {_id: 'CLOSED', name: 'Closed'}
    ];
    if (dropdownType === 'filterSeverity') return [
      {_id: 'ALL', name: 'All Severities'}, {_id: 'LOW', name: 'Low'}, 
      {_id: 'MEDIUM', name: 'Medium'}, {_id: 'HIGH', name: 'High'}, {_id: 'CRITICAL', name: 'Critical'}
    ];
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'project') setFormData({...formData, projectId: item._id});
    if (dropdownType === 'filterStatus') setFilterStatus(item._id);
    if (dropdownType === 'filterSeverity') setFilterSeverity(item._id);
    setDropdownVisible(false);
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => {
    const isResolved = item.status === 'RESOLVED' || item.status === 'CLOSED';
    const statusColor = isResolved ? '#10b981' : (isDarkMode ? '#47c8ff' : '#0284c7');
    const statusBg = isResolved ? (isDarkMode ? '#10b9811a' : '#ecfdf5') : (isDarkMode ? '#47c8ff1a' : '#f0f9ff');
    
    let sevColor = '#f59e0b';
    let sevBg = isDarkMode ? '#f59e0b1a' : '#fffbeb';
    if (item.severity === 'CRITICAL') { sevColor = '#ef4444'; sevBg = isDarkMode ? '#ef44441a' : '#fef2f2'; }
    else if (item.severity === 'HIGH') { sevColor = '#f97316'; sevBg = isDarkMode ? '#f973161a' : '#fff7ed'; }
    else if (item.severity === 'LOW') { sevColor = '#10b981'; sevBg = isDarkMode ? '#10b9811a' : '#ecfdf5'; }

    let reportedByName = 'Unknown';
    if (item.created_by || item.reporterId) {
      const rId = item.created_by?._id || item.created_by || item.reporterId;
      const rUser = users.find(u => u._id === rId);
      if (rUser) reportedByName = rUser.name;
    }

    return (
      <View className={`rounded-lg p-5 mb-4 border ${bgCard} ${borderColor}`}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3 flex-row items-start">
            <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 border`} style={{ backgroundColor: sevBg, borderColor: `${sevColor}4a` }}>
              <AlertCircle size={18} color={sevColor} />
            </View>
            <View className="flex-1">
              <Text className={`text-base font-bold mb-1 ${textColor}`}>{item.title || item.name || 'Untitled Issue'}</Text>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textMuted}`}>{item.projectId?.name || item.projectId?.projectName || 'No Project'}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => openModal(item)} className={`p-1.5 rounded border mr-2 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
              <Edit2 size={14} color={isDarkMode ? "#c2c6d6" : "#6b7280"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5 bg-[#ff47471a] rounded border border-[#ff47474a]">
              <Trash2 size={14} color="#ff4747" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
           <View className={`px-2 py-1 rounded mr-2`} style={{ backgroundColor: sevBg, borderColor: `${sevColor}4a`, borderWidth: 1 }}>
              <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: sevColor }}>
                SEVERITY: {item.severity || 'MEDIUM'}
              </Text>
           </View>
           <TouchableOpacity onPress={() => changeStatus(item._id, item.status)} className={`px-2 py-1 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
              <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                STATUS: {item.status?.replace('_', ' ') || 'OPEN'}
              </Text>
           </TouchableOpacity>
        </View>

        {item.description ? (
          <Text className={`text-xs mb-4 ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View className={`flex-row justify-between items-center border-t pt-3 ${borderColor}`}>
          <View className="flex-row items-center">
            <User size={12} color={isDarkMode ? "#6b7280" : "#9ca3af"} className="mr-2" />
            <Text className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>
              BY: {reportedByName}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={12} color={isDarkMode ? "#6b7280" : "#9ca3af"} className="mr-2" />
            <Text className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>
              {item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleDateString() : 'NO DATE'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin / Issues</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Issues</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Report Issue</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Grid */}
      <View className="flex-row mb-6">
        <View className={`flex-1 border p-3 rounded-lg mr-2 ${bgCard} ${borderColor}`}>
           <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Total</Text>
           <Text className={`text-xl font-bold ${textColor}`}>{stats.total}</Text>
        </View>
        <View className={`flex-1 border p-3 rounded-lg mr-2 ${bgCard} ${borderColor}`}>
           <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Open</Text>
           <Text className="text-[#ef4444] text-xl font-bold">{stats.open}</Text>
        </View>
        <View className={`flex-1 border p-3 rounded-lg mr-2 ${bgCard} ${borderColor}`}>
           <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>In Progress</Text>
           <Text className={`text-xl font-bold ${isDarkMode ? 'text-[#47c8ff]' : 'text-[#0ea5e9]'}`}>{stats.inProgress}</Text>
        </View>
        <View className={`flex-1 border p-3 rounded-lg ${bgCard} ${borderColor}`}>
           <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Resolved</Text>
           <Text className="text-[#10b981] text-xl font-bold">{stats.resolved}</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View className="mb-4">
         <View className={`border rounded px-3 h-10 mb-2 flex-row items-center ${bgInput} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search Issues..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
         <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => { setDropdownType('filterStatus'); setDropdownVisible(true); }} className={`flex-1 border rounded px-3 h-10 flex-row items-center justify-between mr-2 ${bgInput} ${borderColor}`}>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterStatus === 'ALL' ? 'All Statuses' : filterStatus.replace('_', ' ')}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setDropdownType('filterSeverity'); setDropdownVisible(true); }} className={`flex-1 border rounded px-3 h-10 flex-row items-center justify-between ml-2 ${bgInput} ${borderColor}`}>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterSeverity === 'ALL' ? 'All Severities' : filterSeverity}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
         </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={filteredIssues}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className={`items-center justify-center mt-10 p-6 border rounded-lg ${bgCard} ${borderColor}`}>
               <View className={`h-12 w-12 rounded-full items-center justify-center mb-4 ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100'}`}>
                 <Bug size={24} color={isDarkMode ? "#888" : "#9ca3af"} />
               </View>
               <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>No issues found</Text>
            </View>
          }
        />
      )}

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className={`border-t rounded-t-2xl p-6 h-[85%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-lg font-bold tracking-widest uppercase ${textColor}`}>{editingIssue ? 'Edit Issue' : 'Report Issue'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Issue Title *</Text>
              <View className={`border rounded p-3 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.title} 
                   onChangeText={v => setFormData({...formData, title: v})} 
                   placeholder="e.g. Login page crash" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={`text-base py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Project *</Text>
              <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className={`border rounded p-4 mb-4 flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <Text className={formData.projectId ? `text-base capitalize ${textColor}` : `text-base ${textMuted}`}>
                   {formData.projectId ? projects.find(p => p._id === formData.projectId)?.name || projects.find(p => p._id === formData.projectId)?.projectName || 'Unknown' : 'Select a project'}
                 </Text>
                 <ChevronDown size={20} color={isDarkMode ? "#888" : "#9ca3af"} />
              </TouchableOpacity>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Severity</Text>
              <View className={`flex-row justify-between border rounded p-1 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                  <TouchableOpacity key={s} onPress={() => setFormData({...formData, severity: s})} className={`flex-1 py-2 items-center rounded ${formData.severity === s ? (isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]') : ''}`}>
                    <Text className={`text-[10px] font-bold ${formData.severity === s ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textMuted}`}>{s.substring(0,4)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Description / Steps to Reproduce</Text>
              <View className={`border rounded p-3 mb-8 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Detailed description..." 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   multiline numberOfLines={4}
                   className={`text-base py-1 min-h-[80px] ${textColor}`} 
                   textAlignVertical="top"
                 />
              </View>
            </ScrollView>

            <View className={`flex-row justify-end pt-4 border-t mt-2 pb-6 ${borderColor}`}>
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-sm uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Issue</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shared Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className={`border rounded-lg w-5/6 max-h-[60%] p-2 ${bgCard} ${borderColor}`}>
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
              renderItem={({item}) => {
                let isSelected = false;
                if (dropdownType === 'project') isSelected = formData.projectId === item._id;
                if (dropdownType === 'filterStatus') isSelected = filterStatus === item._id;
                if (dropdownType === 'filterSeverity') isSelected = filterSeverity === item._id;

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

    </View>
  );
}
