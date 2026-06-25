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
  Users,
  FolderOpen,
  ChevronRight,
  Menu,
  BarChart2,
} from 'lucide-react-native';
import useAuthStore from '../../store/authStore';
import client from '../../api/client';

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
    APPROVED:    { bg: '#d1fae5', color: '#059669', label: 'Approved' },
  };
  const cfg = map[status?.toUpperCase()] ?? { bg: '#f3f4f6', color: '#6b7280', label: status ?? '—' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

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

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <View style={styles.divider} />;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DeptHeadDashboard({ navigation }) {
  const { user } = useAuthStore();

  const [tasks, setTasks]         = useState([]);
  const [projects, setProjects]   = useState([]);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'Manager';

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes, membersRes] = await Promise.allSettled([
        client.get('/tasks', { params: { limit: 20 } }),
        client.get('/projects/my-projects'),
        client.get('/users/colleagues'),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const t = tasksRes.value.data;
        setTasks(t?.tasks ?? (Array.isArray(t) ? t : []));
      }
      if (projectsRes.status === 'fulfilled') {
        const p = projectsRes.value.data;
        setProjects(p?.projects ?? (Array.isArray(p) ? p : []));
      }
      if (membersRes.status === 'fulfilled') {
        const m = membersRes.value.data;
        setMembers(m?.data ?? m?.users ?? (Array.isArray(m) ? m : []));
      }
    } catch (err) {
      console.error('DeptHead Dashboard fetch error:', err);
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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const todoCount       = tasks.filter(t => t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewCount   = tasks.filter(t => t.status === 'IN_REVIEW').length;
  const doneCount       = tasks.filter(t => t.status === 'DONE').length;
  const activeProjects  = projects.filter(p => p.status?.toUpperCase() !== 'COMPLETED');

  const recentTasks    = tasks.slice(0, 5);
  const recentProjects = activeProjects.slice(0, 5);
  const recentMembers  = members.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Menu size={22} color="#0f172a" strokeWidth={1.75} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <View style={styles.roleChip}>
          <Text style={styles.roleText}>DEPT HEAD</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />
        }>

        {/* ── Task Stats ── */}
        <Text style={styles.sectionTitle}>TASK OVERVIEW</Text>
        <View style={styles.statsGrid}>
          <StatCard label="PENDING"     value={todoCount}       color="#d97706" Icon={Clock3}        loading={loading} />
          <StatCard label="IN PROGRESS" value={inProgressCount} color="#2563eb" Icon={ClipboardList}  loading={loading} />
          <StatCard label="IN REVIEW"   value={inReviewCount}   color="#7c3aed" Icon={AlertCircle}    loading={loading} />
          <StatCard label="DONE"        value={doneCount}       color="#059669" Icon={CheckCircle2}   loading={loading} />
        </View>

        {/* ── Quick Stats row ── */}
        <View style={styles.quickRow}>
          <View style={[styles.quickCard, { borderTopColor: '#2573e6' }]}>
            <FolderOpen size={20} color="#2573e6" strokeWidth={1.75} />
            <Text style={[styles.quickValue, { color: '#2573e6' }]}>
              {loading ? '—' : activeProjects.length}
            </Text>
            <Text style={styles.quickLabel}>PROJECTS</Text>
          </View>
          <View style={[styles.quickCard, { borderTopColor: '#059669' }]}>
            <Users size={20} color="#059669" strokeWidth={1.75} />
            <Text style={[styles.quickValue, { color: '#059669' }]}>
              {loading ? '—' : members.length}
            </Text>
            <Text style={styles.quickLabel}>MEMBERS</Text>
          </View>
          <View style={[styles.quickCard, { borderTopColor: '#7c3aed' }]}>
            <BarChart2 size={20} color="#7c3aed" strokeWidth={1.75} />
            <Text style={[styles.quickValue, { color: '#7c3aed' }]}>
              {loading ? '—' : tasks.length}
            </Text>
            <Text style={styles.quickLabel}>TOTAL TASKS</Text>
          </View>
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
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    {task.deadline && (
                      <Text style={styles.taskMeta}>
                        Due {new Date(task.deadline).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </Text>
                    )}
                  </View>
                  <Badge status={task.status} />
                </View>
                {i < recentTasks.length - 1 && <Divider />}
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
          ) : recentProjects.length === 0 ? (
            <Text style={styles.emptyText}>No active projects</Text>
          ) : (
            recentProjects.map((project, i) => (
              <View key={project._id ?? i}>
                <View style={styles.projectRow}>
                  <View style={[styles.projectDot, { backgroundColor: '#2573e6' }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{project.name}</Text>
                    {project.endDate && (
                      <Text style={styles.taskMeta}>
                        Due {new Date(project.endDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </Text>
                    )}
                  </View>
                  <Badge status={project.status ?? 'ACTIVE'} />
                </View>
                {i < recentProjects.length - 1 && <Divider />}
              </View>
            ))
          )}
        </View>

        {/* ── Team Members ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TEAM MEMBERS</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Employee')}
            style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
            <ChevronRight size={14} color="#2573e6" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color="#2573e6" style={{ padding: 20 }} />
          ) : recentMembers.length === 0 ? (
            <Text style={styles.emptyText}>No team members found</Text>
          ) : (
            recentMembers.map((member, i) => {
              const initials = member.name
                ? member.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                : '??';
              const role = (member.globalRole ?? member.role ?? 'employee')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
              return (
                <View key={member._id ?? i}>
                  <View style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitials}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.taskTitle} numberOfLines={1}>{member.name}</Text>
                      <Text style={styles.taskMeta}>{role}</Text>
                    </View>
                    <View style={[
                      styles.badge,
                      { backgroundColor: member.isActive ? '#d1fae5' : '#fee2e2' },
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        { color: member.isActive ? '#059669' : '#dc2626' },
                      ]}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  {i < recentMembers.length - 1 && <Divider />}
                </View>
              );
            })
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
  menuBtn: { padding: 4 },
  greeting: { fontSize: 11, color: '#6b7280', fontWeight: '600', letterSpacing: 0.5 },
  name: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  roleChip: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 10, fontWeight: '800', color: '#7c3aed', letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

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
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 10, fontWeight: '700', color: '#2573e6', letterSpacing: 0.8 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', letterSpacing: 1 },
  statValue: { fontSize: 28, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },

  quickRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  quickValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  quickLabel: { fontSize: 9, fontWeight: '700', color: '#9ca3af', letterSpacing: 1 },

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
  taskTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  taskMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  projectDot: { width: 7, height: 7, borderRadius: 4 },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2573e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  divider: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.06)',
    marginHorizontal: 16,
  },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 24 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});
