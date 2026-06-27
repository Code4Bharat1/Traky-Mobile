import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { CheckSquare, Plus, Clock, Tag, X, ChevronDown, CheckCircle, Search, MessageSquare, Send, FileText, Calendar } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function TasksScreen() {
  const { isDarkMode } = useThemeStore();
  const [tasks, setTasks] = useState([]);
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
  const [formData, setFormData] = useState({ title: '', description: '', points: '0', priority: 'MEDIUM', projectId: '', assigneeIds: [] });
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, projRes, depRes, userRes] = await Promise.all([
        client.get('/tasks?limit=5000'),
        client.get('/projects?limit=500'),
        client.get('/departments?limit=100'),
        client.get('/users?limit=500')
      ]);
      setTasks(taskRes.data.data || taskRes.data || []);
      setProjects(projRes.data.data || projRes.data || []);
      setDepartments(depRes.data.allDepartments || depRes.data.data || []);
      setUsers(userRes.data.data || userRes.data.users || []);
    } catch (error) {
      console.error("Failed to load tasks data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormData({ title: '', description: '', points: '0', priority: 'MEDIUM', projectId: '', assigneeIds: [] });
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
      const payload = { ...formData, points: Number(formData.points) };
      await client.post('/tasks', payload);
      setAddModalVisible(false);
      fetchData();
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
  
  const filteredTasks = safeTasks.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (t.title || t.name || '').toLowerCase();
      if (!title.includes(q)) return false;
    }

    if (filterDate) {
      const targetDate = new Date(filterDate).toDateString();
      const tStart = t.startTime ? new Date(t.startTime).toDateString() : null;
      const tDeadline = t.deadline ? new Date(t.deadline).toDateString() : null;
      const tCreated = t.created_at ? new Date(t.created_at).toDateString() : null;
      if (tStart !== targetDate && tDeadline !== targetDate && tCreated !== targetDate) {
        return false;
      }
    }
    
    return true;
  });

  const getTimeSpent = (item) => {
    let totalMs = 0;
    if (item.employeeProgress && item.employeeProgress.length > 0) {
      totalMs = item.employeeProgress.reduce((acc, p) => acc + (p.totalActiveMs || 0), 0);
    }
    if (totalMs > 0) return (totalMs / (1000 * 60 * 60)).toFixed(2) + 'hr';
    if (item.totalTimeSpent) return `${item.totalTimeSpent}hr`;
    if (item.timeSpent) return `${item.timeSpent}hr`;
    return '—';
  };

  const getDropdownOptions = () => {
    if (dropdownType === 'project') return [{_id: '', name: 'No Project'}, ...projects.map(p => ({_id: p._id, name: p.name || p.projectName}))];
    if (dropdownType === 'filterStatus') return [
      {_id: 'ALL', name: 'All Statuses'}, {_id: 'PENDING', name: 'Pending'}, {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'IN_REVIEW', name: 'In Review'}, {_id: 'COMPLETED', name: 'Completed'}, {_id: 'REJECTED', name: 'Rejected'}
    ];
    if (dropdownType === 'filterDept') return [{_id: 'ALL', name: 'All Depts'}, ...departments.map(d => ({_id: d._id, name: d.departmentName}))];
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'project') setFormData({...formData, projectId: item._id});
    if (dropdownType === 'filterStatus') setFilterStatus(item._id);
    if (dropdownType === 'filterDept') setFilterDept(item._id);
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
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className={`border-t rounded-t-2xl p-6 h-[85%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-lg font-bold tracking-widest uppercase ${textColor}`}>Assign Task</Text>
               <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={24} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Task Title *</Text>
              <View className={`border rounded p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
                 <TextInput 
                   value={formData.title} 
                   onChangeText={v => setFormData({...formData, title: v})} 
                   placeholder="e.g. Design Homepage" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={`text-base py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Description</Text>
              <View className={`border rounded p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Task description..." 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   multiline numberOfLines={3}
                   className={`text-base py-1 min-h-[60px] ${textColor}`} 
                   textAlignVertical="top"
                 />
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="flex-1 mr-2">
                  <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Points</Text>
                  <View className={`border rounded p-3 ${bgInputAlt} ${borderColor}`}>
                     <TextInput 
                       value={formData.points} 
                       onChangeText={v => setFormData({...formData, points: v})} 
                       keyboardType="numeric"
                       className={`text-base py-1 ${textColor}`} 
                     />
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Priority</Text>
                  <View className={`flex-row justify-between border rounded p-1 ${bgInputAlt} ${borderColor}`}>
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <TouchableOpacity key={p} onPress={() => setFormData({...formData, priority: p})} className={`flex-1 py-2 items-center rounded ${formData.priority === p ? (isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]') : ''}`}>
                        <Text className={`text-[10px] font-bold ${formData.priority === p ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textMuted}`}>{p[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Project (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className={`border rounded p-4 mb-8 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                 <Text className={formData.projectId ? `text-base capitalize ${textColor}` : `text-base ${textMuted}`}>
                   {formData.projectId ? projects.find(p => p._id === formData.projectId)?.name || projects.find(p => p._id === formData.projectId)?.projectName || 'Unknown' : 'Select a project'}
                 </Text>
                 <ChevronDown size={20} color={isDarkMode ? "#888" : "#9ca3af"} />
              </TouchableOpacity>
            </ScrollView>

            <View className={`flex-row justify-end pt-4 border-t mt-2 pb-6 ${borderColor}`}>
               <TouchableOpacity onPress={() => setAddModalVisible(false)} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-sm uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Task</Text>}
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
              keyExtractor={(item) => item._id || 'none'}
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
              keyExtractor={(item) => item._id || item.id}
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
