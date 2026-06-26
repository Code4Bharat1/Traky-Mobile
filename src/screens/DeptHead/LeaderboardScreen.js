import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Users, CheckCircle2, Clock, ClipboardList, Bug, Star } from 'lucide-react-native';
import { getLeaderboard } from '../../api/services';

const PERIODS = [
  { key: 'all',       label: 'All Time' },
  { key: 'weekly',    label: 'Weekly' },
  { key: 'monthly',   label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
];

function ScoreColor(score) {
  if (score >= 80) return '#47ff8a';
  if (score >= 60) return '#2573e6';
  if (score >= 40) return '#e8a847';
  return '#ff4747';
}

function RankBadge({ rank }) {
  const map = { 1: { color: '#e8a847', bg: '#e8a84718' }, 2: { color: '#9ca3af', bg: '#9ca3af18' }, 3: { color: '#f87343', bg: '#f8734318' } };
  const m = map[rank] || { color: '#374151', bg: '#37415118' };
  return (
    <View style={{ width: 28, height: 28, backgroundColor: m.bg, borderWidth: 1, borderColor: m.color + '50', alignItems: 'center', justifyContent: 'center' }}>
      {rank === 1 ? <Trophy size={14} color={m.color} /> : <Text style={{ fontSize: 12, fontWeight: '800', color: m.color }}>{rank}</Text>}
    </View>
  );
}

export default function LeaderboardScreen() {
  const [data, setData]       = useState([]);
  const [deptAvg, setDeptAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]   = useState('all');

  const load = useCallback(async () => {
    try {
      const result = await getLeaderboard(period);
      setData(result?.data || []);
      setDeptAvg(result?.departmentAverage || 0);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const topScore = data[0]?.score || 0;

  return (
    <SafeAreaView style={lb.safe} edges={['bottom']}>
      <View style={lb.header}>
        <View>
          <Text style={lb.headerSub}>DEPARTMENT</Text>
          <Text style={lb.headerTitle}>Leaderboard</Text>
        </View>
        <View style={lb.avgCard}>
          <Text style={lb.avgLabel}>DEPT AVG</Text>
          <Text style={lb.avgValue}>{deptAvg} <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '500' }}>pts</Text></Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        {/* Period selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={[lb.chip, period === p.key && lb.chipActive]}>
              <Text style={[lb.chipText, period === p.key && lb.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Info note */}
        <View style={lb.note}>
          <Star size={12} color="#e8a847" />
          <Text style={lb.noteText}>Points: task completion, daily logs. Deductions: missed deadlines, overdue tasks.</Text>
        </View>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         data.length === 0 ? <View style={lb.empty}><Trophy size={32} color="#374151" /><Text style={lb.emptyText}>No data available</Text></View> :
         data.map((emp, i) => {
           const barW = topScore > 0 ? Math.round((emp.score / topScore) * 100) : 0;
           const sColor = ScoreColor(emp.score);
           return (
             <View key={emp.userId || i} style={[lb.card, emp.rank === 1 && { borderColor: '#47ff8a40' }]}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                 <RankBadge rank={emp.rank} />
                 <View style={{ flex: 1 }}>
                   <Text style={lb.empName}>{emp.name}</Text>
                   <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                       <CheckCircle2 size={11} color="#47ff8a" />
                       <Text style={{ fontSize: 10, color: '#9ca3af' }}>{emp.tasksCompleted}/{emp.tasksTotal}</Text>
                     </View>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                       <Clock size={11} color={emp.tasksOverdue > 0 ? '#ff4747' : '#47ff8a'} />
                       <Text style={{ fontSize: 10, color: '#9ca3af' }}>{emp.tasksOverdue} overdue</Text>
                     </View>
                     {emp.logsCount != null && (
                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                         <ClipboardList size={11} color="#47c8ff" />
                         <Text style={{ fontSize: 10, color: '#9ca3af' }}>{emp.logsCount} logs</Text>
                       </View>
                     )}
                   </View>
                 </View>
                 <View style={[lb.scoreBadge, { borderColor: sColor + '40', backgroundColor: sColor + '18' }]}>
                   <Text style={[lb.scoreText, { color: sColor }]}>{emp.score} pts</Text>
                 </View>
               </View>
               {/* Score bar */}
               <View style={lb.barBg}>
                 <View style={[lb.barFill, { width: `${barW}%`, backgroundColor: sColor }]} />
               </View>
             </View>
           );
         })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const lb = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  avgCard:      { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8 },
  avgLabel:     { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1 },
  avgValue:     { fontSize: 16, fontWeight: '800', color: '#ffffff', textAlign: 'right' },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipActive:   { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  chipTextActive:{ color: '#2573e6' },
  note:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 10, marginBottom: 14 },
  noteText:     { fontSize: 11, color: '#6b7280', flex: 1 },
  card:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  empName:      { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  scoreBadge:   { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  scoreText:    { fontSize: 11, fontWeight: '800' },
  barBg:        { height: 3, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 2 },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
});
