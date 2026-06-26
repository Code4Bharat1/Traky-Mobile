import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { CheckSquare, Plus, Clock, Tag, X, ChevronDown, CheckCircle, Search, MessageSquare, Send, FileText } from 'lucide-react-native';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');

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
        client.get('/tasks?limit=500'),
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
    
    return true;
  });

  const getDropdownOptions = () => {
    if (dropdownType === 'project') return [{_id: '', name: 'No Project'}, ...projects.map(p => ({_id: p._id, name: p.name || p.projectName}))];
    if (dropdownType === 'filterStatus') return [
      {_id: 'ALL', name: 'All Statuses'}, {_id: 'PENDING', name: 'Pending'}, {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'COMPLETED', name: 'Completed'}
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

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'COMPLETED' || item.status === 'DONE';
    const isPending = item.status === 'PENDING' || item.status === 'TODO';
    const isExpanded = expandedNoteTaskId === item._id;
    
    let statusColor = '#47c8ff'; // default (In Progress)
    let statusBg = '#47c8ff1a';
    if (isCompleted) { statusColor = '#10b981'; statusBg = '#10b9811a'; }
    else if (isPending) { statusColor = '#f59e0b'; statusBg = '#f59e0b1a'; }

    const isOverdue = item.deadline && new Date(item.deadline) < new Date() && !isCompleted;

    let assigneesStr = '—';
    if (item.contributors && item.contributors.length > 0) {
      assigneesStr = item.contributors.map(c => getUserName(c.userId || c)).join(', ');
    } else if (item.assignees && item.assignees.length > 0) {
      assigneesStr = item.assignees.map(a => getUserName(a)).join(', ');
    }

    const deadlineStr = item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const timeSpent = item.timeSpent ? `${item.timeSpent}hr` : '—';
    const hasNotes = item.notes && item.notes.length > 0;

    return (
      <View className="mb-4 shadow-sm shadow-black">
        <TouchableOpacity onPress={() => openDetailsModal(item)} className={`bg-[#1c1b1b] p-5 border border-[#ffffff1a] ${isExpanded ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}>
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-white text-base font-bold mb-1" numberOfLines={2}>{item.title || item.name || 'Untitled Task'}</Text>
            </View>
            <View className="flex-row items-center">
              <View className={`px-3 py-1.5 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
                <Text className={`text-[9px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                  • {item.status?.replace('_', ' ') || 'PENDING'}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between mb-3 border-b border-[#ffffff1a] pb-3">
             <View className="flex-1">
                <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Assignees</Text>
                <Text className="text-white text-xs" numberOfLines={1}>{assigneesStr}</Text>
             </View>
             <View className="flex-1 items-end">
                <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Time Spent</Text>
                <Text className="text-white text-xs">{timeSpent}</Text>
             </View>
          </View>

          <View className="flex-row justify-between items-center mt-1">
             <View className="flex-row items-center flex-1">
                <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mr-2">Deadline:</Text>
                <Text className="text-white text-xs mr-2">{deadlineStr}</Text>
                {isOverdue && (
                   <View className="px-1.5 py-0.5 rounded bg-[#ef44441a] border border-[#ef44444a]">
                      <Text className="text-[#ef4444] text-[8px] font-bold uppercase tracking-widest">OVERDUE</Text>
                   </View>
                )}
             </View>
             
             <TouchableOpacity onPress={() => toggleNotes(item)} className="p-2 border border-[#ffffff1a] rounded bg-[#201f1f]">
                <MessageSquare size={14} color={hasNotes ? "#adc6ff" : "#888"} />
             </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] border-t-0 rounded-b-lg p-5 pt-2">
             <View className="border-t border-[#ffffff1a] pt-4 mt-1">
               <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-3">NOTES & COMMENTS</Text>
               
               {(!item.notes || item.notes.length === 0) ? (
                 <Text className="text-[#888] text-xs italic mb-4">No notes yet.</Text>
               ) : (
                 <View className="mb-4">
                   {item.notes.map((note, i) => (
                     <View key={i} className="bg-[#131313] p-3 rounded mb-2 border border-[#ffffff1a]">
                       <View className="flex-row justify-between mb-1">
                         <Text className="text-[#adc6ff] text-[10px] font-bold">{note.authorName || 'Unknown'}</Text>
                         <Text className="text-[#888] text-[9px]">{new Date(note.createdAt).toLocaleString()}</Text>
                       </View>
                       <Text className="text-white text-xs leading-5">{note.text}</Text>
                     </View>
                   ))}
                 </View>
               )}

               {isCompleted && (
                 <View className="flex-row items-stretch border border-[#ffffff1a] bg-[#131313] rounded mt-2">
                   <TextInput
                     value={noteText}
                     onChangeText={setNoteText}
                     placeholder="Add a note or comment..."
                     placeholderTextColor="#888"
                     multiline
                     className="flex-1 text-white text-xs px-3 py-4 min-h-[44px]"
                     textAlignVertical="center"
                   />
                   <TouchableOpacity onPress={handleAddNote} disabled={addingNote || !noteText.trim()} className="bg-[#adc6ff] px-4 justify-center items-center opacity-90 disabled:opacity-50 border-l border-[#ffffff1a]">
                      {addingNote ? <ActivityIndicator size="small" color="#131313" /> : (
                        <View className="flex-row items-center">
                          <Send size={12} color="#131313" className="mr-1.5" />
                          <Text className="text-[#131313] text-[10px] font-bold uppercase tracking-widest">Add</Text>
                        </View>
                      )}
                   </TouchableOpacity>
                 </View>
               )}
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
    
    let statusColor = '#47c8ff'; let statusBg = '#47c8ff1a';
    if (isCompleted) { statusColor = '#10b981'; statusBg = '#10b9811a'; }
    else if (isPending) { statusColor = '#f59e0b'; statusBg = '#f59e0b1a'; }

    const deadlineStr = item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const startStr = item.startTime ? new Date(item.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : '—';
    const endStr = item.endTime ? new Date(item.endTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : '—';

    let contributors = item.contributors || [];
    let progress = item.employeeProgress || [];

    return (
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-[#131313]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-[#ffffff1a] bg-[#1c1b1b]">
            <View className="flex-row items-center">
              <FileText size={18} color="#888" className="mr-2" />
              <Text className="text-white text-xs font-bold uppercase tracking-widest">TASK DETAILS</Text>
            </View>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} className="p-2">
              <X size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Title & Status */}
            <View className="flex-row justify-between items-start mb-6">
               <Text className="text-white text-xl font-bold flex-1 mr-4">{item.title}</Text>
               <View className={`px-3 py-1.5 rounded`} style={{ backgroundColor: statusBg, borderColor: `${statusColor}4a`, borderWidth: 1 }}>
                 <Text className={`text-[10px] font-bold uppercase tracking-wider`} style={{ color: statusColor }}>
                   {item.status?.replace('_', ' ') || 'PENDING'}
                 </Text>
               </View>
            </View>

            {/* Quick Info Grid */}
            <View className="border border-[#ffffff1a] rounded p-4 mb-6">
               <View className="flex-row justify-between mb-4 border-b border-[#ffffff1a] pb-4">
                  <View className="flex-1">
                     <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Priority</Text>
                     <Text className="text-white text-sm font-bold">{item.priority || 'MEDIUM'}</Text>
                  </View>
                  <View className="flex-1">
                     <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Deadline</Text>
                     <Text className="text-white text-sm font-bold">{deadlineStr}</Text>
                  </View>
               </View>
               <View className="flex-row justify-between">
                  <View className="flex-1">
                     <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Scheduled Start</Text>
                     <Text className="text-white text-xs font-bold">{startStr}</Text>
                  </View>
                  <View className="flex-1">
                     <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Scheduled End</Text>
                     <Text className="text-white text-xs font-bold">{endStr}</Text>
                  </View>
               </View>
            </View>

            {/* Employee Progress */}
            {progress.length > 0 && (
              <View className="mb-6">
                 <Text className="text-white text-[11px] font-bold uppercase tracking-widest mb-3">PER EMPLOYEE COMPLETION DETAILS</Text>
                 <View className="border border-[#ffffff1a] rounded overflow-hidden">
                   {progress.map((p, idx) => {
                     const uName = getUserName(p.userId);
                     const pComp = p.status === 'COMPLETED' || p.status === 'DONE';
                     const pStart = p.startedAt ? new Date(p.startedAt).toLocaleString() : '—';
                     const pEnd = p.completedAt ? new Date(p.completedAt).toLocaleString() : '—';
                     return (
                       <View key={idx} className={`p-4 ${idx < progress.length - 1 ? 'border-b border-[#ffffff1a]' : ''}`}>
                          <View className="flex-row justify-between items-center mb-3">
                             <Text className="text-white text-sm font-bold">{uName}</Text>
                             <View className={`px-2 py-1 rounded ${pComp ? 'bg-[#10b9811a] border border-[#10b9814a]' : 'bg-[#f59e0b1a] border border-[#f59e0b4a]'}`}>
                                <Text className={`text-[9px] font-bold uppercase tracking-widest ${pComp ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>{p.status}</Text>
                             </View>
                          </View>
                          <View className="flex-row justify-between">
                             <View className="flex-1">
                                <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Actual Start Time</Text>
                                <Text className="text-white text-xs font-bold">{pStart}</Text>
                             </View>
                             <View className="flex-1">
                                <Text className="text-[#888] text-[9px] font-bold uppercase tracking-widest mb-1">Actual Completion Time</Text>
                                <Text className="text-white text-xs font-bold">{pEnd}</Text>
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
                 <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-2">CONTRIBUTORS</Text>
                 <View className="flex-row flex-wrap">
                   {contributors.map((c, i) => (
                     <View key={i} className="border border-[#ffffff1a] bg-[#1c1b1b] px-3 py-1.5 rounded mr-2 mb-2">
                        <Text className="text-[#adc6ff] text-xs font-bold">{getUserName(c.userId || c)}</Text>
                     </View>
                   ))}
                 </View>
               </View>
            )}

            {/* History */}
            {item.history && item.history.length > 0 && (
               <View className="mb-8">
                 <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-2">TASK HISTORY / CHANGE LOG</Text>
                 <View className="border border-[#ffffff1a] border-b-0 rounded overflow-hidden">
                    {item.history.map((h, i) => (
                       <View key={i} className="p-3 border-b border-[#ffffff1a] flex-row justify-between items-start">
                          <View className="flex-1 mr-2">
                             <Text className="text-white text-xs font-bold mb-1">
                               {h.performedByName || 'System'} <Text className="text-[#888] font-normal">({h.action})</Text>
                             </Text>
                             {h.details ? <Text className="text-[#888] text-[10px]">{h.details}</Text> : null}
                          </View>
                          <Text className="text-[#888] text-[9px]">{new Date(h.createdAt).toLocaleString()}</Text>
                       </View>
                    ))}
                 </View>
               </View>
            )}
          </ScrollView>

          <View className="p-4 border-t border-[#ffffff1a] bg-[#1c1b1b]">
             <TouchableOpacity onPress={() => setDetailsModalVisible(false)} className="w-full bg-[#201f1f] border border-[#ffffff1a] py-3 rounded items-center">
                <Text className="text-white font-bold text-xs uppercase tracking-widest">CLOSE</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddModal = () => (
    <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border-t border-[#ffffff1a] rounded-t-2xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-lg font-bold tracking-widest uppercase">Assign Task</Text>
               <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={24} color="#888" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Task Title *</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.title} 
                   onChangeText={v => setFormData({...formData, title: v})} 
                   placeholder="e.g. Design Homepage" 
                   placeholderTextColor="#888" 
                   className="text-white text-base py-1" 
                 />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Description</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Task description..." 
                   placeholderTextColor="#888" 
                   multiline numberOfLines={3}
                   className="text-white text-base py-1 min-h-[60px]" 
                   textAlignVertical="top"
                 />
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Points</Text>
                  <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3">
                     <TextInput 
                       value={formData.points} 
                       onChangeText={v => setFormData({...formData, points: v})} 
                       keyboardType="numeric"
                       className="text-white text-base py-1" 
                     />
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Priority</Text>
                  <View className="flex-row justify-between border border-[#ffffff1a] bg-[#131313] rounded p-1">
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <TouchableOpacity key={p} onPress={() => setFormData({...formData, priority: p})} className={`flex-1 py-2 items-center rounded ${formData.priority === p ? 'bg-[#adc6ff]' : ''}`}>
                        <Text className={`text-[10px] font-bold ${formData.priority === p ? 'text-[#131313]' : 'text-[#888]'}`}>{p[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Project (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-4 mb-8 flex-row justify-between items-center">
                 <Text className={formData.projectId ? "text-white text-base capitalize" : "text-[#888] text-base"}>
                   {formData.projectId ? projects.find(p => p._id === formData.projectId)?.name || projects.find(p => p._id === formData.projectId)?.projectName || 'Unknown' : 'Select a project'}
                 </Text>
                 <ChevronDown size={20} color="#888" />
              </TouchableOpacity>
            </ScrollView>

            <View className="flex-row justify-end pt-4 border-t border-[#ffffff1a] mt-2 pb-6">
               <TouchableOpacity onPress={() => setAddModalVisible(false)} className="mr-4 py-3 px-4"><Text className="text-white font-bold text-sm uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-[#adc6ff] px-6 py-3 rounded-lg flex-row items-center">
                  {saving ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-sm uppercase tracking-wider">Save Task</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className="text-[#888] text-[10px] tracking-widest uppercase mb-1 font-bold">Admin / Tasks</Text>
           <Text className="text-white text-2xl font-bold tracking-wider">Tasks</Text>
        </View>
        <TouchableOpacity onPress={() => openAddModal()} className="bg-[#adc6ff] flex-row items-center px-3 py-2 rounded">
          <Plus size={16} color="#131313" className="mr-1" />
          <Text className="text-[#131313] font-bold text-[10px] uppercase tracking-widest">Assign Task</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View className="mb-4">
         <View className="flex-row items-center bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 mb-2">
            <Search size={16} color="#888" className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search tasks..."
               placeholderTextColor="#888"
               className="flex-1 text-white text-xs h-10"
            />
         </View>
         <View className="flex-row justify-between items-center mb-2">
            <TouchableOpacity onPress={() => { setDropdownType('filterStatus'); setDropdownVisible(true); }} className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 flex-row items-center justify-between mr-2">
              <Text className="text-white text-[10px] uppercase font-bold tracking-widest">{filterStatus === 'ALL' ? 'All Statuses' : filterStatus.replace('_', ' ')}</Text>
              <ChevronDown size={14} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setDropdownType('filterDept'); setDropdownVisible(true); }} className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 flex-row items-center justify-between ml-2">
              <Text className="text-white text-[10px] uppercase font-bold tracking-widest">{filterDept === 'ALL' ? 'All Depts' : departments.find(d => d._id === filterDept)?.departmentName?.substring(0,8) + '..'}</Text>
              <ChevronDown size={14} color="#888" />
            </TouchableOpacity>
         </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={filteredTasks}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-10 p-6 border border-[#ffffff1a] bg-[#1c1b1b] rounded-lg">
               <View className="h-12 w-12 rounded-full bg-[#201f1f] items-center justify-center mb-4">
                 <CheckSquare size={24} color="#888" />
               </View>
               <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">No tasks found</Text>
            </View>
          }
        />
      )}

      {renderAddModal()}
      {renderDetailsModal()}

      {/* Shared Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-5/6 max-h-[60%] p-2">
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item) => item._id || 'none'}
              renderItem={({item}) => {
                let isSelected = false;
                if (dropdownType === 'project') isSelected = formData.projectId === item._id;
                if (dropdownType === 'filterStatus') isSelected = filterStatus === item._id;
                if (dropdownType === 'filterDept') isSelected = filterDept === item._id;

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

    </View>
  );
}
