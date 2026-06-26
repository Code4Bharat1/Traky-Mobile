import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FolderKanban, Plus, Search, Pencil, Trash2, X, Check,
  ChevronDown, Calendar, Users, Circle,
} from 'lucide-react-native';
import useAuthStore from '../../store/authStore';
import {
  getProjects, getUsers, createProject, updateProject, deleteProject,
} from '../../api/services';

// ─── Helpers ──────────────────────────────────────────────────
function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_META = {
  IN_PROGRESS: { label: 'In Progress', color: '#47c8ff', bg: '#47c8ff18' },
  COMPLETED:   { label: 'Completed',   color: '#47ff8a', bg: '#47ff8a18' },
  PLANNING:    { label: 'In Progress', color: '#47c8ff', bg: '#47c8ff18' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.IN_PROGRESS;
  return (
    <View style={[s.badge, { backgroundColor: m.bg, borderColor: m.color + '40' }]}>
      <Circle size={6} color={m.color} fill={m.color} />
      <Text style={[s.badgeText, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

// ─── Project Modal ─────────────────────────────────────────────
function ProjectModal({ mode, initial, users, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, description: initial.description || '', status: initial.status || 'IN_PROGRESS' }
      : { name: '', description: '', status: 'IN_PROGRESS' },
  );
  const [err, setErr] = useState('');

  function validate() {
    if (!form.name.trim()) { setErr('Project name is required.'); return false; }
    setErr('');
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave(form);
  }

  const statuses = ['IN_PROGRESS', 'COMPLETED'];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{mode === 'add' ? 'CREATE PROJECT' : 'EDIT PROJECT'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <X size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.sheetBody} showsVerticalScrollIndicator={false}>
            {!!err && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{err}</Text>
              </View>
            )}

            <Text style={s.fieldLabel}>Project Name *</Text>
            <TextInput
              style={s.input}
              value={form.name}
              onChangeText={v => setForm({ ...form, name: v })}
              placeholder="e.g. Website Redesign"
              placeholderTextColor="#4b5563"
            />

            <Text style={s.fieldLabel}>Description</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={form.description}
              onChangeText={v => setForm({ ...form, description: v })}
              placeholder="Brief project description…"
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={3}
            />

            <Text style={s.fieldLabel}>Status</Text>
            <View style={s.statusRow}>
              {statuses.map(st => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setForm({ ...form, status: st })}
                  style={[s.statusChip, form.status === st && s.statusChipActive]}
                >
                  <Text style={[s.statusChipText, form.status === st && s.statusChipTextActive]}>
                    {STATUS_META[st]?.label ?? st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.sheetFooter}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={s.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, saving && s.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Check size={14} color="#fff" /><Text style={s.saveBtnText}>{mode === 'add' ? 'CREATE' : 'SAVE'}</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────
function DeleteModal({ project, onClose, onConfirm, saving }) {
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { maxHeight: 280 }]}>
          <View style={s.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Trash2 size={16} color="#ff4747" />
              <Text style={s.sheetTitle}>DELETE PROJECT</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <View style={{ padding: 20, gap: 6 }}>
            <Text style={s.deleteSubText}>You are about to delete:</Text>
            <Text style={s.deleteName}>{project?.name}</Text>
            <Text style={s.deleteWarning}>This will also delete all modules and logs. This cannot be undone.</Text>
          </View>
          <View style={s.sheetFooter}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={s.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: '#ff4747' }, saving && s.saveBtnDisabled]}
              onPress={onConfirm}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>DELETE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ProjectsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [projects, setProjects]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [modal, setModal]           = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, u] = await Promise.allSettled([getProjects(), getUsers()]);
      setProjects(p.status === 'fulfilled' ? p.value : []);
      setUsers(u.status === 'fulfilled' ? u.value : []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    try {
      setSaving(true);
      if (modal.type === 'edit') {
        const updated = await updateProject(modal.project._id, form);
        setProjects(prev => prev.map(p => p._id === modal.project._id ? { ...p, ...updated } : p));
      } else {
        const created = await createProject(form);
        setProjects(prev => [created, ...prev]);
      }
      setModal(null);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save project.');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await deleteProject(modal.project._id);
      setProjects(prev => prev.filter(p => p._id !== modal.project._id));
      setModal(null);
    } catch {
      Alert.alert('Error', 'Failed to delete project.');
    } finally { setSaving(false); }
  }

  const statusCount = { all: projects.length };
  projects.forEach(p => {
    const st = p.status || 'IN_PROGRESS';
    statusCount[st] = (statusCount[st] || 0) + 1;
  });

  const FILTERS = [
    { key: 'all', label: 'All Statuses' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const total      = projects.length;
  const inProgress = projects.filter(p => p.status !== 'COMPLETED').length;
  const completed  = projects.filter(p => p.status === 'COMPLETED').length;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>DEPARTMENT</Text>
          <Text style={s.headerTitle}>Projects</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setModal({ type: 'add' })}
        >
          <Plus size={14} color="#0f172a" strokeWidth={2.5} />
          <Text style={s.addBtnText}>NEW PROJECT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}
      >
        {/* Stat cards */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>TOTAL PROJECTS</Text>
            <Text style={s.statValue}>{loading ? '—' : total}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>IN PROGRESS</Text>
            <Text style={[s.statValue, { color: '#47c8ff' }]}>{loading ? '—' : inProgress}</Text>
          </View>
        </View>
        <View style={[s.statsRow, { marginTop: 10 }]}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>COMPLETED</Text>
            <Text style={[s.statValue, { color: '#47ff8a' }]}>{loading ? '—' : completed}</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: 'transparent', borderWidth: 0 }]} />
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Search size={14} color="#6b7280" />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search projects or managers..."
              placeholderTextColor="#4b5563"
            />
          </View>
          <View style={s.filterPicker}>
            <ChevronDown size={12} color="#9ca3af" />
            <Text style={s.filterText}>{FILTERS.find(f => f.key === filter)?.label}</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[s.chip, filter === f.key && s.chipActive]}
            >
              <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {loading ? (
          <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <FolderKanban size={32} color="#374151" />
            <Text style={s.emptyText}>No projects found</Text>
          </View>
        ) : (
          filtered.map(project => {
            const lead = users.find(u => {
              const ids = project.managerIds || [];
              return ids.includes(u._id);
            });
            const contributors = (project.developerIds || []).length;

            return (
              <View key={project._id} style={s.projectCard}>
                <View style={s.projectCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.projectName}>{project.name}</Text>
                    <Text style={s.projectDesc} numberOfLines={1}>
                      {project.description || 'No description'}
                    </Text>
                  </View>
                  <StatusBadge status={project.status} />
                </View>

                <View style={s.divider} />

                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => setModal({ type: 'edit', project })}
                >
                  <Pencil size={13} color="#9ca3af" />
                  <Text style={s.editBtnText}>EDIT</Text>
                </TouchableOpacity>

                <View style={s.divider} />

                <View style={s.projectMeta}>
                  <Text style={s.metaLabel}>LEAD</Text>
                  <Text style={s.metaValue}>{lead?.name || 'No lead assigned'}</Text>
                </View>
                <View style={s.projectMeta}>
                  <Text style={s.metaLabel}>CONTRIBUTORS</Text>
                  <Text style={s.metaValue}>{contributors} members</Text>
                </View>
                <View style={s.projectMeta}>
                  <Text style={s.metaLabel}>REVIEWERS</Text>
                  <Text style={s.metaValue}>
                    {(project.testerIds || []).length > 0 ? `${project.testerIds.length} reviewer(s)` : 'None'}
                  </Text>
                </View>

                {(project.startDate || project.endDate) && (
                  <View style={s.timeline}>
                    <Text style={s.timelineLabel}>TIMELINE</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Calendar size={12} color="#6b7280" />
                      <Text style={s.timelineText}>
                        {fmt(project.startDate)} → {project.endDate ? fmt(project.endDate) : '—'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Delete */}
                <TouchableOpacity
                  style={s.deleteRowBtn}
                  onPress={() => setModal({ type: 'delete', project })}
                >
                  <Trash2 size={13} color="#ff4747" />
                  <Text style={s.deleteRowText}>DELETE</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {modal?.type === 'add' && (
        <ProjectModal mode="add" users={users} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
      {modal?.type === 'edit' && (
        <ProjectModal mode="edit" initial={modal.project} users={users} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal project={modal.project} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d0d' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:       { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: -0.3 },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2573e6', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#adc6ff' },
  addBtnText:      { fontSize: 11, fontWeight: '800', color: '#0f172a', letterSpacing: 0.8 },

  statsRow:        { flexDirection: 'row', gap: 10 },
  statCard:        { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 16 },
  statLabel:       { fontSize: 9, color: '#6b7280', letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  statValue:       { fontSize: 28, fontWeight: '800', color: '#ffffff' },

  searchRow:       { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 10 },
  searchBox:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8 },
  searchInput:     { flex: 1, fontSize: 12, color: '#e5e7eb' },
  filterPicker:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8 },
  filterText:      { fontSize: 11, color: '#9ca3af' },

  chip:            { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive:      { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:        { fontSize: 10, color: '#9ca3af', fontWeight: '700', letterSpacing: 0.6 },
  chipTextActive:  { color: '#2573e6' },

  projectCard:     { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', marginBottom: 12, padding: 16 },
  projectCardTop:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  projectName:     { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  projectDesc:     { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  badgeText:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  divider:         { height: 1, backgroundColor: '#1f2937', marginVertical: 10 },
  editBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderWidth: 1, borderColor: '#1f2937' },
  editBtnText:     { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 0.8 },
  projectMeta:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel:       { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 0.8 },
  metaValue:       { fontSize: 12, color: '#e5e7eb', fontWeight: '500' },
  timeline:        { marginTop: 4 },
  timelineLabel:   { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1 },
  timelineText:    { fontSize: 11, color: '#9ca3af' },
  deleteRowBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1f2937' },
  deleteRowText:   { fontSize: 10, color: '#ff4747', fontWeight: '700', letterSpacing: 0.8 },

  empty:           { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:       { fontSize: 13, color: '#4b5563', letterSpacing: 0.5 },

  // Modal
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '90%' },
  sheetHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:      { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  sheetBody:       { padding: 16 },
  sheetFooter:     { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' },
  fieldLabel:      { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 12 },
  input:           { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  textArea:        { minHeight: 80, textAlignVertical: 'top' },
  statusRow:       { flexDirection: 'row', gap: 8 },
  statusChip:      { flex: 1, borderWidth: 1, borderColor: '#1f2937', paddingVertical: 8, alignItems: 'center' },
  statusChipActive: { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  statusChipText:  { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 0.5 },
  statusChipTextActive: { color: '#2573e6' },
  errorBox:        { backgroundColor: '#ff474720', borderWidth: 1, borderColor: '#ff4747', padding: 10, marginBottom: 4 },
  errorText:       { fontSize: 11, color: '#ff4747' },
  cancelBtn:       { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:   { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
  saveBtn:         { flex: 1, paddingVertical: 12, backgroundColor: '#2573e6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:     { fontSize: 11, color: '#ffffff', fontWeight: '700', letterSpacing: 1 },
  deleteSubText:   { fontSize: 12, color: '#9ca3af' },
  deleteName:      { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  deleteWarning:   { fontSize: 11, color: '#6b7280' },
});
