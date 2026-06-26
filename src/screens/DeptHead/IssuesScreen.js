import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bug, Plus, Search, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react-native';
import { getAllBugs, getBugsReportedByMe, createBug, updateBug, deleteBug, getProjects, getUsers } from '../../api/services';
import useAuthStore from '../../store/authStore';

const SEVERITY_META = {
  LOW:      { label: 'Low',      color: '#47c8ff', bg: '#47c8ff18' },
  MEDIUM:   { label: 'Medium',   color: '#e8a847', bg: '#e8a84718' },
  HIGH:     { label: 'High',     color: '#f87343', bg: '#f8734318' },
  CRITICAL: { label: 'Critical', color: '#ff4747', bg: '#ff474718' },
};
const STATUS_META = {
  OPEN:        { label: 'Open',        color: '#ff4747', bg: '#ff474718' },
  IN_PROGRESS: { label: 'In Progress', color: '#47c8ff', bg: '#47c8ff18' },
  RESOLVED:    { label: 'Resolved',    color: '#47ff8a', bg: '#47ff8a18' },
  CLOSED:      { label: 'Closed',      color: '#6b7280', bg: '#6b728018' },
};

function Badge({ label, color, bg }) {
  return (
    <View style={{ backgroundColor: bg, borderWidth: 1, borderColor: color + '40', paddingHorizontal: 7, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function IssueModal({ initial, projects, users, reporterId, onClose, onSave }) {
  const [form, setForm] = useState({
    title:      initial?.title || '',
    description:initial?.description || '',
    severity:   initial?.severity || 'MEDIUM',
    projectId:  initial?.projectId?._id || initial?.projectId || '',
    assignedTo: initial?.assignedTo?._id || initial?.assignedTo || '',
    status:     initial?.status || 'OPEN',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit() {
    if (!form.title.trim() || !form.projectId) { setErr('Title and project are required.'); return; }
    setErr('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch { setErr('Failed to save issue.'); }
    finally { setSaving(false); }
  }

  const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={is.overlay}>
        <View style={is.sheet}>
          <View style={is.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Bug size={14} color="#ff4747" />
              <Text style={is.sheetTitle}>{initial ? 'EDIT ISSUE' : 'REPORT NEW ISSUE'}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {!!err && <View style={is.errorBox}><Text style={is.errorText}>{err}</Text></View>}
            <Text style={is.label}>Issue Title *</Text>
            <TextInput style={is.input} value={form.title} onChangeText={v => setForm({ ...form, title: v })} placeholder="Brief description of the issue" placeholderTextColor="#4b5563" />
            <Text style={is.label}>Description</Text>
            <TextInput style={[is.input, is.textArea]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="Steps to reproduce..." placeholderTextColor="#4b5563" multiline />
            <Text style={is.label}>Project *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {projects.map(p => (
                <TouchableOpacity key={p._id} onPress={() => setForm({ ...form, projectId: p._id })} style={[is.chip, form.projectId === p._id && is.chipActive]}>
                  <Text style={[is.chipText, form.projectId === p._id && is.chipTextActive]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={is.label}>Severity</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {SEVERITIES.map(sv => {
                const m = SEVERITY_META[sv];
                return (
                  <TouchableOpacity key={sv} onPress={() => setForm({ ...form, severity: sv })} style={[is.chip, { borderColor: form.severity === sv ? m.color : '#1f2937', backgroundColor: form.severity === sv ? m.bg : 'transparent' }]}>
                    <Text style={[is.chipText, { color: form.severity === sv ? m.color : '#9ca3af' }]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={is.label}>Assign To</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity onPress={() => setForm({ ...form, assignedTo: '' })} style={[is.chip, !form.assignedTo && is.chipActive]}>
                <Text style={[is.chipText, !form.assignedTo && is.chipTextActive]}>Unassigned</Text>
              </TouchableOpacity>
              {users.map(u => (
                <TouchableOpacity key={u._id} onPress={() => setForm({ ...form, assignedTo: u._id })} style={[is.chip, form.assignedTo === u._id && is.chipActive]}>
                  <Text style={[is.chipText, form.assignedTo === u._id && is.chipTextActive]}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={is.footer}>
            <TouchableOpacity style={is.cancelBtn} onPress={onClose} disabled={saving}><Text style={is.cancelText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity style={[is.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={is.saveText}>{initial ? 'SAVE CHANGES' : 'REPORT ISSUE'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function IssuesScreen() {
  const { user } = useAuthStore();
  const [allBugs, setAllBugs]     = useState([]);
  const [myBugs, setMyBugs]       = useState([]);
  const [projects, setProjects]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('all');
  const [modal, setModal]         = useState(null); // null | {type:'add'} | {type:'edit', bug}

  const load = useCallback(async () => {
    try {
      const [a, m, p, u] = await Promise.allSettled([getAllBugs(), getBugsReportedByMe(), getProjects(), getUsers()]);
      setAllBugs(a.status === 'fulfilled' ? a.value : []);
      setMyBugs(m.status === 'fulfilled' ? m.value : []);
      setProjects(p.status === 'fulfilled' ? p.value : []);
      setUsers(u.status === 'fulfilled' ? u.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    if (modal.type === 'edit') {
      await updateBug(modal.bug._id, form);
    } else {
      await createBug({ ...form, reportedBy: user?._id });
    }
    load();
    setModal(null);
  }

  async function handleDelete(bug) {
    Alert.alert('Delete Issue', `Delete "${bug.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteBug(bug._id); setAllBugs(prev => prev.filter(b => b._id !== bug._id)); }
          catch { Alert.alert('Error', 'Failed to delete issue.'); }
        }
      },
    ]);
  }

  const bugs = activeTab === 'all' ? allBugs : myBugs;
  const filtered = bugs.filter(b => {
    const matchS = !search || b.title?.toLowerCase().includes(search.toLowerCase());
    const matchF = statusF === 'all' || b.status === statusF;
    return matchS && matchF;
  });

  const openCount = allBugs.filter(b => b.status === 'OPEN').length;
  const ipCount   = allBugs.filter(b => b.status === 'IN_PROGRESS').length;
  const resCount  = allBugs.filter(b => b.status === 'RESOLVED').length;

  return (
    <SafeAreaView style={is.safe} edges={['bottom']}>
      <View style={is.header}>
        <View>
          <Text style={is.headerSub}>DEPARTMENT HEAD</Text>
          <Text style={is.headerTitle}>Issues</Text>
        </View>
        <TouchableOpacity style={[is.addBtn, { borderColor: '#ff4747', backgroundColor: '#ff474718' }]} onPress={() => setModal({ type: 'add' })}>
          <Plus size={14} color="#ff4747" strokeWidth={2.5} />
          <Text style={[is.addBtnText, { color: '#ff4747' }]}>REPORT ISSUE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff4747" />}>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[{ label: 'OPEN', value: openCount, color: '#ff4747' }, { label: 'IN PROGRESS', value: ipCount, color: '#e8a847' }, { label: 'RESOLVED', value: resCount, color: '#47ff8a' }].map(s => (
            <View key={s.label} style={[is.statCard]}>
              <Text style={is.statLabel}>{s.label}</Text>
              <Text style={[is.statValue, { color: s.color }]}>{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1f2937', marginBottom: 14 }}>
          {[{ key: 'all', label: `All Issues (${allBugs.length})` }, { key: 'mine', label: `Reported by Me (${myBugs.length})` }].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)} style={[is.tab, activeTab === t.key && is.tabActive]}>
              <Text style={[is.tabText, activeTab === t.key && is.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search + Status */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <View style={[is.searchBox, { flex: 1 }]}>
            <Search size={13} color="#6b7280" />
            <TextInput style={is.searchInput} value={search} onChangeText={setSearch} placeholder="Search issues..." placeholderTextColor="#4b5563" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(f => (
              <TouchableOpacity key={f} onPress={() => setStatusF(f)} style={[is.chip, statusF === f && is.chipActive]}>
                <Text style={[is.chipText, statusF === f && is.chipTextActive]}>{f === 'all' ? 'All' : STATUS_META[f]?.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        {loading ? <ActivityIndicator color="#ff4747" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={is.empty}><Bug size={32} color="#374151" /><Text style={is.emptyText}>No issues found</Text></View> :
         filtered.map(bug => {
           const proj = projects.find(p => p._id === (bug.projectId?._id || bug.projectId));
           const assignee = users.find(u => u._id === (bug.assignedTo?._id || bug.assignedTo));
           const sm = SEVERITY_META[bug.severity] || SEVERITY_META.LOW;
           const stm = STATUS_META[bug.status] || STATUS_META.OPEN;
           return (
             <View key={bug._id} style={is.bugCard}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                 <View style={{ flex: 1, marginRight: 8 }}>
                   <Text style={is.bugTitle}>{bug.title}</Text>
                   <Text style={is.bugProj}>{proj?.name || '—'}</Text>
                 </View>
                 <View style={{ gap: 4, alignItems: 'flex-end' }}>
                   <TouchableOpacity onPress={() => setModal({ type: 'edit', bug })}><Pencil size={13} color="#6b7280" /></TouchableOpacity>
                   <TouchableOpacity onPress={() => handleDelete(bug)}><Trash2 size={13} color="#ff4747" /></TouchableOpacity>
                 </View>
               </View>
               <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                 <Badge label={sm.label} color={sm.color} bg={sm.bg} />
                 <Badge label={stm.label} color={stm.color} bg={stm.bg} />
                 <Text style={is.assigneeText}>{assignee?.name || 'Unassigned'}</Text>
               </View>
             </View>
           );
         })}
        <View style={{ height: 32 }} />
      </ScrollView>

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <IssueModal initial={modal.bug} projects={projects} users={users} reporterId={user?._id} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </SafeAreaView>
  );
}

const is = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText:   { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  statCard:     { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  statLabel:    { fontSize: 8, color: '#6b7280', letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  statValue:    { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  tab:          { paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: '#ff4747' },
  tabText:      { fontSize: 11, color: '#6b7280', fontWeight: '700', letterSpacing: 0.8 },
  tabTextActive:{ color: '#ff4747' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8 },
  searchInput:  { flex: 1, fontSize: 12, color: '#e5e7eb' },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 11, paddingVertical: 6, marginRight: 6 },
  chipActive:   { borderColor: '#ff4747', backgroundColor: '#ff474718' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  chipTextActive:{ color: '#ff4747' },
  bugCard:      { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  bugTitle:     { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  bugProj:      { fontSize: 11, color: '#6b7280', marginTop: 2 },
  assigneeText: { fontSize: 11, color: '#9ca3af' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  // Modal
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '90%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:   { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  footer:       { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' },
  label:        { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 10 },
  input:        { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  textArea:     { minHeight: 70, textAlignVertical: 'top' },
  errorBox:     { backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff4747', padding: 10, marginBottom: 8 },
  errorText:    { fontSize: 11, color: '#ff4747' },
  cancelBtn:    { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
  saveBtn:      { flex: 1, paddingVertical: 12, backgroundColor: '#ff4747', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveText:     { fontSize: 11, color: '#ffffff', fontWeight: '700', letterSpacing: 1 },
});
