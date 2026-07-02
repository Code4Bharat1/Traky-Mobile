import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListTodo, Plus, Search, X, Check, AlertCircle, Calendar, MessageSquare, Send, FileText, ChevronDown } from 'lucide-react-native';
import { getTasks, getUsers, getProjects, createTask, updateTask, deleteTask } from '../../api/services';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import client from '../../api/client';

const STATUS_META = {
  TODO:        { label: 'Pending',     color: '#f59e0b' },
  IN_PROGRESS: { label: 'In Progress', color: '#47c8ff' },
  IN_REVIEW:   { label: 'In Review',   color: '#e8a847' },
  DONE:        { label: 'Completed',   color: '#10b981' },
  REJECTED:    { label: 'Rejected',    color: '#ef4444' },
};
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES   = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'REJECTED'];

export default function TasksScreen() {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [statusFilter, setFilter] = useState('all');
  const [modal, setModal]       = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, p, u] = await Promise.allSettled([getTasks({ limit: 100 }), getProjects(), getUsers()]);
      setTasks(t.status === 'fulfilled' ? t.value : []);
      setProjects(p.status === 'fulfilled' ? p.value : []);
      setUsers(u.status === 'fulfilled' ? u.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const getUserName = (idOrObj) => {
    const id = typeof idOrObj === 'object' ? (idOrObj?._id || idOrObj?.userId) : idOrObj;
    return users.find(u => u._id === id)?.name || 'Unknown';
  };

  async function handleSave(form) {
    try {
      setSaving(true);
      const payload = { ...form, contributors: form.contributors.map(id => ({ userId: id })) };
      if (modal.type === 'edit') {
        await updateTask(modal.task._id, payload);
      } else {
        await createTask(payload);
      }
      setModal(null); load();
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed to save task.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(task) {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteTask(task._id); load(); }
          catch { Alert.alert('Error', 'Failed to delete.'); }
        }},
    ]);
  }

  async function handleAddNote() {
    if (!noteText.trim() || !detailTask) return;
    setAddingNote(true);
    try {
      await client.post(`/tasks/${detailTask._id}/notes`, { text: noteText, authorName: user?.name || 'Dept Head' });
      setNoteText('');
      const res = await client.get(`/tasks/${detailTask._id}`);
      const updated = res.data?.task || res.data;
      setDetailTask(updated);
      setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
    } catch { Alert.alert('Error', 'Failed to add note.'); }
    finally { setAddingNote(false); }
  }

  const FILTERS = ['all', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const filtered = tasks.filter(t => {
    const matchS = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchF = statusFilter === 'all' || t.status === statusFilter;
    return matchS && matchF;
  });
  const counts = { todo: tasks.filter(t => t.status === 'TODO').length, ip: tasks.filter(t => t.status === 'IN_PROGRESS').length, done: tasks.filter(t => t.status === 'DONE').length };

  const bgScreen   = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard     = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor= isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor  = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted  = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      {/* Top action bar */}
      <View className={`flex-row justify-end px-4 py-3 border-b ${borderColor}`}>
        <TouchableOpacity onPress={() => setModal({ type: 'add', task: null })}
          className={`flex-row items-center px-4 py-2 rounded-lg ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={14} color={isDarkMode ? '#131313' : '#fff'} />
          <Text className={`text-xs font-bold ml-1.5 uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>NEW TASK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? '#adc6ff' : '#2573e6'} />}>

        {/* Stats */}
        <View className="flex-row gap-2 mb-4">
          {[{ label: 'PENDING', value: counts.todo, color: '#f59e0b' }, { label: 'IN PROGRESS', value: counts.ip, color: '#47c8ff' }, { label: 'DONE', value: counts.done, color: '#10b981' }].map(s => (
            <View key={s.label} className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
              <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{s.label}</Text>
              <Text style={{ color: s.color }} className="text-xl font-bold">{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-3 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode ? '#888' : '#9ca3af'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search tasks..."
            placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'}
            className={`flex-1 text-xs ml-2 ${textColor}`} />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color={isDarkMode ? '#888' : '#9ca3af'} /></TouchableOpacity>}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${statusFilter === f ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : `${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${statusFilter === f ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>
                {f === 'all' ? 'All' : STATUS_META[f]?.label || f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Task list */}
        {loading ? <ActivityIndicator color={isDarkMode ? '#adc6ff' : '#2573e6'} className="mt-10" /> :
         filtered.length === 0 ? (
          <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
            <ListTodo size={32} color={isDarkMode ? '#888' : '#9ca3af'} />
            <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No tasks found</Text>
          </View>
         ) : filtered.map(task => {
           const sm = STATUS_META[task.status] || STATUS_META.TODO;
           const projectName = projects.find(p => p._id === (task.projectId?._id || task.projectId))?.name;
           const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE';
           return (
             <TouchableOpacity key={task._id} onPress={() => setDetailTask(task)}
               className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row justify-between items-start mb-2">
                 <View className="flex-1 mr-3">
                   <Text className={`text-sm font-bold ${textColor}`} numberOfLines={2}>{task.title}</Text>
                   {projectName && <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{projectName}</Text>}
                 </View>
                 <View className="flex-row items-center gap-2">
                   <View className="px-2 py-1 rounded border" style={{ borderColor: sm.color + '50', backgroundColor: sm.color + '18' }}>
                     <Text style={{ color: sm.color }} className="text-[9px] font-bold uppercase tracking-widest">• {sm.label}</Text>
                   </View>
                 </View>
               </View>
               <View className={`flex-row justify-between items-center pt-2 border-t ${borderColor}`}>
                 <View className="flex-row items-center">
                   {task.deadline && <><Calendar size={11} color={isDarkMode ? '#888' : '#9ca3af'} />
                   <Text className={`text-[10px] ml-1 ${textMuted}`}>{new Date(task.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</Text></>}
                   {isOverdue && <View className="ml-2 px-1.5 py-0.5 rounded border border-[#ef44444d] bg-[#ef44441a]"><Text className="text-[#ef4444] text-[8px] font-bold uppercase">OVERDUE</Text></View>}
                 </View>
                 <View className="flex-row gap-3">
                   <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setModal({ type: 'edit', task }); }}>
                     <Text className={`text-[10px] font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>EDIT</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handleDelete(task); }}>
                     <Text className="text-[10px] font-bold text-[#ef4444]">DELETE</Text>
                   </TouchableOpacity>
                 </View>
               </View>
             </TouchableOpacity>
           );
         })}
        <View className="h-8" />
      </ScrollView>

      {/* Add/Edit Modal */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <TaskFormModal mode={modal.type} initial={modal.task} projects={projects} users={users}
          isDarkMode={isDarkMode} saving={saving} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {/* Detail Modal */}
      {detailTask && (
        <TaskDetailModal task={detailTask} users={users} noteText={noteText} setNoteText={setNoteText}
          addingNote={addingNote} onAddNote={handleAddNote} isDarkMode={isDarkMode}
          onClose={() => { setDetailTask(null); setNoteText(''); }} />
      )}
    </SafeAreaView>
  );
}

function TaskFormModal({ mode, initial, projects, users, isDarkMode, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    title: initial?.title || '', description: initial?.description || '',
    projectId: initial?.projectId?._id || initial?.projectId || '',
    priority: initial?.priority || 'MEDIUM', status: initial?.status || 'IN_PROGRESS',
    contributors: (initial?.contributors || []).map(c => c.userId?._id || c.userId || c),
  });
  const [err, setErr] = useState('');
  const [empSearch, setEmpSearch] = useState('');

  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  function handle() {
    if (!form.title.trim()) { setErr('Task title is required.'); return; }
    if (!form.contributors.length) { setErr('Assign at least one employee.'); return; }
    setErr(''); onSave(form);
  }

  const filteredUsers = users.filter(u => !empSearch || u.name?.toLowerCase().includes(empSearch.toLowerCase()));

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[#000000cc]">
        <View className={`border-t rounded-t-2xl max-h-[92%] ${bgCard} ${borderColor}`}>
          <View className={`flex-row justify-between items-center p-6 pb-4 border-b ${borderColor}`}>
            <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{mode === 'add' ? 'ASSIGN NEW TASK' : 'EDIT TASK'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}><X size={20} color={isDarkMode ? '#888' : '#6b7280'} /></TouchableOpacity>
          </View>
          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            <View className="h-4" />
            {!!err && <View className="flex-row items-center bg-[#ef44441a] border border-[#ef44444d] rounded p-3 mb-4"><AlertCircle size={14} color="#ef4444" /><Text className="text-[#ef4444] text-xs ml-2">{err}</Text></View>}

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Task Title *</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={form.title} onChangeText={v => setForm({...form, title: v})} placeholder="e.g. Implement Login API"
                placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} className={`text-xs ${textColor}`} />
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Project</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <TouchableOpacity onPress={() => setForm({...form, projectId: ''})}
                className={`mr-2 px-4 py-1.5 rounded-full border ${!form.projectId ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : `${bgInputAlt} ${borderColor}`}`}>
                <Text className={`text-[10px] font-bold ${!form.projectId ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>None / No Project</Text>
              </TouchableOpacity>
              {projects.map(p => (
                <TouchableOpacity key={p._id} onPress={() => setForm({...form, projectId: p._id})}
                  className={`mr-2 px-4 py-1.5 rounded-full border ${form.projectId === p._id ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : `${bgInputAlt} ${borderColor}`}`}>
                  <Text className={`text-[10px] font-bold ${form.projectId === p._id ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Description</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={form.description} onChangeText={v => setForm({...form, description: v})} placeholder="Details about the task..."
                placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} multiline numberOfLines={3}
                className={`text-xs min-h-[60px] ${textColor}`} textAlignVertical="top" />
            </View>



            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Assign Employees *</Text>
            <View className={`border rounded-lg mb-2 ${bgInputAlt} ${borderColor}`}>
              <View className={`flex-row items-center px-3 py-2 border-b ${borderColor}`}>
                <Search size={12} color={isDarkMode ? '#888' : '#9ca3af'} />
                <TextInput value={empSearch} onChangeText={setEmpSearch} placeholder="Search users..."
                  placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`} />
              </View>
              {filteredUsers.slice(0, 15).map(u => {
                const selected = form.contributors.includes(u._id);
                return (
                  <TouchableOpacity key={u._id} onPress={() => setForm(prev => ({ ...prev, contributors: selected ? prev.contributors.filter(id => id !== u._id) : [...prev.contributors, u._id] }))}
                    className={`flex-row items-center px-3 py-3 border-b ${borderColor} ${selected ? (isDarkMode ? 'bg-[#adc6ff1a]' : 'bg-blue-50') : ''}`}>
                    <View className={`w-4 h-4 rounded border mr-3 items-center justify-center ${selected ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : borderColor}`}>
                      {selected && <Check size={10} color={isDarkMode ? '#131313' : '#fff'} />}
                    </View>
                    <Text className={`text-xs font-medium ${selected ? (isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]') : textColor}`}>{u.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {form.contributors.length > 0 && (
              <Text className={`text-[10px] mb-4 ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{form.contributors.length} employee(s) selected</Text>
            )}
            <View className="h-4" />
          </ScrollView>
          <View className={`flex-row justify-end p-6 pt-4 border-t ${borderColor}`}>
            <TouchableOpacity onPress={onClose} disabled={saving} className="mr-4 py-3 px-4">
              <Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handle} disabled={saving}
              className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'} ${saving ? 'opacity-50' : ''}`}>
              {saving ? <ActivityIndicator size="small" color={isDarkMode ? '#131313' : '#fff'} /> :
                <Text className={`font-bold text-sm uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>{mode === 'add' ? 'ASSIGN' : 'SAVE'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TaskDetailModal({ task, users, noteText, setNoteText, addingNote, onAddNote, isDarkMode, onClose }) {
  const bgScreen   = isDarkMode ? 'bg-[#131313]' : 'bg-gray-100';
  const bgCard     = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor= isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor  = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted  = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const getUserName = (idOrObj) => {
    const id = typeof idOrObj === 'object' ? (idOrObj?._id || idOrObj?.userId) : idOrObj;
    return users.find(u => u._id === id)?.name || 'Unknown';
  };

  const sm = STATUS_META[task.status] || STATUS_META.TODO;
  const contributors = task.contributors || [];
  const progress = task.employeeProgress || [];
  const notes = task.notes || [];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 mt-10 rounded-t-2xl border-t ${bgScreen} ${borderColor}`}>
        <View className={`p-4 border-b flex-row justify-between items-center rounded-t-2xl ${bgCard} ${borderColor}`}>
          <View className="flex-row items-center"><FileText size={16} color={isDarkMode ? '#888' : '#9ca3af'} /><Text className={`text-xs font-bold uppercase tracking-widest ml-2 ${textColor}`}>TASK DETAILS</Text></View>
          <TouchableOpacity onPress={onClose} className="bg-gray-500 p-2 rounded-full"><X size={16} color="#fff" /></TouchableOpacity>
        </View>
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-between items-start mb-6">
            <Text className={`text-xl font-bold flex-1 mr-4 ${textColor}`}>{task.title}</Text>
            <View className="px-3 py-1.5 rounded border" style={{ borderColor: sm.color + '50', backgroundColor: sm.color + '18' }}>
              <Text style={{ color: sm.color }} className="text-[10px] font-bold uppercase tracking-wider">{sm.label}</Text>
            </View>
          </View>

          <View className={`border rounded-lg p-4 mb-6 ${bgCard} ${borderColor}`}>
            <View className={`flex-row justify-between mb-4 pb-4 border-b ${borderColor}`}>
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Priority</Text><Text className={`text-sm font-bold ${textColor}`}>{task.priority || 'MEDIUM'}</Text></View>
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Deadline</Text><Text className={`text-sm font-bold ${textColor}`}>{task.deadline ? new Date(task.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</Text></View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Scheduled Start</Text><Text className={`text-xs font-bold ${textColor}`}>{task.startTime ? new Date(task.startTime).toLocaleString() : '—'}</Text></View>
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Scheduled End</Text><Text className={`text-xs font-bold ${textColor}`}>{task.endTime ? new Date(task.endTime).toLocaleString() : '—'}</Text></View>
            </View>
          </View>

          {contributors.length > 0 && (
            <View className="mb-6">
              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>CONTRIBUTORS</Text>
              <View className="flex-row flex-wrap">{contributors.map((c, i) => (
                <View key={i} className={`border px-3 py-1.5 rounded-full mr-2 mb-2 ${bgCard} ${borderColor}`}>
                  <Text className={`text-xs font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{getUserName(c.userId || c)}</Text>
                </View>
              ))}</View>
            </View>
          )}

          {progress.length > 0 && (
            <View className="mb-6">
              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textColor}`}>EMPLOYEE PROGRESS</Text>
              <View className={`border rounded-lg overflow-hidden ${borderColor}`}>
                {progress.map((p, idx) => (
                  <View key={idx} className={`p-4 ${idx < progress.length - 1 ? `border-b ${borderColor}` : ''}`}>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className={`text-sm font-bold ${textColor}`}>{getUserName(p.userId)}</Text>
                      <View className={`px-2 py-1 rounded border ${p.status==='DONE'||p.status==='COMPLETED' ? 'bg-[#10b9811a] border-[#10b9814a]' : 'bg-[#f59e0b1a] border-[#f59e0b4a]'}`}>
                        <Text className={`text-[9px] font-bold uppercase ${p.status==='DONE'||p.status==='COMPLETED' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>{p.status}</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between">
                      <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Started</Text><Text className={`text-xs ${textColor}`}>{p.startedAt ? new Date(p.startedAt).toLocaleString() : '—'}</Text></View>
                      <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Completed</Text><Text className={`text-xs ${textColor}`}>{p.completedAt ? new Date(p.completedAt).toLocaleString() : '—'}</Text></View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="mb-6">
            <Text className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textMuted}`}>NOTES & COMMENTS</Text>
            {notes.length === 0 ? <Text className={`text-xs italic mb-3 ${textMuted}`}>No notes yet.</Text> :
              notes.map((note, i) => (
                <View key={i} className={`p-3 rounded-lg mb-2 border ${bgInputAlt} ${borderColor}`}>
                  <View className="flex-row justify-between mb-1">
                    <Text className={`text-[10px] font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{note.authorName || 'Unknown'}</Text>
                    <Text className={`text-[9px] ${textMuted}`}>{new Date(note.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text className={`text-xs leading-5 ${textColor}`}>{note.text}</Text>
                </View>
              ))}
            <View className={`flex-row items-stretch border rounded-lg mt-2 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={noteText} onChangeText={setNoteText} placeholder="Add a note..."
                placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} multiline
                className={`flex-1 text-xs px-3 py-3 ${textColor}`} textAlignVertical="center" />
              <TouchableOpacity onPress={onAddNote} disabled={addingNote || !noteText.trim()}
                className={`px-4 justify-center items-center border-l ${borderColor} ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'} ${(!noteText.trim()) ? 'opacity-40' : ''}`}>
                {addingNote ? <ActivityIndicator size="small" color={isDarkMode ? '#131313' : '#fff'} /> :
                  <Send size={14} color={isDarkMode ? '#131313' : '#fff'} />}
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-4" />
        </ScrollView>
        <View className={`p-4 border-t ${bgCard} ${borderColor}`}>
          <TouchableOpacity onPress={onClose} className={`w-full border py-3 rounded-lg items-center ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100'} ${borderColor}`}>
            <Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
