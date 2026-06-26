import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, Users, CheckCircle2, Clock, ClipboardList, Bug } from 'lucide-react-native';
import { getLeaderboard, getUsers } from '../../api/services';

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PERIODS = [
  { key: 'all',       label: 'All Time' },
  { key: 'weekly',    label: 'Weekly' },
  { key: 'monthly',   label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
];

function scoreColor(score) {
  if (score >= 80) return '#47ff8a';
  if (score >= 60) return '#2573e6';
  if (score >= 40) return '#e8a847';
  return '#ff4747';
}

function MetricRow({ icon: Icon, label, value, color }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon size={12} color={color} />
      <Text style={{ fontSize: 10, color: '#6b7280' }}>{label}:</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{value}</Text>
    </View>
  );
}

export default function EmployeeReportScreen() {
  const [data, setData]       = useState([]);
  const [users, setUsers]     = useState([]);
  const [deptAvg, setDeptAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]   = useState('all');

  const load = useCallback(async () => {
    try {
      const [lb, u] = await Promise.allSettled([getLeaderboard(period), getUsers()]);
      setData(lb.status === 'fulfilled' ? lb.value?.data || [] : []);
      setDeptAvg(lb.status === 'fulfilled' ? lb.value?.departmentAverage || 0 : 0);
      setUsers(u.status === 'fulfilled' ? u.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  // Enrich with user details
  const enriched = data.map(entry => {
    const user = users.find(u => String(u._id) === String(entry.userId));
    return { ...entry, email: user?.email, role: user?.globalRole };
  });

  return (
    <SafeAreaView style={er.safe} edges={['bottom']}>
      <View style={er.header}>
        <View>
          <Text style={er.headerSub}>DEPARTMENT</Text>
          <Text style={er.headerTitle}>Employee Report</Text>
        </View>
        <View style={er.avgCard}>
          <Text style={er.avgLabel}>DEPT AVG</Text>
          <Text style={er.avgValue}>{deptAvg} pts</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        {/* Period */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={[er.chip, period === p.key && er.chipActive]}>
              <Text style={[er.chipText, period === p.key && er.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'EMPLOYEES', value: data.length, color: '#2573e6' },
            { label: 'AVG SCORE', value: `${deptAvg}`, color: '#e8a847' },
            { label: 'TOP SCORE', value: data[0]?.score || 0, color: '#47ff8a' },
          ].map(s => (
            <View key={s.label} style={er.statCard}>
              <Text style={er.statLabel}>{s.label}</Text>
              <Text style={[er.statValue, { color: s.color }]}>{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         enriched.length === 0 ? <View style={er.empty}><BarChart3 size={32} color="#374151" /><Text style={er.emptyText}>No data available</Text></View> :
         enriched.map((emp, i) => {
           const sColor = scoreColor(emp.score);
           const topScore = data[0]?.score || 1;
           const barW = Math.round((emp.score / topScore) * 100);
           const ROLE_META = { department_head: 'Dept Head', lead: 'Lead', project_manager: 'Manager', employee: 'Employee' };
           return (
             <View key={emp.userId || i} style={er.card}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                 {/* Rank */}
                 <View style={{ width: 28, height: 28, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
                   <Text style={{ fontSize: 11, fontWeight: '800', color: '#9ca3af' }}>{emp.rank}</Text>
                 </View>
                 {/* Avatar & Name */}
                 <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#2573e620', borderWidth: 1, borderColor: '#2573e640', alignItems: 'center', justifyContent: 'center' }}>
                   <Users size={14} color="#2573e6" />
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={er.empName}>{emp.name}</Text>
                   {emp.role && <Text style={{ fontSize: 10, color: '#6b7280' }}>{ROLE_META[emp.role] || emp.role}</Text>}
                 </View>
                 <View style={{ borderWidth: 1, borderColor: sColor + '40', backgroundColor: sColor + '18', paddingHorizontal: 8, paddingVertical: 4 }}>
                   <Text style={{ fontSize: 11, fontWeight: '800', color: sColor }}>{emp.score} pts</Text>
                 </View>
               </View>

               {/* Metrics */}
               <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                 <MetricRow icon={CheckCircle2} label="Tasks" value={`${emp.tasksCompleted}/${emp.tasksTotal}`} color="#47ff8a" />
                 <MetricRow icon={Clock} label="Overdue" value={emp.tasksOverdue} color={emp.tasksOverdue > 0 ? '#ff4747' : '#47ff8a'} />
                 {emp.logsCount != null && <MetricRow icon={ClipboardList} label="Logs" value={emp.logsCount} color="#47c8ff" />}
                 {emp.openBugs != null && <MetricRow icon={Bug} label="Bugs" value={emp.openBugs} color={emp.openBugs > 0 ? '#ff4747' : '#47ff8a'} />}
               </View>

               {/* Score bar */}
               <View style={er.barBg}>
                 <View style={[er.barFill, { width: `${barW}%`, backgroundColor: sColor }]} />
               </View>
             </View>
           );
         })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const er = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  avgCard:      { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8 },
  avgLabel:     { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1 },
  avgValue:     { fontSize: 14, fontWeight: '800', color: '#ffffff', textAlign: 'right' },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipActive:   { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  chipTextActive:{ color: '#2573e6' },
  statCard:     { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 10 },
  statLabel:    { fontSize: 8, color: '#6b7280', letterSpacing: 1, fontWeight: '700', marginBottom: 3 },
  statValue:    { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  card:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  empName:      { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  barBg:        { height: 3, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 2 },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
});
