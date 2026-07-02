import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ListTodo, Plus, Search, Pencil, Trash2, X, Check,
  ChevronDown, Circle, AlertCircle, Calendar,
} from 'lucide-react-native';
import useAuthStore from '../../store/authStore';
import { getTasks, getUsers, getProjects, createTask, updateTask, deleteTask } from '../../api/services';

// ─── Meta ─────────────────────────────────────────────────────
const STATUS_META = {
  TODO:        { label: 'Pending',     color: '#9ca3af', bg: '#9ca3af12' },
  IN_PROGRESS: { label: 'In Progress', color: '#47c8ff', bg: '#47c8ff18' },
  IN_REVIEW:   { label: 'In Review',   color: '#e8a847', bg: '#e8a84718' },
  DONE:        { label: 'Completed',   color: '#47ff8a', bg: '#47ff8a18' },
  REJECTED:    { label: 'Rejected',    color: '#ff4747', bg: '#ff474718' },
};
const PRIORITY_META = {
  LOW:    { label: 'Low',    color: '#9ca3af' },
  MEDIUM: { label: 'Medium', color: '#47c8ff' },
  HIGH:   { label: 'High',   color: '#ff4747' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.TODO;
  return (
    <View style={[ts.badge, { backgroundColor: m.bg, borderColor: m.color + '50' }]}>
      <Circle size={6} color={m.color} fill={m.color} />
      <Text style={[ts.badgeText, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

function PriorityChip({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.LOW;
  return <Text style={[ts.priorityChip, { color: m.color }]}>{m.label}</Text>;
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Task Modal ────────────────────────────────────────────────
function TaskModal({ mode, initial, projects, users, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description || '',
          projectId: initial.projectId?._id || initial.projectId || '',
          priority: initial.priority || 'MEDIUM',
          status: initial.status || 'IN_PROGRESS',
          contributors: (initial.contributors || []).map(c => c.userId?._id || c.userId || c),
        }
      : { title: '', description: '', projectId: '', priority: 'MEDIUM', status: 'IN_PROGRESS', contributors: [] },
  );
  const [err, setErr] = useState('');

  function handleSubmit() {
    if (!form.title.trim()) { setErr('Task title is required.'); return; }
    if (!form.contributors.length) { setErr('Please assign at least one employee.'); return; }
    setErr('');
    onSave(form);
  }

  function toggleContributor(id) {
    setForm(prev => ({
      ...prev,
      contributors: prev.contributors.includes(id)
        ? prev.contributors.filter(c => c !== id)
        : [...prev.contributors, id],
    }));
  }

  const STATUSES = ['IN_PROGRESS', 'TODO', 'IN_REVIEW', 'DONE', 'REJECTED'];
  const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ts.overlay}>
        <View style={ts.sheet}>
          <View style={ts.sheetHeader}>
            <Text style={ts.sheetTitle}>{mode === 'add' ? 'ASSIGN NEW TASK' : 'EDIT TASK'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {!!err && <View style={ts.errorBox}><AlertCircle size={12} color="#ff4747" /><Text style={ts.errorText}>{err}</Text></View>}

            <Text style={ts.label}>Task Title *</Text>
            <TextInput style={ts.input} value={form.title} onChangeText={v => setForm({ ...form, title: v })} placeholder="e.g. Implement Login" placeholderTextColor="#4b5563" />

            <Text style={ts.label}>Description</Text>
            <TextInput style={[ts.input, ts.textArea]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="Task details..." placeholderTextColor="#4b5563" multiline />

            <Text style={ts.label}>Project</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity onPress={() => setForm({ ...form, projectId: '' })} style={[ts.optChip, !form.projectId && ts.optChipActive]}>
                <Text style={[ts.optChipText, !form.projectId && ts.optChipTextActive]}>None</Text>
              </TouchableOpacity>
              {projects.map(p => (
                <TouchableOpacity key={p._id} onPress={() => setForm({ ...form, projectId: p._id })} style={[ts.optChip, form.projectId === p._id && ts.optChipActive]}>
                  <Text style={[ts.optChipText, form.projectId === p._id && ts.optChipTextActive]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={ts.label}>Priority</Text>
            <View style={ts.row}>
              {PRIORITIES.map(p => (
                <TouchableOpacity key={p} onPress={() => setForm({ ...form, priority: p })} style={[ts.optChip, form.priority === p && ts.optChipActive]}>
                  <Text style={[ts.optChipText, form.priority === p && ts.optChipTextActive]}>{PRIORITY_META[p].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ts.label}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {STATUSES.map(st => (
                <TouchableOpacity key={st} onPress={() => setForm({ ...form, status: st })} style={[ts.optChip, form.status === st && ts.optChipActive]}>
                  <Text style={[ts.optChipText, form.status === st && ts.optChipTextActive]}>{STATUS_META[st].label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            
            <Text style={ts.label}>Advanced Options</Text>
            <View style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 12, marginBottom: 12 }}>
               <Text style={ts.label}>Task Points</Text>
               <TextInput style={ts.input} value={String(form.points || '0')} onChangeText={v => setForm({...form, points: v})} keyboardType="numeric" placeholderTextColor="#4b5563" />
               
               <Text style={ts.label}>Parent Task ID (Optional)</Text>
               <TextInput style={ts.input} value={form.parentTaskId || ''} onChangeText={v => setForm({...form, parentTaskId: v})} placeholder="Task ID..." placeholderTextColor="#4b5563" />
               
               <View style={[ts.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
                 <Text style={ts.label}>Recurring Task</Text>
                 <Switch value={form.isRecurring || false} onValueChange={v => setForm({...form, isRecurring: v})} />
               </View>
            </View>
     
            <Text style={ts.label}>Assign Employees *</Text>
            {users.slice(0, 20).map(u => {
              const selected = form.contributors.includes(u._id);
              return (
                <TouchableOpacity key={u._id} onPress={() => toggleContributor(u._id)} style={[ts.userRow, selected && ts.userRowSelected]}>
                  <View style={[ts.checkbox, selected && ts.checkboxSelected]}>
                    {selected && <Check size={10} color="#2573e6" />}
                  </View>
                  <Text style={[ts.userName, selected && ts.userNameSelected]}>{u.name}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={{ height: 20 }} />
          </ScrollView>
          <View style={ts.footer}>
            <TouchableOpacity style={ts.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={ts.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ts.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Check size={14} color="#fff" /><Text style={ts.saveText}>{mode === 'add' ? 'ASSIGN' : 'SAVE'}</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function TasksScreen({ navigation }) {
  const [tasks, setTasks]         = useState([]);
  const [projects, setProjects]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setFilter] = useState('all');
  const [modal, setModal]         = useState(null);

  const load = useCallback(async () => {
    try {
      const [t, p, u] = await Promise.allSettled([
        getTasks({ limit: 100 }),
        getProjects(),
        getUsers(),
      ]);
      setTasks(t.status === 'fulfilled' ? t.value : []);
      setProjects(p.status === 'fulfilled' ? p.value : []);
      setUsers(u.status === 'fulfilled' ? u.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    try {
      setSaving(true);
      if (modal.type === 'edit') {
        const updated = await updateTask(modal.task._id, { ...form, contributors: form.contributors.map(id => ({ userId: id })) });
        setTasks(prev => prev.map(t => t._id === modal.task._id ? { ...t, ...updated } : t));
      } else {
        const created = await createTask({ ...form, contributors: form.contributors.map(id => ({ userId: id })) });
        setTasks(prev => [created, ...prev]);
      }
      setModal(null);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save task.');
    } finally { setSaving(false); }
  }

  async function handleDelete(task) {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteTask(task._id); setTasks(prev => prev.filter(t => t._id !== task._id)); }
          catch { Alert.alert('Error', 'Failed to delete task.'); }
        }
      },
    ]);
  }

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'TODO', label: 'Pending' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'IN_REVIEW', label: 'In Review' },
    { key: 'DONE', label: 'Completed' },
  ];

  const filtered = tasks.filter(t => {
    const matchS = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchF = statusFilter === 'all' || t.status === statusFilter;
    return matchS && matchF;
  });

  const counts = { todo: tasks.filter(t => t.status === 'TODO').length, ip: tasks.filter(t => t.status === 'IN_PROGRESS').length, done: tasks.filter(t => t.status === 'DONE').length };

  return (
    <SafeAreaView style={ts.safe} edges={['bottom']}>
      <View style={ts.header}>
        <View>
          <Text style={ts.headerSub}>DEPARTMENT</Text>
          <Text style={ts.headerTitle}>Tasks</Text>
        </View>
        <TouchableOpacity style={ts.addBtn} onPress={() => setModal({ type: 'add' })}>
          <Plus size={14} color="#0f172a" strokeWidth={2.5} />
          <Text style={ts.addBtnText}>NEW TASK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        {/* Stats */}
        <View style={ts.statsRow}>
          {[
            { label: 'PENDING', value: counts.todo, color: '#9ca3af' },
            { label: 'IN PROGRESS', value: counts.ip, color: '#47c8ff' },
            { label: 'COMPLETED', value: counts.done, color: '#47ff8a' },
          ].map(s => (
            <View key={s.label} style={ts.statCard}>
              <Text style={ts.statLabel}>{s.label}</Text>
              <Text style={[ts.statValue, { color: s.color }]}>{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={ts.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={ts.searchInput} value={search} onChangeText={setSearch} placeholder="Search tasks..." placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[ts.chip, statusFilter === f.key && ts.chipActive]}>
              <Text style={[ts.chipText, statusFilter === f.key && ts.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={ts.empty}><ListTodo size={32} color="#374151" /><Text style={ts.emptyText}>No tasks found</Text></View> :
         filtered.map(task => {
           const projectName = projects.find(p => p._id === (task.projectId?._id || task.projectId))?.name;
           return (
             <View key={task._id} style={ts.taskCard}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                 <View style={{ flex: 1, marginRight: 8 }}>
                   <Text style={ts.taskTitle}>{task.title}</Text>
                   {projectName && <Text style={ts.taskMeta}>{projectName}</Text>}
                 </View>
                 <StatusBadge status={task.status} />
               </View>
               <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                 <PriorityChip priority={task.priority} />
                 {task.endTime && (
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                     <Calendar size={11} color="#6b7280" />
                     <Text style={ts.taskDate}>{fmt(task.endTime)}</Text>
                   </View>
                 )}
                 <View style={{ flexDirection: 'row', gap: 12 }}>
                   <TouchableOpacity onPress={() => setModal({ type: 'edit', task })}><Pencil size={14} color="#6b7280" /></TouchableOpacity>
                   <TouchableOpacity onPress={() => handleDelete(task)}><Trash2 size={14} color="#ff4747" /></TouchableOpacity>
                 </View>
               </View>
             </View>
           );
         })}

        <View style={{ height: 32 }} />
      </ScrollView>

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <TaskModal mode={modal.type} initial={modal.task} projects={projects} users={users} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0d0d0d' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:        { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  addBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2573e6', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#adc6ff' },
  addBtnText:       { fontSize: 11, fontWeight: '800', color: '#0f172a', letterSpacing: 0.8 },
  statsRow:         { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard:         { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  statLabel:        { fontSize: 8, color: '#6b7280', letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  statValue:        { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  searchBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchInput:      { flex: 1, fontSize: 12, color: '#e5e7eb' },
  chip:             { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive:       { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:         { fontSize: 10, color: '#9ca3af', fontWeight: '700', letterSpacing: 0.6 },
  chipTextActive:   { color: '#2573e6' },
  taskCard:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  taskTitle:        { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  taskMeta:         { fontSize: 11, color: '#6b7280', marginTop: 2 },
  taskDate:         { fontSize: 11, color: '#6b7280' },
  badge:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  badgeText:        { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  priorityChip:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  empty:            { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:        { fontSize: 13, color: '#4b5563' },
  // Modal
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:            { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '92%' },
  sheetHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:       { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  footer:           { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' },
  label:            { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 10 },
  input:            { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  textArea:         { minHeight: 70, textAlignVertical: 'top' },
  row:              { flexDirection: 'row', gap: 8, marginBottom: 8 },
  optChip:          { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 7, marginRight: 6 },
  optChipActive:    { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  optChipText:      { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  optChipTextActive:{ color: '#2573e6' },
  userRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#131313' },
  userRowSelected:  { backgroundColor: '#2573e610' },
  checkbox:         { width: 16, height: 16, borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  userName:         { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  userNameSelected: { color: '#2573e6' },
  errorBox:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff4747', padding: 10, marginBottom: 8 },
  errorText:        { fontSize: 11, color: '#ff4747', flex: 1 },
  cancelBtn:        { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelText:       { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
  saveBtn:          { flex: 1, paddingVertical: 12, backgroundColor: '#2573e6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveText:         { fontSize: 11, color: '#ffffff', fontWeight: '700', letterSpacing: 1 },
});
