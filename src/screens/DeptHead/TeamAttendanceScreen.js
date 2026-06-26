import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users2, Search, X, Check, ChevronDown, Calendar, Clock, MapPin } from 'lucide-react-native';
import { getAllAttendance, updateApprovalStatus } from '../../api/services';

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#e8a847', bg: '#e8a84718' },
  approved: { label: 'Approved', color: '#47ff8a', bg: '#47ff8a18' },
  rejected: { label: 'Rejected', color: '#ff4747', bg: '#ff474718' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status?.toLowerCase()] || STATUS_META.pending;
  return (
    <View style={{ backgroundColor: m.bg, borderWidth: 1, borderColor: m.color + '40', paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: m.color }}>{m.label}</Text>
    </View>
  );
}

function ReviewModal({ record, onClose, onReview }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handle(action) {
    setSaving(true);
    try { await onReview(record._id, action, notes); onClose(); }
    catch {} finally { setSaving(false); }
  }

  const employee = record.userId?.name || record.employeeName || 'Employee';
  const punchIn  = record.punchIn?.time || record.checkIn;
  const punchOut = record.punchOut?.time || record.checkOut;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ats.overlay}>
        <View style={ats.sheet}>
          <View style={ats.sheetHeader}>
            <Text style={ats.sheetTitle}>ATTENDANCE REVIEW</Text>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={ats.infoBlock}>
              <Text style={ats.infoLabel}>EMPLOYEE</Text>
              <Text style={ats.infoValue}>{employee}</Text>
            </View>
            <View style={ats.infoBlock}>
              <Text style={ats.infoLabel}>DATE</Text>
              <Text style={ats.infoValue}>{fmtDate(record.date || record.created_at)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[ats.infoBlock, { flex: 1 }]}>
                <Text style={ats.infoLabel}>PUNCH IN</Text>
                <Text style={ats.infoValue}>{fmt(punchIn)}</Text>
              </View>
              <View style={[ats.infoBlock, { flex: 1 }]}>
                <Text style={ats.infoLabel}>PUNCH OUT</Text>
                <Text style={ats.infoValue}>{punchOut ? fmt(punchOut) : '—'}</Text>
              </View>
            </View>
            {record.punchIn?.address && (
              <View style={ats.infoBlock}>
                <Text style={ats.infoLabel}>LOCATION</Text>
                <Text style={ats.infoValue}>{record.punchIn.address}</Text>
              </View>
            )}
            <Text style={ats.label}>Notes (optional)</Text>
            <TextInput style={[ats.input, { minHeight: 60, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Add review notes..." placeholderTextColor="#4b5563" multiline />
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' }}>
            <TouchableOpacity style={[ats.cancelBtn, { flex: 1 }]} onPress={onClose}><Text style={ats.cancelText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handle('rejected')} disabled={saving} style={{ flex: 1, paddingVertical: 12, backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff4747', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, color: '#ff4747', fontWeight: '700', letterSpacing: 0.8 }}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handle('approved')} disabled={saving} style={{ flex: 1, paddingVertical: 12, backgroundColor: '#47ff8a18', borderWidth: 1, borderColor: '#47ff8a', alignItems: 'center', justifyContent: 'center' }}>
              {saving ? <ActivityIndicator size="small" color="#47ff8a" /> : <Text style={{ fontSize: 11, color: '#47ff8a', fontWeight: '700', letterSpacing: 0.8 }}>APPROVE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TeamAttendanceScreen() {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('all');
  const [selected, setSelected]   = useState(null);

  const load = useCallback(async () => {
    try {
      const { records: r } = await getAllAttendance({ limit: 100 });
      setRecords(r || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleReview(id, action, notes) {
    const updated = await updateApprovalStatus(id, action, notes);
    setRecords(prev => prev.map(r => r._id === id ? { ...r, approvalStatus: action } : r));
  }

  const FILTERS = [{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }];

  const filtered = records.filter(r => {
    const name = r.userId?.name || r.employeeName || '';
    const matchS = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchF = statusF === 'all' || r.approvalStatus?.toLowerCase() === statusF;
    return matchS && matchF;
  });

  const counts = {
    present: records.filter(r => r.approvalStatus === 'approved').length,
    pending: records.filter(r => !r.approvalStatus || r.approvalStatus === 'pending').length,
  };

  return (
    <SafeAreaView style={ats.safe} edges={['bottom']}>
      <View style={ats.header}>
        <View>
          <Text style={ats.headerSub}>DEPARTMENT</Text>
          <Text style={ats.headerTitle}>Team Attendance</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[{ label: 'APPROVED', value: counts.present, color: '#47ff8a' }, { label: 'PENDING REVIEW', value: counts.pending, color: '#e8a847' }].map(s => (
            <View key={s.label} style={ats.statCard}>
              <Text style={ats.statLabel}>{s.label}</Text>
              <Text style={[ats.statValue, { color: s.color }]}>{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={ats.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={ats.searchInput} value={search} onChangeText={setSearch} placeholder="Search employee..." placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setStatusF(f.key)} style={[ats.chip, statusF === f.key && ats.chipActive]}>
              <Text style={[ats.chipText, statusF === f.key && ats.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={ats.empty}><Users2 size={32} color="#374151" /><Text style={ats.emptyText}>No attendance records</Text></View> :
         filtered.map(r => {
           const name = r.userId?.name || r.employeeName || 'Employee';
           const punchIn  = r.punchIn?.time || r.checkIn;
           const punchOut = r.punchOut?.time || r.checkOut;
           const status   = r.approvalStatus || 'pending';
           return (
             <TouchableOpacity key={r._id} style={ats.card} onPress={() => setSelected(r)}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <View style={{ flex: 1 }}>
                   <Text style={ats.cardName}>{name}</Text>
                   <Text style={ats.cardDate}>{fmtDate(r.date || r.created_at)}</Text>
                 </View>
                 <StatusBadge status={status} />
               </View>
               <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                   <Clock size={11} color="#6b7280" />
                   <Text style={ats.timeText}>In: {fmt(punchIn)}</Text>
                 </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                   <Clock size={11} color="#6b7280" />
                   <Text style={ats.timeText}>Out: {punchOut ? fmt(punchOut) : '—'}</Text>
                 </View>
               </View>
               {status === 'pending' && (
                 <Text style={{ fontSize: 10, color: '#2573e6', fontWeight: '700', marginTop: 8 }}>Tap to review →</Text>
               )}
             </TouchableOpacity>
           );
         })}
        <View style={{ height: 32 }} />
      </ScrollView>

      {selected && <ReviewModal record={selected} onClose={() => setSelected(null)} onReview={handleReview} />}
    </SafeAreaView>
  );
}

const ats = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  statCard:     { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  statLabel:    { fontSize: 8, color: '#6b7280', letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  statValue:    { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchInput:  { flex: 1, fontSize: 12, color: '#e5e7eb' },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive:   { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700', letterSpacing: 0.6 },
  chipTextActive:{ color: '#2573e6' },
  card:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  cardName:     { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  cardDate:     { fontSize: 11, color: '#6b7280', marginTop: 2 },
  timeText:     { fontSize: 12, color: '#9ca3af' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '85%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:   { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  infoBlock:    { marginBottom: 12 },
  infoLabel:    { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  infoValue:    { fontSize: 13, color: '#e5e7eb', fontWeight: '600' },
  label:        { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 4 },
  input:        { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  cancelBtn:    { paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
});
