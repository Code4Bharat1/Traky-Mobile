import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ChevronRight,
  Menu,
} from 'lucide-react-native';
import useAuthStore from '../../store/authStore';
import client from '../../api/client';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, Icon, loading }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel}>{label}</Text>
        <Icon size={18} color={color} strokeWidth={1.75} />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} style={{ marginTop: 6 }} />
      ) : (
        <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>
      )}
    </View>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    TODO:        { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    IN_PROGRESS: { bg: '#dbeafe', color: '#2563eb', label: 'In Progress' },
    IN_REVIEW:   { bg: '#ede9fe', color: '#7c3aed', label: 'In Review' },
    DONE:        { bg: '#d1fae5', color: '#059669', label: 'Done' },
    REJECTED:    { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    PENDING:     { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    ACTIVE:      { bg: '#dbeafe', color: '#2563eb', label: 'Active' },
    COMPLETED:   { bg: '#d1fae5', color: '#059669', label: 'Completed' },
  };
  const cfg = map[status?.toUpperCase()] ?? { bg: '#f3f4f6', color: '#6b7280', label: status ?? '—' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LeadDashboard({ navigation }) {
  const { user } = useAuthStore();

  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'Lead';

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.allSettled([
        client.get('/tasks', { params: { limit: 20 } }),
        client.get('/projects/my-projects'),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const t = tasksRes.value.data;
        setTasks(t?.tasks ?? (Array.isArray(t) ? t : []));
      }
      if (projectsRes.status === 'fulfilled') {
        const p = projectsRes.value.data;
        setProjects(p?.projects ?? (Array.isArray(p) ? p : []));
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const todoCount       = tasks.filter(t => t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewCount   = tasks.filter(t => t.status === 'IN_REVIEW').length;
  const doneCount       = tasks.filter(t => t.status === 'DONE').length;

  const recentTasks    = tasks.slice(0, 5);
  const activeProjects = projects.filter(p =>
    p.status?.toUpperCase() !== 'COMPLETED'
  ).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* ── Top header bar ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Menu size={22} color="#0f172a" strokeWidth={1.75} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{firstName} <Text style={styles.namePrimary}>👋</Text></Text>
        </View>
        <View style={styles.roleChip}>
          <Text style={styles.roleText}>LEAD</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />
        }>

        {/* ── Stats Grid ── */}
        <Text style={styles.sectionTitle}>TASK OVERVIEW</Text>
        <View style={styles.statsGrid}>
          <StatCard label="PENDING"     value={todoCount}       color="#d97706" Icon={Clock3}       loading={loading} />
          <StatCard label="IN PROGRESS" value={inProgressCount} color="#2563eb" Icon={ClipboardList} loading={loading} />
          <StatCard label="IN REVIEW"   value={inReviewCount}   color="#7c3aed" Icon={AlertCircle}   loading={loading} />
          <StatCard label="DONE"        value={doneCount}       color="#059669" Icon={CheckCircle2}  loading={loading} />
        </View>

        {/* ── My Tasks ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY TASKS</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Tasks')}
            style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
            <ChevronRight size={14} color="#2573e6" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color="#2573e6" style={{ padding: 20 }} />
          ) : recentTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks assigned</Text>
          ) : (
            recentTasks.map((task, i) => (
              <View key={task._id ?? i}>
                <View style={styles.taskRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    {task.deadline && (
                      <Text style={styles.taskMeta}>
                        Due {new Date(task.deadline).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        })}
                      </Text>
                    )}
                  </View>
                  <Badge status={task.status} />
                </View>
                {i < recentTasks.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        {/* ── Active Projects ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACTIVE PROJECTS</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Projects')}
            style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
            <ChevronRight size={14} color="#2573e6" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color="#2573e6" style={{ padding: 20 }} />
          ) : activeProjects.length === 0 ? (
            <Text style={styles.emptyText}>No active projects</Text>
          ) : (
            activeProjects.map((project, i) => (
              <View key={project._id ?? i}>
                <View style={styles.projectRow}>
                  <View style={[styles.projectDot, { backgroundColor: '#2573e6' }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {project.name}
                    </Text>
                    {project.endDate && (
                      <Text style={styles.taskMeta}>
                        Due {new Date(project.endDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </Text>
                    )}
                  </View>
                  <Badge status={project.status ?? 'ACTIVE'} />
                </View>
                {i < activeProjects.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7f9' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  menuBtn: {
    padding: 4,
  },
  greeting: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  namePrimary: { color: '#2573e6' },
  roleChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 4 },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2573e6',
    letterSpacing: 0.8,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.5,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  taskMeta: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },

  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  projectDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  projectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.06)',
    marginHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
    padding: 24,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
