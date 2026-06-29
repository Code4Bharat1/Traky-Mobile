import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { CheckSquare, Plus, Clock, Tag, X, ChevronDown, CheckCircle, Search, MessageSquare, Send, FileText, Calendar, Check } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function TasksScreen() {
  const { isDarkMode } = useThemeStore();
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  
  // Date Picker State
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time Spent Modal State
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeSearchQuery, setTimeSearchQuery] = useState('');

  // Add Task Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'IN_PROGRESS', projectId: '', assigneeIds: [], proofRequired: false, startTime: null, endTime: null });
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Details Modal State
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Notes State
  const [expandedNoteTaskId, setExpandedNoteTaskId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  
  // Dropdown States
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState(''); 

  const fetchTasks = async (pageNumber = 1, shouldRefresh = false) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);

      let url = `/tasks?limit=20&page=${pageNumber}`;
      if (debouncedSearchQuery) url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      if (filterStatus !== 'ALL') url += `&status=${filterStatus}`;
      if (filterDept !== 'ALL') url += `&filterDept=${filterDept}`;
      if (filterDate) {
         const d = new Date(filterDate);
         d.setHours(0,0,0,0);
         url += `&dateFrom=${d.toISOString()}`;
         d.setHours(23,59,59,999);
         url += `&dateTo=${d.toISOString()}`;
      }

      const res = await client.get(url);
      const newTasks = res.data.data || res.data || [];
      
      if (shouldRefresh || pageNumber === 1) {
        setTasks(newTasks);
      } else {
        setTasks(prev => [...prev, ...newTasks]);
      }

      if (res.data.pagination) {
        setHasMore(pageNumber < res.data.pagination.pages);
      } else {
        setHasMore(newTasks.length === 20); // fallback
      }
      setPage(pageNumber);
    } catch (error) {
      console.error("Failed to load tasks data", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchAux = async () => {
      try {
        const [projRes, depRes, userRes] = await Promise.all([
          client.get('/projects?limit=500'),
          client.get('/departments?limit=100'),
          client.get('/users?limit=500')
        ]);
        setProjects(projRes.data.data || projRes.data || []);
        setDepartments(depRes.data.allDepartments || depRes.data.data || []);
        setUsers(userRes.data.data || userRes.data.users || []);
      } catch (err) {
        console.error("Failed to load auxiliary data", err);
      }
    };
    fetchAux();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTasks(1, true);
  }, [debouncedSearchQuery, filterStatus, filterDept, filterDate]);

  const openAddModal = () => {
    setFormData({ title: '', description: '', priority: 'MEDIUM', status: 'IN_PROGRESS', projectId: '', assigneeIds: [], proofRequired: false, startTime: null, endTime: null });
    setAddModalVisible(true);
  };

  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setDetailsModalVisible(true);
  };

  const toggleNotes = (task) => {
    if (expandedNoteTaskId === task._id) {
      setExpandedNoteTaskId(null);
      setNoteText('');
    } else {
      setExpandedNoteTaskId(task._id);
      setSelectedTask(task);
      setNoteText('');
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Task Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        ...formData, 
        contributors: formData.assigneeIds,
        proofRequired: formData.proofRequired
      };
      // Format dates if available
      if (formData.startTime) payload.startTime = formData.startTime.toISOString();
      if (formData.endTime) payload.endTime = formData.endTime.toISOString();
      if (!payload.projectId) delete payload.projectId;
      await client.post('/tasks', payload);
      setAddModalVisible(false);
      fetchTasks(1, true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign task');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedTask) return;
    setAddingNote(true);
    try {
      const payload = { text: noteText, authorName: 'Admin' };
      await client.post(`/tasks/${selectedTask._id}/notes`, payload);
      setNoteText('');
      
      const updatedNotes = [...(selectedTask.notes || []), { ...payload, createdAt: new Date() }];
      setSelectedTask({ ...selectedTask, notes: updatedNotes });
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, notes: updatedNotes } : t));
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const getUserId = (idOrObj) => (typeof idOrObj === 'object' && idOrObj !== null) ? (idOrObj._id || idOrObj.id || idOrObj.userId) : idOrObj;

  const getUserName = (idOrObj) => {
    const id = getUserId(idOrObj);
    const user = users.find(u => u._id === id);
    return user ? user.name : 'Unknown';
  };

  // Processing Data
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  const filteredTasks = safeTasks;

  const getTimeSpent = (item) => {
    let totalMs = 0;
    if (item.employeeProgress && item.employeeProgress.length > 0) {
      item.employeeProgress.forEach(p => {
        if (Array.isArray(p.sessions) && p.sessions.length > 0) {
          p.sessions.forEach(s => {
            const st = s.start ? new Date(s.start).getTime() : null;
            const en = s.end ? new Date(s.end).getTime() : null;
            if (st && en && !isNaN(st) && !isNaN(en) && en > st) totalMs += (en - st);
          });
        } else if (p.startedAt || p.started_at) {
          const st = new Date(p.startedAt || p.started_at).getTime();
          const enDate = p.completedAt || p.completed_at;
          if (!isNaN(st)) {
            if (enDate) {
              const en = new Date(enDate).getTime();
              if (!isNaN(en) && en > st) totalMs += (en - st);
            } else {
              totalMs += (Date.now() - st);
            }
          }
        }
      });
    }
    if (totalMs > 0) return (totalMs / (1000 * 60 * 60)).toFixed(2) + 'hr';
    if (item.totalTimeSpent) return `${item.totalTimeSpent}hr`;
    if (item.timeSpent) return `${item.timeSpent}hr`;
    return '—';
  };

  const getDropdownOptions = () => {
    if (dropdownType === 'project') return [{_id: '', name: 'None / No Project'}, ...projects.map(p => ({_id: p._id, name: p.name || p.projectName}))];
    if (dropdownType === 'filterStatus') return [
      {_id: 'ALL', name: 'All Statuses'}, {_id: 'PENDING', name: 'Pending'}, {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'IN_REVIEW', name: 'In Review'}, {_id: 'COMPLETED', name: 'Completed'}, {_id: 'REJECTED', name: 'Rejected'}
    ];
    if (dropdownType === 'filterDept') return [{_id: 'ALL', name: 'All Depts'}, ...departments.map(d => ({_id: d._id, name: d.departmentName}))];
    if (dropdownType === 'addPriority') return [{_id: 'LOW', name: 'Low'}, {_id: 'MEDIUM', name: 'Medium'}, {_id: 'HIGH', name: 'High'}];
    if (dropdownType === 'addStatus') return [{_id: 'TODO', name: 'Todo'}, {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'DONE', name: 'Done'}];
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'project') setFormData({...formData, projectId: item._id});
    if (dropdownType === 'filterStatus') setFilterStatus(item._id);
    if (dropdownType === 'filterDept') setFilterDept(item._id);
    if (dropdownType === 'addPriority') setFormData({...formData, priority: item._id});
    if (dropdownType === 'addStatus') setFormData({...formData, status: item._id});
    setDropdownVisible(false);
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgInputDeep = isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'COMPLETED' || item.status === 'DONE';
    const isPending = item.status === 'PENDING' || item.status === 'TODO';
    const isExpanded = expandedNoteTaskId === item._id;
    
    let statusColor = isDarkMode ? '#47c8ff' : '#0284c7';
    let statusBg = isDarkMode ? '#47c8ff1a' : '#f0f9ff';
    if (isCompleted) { statusColor = '#10b981'; statusBg = isDarkMode ? '#10b9811a' : '#ecfdf5'; }
    else if (isPending) { statusColor = isDarkMode ? '#f59e0b' : '#d97706'; statusBg = isDarkMode ? '#f59e0b1a' : '#fffbeb'; }

    const isOverdue = item.deadline && new Date(item.deadline) < new Date() && !isCompleted;

    let assigneesStr = '—';
    if (item.contributors && item.contributors.length > 0) {
      assigneesStr = item.contributors.map(c => getUserName(c.userId || c)).join(', ');
    } else if (item.assignees && item.assignees.length > 0) {
      assigneesStr = item.assignees.map(a => getUserName(a)).join(', ');
    }

    const deadlineStr = item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const timeSpent = getTimeSpent(item);
    const hasNotes = item.notes && item.notes.length > 0;

    return (
      <View className={`mb-4 shadow-sm shadow-black ${isDarkMode ? '' : 'shadow-none drop-shadow-sm'}`}>
        <TouchableOpacity onPress={() => openDetailsModal(item)} className={`p-5 border ${isExpanded ? 'rounded-t-lg border-b-0' : 'rounded-lg'} ${bgCard} ${borderColor}`}>
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-3">
              <Text className={`text-base font-bold mb-1 ${textColor}`} numberOfLines={2}>{item.title || item.name || 'Untitled Task'}</Text>
            </View>
            <View className="flex-row items-center">
              <View className={`px-3 py-1.5 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
                <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                  • {item.status?.replace('_', ' ') || 'PENDING'}
                </Text>
              </View>
            </View>
          </View>

          <View className={`flex-row justify-between mb-3 border-b pb-3 ${borderColor}`}>
             <View className="flex-1">
                <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Assignees</Text>
                <Text className={`text-xs ${textColor}`} numberOfLines={1}>{assigneesStr}</Text>
             </View>
             <View className="flex-1 items-end">
                <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Time Spent</Text>
                <Text className={`text-xs ${textColor}`}>{timeSpent}</Text>
             </View>
          </View>

          <View className="flex-row justify-between items-center mt-1">
             <View className="flex-row items-center flex-1">
                <Text className={`text-[9px] font-bold uppercase tracking-widest mr-2 ${textMuted}`}>Deadline:</Text>
                <Text className={`text-xs mr-2 ${textColor}`}>{deadlineStr}</Text>
                {isOverdue && (
                   <View className={`px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-[#ef44441a] border-[#ef44444a]' : 'bg-red-50 border-red-200'}`}>
                      <Text className="text-[#ef4444] text-[8px] font-bold uppercase tracking-widest">OVERDUE</Text>
                   </View>
                )}
             </View>
             
             <TouchableOpacity onPress={() => toggleNotes(item)} className={`p-2 border rounded ${bgInputDeep} ${borderColor}`}>
                <MessageSquare size={14} color={hasNotes ? (isDarkMode ? "#adc6ff" : "#2573e6") : (isDarkMode ? "#888" : "#9ca3af")} />
             </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View className={`border border-t-0 rounded-b-lg p-5 pt-2 ${bgCard} ${borderColor}`}>
             <View className={`border-t pt-4 mt-1 ${borderColor}`}>
               <Text className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textMuted}`}>NOTES & COMMENTS</Text>
               
               {(!item.notes || item.notes.length === 0) ? (
                 <Text className={`text-xs italic mb-4 ${textMuted}`}>No notes yet.</Text>
               ) : (
                 <View className="mb-4">
                   {item.notes.map((note, i) => (
                     <View key={i} className={`p-3 rounded mb-2 border ${bgInputAlt} ${borderColor}`}>
                       <View className="flex-row justify-between mb-1">
                         <Text className={`text-[10px] font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{note.authorName || 'Unknown'}</Text>
                         <Text className={`text-[9px] ${textMuted}`}>{new Date(note.createdAt).toLocaleString()}</Text>
                       </View>
                       <Text className={`text-xs leading-5 ${textColor}`}>{note.text}</Text>
                     </View>
                   ))}
                 </View>
               )}

               <View className={`flex-row items-stretch border rounded mt-2 ${bgInputAlt} ${borderColor}`}>
                 <TextInput
                   value={noteText}
                   onChangeText={setNoteText}
                   placeholder="Add a note or comment..."
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
                   multiline
                   className={`flex-1 text-xs px-3 py-4 min-h-[44px] ${textColor}`}
                   textAlignVertical="center"
                 />
                 <TouchableOpacity onPress={handleAddNote} disabled={addingNote || !noteText.trim()} className={`px-4 justify-center items-center opacity-90 disabled:opacity-50 border-l ${borderColor} ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                    {addingNote ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : (
                      <View className="flex-row items-center">
                        <Send size={12} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1.5" />
                        <Text className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Add</Text>
                      </View>
                    )}
                 </TouchableOpacity>
               </View>
             </View>
          </View>
        )}
      </View>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedTask) return null;
    const item = selectedTask;
    const isCompleted = item.status === 'COMPLETED' || item.status === 'DONE';
    const isPending = item.status === 'PENDING' || item.status === 'TODO';
    
    let statusColor = isDarkMode ? '#47c8ff' : '#0284c7'; 
    let statusBg = isDarkMode ? '#47c8ff1a' : '#f0f9ff';
    if (isCompleted) { statusColor = '#10b981'; statusBg = isDarkMode ? '#10b9811a' : '#ecfdf5'; }
    else if (isPending) { statusColor = isDarkMode ? '#f59e0b' : '#d97706'; statusBg = isDarkMode ? '#f59e0b1a' : '#fffbeb'; }

    const deadlineStr = item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const startStr = item.startTime ? new Date(item.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : '—';
    const endStr = item.endTime ? new Date(item.endTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : '—';

    let contributors = item.contributors || [];
    let progress = item.employeeProgress || [];

    return (
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View className={`flex-1 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-100'}`}>
          {/* Header */}
          <View className={`flex-row items-center justify-between p-4 border-b ${bgCard} ${borderColor}`}>
            <View className="flex-row items-center">
              <FileText size={18} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
              <Text className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>TASK DETAILS</Text>
            </View>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} className="p-2">
              <X size={20} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Title & Status */}
            <View className="flex-row justify-between items-start mb-6">
               <Text className={`text-xl font-bold flex-1 mr-4 ${textColor}`}>{item.title}</Text>
               <View className={`px-3 py-1.5 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
                 <Text className={`text-[10px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                   {item.status?.replace('_', ' ') || 'PENDING'}
                 </Text>
               </View>
            </View>

            {/* Quick Info Grid */}
            <View className={`border rounded p-4 mb-6 ${borderColor}`}>
               <View className={`flex-row justify-between mb-4 border-b pb-4 ${borderColor}`}>
                  <View className="flex-1">
                     <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Priority</Text>
                     <Text className={`text-sm font-bold ${textColor}`}>{item.priority || 'MEDIUM'}</Text>
                  </View>
                  <View className="flex-1">
                     <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Deadline</Text>
                     <Text className={`text-sm font-bold ${textColor}`}>{deadlineStr}</Text>
                  </View>
               </View>
               <View className="flex-row justify-between">
                  <View className="flex-1">
                     <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Scheduled Start</Text>
                     <Text className={`text-xs font-bold ${textColor}`}>{startStr}</Text>
                  </View>
                  <View className="flex-1">
                     <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Scheduled End</Text>
                     <Text className={`text-xs font-bold ${textColor}`}>{endStr}</Text>
                  </View>
               </View>
            </View>

            {/* Employee Progress */}
            {progress.length > 0 && (
              <View className="mb-6">
                 <Text className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${textColor}`}>PER EMPLOYEE COMPLETION DETAILS</Text>
                 <View className={`border rounded overflow-hidden ${borderColor}`}>
                   {progress.map((p, idx) => {
                     const uName = getUserName(p.userId);
                     const pComp = p.status === 'COMPLETED' || p.status === 'DONE';
                     const pStart = p.startedAt ? new Date(p.startedAt).toLocaleString() : '—';
                     const pEnd = p.completedAt ? new Date(p.completedAt).toLocaleString() : '—';
                     return (
                       <View key={idx} className={`p-4 ${idx < progress.length - 1 ? 'border-b ' + borderColor : ''}`}>
                          <View className="flex-row justify-between items-center mb-3">
                             <Text className={`text-sm font-bold ${textColor}`}>{uName}</Text>
                             <View className={`px-2 py-1 rounded ${pComp ? (isDarkMode ? 'bg-[#10b9811a] border border-[#10b9814a]' : 'bg-green-50 border border-green-200') : (isDarkMode ? 'bg-[#f59e0b1a] border border-[#f59e0b4a]' : 'bg-yellow-50 border border-yellow-200')}`}>
                                <Text className={`text-[9px] font-bold uppercase tracking-widest ${pComp ? (isDarkMode ? 'text-[#10b981]' : 'text-green-600') : (isDarkMode ? 'text-[#f59e0b]' : 'text-yellow-600')}`}>{p.status}</Text>
                             </View>
                          </View>
                          <View className="flex-row justify-between">
                             <View className="flex-1">
                                <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Actual Start Time</Text>
                                <Text className={`text-xs font-bold ${textColor}`}>{pStart}</Text>
                             </View>
                             <View className="flex-1">
                                <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Actual Completion Time</Text>
                                <Text className={`text-xs font-bold ${textColor}`}>{pEnd}</Text>
                             </View>
                          </View>
                       </View>
                     );
                   })}
                 </View>
              </View>
            )}

            {/* Contributors */}
            {contributors.length > 0 && (
               <View className="mb-6">
                 <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>CONTRIBUTORS</Text>
                 <View className="flex-row flex-wrap">
                   {contributors.map((c, i) => (
                     <View key={i} className={`border px-3 py-1.5 rounded mr-2 mb-2 ${bgCard} ${borderColor}`}>
                        <Text className={`text-xs font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{getUserName(c.userId || c)}</Text>
                     </View>
                   ))}
                 </View>
               </View>
            )}

            {/* History */}
            {item.history && item.history.length > 0 && (
               <View className="mb-8">
                 <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>TASK HISTORY / CHANGE LOG</Text>
                 <View className={`border border-b-0 rounded overflow-hidden ${borderColor}`}>
                    {item.history.map((h, i) => (
                       <View key={i} className={`p-3 border-b flex-row justify-between items-start ${borderColor}`}>
                          <View className="flex-1 mr-2">
                             <Text className={`text-xs font-bold mb-1 ${textColor}`}>
                               {h.performedByName || 'System'} <Text className={`font-normal ${textMuted}`}>({h.action})</Text>
                             </Text>
                             {h.details ? <Text className={`text-[10px] ${textMuted}`}>{h.details}</Text> : null}
                          </View>
                          <Text className={`text-[9px] ${textMuted}`}>{new Date(h.createdAt).toLocaleString()}</Text>
                       </View>
                    ))}
                 </View>
               </View>
            )}
          </ScrollView>

          <View className={`p-4 border-t ${bgCard} ${borderColor}`}>
             <TouchableOpacity onPress={() => setDetailsModalVisible(false)} className={`w-full border py-3 rounded items-center ${bgInputDeep} ${borderColor}`}>
                <Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>CLOSE</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddModal = () => (
    <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className={`border rounded-lg p-6 w-full max-h-[90%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6 border-b pb-4 ${borderColor}">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Assign New Task</Text>
               <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Task Title</Text>
               <View className={`border rounded p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
                  <TextInput 
                    value={formData.title} 
                    onChangeText={v => setFormData({...formData, title: v})} 
                    placeholder="e.g. Implement Login API" 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    className={`text-xs ${textColor}`} 
                  />
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Project</Text>
               <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className={`border rounded p-3 mb-4 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={formData.projectId ? `text-xs ${textColor}` : `text-xs ${textMuted}`}>
                    {formData.projectId ? projects.find(p => p._id === formData.projectId)?.name || projects.find(p => p._id === formData.projectId)?.projectName || 'Unknown' : 'None / No Project'}
                  </Text>
                  <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
               </TouchableOpacity>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Description</Text>
               <View className={`border rounded p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
                  <TextInput 
                    value={formData.description} 
                    onChangeText={v => setFormData({...formData, description: v})} 
                    placeholder="Details about the task..." 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    multiline numberOfLines={3}
                    className={`text-xs min-h-[60px] ${textColor}`} 
                    textAlignVertical="top"
                  />
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Assign Employees</Text>
               <View className={`border rounded mb-4 ${bgInputAlt} ${borderColor}`}>
                  <View className={`flex-row items-center p-3 border-b ${borderColor}`}>
                     <Search size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
                     <TextInput 
                        value={employeeSearch}
                        onChangeText={setEmployeeSearch}
                        placeholder="Search users..."
                        placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
                        className={`flex-1 text-xs ${textColor}`}
                     />
                  </View>
                  <View className="max-h-40">
                     <ScrollView nestedScrollEnabled>
                        {users.filter(u => u.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(u => {
                           const isSelected = formData.assigneeIds.includes(u._id);
                           return (
                              <TouchableOpacity 
                                 key={u._id} 
                                 onPress={() => {
                                    if (isSelected) setFormData({...formData, assigneeIds: formData.assigneeIds.filter(id => id !== u._id)});
                                    else setFormData({...formData, assigneeIds: [...formData.assigneeIds, u._id]});
                                 }}
                                 className={`flex-row items-center justify-between p-3 border-b ${borderColor}`}
                              >
                                 <View>
                                    <Text className={`text-xs font-bold ${textColor}`}>{u.name}</Text>
                                    <Text className={`text-[9px] tracking-widest uppercase mt-0.5 ${textMuted}`}>{u.role?.name || u.role || 'EMPLOYEE'}</Text>
                                 </View>
                                 <View className={`w-4 h-4 border rounded items-center justify-center ${isSelected ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : borderColor}`}>
                                    {isSelected && <Check size={10} color={isDarkMode ? "#131313" : "#ffffff"} />}
                                 </View>
                              </TouchableOpacity>
                           );
                        })}
                     </ScrollView>
                  </View>
               </View>

               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                   <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Priority</Text>
                   <TouchableOpacity onPress={() => { setDropdownType('addPriority'); setDropdownVisible(true); }} className={`border rounded p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                      <Text className={`text-xs ${textColor}`}>{formData.priority.charAt(0) + formData.priority.slice(1).toLowerCase()}</Text>
                      <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                   </TouchableOpacity>
                 </View>
                 <View className="flex-1 ml-2">
                   <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Status</Text>
                   <TouchableOpacity onPress={() => { setDropdownType('addStatus'); setDropdownVisible(true); }} className={`border rounded p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                      <Text className={`text-xs ${textColor}`}>{formData.status.replace('_', ' ')}</Text>
                      <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                   </TouchableOpacity>
                 </View>
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Proof Required</Text>
               <View className="flex-row mb-4">
                  <TouchableOpacity onPress={() => setFormData({...formData, proofRequired: true})} className={`flex-1 py-3 border rounded-l ${formData.proofRequired ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : (bgInputAlt + ' ' + borderColor)}`}>
                     <Text className={`text-[10px] text-center font-bold tracking-widest uppercase ${formData.proofRequired ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setFormData({...formData, proofRequired: false})} className={`flex-1 py-3 border border-l-0 rounded-r ${!formData.proofRequired ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : (bgInputAlt + ' ' + borderColor)}`}>
                     <Text className={`text-[10px] text-center font-bold tracking-widest uppercase ${!formData.proofRequired ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>No</Text>
                  </TouchableOpacity>
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Start - End</Text>
               <TouchableOpacity onPress={() => setShowDatePicker(true)} className={`border rounded p-3 mb-6 flex-row items-center ${bgInputAlt} ${borderColor}`}>
                  <Calendar size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
                  <Text className={`text-xs ${textColor}`}>Select start and end date/time</Text>
               </TouchableOpacity>

            </ScrollView>

            <View className="flex-row justify-between pt-4 mt-2 border-t border-[#333]">
               <TouchableOpacity onPress={() => setAddModalVisible(false)} className={`flex-1 mr-2 py-3 border rounded items-center ${borderColor} ${bgInputAlt}`}>
                  <Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`flex-1 ml-2 py-3 rounded items-center flex-row justify-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : (
                     <>
                        <Check size={14} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
                        <Text className={`font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Assign Task</Text>
                     </>
                  )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin / Tasks</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Tasks</Text>
        </View>
        <TouchableOpacity onPress={() => openAddModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Assign Task</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View className="mb-4">
         <View className={`flex-row items-center border rounded px-3 h-10 mb-2 ${bgCard} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search tasks..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
         <View className="flex-row justify-between items-center mb-2">
            <TouchableOpacity onPress={() => { setDropdownType('filterStatus'); setDropdownVisible(true); }} className={`flex-1 border rounded px-3 h-10 flex-row items-center justify-between mr-2 ${bgCard} ${borderColor}`}>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterStatus === 'ALL' ? 'All Statuses' : filterStatus.replace('_', ' ')}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setDropdownType('filterDept'); setDropdownVisible(true); }} className={`flex-1 border rounded px-3 h-10 flex-row items-center justify-between ml-2 ${bgCard} ${borderColor}`}>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterDept === 'ALL' ? 'All Depts' : departments.find(d => d._id === filterDept)?.departmentName?.substring(0,8) + '..'}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
         </View>
         <View className="flex-row justify-between items-center mb-2">
            <TouchableOpacity onPress={() => setShowDatePicker(true)} className={`flex-1 border rounded px-3 h-10 flex-row items-center mr-2 ${bgCard} ${borderColor}`}>
              <Calendar size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${filterDate ? textColor : textMuted}`}>
                 {filterDate ? filterDate.toLocaleDateString() : 'Filter by date'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTimeModalVisible(true)} className={`flex-1 border rounded px-3 h-10 flex-row items-center justify-between ml-2 ${bgCard} ${borderColor}`}>
              <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`} numberOfLines={1}>Total Time Spent</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
         </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
              setFilterDate(selectedDate);
            } else if (event.type === 'dismiss') {
              setFilterDate(null); // Clear filter on cancel
            }
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={filteredTasks}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) {
              fetchTasks(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="my-4" /> : null
          }
          ListEmptyComponent={
            <View className={`items-center justify-center mt-10 p-6 border rounded-lg ${bgCard} ${borderColor}`}>
               <View className={`h-12 w-12 rounded-full items-center justify-center mb-4 ${bgInputDeep}`}>
                 <CheckSquare size={24} color={isDarkMode ? "#888" : "#9ca3af"} />
               </View>
               <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>No tasks found</Text>
            </View>
          }
        />
      )}

      {renderAddModal()}
      {renderDetailsModal()}

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
                if (dropdownType === 'filterDept') isSelected = filterDept === item._id;

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

      {/* Time Spent Modal */}
      <Modal visible={timeModalVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setTimeModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} className={`border rounded-lg w-11/12 max-h-[70%] overflow-hidden ${bgCard} ${borderColor}`}>
            <View className={`p-4 border-b flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
              <Text className={`font-bold uppercase tracking-widest text-xs ${textColor}`}>Total Time Spent on Each Task</Text>
              <TouchableOpacity onPress={() => setTimeModalVisible(false)}><X size={18} color={isDarkMode ? "#888" : "#9ca3af"} /></TouchableOpacity>
            </View>
            <View className={`p-3 border-b ${borderColor}`}>
              <View className={`flex-row items-center border rounded px-3 h-10 ${bgInput} ${borderColor}`}>
                <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
                <TextInput 
                  value={timeSearchQuery}
                  onChangeText={setTimeSearchQuery}
                  placeholder="Search tasks..."
                  placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
                  className={`flex-1 text-xs ${textColor}`}
                />
              </View>
            </View>
            <FlatList
              data={safeTasks.filter(t => (t.title || t.name || '').toLowerCase().includes(timeSearchQuery.toLowerCase()))}
              keyExtractor={(item, index) => (item._id || item.id) ? (item._id || item.id) + '_' + index : index.toString()}
              contentContainerStyle={{ padding: 10 }}
              renderItem={({item}) => (
                <View className={`py-3 px-3 border-b flex-row items-center justify-between ${borderColor}`}>
                  <Text className={`text-xs flex-1 mr-4 ${textColor}`} numberOfLines={2}>{item.title || item.name || 'Untitled Task'}</Text>
                  <Text className={`text-xs font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{getTimeSpent(item)}</Text>
                </View>
              )}
              ListEmptyComponent={<Text className={`text-center py-6 text-xs ${textMuted}`}>No tasks found.</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
