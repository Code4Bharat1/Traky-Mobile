import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Search, X, Check, Plus, AlertCircle } from 'lucide-react-native';
import { getMyExpenses, submitExpense, reviewExpense } from '../../api/services';

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#e8a847', bg: '#e8a84718' },
  approved: { label: 'Approved', color: '#47ff8a', bg: '#47ff8a18' },
  rejected: { label: 'Rejected', color: '#ff4747', bg: '#ff474718' },
  paid:     { label: 'Paid',     color: '#47c8ff', bg: '#47c8ff18' },
};

const CATEGORIES = ['travel', 'food', 'accommodation', 'equipment', 'training', 'other'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'upi'];

function Badge({ status }) {
  const m = STATUS_META[status?.toLowerCase()] || STATUS_META.pending;
  return (
    <View style={{ backgroundColor: m.bg, borderWidth: 1, borderColor: m.color + '40', paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: m.color }}>{m.label}</Text>
    </View>
  );
}

function SubmitModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', category: 'travel', amount: '', expenseDate: new Date().toISOString().slice(0, 10), description: '', paymentMethod: 'cash' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit() {
    if (!form.title.trim() || !form.amount) { setErr('Title and amount are required.'); return; }
    if (isNaN(parseFloat(form.amount))) { setErr('Amount must be a number.'); return; }
    setErr('');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { setErr(e?.response?.data?.message || 'Failed to submit expense.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={exp.overlay}>
        <View style={exp.sheet}>
          <View style={exp.sheetHeader}>
            <Text style={exp.sheetTitle}>SUBMIT EXPENSE</Text>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {!!err && <View style={exp.errorBox}><AlertCircle size={12} color="#ff4747" /><Text style={exp.errorText}>{err}</Text></View>}
            <Text style={exp.label}>Title *</Text>
            <TextInput style={exp.input} value={form.title} onChangeText={v => setForm({ ...form, title: v })} placeholder="e.g. Flight to Delhi" placeholderTextColor="#4b5563" />
            <Text style={exp.label}>Amount (₹) *</Text>
            <TextInput style={exp.input} value={form.amount} onChangeText={v => setForm({ ...form, amount: v })} placeholder="0.00" placeholderTextColor="#4b5563" keyboardType="numeric" />
            <Text style={exp.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setForm({ ...form, category: c })} style={[exp.chip, form.category === c && exp.chipActive]}>
                  <Text style={[exp.chipText, form.category === c && exp.chipTextActive]}>{c.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={exp.label}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity key={m} onPress={() => setForm({ ...form, paymentMethod: m })} style={[exp.chip, form.paymentMethod === m && exp.chipActive]}>
                  <Text style={[exp.chipText, form.paymentMethod === m && exp.chipTextActive]}>{m.replace('_', ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={exp.label}>Description</Text>
            <TextInput style={[exp.input, { minHeight: 60, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="Additional details..." placeholderTextColor="#4b5563" multiline />
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={exp.footer}>
            <TouchableOpacity style={exp.cancelBtn} onPress={onClose}><Text style={exp.cancelText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity style={[exp.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Check size={14} color="#fff" /><Text style={exp.saveText}>SUBMIT</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ExpensesScreen() {
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('all');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyExpenses({ limit: 100 });
      const arr = data?.expenses || data?.records || (Array.isArray(data) ? data : []);
      setExpenses(arr);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSubmit(form) {
    await submitExpense(form);
    load();
  }

  const FILTERS = ['all', 'pending', 'approved', 'rejected', 'paid'];

  const filtered = expenses.filter(e => {
    const matchS = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchF = statusF === 'all' || e.status?.toLowerCase() === statusF;
    return matchS && matchF;
  });

  const total   = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const pending = expenses.filter(e => e.status === 'pending').length;

  return (
    <SafeAreaView style={exp.safe} edges={['bottom']}>
      <View style={exp.header}>
        <View>
          <Text style={exp.headerSub}>DEPARTMENT</Text>
          <Text style={exp.headerTitle}>Expenses</Text>
        </View>
        <TouchableOpacity style={exp.addBtn} onPress={() => setShowModal(true)}>
          <Plus size={14} color="#0f172a" strokeWidth={2.5} />
          <Text style={exp.addBtnText}>SUBMIT EXPENSE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <View style={exp.statCard}>
            <Text style={exp.statLabel}>TOTAL AMOUNT</Text>
            <Text style={[exp.statValue, { color: '#47c8ff' }]}>₹{loading ? '—' : total.toFixed(2)}</Text>
          </View>
          <View style={exp.statCard}>
            <Text style={exp.statLabel}>PENDING</Text>
            <Text style={[exp.statValue, { color: '#e8a847' }]}>{loading ? '—' : pending}</Text>
          </View>
        </View>

        <View style={exp.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={exp.searchInput} value={search} onChangeText={setSearch} placeholder="Search expenses..." placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setStatusF(f)} style={[exp.chip, statusF === f && exp.chipActive]}>
              <Text style={[exp.chipText, statusF === f && exp.chipTextActive]}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={exp.empty}><CreditCard size={32} color="#374151" /><Text style={exp.emptyText}>No expenses found</Text></View> :
         filtered.map(e => (
           <View key={e._id} style={exp.card}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
               <View style={{ flex: 1 }}>
                 <Text style={exp.cardTitle}>{e.title}</Text>
                 <Text style={exp.cardCat}>{e.category?.toUpperCase()}</Text>
               </View>
               <Badge status={e.status} />
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={exp.amountText}>₹{parseFloat(e.amount).toFixed(2)}</Text>
               <Text style={exp.dateText}>{e.expenseDate ? new Date(e.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Text>
             </View>
           </View>
         ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {showModal && <SubmitModal onClose={() => setShowModal(false)} onSave={handleSubmit} />}
    </SafeAreaView>
  );
}

const exp = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2573e6', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#adc6ff' },
  addBtnText:   { fontSize: 11, fontWeight: '800', color: '#0f172a', letterSpacing: 0.8 },
  statCard:     { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  statLabel:    { fontSize: 8, color: '#6b7280', letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  statValue:    { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchInput:  { flex: 1, fontSize: 12, color: '#e5e7eb' },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive:   { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700', letterSpacing: 0.6 },
  chipTextActive:{ color: '#2573e6' },
  card:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  cardCat:      { fontSize: 10, color: '#6b7280', marginTop: 2 },
  amountText:   { fontSize: 15, fontWeight: '800', color: '#47c8ff' },
  dateText:     { fontSize: 11, color: '#6b7280' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '90%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:   { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  footer:       { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' },
  label:        { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 10 },
  input:        { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff4747', padding: 10, marginBottom: 8 },
  errorText:    { fontSize: 11, color: '#ff4747', flex: 1 },
  cancelBtn:    { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
  saveBtn:      { flex: 1, paddingVertical: 12, backgroundColor: '#2573e6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveText:     { fontSize: 11, color: '#ffffff', fontWeight: '700', letterSpacing: 1 },
});
