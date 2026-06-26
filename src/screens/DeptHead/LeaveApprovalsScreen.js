import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Umbrella, Search, X, Check, Calendar } from 'lucide-react-native';
import { getLeaveApprovals, reviewLeave } from '../../api/services';

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#e8a847', bg: '#e8a84718' },
  approved: { label: 'Approved', color: '#47ff8a', bg: '#47ff8a18' },
  rejected: { label: 'Rejected', color: '#ff4747', bg: '#ff474718' },
};
const LEAVE_TYPES = {
  sick:       'Sick Leave',
  casual:     'Casual Leave',
  annual:     'Annual Leave',
  maternity:  'Maternity Leave',
  paternity:  'Paternity Leave',
  unpaid:     'Unpaid Leave',
};

function Badge({ status }) {
  const m = STATUS_META[status?.toLowerCase()] || STATUS_META.pending;
  return (
    <View style={{ backgroundColor: m.bg, borderWidth: 1, borderColor: m.color + '40', paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: m.color }}>{m.label}</Text>
    </View>
  );
}

function ReviewModal({ leave, onClose, onReview }) {
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  async function handle(action) {
    setSaving(true);
    try { await onReview(leave._id, action, remarks); onClose(); }
    catch {} finally { setSaving(false); }
  }

  const emp = leave.userId?.name || leave.employeeName || 'Employee';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ls.overlay}>
        <View style={ls.sheet}>
          <View style={ls.sheetHeader}>
            <Text style={ls.sheetTitle}>LEAVE REVIEW</Text>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={ls.infoRow}><Text style={ls.infoLabel}>EMPLOYEE</Text><Text style={ls.infoValue}>{emp}</Text></View>
            <View style={ls.infoRow}><Text style={ls.infoLabel}>LEAVE TYPE</Text><Text style={ls.infoValue}>{LEAVE_TYPES[leave.leaveType] || leave.leaveType}</Text></View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[ls.infoRow, { flex: 1 }]}><Text style={ls.infoLabel}>FROM</Text><Text style={ls.infoValue}>{fmt(leave.startDate)}</Text></View>
              <View style={[ls.infoRow, { flex: 1 }]}><Text style={ls.infoLabel}>TO</Text><Text style={ls.infoValue}>{fmt(leave.endDate)}</Text></View>
            </View>
            <View style={ls.infoRow}><Text style={ls.infoLabel}>REASON</Text><Text style={ls.infoValue}>{leave.reason || '—'}</Text></View>
            <Text style={ls.label}>Approver Remarks (optional)</Text>
            <TextInput style={[ls.input, { minHeight: 60, textAlignVertical: 'top' }]} value={remarks} onChangeText={setRemarks} placeholder="Add remarks..." placeholderTextColor="#4b5563" multiline />
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' }}>
            <TouchableOpacity style={[ls.cancelBtn, { flex: 1 }]} onPress={onClose}><Text style={ls.cancelText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handle('reject')} disabled={saving} style={{ flex: 1, paddingVertical: 12, backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff4747', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#ff4747', fontWeight: '700' }}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handle('approve')} disabled={saving} style={{ flex: 1, paddingVertical: 12, backgroundColor: '#47ff8a18', borderWidth: 1, borderColor: '#47ff8a', alignItems: 'center', justifyContent: 'center' }}>
              {saving ? <ActivityIndicator size="small" color="#47ff8a" /> : <Text style={{ fontSize: 11, color: '#47ff8a', fontWeight: '700' }}>APPROVE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function LeaveApprovalsScreen() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const { records: r } = await getLeaveApprovals({ limit: 100 });
      setRecords(r || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleReview(id, action, remarks) {
    const updated = await reviewLeave(id, action, remarks);
    setRecords(prev => prev.map(r => r._id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r));
  }

  const filtered = records.filter(r => {
    const name = r.userId?.name || r.employeeName || '';
    const matchS = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchF = statusF === 'all' || r.status?.toLowerCase() === statusF;
    return matchS && matchF;
  });

  const pending  = records.filter(r => !r.status || r.status === 'pending').length;
  const approved = records.filter(r => r.status === 'approved').length;

  return (
    <SafeAreaView style={ls.safe} edges={['bottom']}>
      <View style={ls.header}>
        <View>
          <Text style={ls.headerSub}>DEPARTMENT</Text>
          <Text style={ls.headerTitle}>Leave Approvals</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[{ label: 'PENDING', value: pending, color: '#e8a847' }, { label: 'APPROVED', value: approved, color: '#47ff8a' }].map(s => (
            <View key={s.label} style={ls.statCard}>
              <Text style={ls.statLabel}>{s.label}</Text>
              <Text style={[ls.statValue, { color: s.color }]}>{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>

        <View style={ls.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={ls.searchInput} value={search} onChangeText={setSearch} placeholder="Search employee..." placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <TouchableOpacity key={f} onPress={() => setStatusF(f)} style={[ls.chip, statusF === f && ls.chipActive]}>
              <Text style={[ls.chipText, statusF === f && ls.chipTextActive]}>{f === 'all' ? 'All' : STATUS_META[f]?.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={ls.empty}><Umbrella size={32} color="#374151" /><Text style={ls.emptyText}>No leave requests</Text></View> :
         filtered.map(r => {
           const name = r.userId?.name || r.employeeName || 'Employee';
           return (
             <TouchableOpacity key={r._id} style={ls.card} onPress={() => setSelected(r)}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                 <View style={{ flex: 1 }}>
                   <Text style={ls.cardName}>{name}</Text>
                   <Text style={ls.cardType}>{LEAVE_TYPES[r.leaveType] || r.leaveType}</Text>
                 </View>
                 <Badge status={r.status} />
               </View>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                 <Calendar size={11} color="#6b7280" />
                 <Text style={ls.cardDate}>{fmt(r.startDate)} → {fmt(r.endDate)}</Text>
               </View>
               {(!r.status || r.status === 'pending') && (
                 <Text style={{ fontSize: 10, color: '#2573e6', fontWeight: '700', marginTop: 8 }}>Tap to review →</Text>
               )}
             </TouchableOpacity>
           );
         })}
        <View style={{ height: 32 }} />
      </ScrollView>

      {selected && <ReviewModal leave={selected} onClose={() => setSelected(null)} onReview={handleReview} />}
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
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
  cardType:     { fontSize: 11, color: '#6b7280', marginTop: 2 },
  cardDate:     { fontSize: 12, color: '#9ca3af' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '85%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:   { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  infoRow:      { marginBottom: 12 },
  infoLabel:    { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  infoValue:    { fontSize: 13, color: '#e5e7eb', fontWeight: '600' },
  label:        { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 4 },
  input:        { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  cancelBtn:    { paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
});
