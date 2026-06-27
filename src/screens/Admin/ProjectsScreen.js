import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { FolderKanban, Plus, Clock, Users, X, ChevronDown, CheckCircle, Search, LayoutGrid, List, ArrowLeft } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function ProjectsScreen() {
  const { isDarkMode } = useThemeStore();
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [formData, setFormData] = useState({ 
    name: '', description: '', departmentId: '', categoryId: '', 
    status: 'IN_PROGRESS', managerId: '', testerId: '', deadline: '' 
  });
  const [saving, setSaving] = useState(false);
  
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState(''); 

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, depRes, catRes, userRes] = await Promise.all([
        client.get('/projects?limit=500'),
        client.get('/departments?limit=100'),
        client.get('/categories'),
        client.get('/users?limit=500')
      ]);
      setProjects(projRes.data.data || projRes.data || []);
      setDepartments(depRes.data.allDepartments || depRes.data.data || []);
      setCategories(catRes.data.data || catRes.data || []);
      setUsers(userRes.data.data || userRes.data.users || []);
    } catch (error) {
      console.error("Failed to load projects data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormData({ 
      name: '', description: '', departmentId: '', categoryId: '', 
      status: 'IN_PROGRESS', managerId: '', testerId: '', deadline: '' 
    });
    setAddModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.departmentId) {
      Alert.alert('Error', 'Project Name and Department are required');
      return;
    }
    
    const payload = {
      name: formData.name,
      description: formData.description,
      departmentId: formData.departmentId,
      categoryId: formData.categoryId || null,
      status: formData.status,
      endDate: formData.deadline || null,
      managerIds: formData.managerId ? [formData.managerId] : [],
      testerIds: formData.testerId ? [formData.testerId] : []
    };

    setSaving(true);
    try {
      await client.post('/projects', payload);
      setAddModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || error.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  // Processing Data
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  const stats = {
    total: safeProjects.length,
    inProgress: safeProjects.filter(p => p.status !== 'COMPLETED').length,
    completed: safeProjects.filter(p => p.status === 'COMPLETED').length
  };

  const filteredProjects = safeProjects.filter(p => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    
    const dId = p.departmentId?._id || p.departmentId;
    if (filterDept !== 'ALL' && dId !== filterDept) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const pName = (p.name || p.projectName || '').toLowerCase();
      const dName = (p.departmentId?.departmentName || '').toLowerCase();
      
      let managerMatch = false;
      if (p.managerIds && p.managerIds.length > 0) {
         const mId = p.managerIds[0];
         const manager = users.find(u => u._id === mId || u._id === mId._id);
         if (manager && manager.name.toLowerCase().includes(q)) managerMatch = true;
      }
      
      if (!pName.includes(q) && !dName.includes(q) && !managerMatch) return false;
    }
    
    return true;
  });

  const getDropdownOptions = () => {
    if (dropdownType === 'department') return departments.map(d => ({ _id: d._id, name: d.departmentName }));
    if (dropdownType === 'category') return [{_id: '', name: 'No Category'}, ...categories];
    if (dropdownType === 'status') return [{_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'COMPLETED', name: 'Completed'}];
    if (dropdownType === 'lead' || dropdownType === 'reviewer') return [{_id: '', name: 'Unassigned'}, ...users];
    
    if (dropdownType === 'filterStatus') return [{_id: 'ALL', name: 'All Status'}, {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'COMPLETED', name: 'Completed'}];
    if (dropdownType === 'filterDept') return [{_id: 'ALL', name: 'All Depts'}, ...departments.map(d => ({ _id: d._id, name: d.departmentName }))];
    
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'department') setFormData({...formData, departmentId: item._id});
    if (dropdownType === 'category') setFormData({...formData, categoryId: item._id});
    if (dropdownType === 'status') setFormData({...formData, status: item._id});
    if (dropdownType === 'lead') setFormData({...formData, managerId: item._id});
    if (dropdownType === 'reviewer') setFormData({...formData, testerId: item._id});
    
    if (dropdownType === 'filterStatus') setFilterStatus(item._id);
    if (dropdownType === 'filterDept') setFilterDept(item._id);
    
    setDropdownVisible(false);
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'COMPLETED';
    const statusColor = isCompleted ? '#10b981' : (isDarkMode ? '#47c8ff' : '#0284c7');
    const statusBg = isCompleted ? (isDarkMode ? '#10b9811a' : '#ecfdf5') : (isDarkMode ? '#47c8ff1a' : '#f0f9ff');
    const dName = item.departmentId?.departmentName || 'No Dept';
    const pName = item.name || item.projectName || 'Unnamed Project';
    
    const isOverdue = item.endDate && new Date(item.endDate) < new Date() && !isCompleted;

    let leadName = 'No manager';
    if (item.managerIds && item.managerIds.length > 0) {
      const mId = typeof item.managerIds[0] === 'object' ? (item.managerIds[0]._id || item.managerIds[0].id) : item.managerIds[0];
      const manager = users.find(u => u._id === mId) || (typeof item.managerIds[0] === 'object' ? item.managerIds[0] : null);
      if (manager && manager.name) leadName = manager.name;
    }
    
    const deadlineStr = item.endDate ? new Date(item.endDate).toLocaleDateString() : '—';
    const totalTasksItem = item.modules || item.totalTasks || 0;
    const completedTasksItem = item.modulesCompleted || item.completedTasks || 0;
    const progressPercent = totalTasksItem > 0 ? Math.round((completedTasksItem / totalTasksItem) * 100) : (item.progress || 0);

    if (viewMode === 'list') {
      return (
        <TouchableOpacity onPress={() => { setSelectedProject(item); setDetailsModalVisible(true); }} className={`rounded-lg p-4 mb-2 border flex-row items-center justify-between ${bgCard} ${borderColor}`}>
           <View className="flex-1 flex-row items-center">
              <FolderKanban size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-3" />
              <View className="flex-1">
                 <Text className={`text-sm font-bold truncate ${textColor}`} numberOfLines={1}>{pName}</Text>
                 <Text className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${textMuted}`}>{dName}</Text>
              </View>
           </View>
           
           <View className="flex-1 px-2 justify-center hidden sm:flex">
              <Text className={`text-xs ${textColor}`}>{leadName}</Text>
           </View>
           
           <View className="w-24 px-2 justify-center items-end">
              <View className={`px-2 py-1 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
                <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                  {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                </Text>
              </View>
              {isOverdue && (
                 <View className={`px-2 py-0.5 rounded mt-1 border ${isDarkMode ? 'bg-[#ef44441a] border-[#ef44444a]' : 'bg-red-50 border-red-200'}`}>
                    <Text className="text-[#ef4444] text-[8px] font-bold uppercase tracking-widest">OVERDUE</Text>
                 </View>
              )}
           </View>
        </TouchableOpacity>
      );
    }

    // Grid View
    return (
      <TouchableOpacity onPress={() => { setSelectedProject(item); setDetailsModalVisible(true); }} className={`rounded-lg p-5 mb-4 border ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-2">
            <Text className={`text-base font-bold mb-1 ${textColor}`} numberOfLines={1}>{pName}</Text>
            <Text className={`text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>{dName}</Text>
          </View>
          <View className="items-end">
            <View className={`px-2 py-1 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
              <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                • {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
              </Text>
            </View>
            {isOverdue && (
               <View className={`px-2 py-0.5 rounded mt-1 border ${isDarkMode ? 'bg-[#ef44441a] border-[#ef44444a]' : 'bg-red-50 border-red-200'}`}>
                  <Text className="text-[#ef4444] text-[8px] font-bold uppercase tracking-widest">OVERDUE</Text>
               </View>
            )}
          </View>
        </View>
        
        <View className="mb-2 flex-row justify-between">
           <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Manager</Text>
           <Text className={`text-xs ${textColor}`}>{leadName}</Text>
        </View>

        <View className="mb-2 flex-row justify-between">
           <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Progress</Text>
           <Text className={`text-xs ${textColor}`}>{progressPercent}%</Text>
        </View>

        <View className="mb-4 flex-row justify-between">
           <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Deadline</Text>
           <Text className={`text-xs ${textColor}`}>{deadlineStr}</Text>
        </View>

        <View className="mt-2">
           <View className="flex-row justify-between mb-1">
              <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Completion</Text>
              <Text className={`text-[10px] ${textColor}`}>{progressPercent}%</Text>
           </View>
           <View className={`h-1 rounded overflow-hidden ${isDarkMode ? 'bg-[#1c1b1b]' : 'bg-gray-200'}`}>
              <View className={`h-full rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`} style={{ width: `${progressPercent}%` }} />
           </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedProject) return null;

    const pName = selectedProject.name || selectedProject.projectName || 'Unnamed Project';
    const dName = selectedProject.departmentId?.departmentName || 'No Dept';

    const getUserId = (idOrObj) => (typeof idOrObj === 'object' && idOrObj !== null) ? (idOrObj._id || idOrObj.id) : idOrObj;

    let leadUser = null;
    if (selectedProject.managerIds && selectedProject.managerIds.length > 0) {
      const mId = getUserId(selectedProject.managerIds[0]);
      leadUser = users.find(u => u._id === mId) || (typeof selectedProject.managerIds[0] === 'object' ? selectedProject.managerIds[0] : null);
    }

    const reviewers = (selectedProject.testerIds || []).map(r => {
      const rId = getUserId(r);
      return users.find(u => u._id === rId) || (typeof r === 'object' ? r : null);
    }).filter(Boolean);

    const contributors = (selectedProject.developerIds || []).map(c => {
      const cId = getUserId(c);
      return users.find(u => u._id === cId) || (typeof c === 'object' ? c : null);
    }).filter(Boolean);

    const totalTasks = selectedProject.modules || selectedProject.totalTasks || 0;
    const completedTasks = selectedProject.modulesCompleted || selectedProject.completedTasks || 0;
    const tasksProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (selectedProject.progress || 0);

    return (
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View className={`flex-1 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`}>
           {/* Header */}
           <View className={`p-4 border-b flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-white'} ${borderColor}`}>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} className="flex-row items-center py-2">
                 <ArrowLeft size={16} color={isDarkMode ? "#888" : "#6b7280"} className="mr-2" />
                 <Text className={`font-bold text-[10px] uppercase tracking-widest ${textMuted}`}>BACK</Text>
              </TouchableOpacity>
              <Text className={`font-bold text-xs ${textColor}`}>ISSUES 0</Text>
           </View>

           <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                 <Text className={`text-2xl font-bold mb-1 ${textColor}`}>{pName}</Text>
                 <Text className={`text-xs uppercase tracking-widest ${textMuted}`}>{dName}</Text>
              </View>

              {/* Lead */}
              <View className="mb-6">
                 <Text className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${textMuted}`}>LEAD</Text>
                 <View className={`border p-3 rounded flex-row items-center ${bgCard} ${borderColor}`}>
                    <View className={`w-8 h-8 rounded border justify-center items-center mr-3 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <Text className={`font-bold text-xs ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{leadUser ? getUserInitials(leadUser.name) : 'U'}</Text>
                    </View>
                    <View>
                       <Text className={`text-xs font-bold mb-0.5 ${textColor}`}>{leadUser ? leadUser.name : 'Unassigned'}</Text>
                       <Text className={`text-[9px] uppercase tracking-widest ${textMuted}`}>LEAD</Text>
                    </View>
                 </View>
              </View>

              {/* Reviewers */}
              <View className="mb-6">
                 <Text className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${textMuted}`}>REVIEWERS ({reviewers.length})</Text>
                 {reviewers.length === 0 ? (
                    <Text className={`text-xs italic ${textMuted}`}>No reviewers assigned</Text>
                 ) : (
                    reviewers.map(r => (
                       <View key={r._id} className={`border p-3 rounded flex-row items-center mb-2 ${bgCard} ${borderColor}`}>
                          <View className={`w-8 h-8 rounded border justify-center items-center mr-3 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                             <Text className={`font-bold text-xs ${isDarkMode ? 'text-[#47c8ff]' : 'text-[#0284c7]'}`}>{getUserInitials(r.name)}</Text>
                          </View>
                          <View>
                             <Text className={`text-xs font-bold mb-0.5 ${textColor}`}>{r.name}</Text>
                             <Text className={`text-[9px] uppercase tracking-widest ${textMuted}`}>REVIEWER</Text>
                          </View>
                       </View>
                    ))
                 )}
              </View>

              {/* Contributors */}
              <View className="mb-6">
                 <Text className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${textMuted}`}>CONTRIBUTORS ({contributors.length})</Text>
                 {contributors.length === 0 ? (
                    <Text className={`text-xs italic ${textMuted}`}>No contributors assigned</Text>
                 ) : (
                    contributors.map(c => (
                       <View key={c._id} className={`border p-3 rounded flex-row items-center mb-2 ${bgCard} ${borderColor}`}>
                          <View className={`w-8 h-8 rounded border justify-center items-center mr-3 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                             <Text className="text-[#10b981] font-bold text-xs">{getUserInitials(c.name)}</Text>
                          </View>
                          <View>
                             <Text className={`text-xs font-bold mb-0.5 ${textColor}`}>{c.name}</Text>
                             <Text className={`text-[9px] uppercase tracking-widest ${textMuted}`}>CONTRIBUTOR</Text>
                          </View>
                       </View>
                    ))
                 )}
              </View>

              {/* Tasks Progress */}
              <View className="mb-6">
                 <Text className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${textMuted}`}>TASKS PROGRESS</Text>
                 <View className={`border p-4 rounded ${bgCard} ${borderColor}`}>
                    <View className="flex-row justify-between mb-2">
                       <Text className={`text-xs font-bold ${textColor}`}>{completedTasks} / {totalTasks} completed</Text>
                       <Text className={`text-xs font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{tasksProgressPercent}%</Text>
                    </View>
                    <View className={`h-1 rounded overflow-hidden ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-100'}`}>
                       <View className={`h-full rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`} style={{ width: `${tasksProgressPercent}%` }} />
                    </View>
                 </View>
              </View>

              {/* Issue Reports */}
              <View className="mb-6">
                 <Text className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${textMuted}`}>ISSUE REPORTS (0)</Text>
                 <View className={`border p-8 rounded items-center justify-center min-h-[150px] ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                    <Text className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>NO ISSUES REPORTED</Text>
                 </View>
              </View>
           </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin / Projects Overview</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Projects</Text>
        </View>
        <TouchableOpacity onPress={() => openAddModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Add Project</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View className="flex-row mb-6">
        <View className={`flex-1 border p-3 rounded-lg mr-2 ${bgCard} ${borderColor}`}>
           <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Total Projects</Text>
           <Text className={`text-xl font-bold ${textColor}`}>{stats.total}</Text>
        </View>
        <View className={`flex-1 border p-3 rounded-lg mr-2 ${bgCard} ${borderColor}`}>
           <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>In Progress</Text>
           <Text className={`text-xl font-bold ${textColor}`}>{stats.inProgress}</Text>
        </View>
        <View className={`flex-1 border p-3 rounded-lg ${bgCard} ${borderColor}`}>
           <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Completed</Text>
           <Text className={`text-xl font-bold ${textColor}`}>{stats.completed}</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View className="mb-4">
         <View className={`flex-row items-center border rounded px-3 h-10 mb-2 ${bgInput} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search name, manager, department..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
         <View className="flex-row justify-between items-center">
            <View className="flex-row flex-1 mr-2">
               <TouchableOpacity onPress={() => { setDropdownType('filterStatus'); setDropdownVisible(true); }} className={`flex-1 border rounded px-2 h-8 flex-row items-center justify-between mr-2 ${bgInput} ${borderColor}`}>
                 <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterStatus === 'ALL' ? 'ALL STATUS' : filterStatus.replace('_', ' ')}</Text>
                 <ChevronDown size={12} color={isDarkMode ? "#888" : "#9ca3af"} />
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setDropdownType('filterDept'); setDropdownVisible(true); }} className={`flex-1 border rounded px-2 h-8 flex-row items-center justify-between ${bgInput} ${borderColor}`}>
                 <Text className={`text-[10px] uppercase font-bold tracking-widest truncate ${textColor}`} numberOfLines={1}>
                   {filterDept === 'ALL' ? 'ALL DEPTS' : departments.find(d => d._id === filterDept)?.departmentName?.substring(0,8) + '..'}
                 </Text>
                 <ChevronDown size={12} color={isDarkMode ? "#888" : "#9ca3af"} />
               </TouchableOpacity>
            </View>
            <View className={`flex-row border rounded h-8 ${bgInput} ${borderColor}`}>
               <TouchableOpacity onPress={() => setViewMode('list')} className={`px-3 justify-center items-center rounded-l ${viewMode === 'list' ? (isDarkMode ? 'bg-[#adc6ff33]' : 'bg-blue-100') : ''}`}>
                  <List size={14} color={viewMode === 'list' ? (isDarkMode ? '#adc6ff' : '#2573e6') : (isDarkMode ? '#888' : '#9ca3af')} />
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setViewMode('grid')} className={`px-3 justify-center items-center rounded-r border-l ${borderColor} ${viewMode === 'grid' ? (isDarkMode ? 'bg-[#adc6ff33]' : 'bg-blue-100') : ''}`}>
                  <LayoutGrid size={14} color={viewMode === 'grid' ? (isDarkMode ? '#adc6ff' : '#2573e6') : (isDarkMode ? '#888' : '#9ca3af')} />
               </TouchableOpacity>
            </View>
         </View>
      </View>

      {/* Projects List */}
      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={filteredProjects}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className={`text-center mt-10 text-xs font-bold uppercase tracking-widest ${textMuted}`}>No projects found.</Text>
          }
        />
      )}

      {/* Add Project Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className={`border-t rounded-t-2xl p-6 h-[90%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Add Project</Text>
               <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Project Name *</Text>
              <View className={`border rounded p-2 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.name} 
                   onChangeText={v => setFormData({...formData, name: v})} 
                   placeholder="e.g. Website Redesign" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={`text-sm py-1 ${textColor}`} 
                 />
              </View>

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Department *</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('department'); setDropdownVisible(true); }} className={`border rounded p-3 flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <Text className={formData.departmentId ? `text-xs capitalize ${textColor}` : `text-xs ${textMuted}`} numberOfLines={1}>
                         {formData.departmentId ? departments.find(d => d._id === formData.departmentId)?.departmentName || 'Unknown' : 'Select'}
                       </Text>
                       <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Status</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('status'); setDropdownVisible(true); }} className={`border rounded p-3 flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <Text className={`text-xs capitalize ${textColor}`} numberOfLines={1}>
                         {formData.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                       </Text>
                       <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>
              </View>

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Lead</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('lead'); setDropdownVisible(true); }} className={`border rounded p-3 flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <Text className={formData.managerId ? `text-xs ${textColor}` : `text-xs ${textMuted}`} numberOfLines={1}>
                         {formData.managerId ? users.find(u => u._id === formData.managerId)?.name || 'Unknown' : 'Unassigned'}
                       </Text>
                       <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Reviewer</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('reviewer'); setDropdownVisible(true); }} className={`border rounded p-3 flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <Text className={formData.testerId ? `text-xs ${textColor}` : `text-xs ${textMuted}`} numberOfLines={1}>
                         {formData.testerId ? users.find(u => u._id === formData.testerId)?.name || 'Unknown' : 'Unassigned'}
                       </Text>
                       <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Deadline (YYYY-MM-DD)</Text>
              <View className={`border rounded p-2 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.deadline} 
                   onChangeText={v => setFormData({...formData, deadline: v})} 
                   placeholder="e.g. 2026-12-31" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={`text-sm py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Category (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('category'); setDropdownVisible(true); }} className={`border rounded p-3 mb-4 flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <Text className={formData.categoryId ? `text-xs ${textColor}` : `text-xs ${textMuted}`}>
                   {formData.categoryId ? categories.find(c => c._id === formData.categoryId)?.name || 'Unknown' : 'Select a category'}
                 </Text>
                 <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
              </TouchableOpacity>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Description</Text>
              <View className={`border rounded p-2 mb-6 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Project description and goals..." 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   multiline numberOfLines={3}
                   className={`text-sm py-1 text-vertical-top ${textColor}`} 
                 />
              </View>
            </ScrollView>

            <View className={`flex-row justify-end pt-4 border-t ${borderColor}`}>
               <TouchableOpacity onPress={() => setAddModalVisible(false)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase tracking-widest ${textMuted}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`px-6 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Project</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className={`border rounded-lg w-5/6 max-h-[60%] p-2 ${bgCard} ${borderColor}`}>
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item) => item._id || 'none'}
              renderItem={({item}) => {
                let isSelected = false;
                if (dropdownType === 'department') isSelected = formData.departmentId === item._id;
                if (dropdownType === 'category') isSelected = formData.categoryId === item._id;
                if (dropdownType === 'status') isSelected = formData.status === item._id;
                if (dropdownType === 'lead') isSelected = formData.managerId === item._id;
                if (dropdownType === 'reviewer') isSelected = formData.testerId === item._id;
                if (dropdownType === 'filterStatus') isSelected = filterStatus === item._id;
                if (dropdownType === 'filterDept') isSelected = filterDept === item._id;

                return (
                  <TouchableOpacity className={`py-4 px-4 border-b flex-row items-center justify-between ${borderColor}`} onPress={() => selectDropdownItem(item)}>
                    <Text className={`text-sm capitalize ${textColor}`}>{item.name}</Text>
                    {isSelected && <CheckCircle size={16} color={isDarkMode ? "#adc6ff" : "#2573e6"} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Details Modal */}
      {renderDetailsModal()}

    </View>
  );
}
