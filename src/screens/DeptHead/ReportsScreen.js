import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Plus, Search, X, Check, Pencil, Trash2, Eye, ChevronDown } from 'lucide-react-native';
import { getMyReports, getReports, createReport, updateReport, deleteReport, getProjects } from '../../api/services';
import useAuthStore from '../../store/authStore';

const UPDATE_TYPES = [
  { key: 'call',      label: 'Call',            color: '#47c8ff' },
  { key: 'email',     label: 'Email',           color: '#e879a0' },
  { key: 'demo',      label: 'Demo',            color: '#e8a847' },
  { key: 'whatsapp',  label: 'WhatsApp Update', color: '#47ff8a' },
  { key: 'review',    label: 'Review Meeting',  color: '#f87343' },
];

function TypeBadge({ typeKey }) {
  const m = UPDATE_TYPES.find(t => t.key === typeKey) || { label: typeKey, color: '#9ca3af' };
  return (
    <View style={{ backgroundColor: m.color + '25', borderWidth: 1, borderColor: m.color + '50', paddingHorizontal: 7, paddingVertical: 3 }}>
      <Text style={{ fontSize: 9, fontWeight: '800', color: m.color, textTransform: 'uppercase', letterSpacing: 0.4 }}>{m.label}</Text>
    </View>
  );
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalize(r) {
  const proj = r.projectId;
  const creator = r.createdBy;
  return {
    id: r._id ?? r.id,
    types: r.types ?? [],
    projectId: typeof proj === 'object' ? proj?._id : (proj ?? ''),
    projectName: typeof proj === 'object' ? proj?.name : '',
    createdByName: typeof creator === 'object' ? creator?.name : '',
    date: r.date ? new Date(r.date).toISOString().slice(0, 10) : '',
    notes: r.notes ?? '',
    clientResponse: r.clientResponse ?? '',
    weeklyIncluded: r.weeklyIncluded ?? false,
    monthlyIncluded: r.monthlyIncluded ?? false,
  };
}

function ReportModal({ initial, projects, onClose, onSave, saving }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    types: initial?.types ?? [],
    projectId: initial?.projectId ?? '',
    date: initial?.date ?? today,
    notes: initial?.notes ?? '',
    clientResponse: initial?.clientResponse ?? '',
    weeklyIncluded: initial?.weeklyIncluded ?? false,
    monthlyIncluded: initial?.monthlyIncluded ?? false,
  });
  const [err, setErr] = useState('');

  function handleSubmit() {
    if (!form.types.length) { setErr('Select at least one update type.'); return; }
    setErr('');
    onSave(form);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={rep.overlay}>
        <View style={rep.sheet}>
          <View style={rep.sheetHeader}>
            <Text style={rep.sheetTitle}>{initial ? 'EDIT REPORT' : 'ADD REPORT'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {!!err && <View style={rep.errorBox}><Text style={rep.errorText}>{err}</Text></View>}

            <Text style={rep.label}>Update Type *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {UPDATE_TYPES.map(t => {
                const selected = form.types.includes(t.key);
                return (
                  <TouchableOpacity key={t.key} onPress={() => setForm(prev => ({ ...prev, types: selected ? prev.types.filter(k => k !== t.key) : [...prev.types, t.key] }))}
                    style={{ borderWidth: 1, borderColor: selected ? t.color : '#1f2937', backgroundColor: selected ? t.color + '20' : 'transparent', paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 10, color: selected ? t.color : '#9ca3af', fontWeight: '700' }}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={rep.label}>Project</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity onPress={() => setForm({ ...form, projectId: '' })} style={[rep.chip, !form.projectId && rep.chipActive]}>
                <Text style={[rep.chipText, !form.projectId && rep.chipTextActive]}>None</Text>
              </TouchableOpacity>
              {projects.map(p => (
                <TouchableOpacity key={p._id} onPress={() => setForm({ ...form, projectId: p._id })} style={[rep.chip, form.projectId === p._id && rep.chipActive]}>
                  <Text style={[rep.chipText, form.projectId === p._id && rep.chipTextActive]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={rep.label}>Notes / Update</Text>
            <TextInput style={[rep.input, { minHeight: 70, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} placeholder="What was discussed or done..." placeholderTextColor="#4b5563" multiline />

            <Text style={rep.label}>Client Response</Text>
            <TextInput style={[rep.input, { minHeight: 50, textAlignVertical: 'top' }]} value={form.clientResponse} onChangeText={v => setForm({ ...form, clientResponse: v })} placeholder="Client's response or feedback..." placeholderTextColor="#4b5563" multiline />

            <Text style={rep.label}>Weekly / Monthly</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[['weeklyIncluded', 'Weekly Report'], ['monthlyIncluded', 'Monthly Report']].map(([field, label]) => (
                <TouchableOpacity key={field} onPress={() => setForm({ ...form, [field]: !form[field] })} style={{ flex: 1, borderWidth: 1, borderColor: form[field] ? '#47ff8a' : '#1f2937', backgroundColor: form[field] ? '#47ff8a18' : 'transparent', paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: form[field] ? '#47ff8a' : '#9ca3af', fontWeight: '700' }}>{label}: {form[field] ? 'YES' : 'NO'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 8 }} />
          </ScrollView>
          <View style={rep.footer}>
            <TouchableOpacity style={rep.cancelBtn} onPress={onClose} disabled={saving}><Text style={rep.cancelText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity style={[rep.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Check size={14} color="#fff" /><Text style={rep.saveText}>{initial ? 'SAVE CHANGES' : 'ADD REPORT'}</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReportDetailModal({ report, onClose }) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={rep.overlay}>
        <View style={rep.sheet}>
          <View style={rep.sheetHeader}>
            <Text style={rep.sheetTitle}>REPORT DETAILS</Text>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
              <View style={[rep.infoBox, { flex: 1 }]}><Text style={rep.infoLabel}>DATE</Text><Text style={rep.infoValue}>{fmt(report.date)}</Text></View>
              {report.projectName && <View style={[rep.infoBox, { flex: 1 }]}><Text style={rep.infoLabel}>PROJECT</Text><Text style={rep.infoValue}>{report.projectName}</Text></View>}
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={rep.infoLabel}>UPDATE TYPE</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {report.types.map(t => <TypeBadge key={t} typeKey={t} />)}
              </View>
            </View>
            <View style={rep.infoBox}>
              <Text style={rep.infoLabel}>NOTES / UPDATE</Text>
              <Text style={[rep.infoValue, { marginTop: 4, color: '#9ca3af', lineHeight: 18 }]}>{report.notes || '—'}</Text>
            </View>
            <View style={[rep.infoBox, { marginTop: 10 }]}>
              <Text style={rep.infoLabel}>CLIENT RESPONSE</Text>
              <Text style={[rep.infoValue, { marginTop: 4, color: '#9ca3af', lineHeight: 18 }]}>{report.clientResponse || '—'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              {[['weeklyIncluded', 'Weekly Report'], ['monthlyIncluded', 'Monthly Report']].map(([field, label]) => (
                <View key={field} style={[rep.infoBox, { flex: 1 }]}>
                  <Text style={rep.infoLabel}>{label.toUpperCase()}</Text>
                  <View style={{ borderWidth: 1, borderColor: report[field] ? '#47ff8a40' : '#ff474740', backgroundColor: report[field] ? '#47ff8a18' : '#ff474718', paddingHorizontal: 8, paddingVertical: 4, marginTop: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: report[field] ? '#47ff8a' : '#ff4747' }}>{report[field] ? 'YES' : 'NO'}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' }}>
            <TouchableOpacity style={rep.closeBtn} onPress={onClose}><Text style={rep.closeBtnText}>CLOSE</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ReportsScreen() {
  const [myReports, setMyReports]   = useState([]);
  const [deptReports, setDeptReports] = useState([]);
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [activeTab, setActiveTab]   = useState('department');
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null); // null | {type:'add'} | {type:'edit', report} | {type:'view', report}

  const load = useCallback(async () => {
    try {
      const [my, dept, p] = await Promise.allSettled([getMyReports(), getReports(), getProjects()]);
      setMyReports(my.status === 'fulfilled' ? my.value.map(normalize) : []);
      setDeptReports(dept.status === 'fulfilled' ? dept.value.map(normalize) : []);
      setProjects(p.status === 'fulfilled' ? p.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    try {
      setSaving(true);
      if (modal.type === 'edit') {
        const updated = await updateReport(modal.report.id, form);
        setMyReports(prev => prev.map(r => r.id === modal.report.id ? { ...normalize(updated), projectName: projects.find(p => p._id === form.projectId)?.name || '' } : r));
      } else {
        const created = await createReport(form);
        setMyReports(prev => [{ ...normalize(created), projectName: projects.find(p => p._id === form.projectId)?.name || '' }, ...prev]);
      }
      setModal(null);
    } catch (e) { Alert.alert('Error', 'Failed to save report.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(report) {
    Alert.alert('Delete Report', 'Delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteReport(report.id); setMyReports(prev => prev.filter(r => r.id !== report.id)); }
          catch { Alert.alert('Error', 'Failed to delete report.'); }
        }
      },
    ]);
  }

  const activeList = activeTab === 'department' ? deptReports : myReports;
  const filtered = activeList.filter(r => !search || r.notes?.toLowerCase().includes(search.toLowerCase()) || r.projectName?.toLowerCase().includes(search.toLowerCase()));

  const stats = { total: activeList.length, weekly: activeList.filter(r => r.weeklyIncluded).length, monthly: activeList.filter(r => r.monthlyIncluded).length };

  return (
    <SafeAreaView style={rep.safe} edges={['bottom']}>
      <View style={rep.header}>
        <View>
          <Text style={rep.headerSub}>DEPARTMENT</Text>
          <Text style={rep.headerTitle}>Reports</Text>
        </View>
        {activeTab === 'mine' && (
          <TouchableOpacity style={rep.addBtn} onPress={() => setModal({ type: 'add' })}>
            <Plus size={14} color="#0f172a" strokeWidth={2.5} />
            <Text style={rep.addBtnText}>ADD REPORT</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1f2937', marginBottom: 14 }}>
          {[{ key: 'department', label: `Dept Reports (${deptReports.length})` }, { key: 'mine', label: `My Reports (${myReports.length})` }].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)} style={[rep.tab, activeTab === t.key && rep.tabActive]}>
              <Text style={[rep.tabText, activeTab === t.key && rep.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[{ label: 'TOTAL', value: stats.total, color: '#e5e7eb' }, { label: 'IN WEEKLY', value: stats.weekly, color: '#47ff8a' }, { label: 'IN MONTHLY', value: stats.monthly, color: '#e8a847' }].map(s => (
            <View key={s.label} style={rep.statCard}>
              <Text style={rep.statLabel}>{s.label}</Text>
              <Text style={[rep.statValue, { color: s.color }]}>{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={rep.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={rep.searchInput} value={search} onChangeText={setSearch} placeholder="Search notes, project..." placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={rep.empty}><FileText size={32} color="#374151" /><Text style={rep.emptyText}>No reports found</Text></View> :
         filtered.map(r => (
           <View key={r.id} style={rep.card}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
               <View style={{ flex: 1 }}>
                 <Text style={rep.cardDate}>{fmt(r.date)}</Text>
                 {r.projectName && <Text style={rep.cardProj}>{r.projectName}</Text>}
                 {r.createdByName && <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>By: {r.createdByName}</Text>}
               </View>
               <View style={{ gap: 6, alignItems: 'flex-end' }}>
                 <View style={{ flexDirection: 'row', gap: 8 }}>
                   <TouchableOpacity onPress={() => setModal({ type: 'view', report: r })}><Eye size={13} color="#6b7280" /></TouchableOpacity>
                   {activeTab === 'mine' && <><TouchableOpacity onPress={() => setModal({ type: 'edit', report: r })}><Pencil size={13} color="#6b7280" /></TouchableOpacity>
                   <TouchableOpacity onPress={() => handleDelete(r)}><Trash2 size={13} color="#ff4747" /></TouchableOpacity></>}
                 </View>
               </View>
             </View>
             <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
               {r.types.map(t => <TypeBadge key={t} typeKey={t} />)}
             </View>
             {r.notes && <Text style={rep.cardNotes} numberOfLines={2}>{r.notes}</Text>}
             <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
               {r.weeklyIncluded && <View style={{ backgroundColor: '#47ff8a18', borderWidth: 1, borderColor: '#47ff8a40', paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, color: '#47ff8a', fontWeight: '700' }}>WEEKLY</Text></View>}
               {r.monthlyIncluded && <View style={{ backgroundColor: '#e8a84718', borderWidth: 1, borderColor: '#e8a84740', paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, color: '#e8a847', fontWeight: '700' }}>MONTHLY</Text></View>}
             </View>
           </View>
         ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <ReportModal initial={modal.report} projects={projects} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
      {modal?.type === 'view' && <ReportDetailModal report={modal.report} onClose={() => setModal(null)} />}
    </SafeAreaView>
  );
}

const rep = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2573e6', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#adc6ff' },
  addBtnText:   { fontSize: 11, fontWeight: '800', color: '#0f172a', letterSpacing: 0.8 },
  tab:          { paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: '#2573e6' },
  tabText:      { fontSize: 11, color: '#6b7280', fontWeight: '700', letterSpacing: 0.8 },
  tabTextActive:{ color: '#2573e6' },
  statCard:     { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 10 },
  statLabel:    { fontSize: 8, color: '#6b7280', letterSpacing: 1, fontWeight: '700', marginBottom: 3 },
  statValue:    { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 12, color: '#e5e7eb' },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 11, paddingVertical: 6, marginRight: 6 },
  chipActive:   { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  chipTextActive:{ color: '#2573e6' },
  card:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  cardDate:     { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  cardProj:     { fontSize: 11, color: '#6b7280', marginTop: 2 },
  cardNotes:    { fontSize: 12, color: '#9ca3af', lineHeight: 17 },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '92%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:   { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  footer:       { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' },
  label:        { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 10 },
  input:        { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  errorBox:     { backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff4747', padding: 10, marginBottom: 8 },
  errorText:    { fontSize: 11, color: '#ff4747' },
  cancelBtn:    { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
  saveBtn:      { flex: 1, paddingVertical: 12, backgroundColor: '#2573e6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveText:     { fontSize: 11, color: '#ffffff', fontWeight: '700', letterSpacing: 1 },
  infoBox:      { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', padding: 10 },
  infoLabel:    { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  infoValue:    { fontSize: 13, color: '#e5e7eb', fontWeight: '600' },
  closeBtn:     { paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center' },
  closeBtnText: { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
});
