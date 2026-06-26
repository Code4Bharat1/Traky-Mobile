import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { FolderKanban, Plus, Clock, Users, X, ChevronDown, CheckCircle, Search, LayoutGrid, List, ArrowLeft } from 'lucide-react-native';

export default function ProjectsScreen() {
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

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'COMPLETED';
    const statusColor = isCompleted ? '#10b981' : '#47c8ff';
    const statusBg = isCompleted ? '#10b9811a' : '#47c8ff1a';
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
        <TouchableOpacity onPress={() => { setSelectedProject(item); setDetailsModalVisible(true); }} className="bg-[#1c1b1b] rounded-lg p-4 mb-2 border border-[#ffffff1a] flex-row items-center justify-between">
           <View className="flex-1 flex-row items-center">
              <FolderKanban size={14} color="#adc6ff" className="mr-3" />
              <View className="flex-1">
                 <Text className="text-white text-sm font-bold truncate" numberOfLines={1}>{pName}</Text>
                 <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mt-0.5">{dName}</Text>
              </View>
           </View>
           
           <View className="flex-1 px-2 justify-center hidden sm:flex">
              <Text className="text-white text-xs">{leadName}</Text>
           </View>
           
           <View className="w-24 px-2 justify-center items-end">
              <View className={`px-2 py-1 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
                <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                  {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                </Text>
              </View>
              {isOverdue && (
                 <View className="px-2 py-0.5 rounded mt-1 bg-[#ef44441a] border border-[#ef44444a]">
                    <Text className="text-[#ef4444] text-[8px] font-bold uppercase tracking-widest">OVERDUE</Text>
                 </View>
              )}
           </View>
        </TouchableOpacity>
      );
    }

    // Grid View styled like the web mobile preview screenshot
    return (
      <TouchableOpacity onPress={() => { setSelectedProject(item); setDetailsModalVisible(true); }} className="bg-[#131313] rounded-lg p-5 mb-4 border border-[#ffffff1a]">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-white text-base font-bold mb-1" numberOfLines={1}>{pName}</Text>
            <Text className="text-[#888] text-[10px] uppercase tracking-wider font-bold">{dName}</Text>
          </View>
          <View className="items-end">
            <View className={`px-2 py-1 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
              <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                • {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
              </Text>
            </View>
            {isOverdue && (
               <View className="px-2 py-0.5 rounded mt-1 bg-[#ef44441a] border border-[#ef44444a]">
                  <Text className="text-[#ef4444] text-[8px] font-bold uppercase tracking-widest">OVERDUE</Text>
               </View>
            )}
          </View>
        </View>
        
        <View className="mb-2 flex-row justify-between">
           <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Manager</Text>
           <Text className="text-white text-xs">{leadName}</Text>
        </View>

        <View className="mb-2 flex-row justify-between">
           <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Progress</Text>
           <Text className="text-white text-xs">{progressPercent}%</Text>
        </View>

        <View className="mb-4 flex-row justify-between">
           <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Deadline</Text>
           <Text className="text-white text-xs">{deadlineStr}</Text>
        </View>

        <View className="mt-2">
           <View className="flex-row justify-between mb-1">
              <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Completion</Text>
              <Text className="text-white text-[10px]">{progressPercent}%</Text>
           </View>
           <View className="h-1 bg-[#1c1b1b] rounded overflow-hidden">
              <View className="h-full bg-[#adc6ff] rounded" style={{ width: `${progressPercent}%` }} />
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
        <View className="flex-1 bg-[#0a0a0a]">
           {/* Header */}
           <View className="p-4 border-b border-[#ffffff1a] flex-row justify-between items-center">
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} className="flex-row items-center py-2">
                 <ArrowLeft size={16} color="#888" className="mr-2" />
                 <Text className="text-[#888] font-bold text-[10px] uppercase tracking-widest">BACK</Text>
              </TouchableOpacity>
              <Text className="text-white font-bold text-xs">ISSUES 0</Text>
           </View>

           <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                 <Text className="text-white text-2xl font-bold mb-1">{pName}</Text>
                 <Text className="text-[#888] text-xs uppercase tracking-widest">{dName}</Text>
              </View>

              {/* Lead */}
              <View className="mb-6">
                 <Text className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-2">LEAD</Text>
                 <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-3 rounded flex-row items-center">
                    <View className="w-8 h-8 rounded bg-[#131313] border border-[#ffffff1a] justify-center items-center mr-3">
                       <Text className="text-[#adc6ff] font-bold text-xs">{leadUser ? getUserInitials(leadUser.name) : 'U'}</Text>
                    </View>
                    <View>
                       <Text className="text-white text-xs font-bold mb-0.5">{leadUser ? leadUser.name : 'Unassigned'}</Text>
                       <Text className="text-[#888] text-[9px] uppercase tracking-widest">LEAD</Text>
                    </View>
                 </View>
              </View>

              {/* Reviewers */}
              <View className="mb-6">
                 <Text className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-2">REVIEWERS ({reviewers.length})</Text>
                 {reviewers.length === 0 ? (
                    <Text className="text-[#888] text-xs italic">No reviewers assigned</Text>
                 ) : (
                    reviewers.map(r => (
                       <View key={r._id} className="bg-[#1c1b1b] border border-[#ffffff1a] p-3 rounded flex-row items-center mb-2">
                          <View className="w-8 h-8 rounded bg-[#131313] border border-[#ffffff1a] justify-center items-center mr-3">
                             <Text className="text-[#47c8ff] font-bold text-xs">{getUserInitials(r.name)}</Text>
                          </View>
                          <View>
                             <Text className="text-white text-xs font-bold mb-0.5">{r.name}</Text>
                             <Text className="text-[#888] text-[9px] uppercase tracking-widest">REVIEWER</Text>
                          </View>
                       </View>
                    ))
                 )}
              </View>

              {/* Contributors */}
              <View className="mb-6">
                 <Text className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-2">CONTRIBUTORS ({contributors.length})</Text>
                 {contributors.length === 0 ? (
                    <Text className="text-[#888] text-xs italic">No contributors assigned</Text>
                 ) : (
                    contributors.map(c => (
                       <View key={c._id} className="bg-[#1c1b1b] border border-[#ffffff1a] p-3 rounded flex-row items-center mb-2">
                          <View className="w-8 h-8 rounded bg-[#131313] border border-[#ffffff1a] justify-center items-center mr-3">
                             <Text className="text-[#10b981] font-bold text-xs">{getUserInitials(c.name)}</Text>
                          </View>
                          <View>
                             <Text className="text-white text-xs font-bold mb-0.5">{c.name}</Text>
                             <Text className="text-[#888] text-[9px] uppercase tracking-widest">CONTRIBUTOR</Text>
                          </View>
                       </View>
                    ))
                 )}
              </View>

              {/* Tasks Progress */}
              <View className="mb-6">
                 <Text className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-2">TASKS PROGRESS</Text>
                 <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded">
                    <View className="flex-row justify-between mb-2">
                       <Text className="text-white text-xs font-bold">{completedTasks} / {totalTasks} completed</Text>
                       <Text className="text-[#adc6ff] text-xs font-bold">{tasksProgressPercent}%</Text>
                    </View>
                    <View className="h-1 bg-[#131313] rounded overflow-hidden">
                       <View className="h-full bg-[#adc6ff] rounded" style={{ width: `${tasksProgressPercent}%` }} />
                    </View>
                 </View>
              </View>

              {/* Issue Reports */}
              <View className="mb-6">
                 <Text className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-2">ISSUE REPORTS (0)</Text>
                 <View className="bg-[#131313] border border-[#ffffff1a] p-8 rounded items-center justify-center min-h-[150px]">
                    <Text className="text-[#888] text-[10px] uppercase tracking-widest font-bold">NO ISSUES REPORTED</Text>
                 </View>
              </View>
           </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className="text-[#888] text-[10px] tracking-widest uppercase mb-1 font-bold">Admin / Projects Overview</Text>
           <Text className="text-white text-2xl font-bold tracking-wider">Projects</Text>
        </View>
        <TouchableOpacity onPress={() => openAddModal()} className="bg-[#adc6ff] flex-row items-center px-3 py-2 rounded">
          <Plus size={16} color="#131313" className="mr-1" />
          <Text className="text-[#131313] font-bold text-[10px] uppercase tracking-widest">Add Project</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View className="flex-row mb-6">
        <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] p-3 rounded-lg mr-2">
           <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Total Projects</Text>
           <Text className="text-white text-xl font-bold">{stats.total}</Text>
        </View>
        <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] p-3 rounded-lg mr-2">
           <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">In Progress</Text>
           <Text className="text-white text-xl font-bold">{stats.inProgress}</Text>
        </View>
        <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] p-3 rounded-lg">
           <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Completed</Text>
           <Text className="text-white text-xl font-bold">{stats.completed}</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View className="mb-4">
         <View className="flex-row items-center bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 mb-2">
            <Search size={16} color="#888" className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search name, manager, department..."
               placeholderTextColor="#888"
               className="flex-1 text-white text-xs h-10"
            />
         </View>
         <View className="flex-row justify-between items-center">
            <View className="flex-row flex-1 mr-2">
               <TouchableOpacity onPress={() => { setDropdownType('filterStatus'); setDropdownVisible(true); }} className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded px-2 h-8 flex-row items-center justify-between mr-2">
                 <Text className="text-white text-[10px] uppercase font-bold tracking-widest">{filterStatus === 'ALL' ? 'ALL STATUS' : filterStatus.replace('_', ' ')}</Text>
                 <ChevronDown size={12} color="#888" />
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setDropdownType('filterDept'); setDropdownVisible(true); }} className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded px-2 h-8 flex-row items-center justify-between">
                 <Text className="text-white text-[10px] uppercase font-bold tracking-widest truncate" numberOfLines={1}>
                   {filterDept === 'ALL' ? 'ALL DEPTS' : departments.find(d => d._id === filterDept)?.departmentName?.substring(0,8) + '..'}
                 </Text>
                 <ChevronDown size={12} color="#888" />
               </TouchableOpacity>
            </View>
            <View className="flex-row bg-[#1c1b1b] border border-[#ffffff1a] rounded h-8">
               <TouchableOpacity onPress={() => setViewMode('list')} className={`px-3 justify-center items-center rounded-l ${viewMode === 'list' ? 'bg-[#adc6ff33]' : ''}`}>
                  <List size={14} color={viewMode === 'list' ? '#adc6ff' : '#888'} />
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setViewMode('grid')} className={`px-3 justify-center items-center rounded-r border-l border-[#ffffff1a] ${viewMode === 'grid' ? 'bg-[#adc6ff33]' : ''}`}>
                  <LayoutGrid size={14} color={viewMode === 'grid' ? '#adc6ff' : '#888'} />
               </TouchableOpacity>
            </View>
         </View>
      </View>

      {/* Projects List */}
      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={filteredProjects}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#888] text-center mt-10 text-xs font-bold uppercase tracking-widest">No projects found.</Text>
          }
        />
      )}

      {/* Add Project Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border-t border-[#ffffff1a] rounded-t-2xl p-6 h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">Add Project</Text>
               <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Project Name *</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                 <TextInput 
                   value={formData.name} 
                   onChangeText={v => setFormData({...formData, name: v})} 
                   placeholder="e.g. Website Redesign" 
                   placeholderTextColor="#888" 
                   className="text-white text-sm py-1" 
                 />
              </View>

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Department *</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('department'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-3 flex-row justify-between items-center">
                       <Text className={formData.departmentId ? "text-white text-xs capitalize" : "text-[#888] text-xs"} numberOfLines={1}>
                         {formData.departmentId ? departments.find(d => d._id === formData.departmentId)?.departmentName || 'Unknown' : 'Select'}
                       </Text>
                       <ChevronDown size={14} color="#888" />
                    </TouchableOpacity>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Status</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('status'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-3 flex-row justify-between items-center">
                       <Text className="text-white text-xs capitalize" numberOfLines={1}>
                         {formData.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                       </Text>
                       <ChevronDown size={14} color="#888" />
                    </TouchableOpacity>
                 </View>
              </View>

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Lead</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('lead'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-3 flex-row justify-between items-center">
                       <Text className={formData.managerId ? "text-white text-xs" : "text-[#888] text-xs"} numberOfLines={1}>
                         {formData.managerId ? users.find(u => u._id === formData.managerId)?.name || 'Unknown' : 'Unassigned'}
                       </Text>
                       <ChevronDown size={14} color="#888" />
                    </TouchableOpacity>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Reviewer</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('reviewer'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-3 flex-row justify-between items-center">
                       <Text className={formData.testerId ? "text-white text-xs" : "text-[#888] text-xs"} numberOfLines={1}>
                         {formData.testerId ? users.find(u => u._id === formData.testerId)?.name || 'Unknown' : 'Unassigned'}
                       </Text>
                       <ChevronDown size={14} color="#888" />
                    </TouchableOpacity>
                 </View>
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Deadline (YYYY-MM-DD)</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                 <TextInput 
                   value={formData.deadline} 
                   onChangeText={v => setFormData({...formData, deadline: v})} 
                   placeholder="e.g. 2026-12-31" 
                   placeholderTextColor="#888" 
                   className="text-white text-sm py-1" 
                 />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Category (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('category'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4 flex-row justify-between items-center">
                 <Text className={formData.categoryId ? "text-white text-xs" : "text-[#888] text-xs"}>
                   {formData.categoryId ? categories.find(c => c._id === formData.categoryId)?.name || 'Unknown' : 'Select a category'}
                 </Text>
                 <ChevronDown size={14} color="#888" />
              </TouchableOpacity>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Description</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-6">
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Project description and goals..." 
                   placeholderTextColor="#888" 
                   multiline numberOfLines={3}
                   className="text-white text-sm py-1 text-vertical-top" 
                 />
              </View>
            </ScrollView>

            <View className="flex-row justify-end pt-4 border-t border-[#ffffff1a]">
               <TouchableOpacity onPress={() => setAddModalVisible(false)} className="mr-4 py-2"><Text className="text-[#888] font-bold text-xs uppercase tracking-widest">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-[#adc6ff] px-6 py-2 rounded flex-row items-center">
                  {saving ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Save Project</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-5/6 max-h-[60%] p-2">
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
                  <TouchableOpacity className="py-4 px-4 border-b border-[#ffffff1a] flex-row items-center justify-between" onPress={() => selectDropdownItem(item)}>
                    <Text className="text-white text-sm capitalize">{item.name}</Text>
                    {isSelected && <CheckCircle size={16} color="#adc6ff" />}
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
