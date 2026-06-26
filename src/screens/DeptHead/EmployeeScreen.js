import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Search, UserPlus, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react-native';
import { getUsers, createUser, updateUser, deleteUser, getDepartments } from '../../api/services';
import useAuthStore from '../../store/authStore';

function initials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

const ROLE_META = {
  department_head: { label: 'Dept Head', color: '#47c8ff' },
  lead:            { label: 'Lead',      color: '#2573e6' },
  project_manager: { label: 'Manager',   color: '#47ff8a' },
  employee:        { label: 'Employee',  color: '#9ca3af' },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.employee;
  return (
    <View style={{ backgroundColor: m.color + '20', borderWidth: 1, borderColor: m.color + '40', paddingHorizontal: 7, paddingVertical: 3 }}>
      <Text style={{ fontSize: 9, fontWeight: '800', color: m.color, letterSpacing: 0.5 }}>{m.label}</Text>
    </View>
  );
}

function EmployeeModal({ mode, initial, departments, currentDeptId, creatorRole, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, email: initial.email, globalRole: initial.globalRole || 'employee', departmentId: typeof initial.departmentId === 'object' ? initial.departmentId?._id : initial.departmentId || '', isActive: initial.isActive !== false }
      : { name: '', email: '', globalRole: 'employee', departmentId: currentDeptId || '', isActive: true },
  );
  const [err, setErr] = useState('');

  const ALLOWED_ROLES = creatorRole === 'department_head' ? ['employee', 'lead'] : ['department_head', 'lead', 'employee'];
  const ROLES = ALLOWED_ROLES.map(r => ({ value: r, label: ROLE_META[r]?.label || r }));
  const isDeptHead = creatorRole === 'department_head';

  function handleSubmit() {
    if (!form.name.trim()) { setErr('Full name is required.'); return; }
    if (!/^[a-zA-Z\s]+$/.test(form.name)) { setErr('Name must only contain letters.'); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Valid email is required.'); return; }
    setErr('');
    onSave(form);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={es.overlay}>
        <View style={es.sheet}>
          <View style={es.sheetHeader}>
            <Text style={es.sheetTitle}>{mode === 'add' ? 'ADD NEW EMPLOYEE' : 'EDIT EMPLOYEE'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {!!err && <View style={es.errorBox}><Text style={es.errorText}>{err}</Text></View>}
            <Text style={es.label}>Full Name *</Text>
            <TextInput style={es.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="John Doe" placeholderTextColor="#4b5563" />
            <Text style={es.label}>Email Address *</Text>
            <TextInput style={es.input} value={form.email} onChangeText={v => setForm({ ...form, email: v })} placeholder="john@company.com" placeholderTextColor="#4b5563" keyboardType="email-address" autoCapitalize="none" />
            <Text style={es.label}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {ROLES.map(r => (
                <TouchableOpacity key={r.value} onPress={() => setForm({ ...form, globalRole: r.value })} style={[es.chip, form.globalRole === r.value && es.chipActive]}>
                  <Text style={[es.chipText, form.globalRole === r.value && es.chipTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!isDeptHead && (
              <>
                <Text style={es.label}>Department</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {departments.map(d => (
                    <TouchableOpacity key={d._id} onPress={() => setForm({ ...form, departmentId: d._id })} style={[es.chip, form.departmentId === d._id && es.chipActive]}>
                      <Text style={[es.chipText, form.departmentId === d._id && es.chipTextActive]}>{d.departmentName?.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            <Text style={es.label}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[{ v: true, l: 'Active' }, { v: false, l: 'Inactive' }].map(({ v, l }) => (
                <TouchableOpacity key={l} onPress={() => setForm({ ...form, isActive: v })} style={[es.chip, form.isActive === v && (v ? { borderColor: '#47ff8a', backgroundColor: '#47ff8a18' } : { borderColor: '#ff4747', backgroundColor: '#ff474718' })]}>
                  <Text style={[es.chipText, form.isActive === v && (v ? { color: '#47ff8a' } : { color: '#ff4747' })]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={es.footer}>
            <TouchableOpacity style={es.cancelBtn} onPress={onClose} disabled={saving}><Text style={es.cancelText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity style={[es.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Check size={14} color="#fff" /><Text style={es.saveText}>{mode === 'add' ? 'ADD EMPLOYEE' : 'SAVE CHANGES'}</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function EmployeeScreen() {
  const { user } = useAuthStore();
  const [members, setMembers]     = useState([]);
  const [depts, setDepts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);

  const load = useCallback(async () => {
    try {
      const [u, d] = await Promise.allSettled([getUsers(), getDepartments()]);
      const usersArr = u.status === 'fulfilled' ? u.value : [];
      const deptsArr = d.status === 'fulfilled' ? d.value : [];
      const myDeptId = typeof user?.departmentId === 'object' ? user.departmentId?._id : user?.departmentId;
      const scoped = myDeptId
        ? usersArr.filter(u => { const did = typeof u.departmentId === 'object' ? u.departmentId?._id : u.departmentId; return String(did) === String(myDeptId); })
        : usersArr;
      const deptMap = Object.fromEntries(deptsArr.map(d => [String(d._id), d.departmentName]));
      setMembers(scoped.map(u => { const dkey = typeof u.departmentId === 'object' ? String(u.departmentId?._id) : String(u.departmentId || ''); return { ...u, departmentName: deptMap[dkey] || null }; }));
      setDepts(deptsArr);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    try {
      setSaving(true);
      if (modal.type === 'add') {
        const created = await createUser({ ...form, departmentId: form.departmentId || user?.departmentId });
        setMembers(prev => [created, ...prev]);
      } else {
        const updated = await updateUser(modal.member._id, form);
        setMembers(prev => prev.map(m => m._id === modal.member._id ? { ...m, ...updated } : m));
      }
      setModal(null);
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(member) {
    Alert.alert('Delete Employee', `Delete "${member.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteUser(member._id); setMembers(prev => prev.filter(m => m._id !== member._id)); }
          catch { Alert.alert('Error', 'Failed to delete employee.'); }
        }
      },
    ]);
  }

  const filtered = members.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()));
  const myDeptId = typeof user?.departmentId === 'object' ? user.departmentId?._id : user?.departmentId;

  return (
    <SafeAreaView style={es.safe} edges={['bottom']}>
      <View style={es.header}>
        <View>
          <Text style={es.headerSub}>DEPARTMENT</Text>
          <Text style={es.headerTitle}>Employees</Text>
        </View>
        <TouchableOpacity style={es.addBtn} onPress={() => setModal({ type: 'add' })}>
          <UserPlus size={14} color="#0f172a" strokeWidth={2.5} />
          <Text style={es.addBtnText}>ADD EMPLOYEE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        {/* Total badge */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1, marginBottom: 2 }}>TOTAL</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>{loading ? '—' : filtered.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={es.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={es.searchInput} value={search} onChangeText={setSearch} placeholder="Search by name or email…" placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={es.empty}><Users size={32} color="#374151" /><Text style={es.emptyText}>No employees found</Text></View> :
         filtered.map(m => (
           <View key={m._id} style={es.memberCard}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
               <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2573e620', borderWidth: 1, borderColor: '#2573e640', alignItems: 'center', justifyContent: 'center' }}>
                 <Text style={{ color: '#2573e6', fontSize: 13, fontWeight: '700' }}>{initials(m.name)}</Text>
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={es.memberName}>{m.name}</Text>
                 <Text style={es.memberDept}>{m.departmentName?.toUpperCase() || '—'}</Text>
               </View>
               <View style={{ alignItems: 'flex-end', gap: 4 }}>
                 <RoleBadge role={m.globalRole} />
                 <Text style={{ fontSize: 10, fontWeight: '700', color: m.isActive !== false ? '#47ff8a' : '#6b7280' }}>
                   {m.isActive !== false ? 'Active' : 'Inactive'}
                 </Text>
               </View>
               <View style={{ gap: 6, marginLeft: 4 }}>
                 <TouchableOpacity onPress={() => setModal({ type: 'edit', member: m })}><Pencil size={13} color="#6b7280" /></TouchableOpacity>
                 <TouchableOpacity onPress={() => handleDelete(m)}><Trash2 size={13} color="#ff4747" /></TouchableOpacity>
               </View>
             </View>
           </View>
         ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <EmployeeModal mode={modal.type} initial={modal.member} departments={depts} currentDeptId={myDeptId} creatorRole={user?.globalRole || user?.role} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
    </SafeAreaView>
  );
}

const es = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2573e6', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#adc6ff' },
  addBtnText:   { fontSize: 11, fontWeight: '800', color: '#0f172a', letterSpacing: 0.8 },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 12, color: '#e5e7eb' },
  memberCard:   { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  memberName:   { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  memberDept:   { fontSize: 11, color: '#6b7280', marginTop: 2 },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '90%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:   { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  footer:       { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' },
  label:        { fontSize: 10, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 10 },
  input:        { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', color: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 7, marginRight: 6 },
  chipActive:   { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  chipTextActive:{ color: '#2573e6' },
  errorBox:     { backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff4747', padding: 10, marginBottom: 8 },
  errorText:    { fontSize: 11, color: '#ff4747' },
  cancelBtn:    { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
  saveBtn:      { flex: 1, paddingVertical: 12, backgroundColor: '#2573e6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveText:     { fontSize: 11, color: '#ffffff', fontWeight: '700', letterSpacing: 1 },
});
