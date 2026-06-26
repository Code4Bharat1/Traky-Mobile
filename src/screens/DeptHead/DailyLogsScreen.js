import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookCheck, Search, X, Users, ChevronRight, Calendar, Layers, BookOpen } from 'lucide-react-native';
import { getAllLogs, getUsers, getProjects } from '../../api/services';

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function LogDetailModal({ log, users, projects, onClose }) {
  const emp = (users || []).find(u => String(u._id) === String(log.userId));
  const entries = log.entries?.length
    ? log.entries
    : [{ projectId: log.projectId, moduleName: log.moduleName, description: log.description }];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={dl.overlay}>
        <View style={dl.sheet}>
          <View style={dl.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BookCheck size={14} color="#2573e6" />
              <Text style={dl.sheetTitle}>LOG DETAILS</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={dl.infoLabel}>EMPLOYEE</Text>
                <Text style={dl.infoValue}>{emp?.name || log.userName || 'Unknown'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dl.infoLabel}>DATE</Text>
                <Text style={dl.infoValue}>{fmt(log.logDate || log.date || log.createdAt)}</Text>
              </View>
            </View>
            <Text style={[dl.infoLabel, { marginBottom: 10 }]}>WORK ENTRIES ({entries.length})</Text>
            {entries.map((entry, i) => {
              const proj = (projects || []).find(p => p._id === (entry.projectId?._id || entry.projectId));
              return (
                <View key={i} style={dl.entryCard}>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={dl.entryLabel}>PROJECT</Text>
                      <Text style={dl.entryValue}>{proj?.name || entry.projectName || '—'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={dl.entryLabel}>MODULE</Text>
                      <Text style={dl.entryValue}>{entry.moduleTitle || entry.moduleName || 'N/A'}</Text>
                    </View>
                  </View>
                  <Text style={dl.entryLabel}>DESCRIPTION</Text>
                  <View style={dl.descBox}>
                    <Text style={dl.descText}>{entry.description || 'No description provided.'}</Text>
                  </View>
                </View>
              );
            })}
            {log.todos?.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={dl.infoLabel}>TODAY'S PLANNED TASKS</Text>
                {log.todos.map((t, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <View style={{ width: 14, height: 14, borderWidth: 1, borderColor: t.completed ? '#47ff8a' : '#374151', backgroundColor: t.completed ? '#47ff8a20' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {t.completed && <X size={8} color="#47ff8a" />}
                    </View>
                    <Text style={[dl.entryValue, t.completed && { textDecorationLine: 'line-through', color: '#6b7280' }]}>{t.task}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' }}>
            <TouchableOpacity style={dl.closeBtn} onPress={onClose}>
              <Text style={dl.closeBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function DailyLogsScreen() {
  const [logs, setLogs]           = useState([]);
  const [users, setUsers]         = useState([]);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);

  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  const load = useCallback(async () => {
    try {
      const [l, u, p] = await Promise.allSettled([getAllLogs(), getUsers(), getProjects()]);
      setLogs(l.status === 'fulfilled' ? l.value : []);
      setUsers(u.status === 'fulfilled' ? u.value : []);
      setProjects(p.status === 'fulfilled' ? p.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = logs.filter(l => {
    const emp = users.find(u => String(u._id) === String(l.userId));
    const name = emp?.name || l.userName || '';
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  const submittedToday = logs.filter(l => (l.logDate || l.date || l.createdAt || '').startsWith(today)).length;
  const missingToday = users.filter(u => ['employee', 'lead', 'contributor', 'reviewer'].includes(u.globalRole) && !logs.some(l => String(l.userId) === String(u._id) && (l.logDate || '').startsWith(today))).length;

  return (
    <SafeAreaView style={dl.safe} edges={['bottom']}>
      <View style={dl.header}>
        <View>
          <Text style={dl.headerSub}>DEPARTMENT</Text>
          <Text style={dl.headerTitle}>Daily Logs</Text>
        </View>
        <View style={{ gap: 2, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1 }}>SUBMITTED / MISSING</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>
            <Text style={{ color: '#2573e6' }}>{loading ? '—' : submittedToday}</Text>
            <Text style={{ color: '#374151' }}> / </Text>
            <Text style={{ color: '#ff4747' }}>{loading ? '—' : missingToday}</Text>
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        <View style={dl.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={dl.searchInput} value={search} onChangeText={setSearch} placeholder="Search employee or project..." placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={dl.empty}><BookOpen size={32} color="#374151" /><Text style={dl.emptyText}>No logs found</Text></View> :
         filtered.map(log => {
           const emp = users.find(u => String(u._id) === String(log.userId));
           const firstEntry = log.entries?.[0] || { projectId: log.projectId, moduleName: log.moduleName };
           const proj = projects.find(p => p._id === (firstEntry.projectId?._id || firstEntry.projectId));
           return (
             <TouchableOpacity key={log._id} style={dl.card} onPress={() => setSelected(log)}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                 <View style={{ flex: 1 }}>
                   <Text style={dl.cardName}>{emp?.name || log.userName || 'Unknown Employee'}</Text>
                   <Text style={dl.cardProj}>{proj?.name || 'No project'}</Text>
                   {firstEntry.moduleName && (
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                       <Layers size={10} color="#6b7280" />
                       <Text style={{ fontSize: 10, color: '#6b7280' }}>{firstEntry.moduleName}</Text>
                     </View>
                   )}
                 </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                   <View style={{ backgroundColor: '#47ff8a18', borderWidth: 1, borderColor: '#47ff8a40', paddingHorizontal: 7, paddingVertical: 3 }}>
                     <Text style={{ fontSize: 9, fontWeight: '800', color: '#47ff8a' }}>SUBMITTED</Text>
                   </View>
                   <ChevronRight size={14} color="#6b7280" />
                 </View>
               </View>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                 <Calendar size={11} color="#6b7280" />
                 <Text style={dl.cardDate}>{fmt(log.logDate || log.date || log.createdAt)}</Text>
               </View>
             </TouchableOpacity>
           );
         })}

        {/* Missing logs */}
        {!loading && users
          .filter(u => ['employee', 'lead'].includes(u.globalRole) && !logs.some(l => String(l.userId) === String(u._id) && (l.logDate || '').startsWith(today)))
          .map(u => (
            <View key={`missing-${u._id}`} style={[dl.card, { opacity: 0.7 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={dl.cardName}>{u.name}</Text>
                  <Text style={dl.cardProj}>No log submitted</Text>
                </View>
                <View style={{ backgroundColor: '#ff474718', borderWidth: 1, borderColor: '#ff474740', paddingHorizontal: 7, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#ff4747' }}>MISSING</Text>
                </View>
              </View>
            </View>
          ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {selected && <LogDetailModal log={selected} users={users} projects={projects} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}

const dl = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 12, color: '#e5e7eb' },
  card:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  cardName:     { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  cardProj:     { fontSize: 11, color: '#6b7280', marginTop: 2 },
  cardDate:     { fontSize: 11, color: '#9ca3af' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '90%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetTitle:   { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1.5 },
  infoLabel:    { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  infoValue:    { fontSize: 13, color: '#e5e7eb', fontWeight: '600' },
  entryCard:    { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', padding: 12, marginBottom: 8 },
  entryLabel:   { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  entryValue:   { fontSize: 12, color: '#e5e7eb' },
  descBox:      { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 10, marginTop: 4 },
  descText:     { fontSize: 12, color: '#9ca3af', lineHeight: 18 },
  closeBtn:     { paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center' },
  closeBtnText: { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
});
