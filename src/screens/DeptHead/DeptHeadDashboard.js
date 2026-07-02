import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import {
  ClipboardList, CheckCircle2, AlertCircle, Users,
  FolderOpen, ArrowRight, Bug, CreditCard, BookCheck,
  Users2, Umbrella, Shield,
} from 'lucide-react-native';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import client from '../../api/client';

// ── Helper: safely extract array from settled promise ───────────────────────
const extract = (res, ...keys) => {
  if (res.status !== 'fulfilled') return [];
  const d = res.value?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  for (const k of keys) { if (Array.isArray(d[k])) return d[k]; }
  if (Array.isArray(d.data)) return d.data;
  return [];
};

// ── Status badge (inline, no external dep) ──────────────────────────────────
const STATUS_COLORS = {
  IN_PROGRESS: { label: 'In Progress', color: '#47c8ff', bg: '#47c8ff1a' },
  COMPLETED:   { label: 'Completed',   color: '#47ff8a', bg: '#47ff8a1a' },
  TODO:        { label: 'Pending',     color: '#e8a847', bg: '#e8a8471a' },
  PENDING:     { label: 'Pending',     color: '#e8a847', bg: '#e8a8471a' },
  DONE:        { label: 'Done',        color: '#47ff8a', bg: '#47ff8a1a' },
  ACTIVE:      { label: 'Active',      color: '#47c8ff', bg: '#47c8ff1a' },
};

function StatusBadge({ status }) {
  const m = STATUS_COLORS[status?.toUpperCase()] || { label: status || '—', color: '#9ca3af', bg: '#9ca3af1a' };
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: m.bg, borderWidth: 1, borderColor: m.color + '40' }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: m.color, letterSpacing: 0.4, textTransform: 'uppercase' }}>{m.label}</Text>
    </View>
  );
}

export default function DeptHeadDashboard({ navigation }) {
  const { user }       = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [data, setData] = useState({
    tasks: [], projects: [], members: [], leaves: [], expenses: [], bugs: [], logs: [],
  });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [tR, pR, mR, lR, exR, bR, lgR] = await Promise.allSettled([
        client.get('/tasks?limit=100'),
        client.get('/projects/my-projects'),
        client.get('/users/colleagues'),
        client.get('/leave/approvals?limit=50'),
        client.get('/expenses/all?limit=50'),
        client.get('/bugs?limit=50'),
        client.get('/daily-logs?limit=50'),
      ]);
      setData({
        tasks:    extract(tR, 'tasks'),
        projects: extract(pR, 'projects'),
        members:  extract(mR, 'data', 'users'),
        leaves:   extract(lR, 'records'),
        expenses: extract(exR, 'records', 'expenses'),
        bugs:     extract(bR, 'bugs'),
        logs:     extract(lgR, 'data', 'logs'),
      });
    } catch (e) {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const openTasks      = data.tasks.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED');
  const activeProjects = data.projects.filter(p => p.status !== 'COMPLETED');
  const pendingLeaves  = data.leaves.filter(l => !l.status || l.status === 'pending');
  const pendingExpenses= data.expenses.filter(e => e.status === 'pending');
  const openBugs       = data.bugs.filter(b => b.status === 'OPEN' || b.status === 'REOPENED');
  const today          = new Date().toISOString().slice(0, 10);
  const todayLogs      = data.logs.filter(l => (l.logDate || l.date || l.createdAt || '').startsWith(today));

  // ── Theme helpers (same as AdminDashboard) ─────────────────────────────────
  const bgScreen  = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard    = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white'   : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]'  : 'text-gray-500';
  const textAccent= isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]';

  const navigateTo = (screen) => {
    if (navigation) navigation.navigate(screen);
  };

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const stats = [
    { icon: FolderOpen,  label: 'Active Projects',  value: activeProjects.length,  color: '#c847ff' },
    { icon: ClipboardList,label: 'Open Tasks',       value: openTasks.length,       color: '#47c8ff' },
    { icon: Users,       label: 'Team Members',      value: data.members.length,    color: '#47ff8a' },
    { icon: BookCheck,   label: 'Logs Today',        value: todayLogs.length,       color: '#e8a847' },
    { icon: Bug,         label: 'Open Issues',       value: openBugs.length,        color: '#ff4747' },
    { icon: CreditCard,  label: 'Pending Expenses',  value: pendingExpenses.length, color: '#47ff8a' },
  ];

  if (loading && !data.tasks.length) {
    return (
      <View className={`flex-1 items-center justify-center ${bgScreen}`}>
        <ActivityIndicator size="large" color={isDarkMode ? '#adc6ff' : '#2573e6'} />
      </View>
    );
  }

  return (
    <ScrollView
      className={`flex-1 p-4 ${bgScreen}`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDarkMode ? '#adc6ff' : '#2573e6'}
        />
      }
    >
      {/* ── Welcome Header ── */}
      <View className="mb-6 mt-2 flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>
            Dept Head
          </Text>
          <Text className={`text-xl font-bold ${textColor}`} numberOfLines={2}>
            Welcome back,{' '}
            <Text className={textAccent}>{user?.name || 'Manager'}</Text>
          </Text>
        </View>
        <View className={`border px-3 py-2 flex-row items-center rounded flex-shrink-0 ${bgCard} ${borderColor}`}>
          <Shield size={14} color={isDarkMode ? '#adc6ff' : '#2573e6'} />
          <Text className={`text-[10px] tracking-widest uppercase font-bold ml-1.5 ${textMuted}`}>
            Dept Head
          </Text>
        </View>
      </View>

      {/* ── Error banner ── */}
      {error && (
        <View className="bg-[#ff47471a] border border-[#ff47474d] rounded p-3 mb-4 flex-row items-center">
          <AlertCircle size={16} color="#ff4747" />
          <Text className="text-[#ff4747] text-xs ml-2">{error}</Text>
        </View>
      )}

      {/* ── Stats Grid (2-col, same as AdminDashboard) ── */}
      <View className="flex-row flex-wrap justify-between mb-6">
        {stats.map((s) => (
          <View
            key={s.label}
            className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}
            style={{ width: '48%' }}
          >
            <View className="flex-row items-center mb-3">
              <s.icon size={16} color={s.color} />
            </View>
            <Text
              className={`text-[10px] tracking-widest uppercase font-bold mb-1 ${textMuted}`}
              numberOfLines={1}
            >
              {s.label}
            </Text>
            <Text style={{ color: s.color }} className="text-2xl font-bold">
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Active Projects ── */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
          <View className="flex-row items-center">
            <FolderOpen size={16} color="#c847ff" />
            <Text className={`text-[10px] tracking-widest uppercase font-bold ml-2 ${textMuted}`}>
              Active Projects
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigateTo('Projects')}
            className="flex-row items-center"
          >
            <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
            <ArrowRight size={12} color={isDarkMode ? '#888' : '#555'} />
          </TouchableOpacity>
        </View>
        {activeProjects.length === 0 ? (
          <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>
            No active projects
          </Text>
        ) : (
          activeProjects.slice(0, 5).map((p, idx) => (
            <View
              key={p._id || idx}
              className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}
            >
              <Text className={`text-xs font-bold flex-1 mr-2 ${textColor}`} numberOfLines={1}>
                {p.name}
              </Text>
              <StatusBadge status={p.status} />
            </View>
          ))
        )}
      </View>

      {/* ── Open Tasks ── */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
          <View className="flex-row items-center">
            <ClipboardList size={16} color="#47c8ff" />
            <Text className={`text-[10px] tracking-widest uppercase font-bold ml-2 ${textMuted}`}>
              Open Tasks
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('Tasks')} className="flex-row items-center">
            <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
            <ArrowRight size={12} color={isDarkMode ? '#888' : '#555'} />
          </TouchableOpacity>
        </View>
        {openTasks.length === 0 ? (
          <View className="flex-row items-center justify-center py-6">
            <CheckCircle2 size={16} color="#47ff8a" />
            <Text className="text-[#47ff8a] text-[10px] tracking-widest uppercase font-bold ml-2">
              ALL CLEAR!
            </Text>
          </View>
        ) : (
          openTasks.slice(0, 5).map((t, idx) => (
            <View
              key={t._id || idx}
              className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}
            >
              <View className="flex-1 mr-2">
                <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{t.title}</Text>
                <Text className={`text-[10px] mt-0.5 ${textMuted}`}>
                  {t.contributors?.length || 0} assignees
                </Text>
              </View>
              <View
                className={`border px-2 py-0.5 rounded ${
                  t.priority === 'HIGH'
                    ? 'border-[#ff47474d] bg-[#ff47471a]'
                    : t.priority === 'MEDIUM'
                    ? 'border-[#47c8ff4d] bg-[#47c8ff1a]'
                    : 'border-[#88888833] bg-[#8888881a]'
                }`}
              >
                <Text
                  className={`text-[10px] uppercase font-bold tracking-widest ${
                    t.priority === 'HIGH'
                      ? 'text-[#ff4747]'
                      : t.priority === 'MEDIUM'
                      ? 'text-[#47c8ff]'
                      : 'text-[#888]'
                  }`}
                >
                  {t.status?.replace('_', ' ') || 'PENDING'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Pending Leave Approvals ── */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
          <View className="flex-row items-center">
            <Umbrella size={16} color="#e8a847" />
            <Text className={`text-[10px] tracking-widest uppercase font-bold ml-2 ${textMuted}`}>
              Leave Requests
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('LeaveApprovals')} className="flex-row items-center">
            <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>Review</Text>
            <ArrowRight size={12} color={isDarkMode ? '#888' : '#555'} />
          </TouchableOpacity>
        </View>
        {pendingLeaves.length === 0 ? (
          <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>
            No pending leaves
          </Text>
        ) : (
          pendingLeaves.slice(0, 4).map((l, idx) => (
            <View
              key={l._id || idx}
              className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}
            >
              <View className="flex-1 mr-2">
                <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>
                  {l.userId?.name || l.employeeName || 'Employee'}
                </Text>
                <Text className={`text-[10px] mt-0.5 ${textMuted}`}>
                  {l.leaveType || 'Leave'} •{' '}
                  {l.startDate ? new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </Text>
              </View>
              <View className="border px-2 py-0.5 rounded border-[#e8a8474d] bg-[#e8a8471a]">
                <Text className="text-[10px] uppercase font-bold tracking-widest text-[#e8a847]">
                  PENDING
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Team Members ── */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
          <View className="flex-row items-center">
            <Users2 size={16} color="#47ff8a" />
            <Text className={`text-[10px] tracking-widest uppercase font-bold ml-2 ${textMuted}`}>
              Team Members
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('Employee')} className="flex-row items-center">
            <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
            <ArrowRight size={12} color={isDarkMode ? '#888' : '#555'} />
          </TouchableOpacity>
        </View>
        {data.members.length === 0 ? (
          <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>
            No team members found
          </Text>
        ) : (
          data.members.slice(0, 5).map((m, idx) => {
            const initials = m.name
              ? m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
              : '??';
            return (
              <View
                key={m._id || idx}
                className={`flex-row items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: '#2573e620', borderWidth: 1, borderColor: '#2573e640' }}
                >
                  <Text style={{ color: '#2573e6', fontSize: 11, fontWeight: '700' }}>{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{m.name}</Text>
                  <Text className={`text-[10px] mt-0.5 ${textMuted}`}>
                    {(m.globalRole || m.role || 'employee').replace(/_/g, ' ')}
                  </Text>
                </View>
                <View
                  className="border px-2 py-0.5 rounded"
                  style={{
                    borderColor: m.isActive !== false ? '#47ff8a40' : '#6b728040',
                    backgroundColor: m.isActive !== false ? '#47ff8a1a' : '#6b72801a',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: m.isActive !== false ? '#47ff8a' : '#6b7280',
                    }}
                  >
                    {m.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── Issues ── */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
          <View className="flex-row items-center">
            <Bug size={16} color="#ff4747" />
            <Text className={`text-[10px] tracking-widest uppercase font-bold ml-2 ${textMuted}`}>
              Open Issues
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('Issues')} className="flex-row items-center">
            <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
            <ArrowRight size={12} color={isDarkMode ? '#888' : '#555'} />
          </TouchableOpacity>
        </View>
        {openBugs.length === 0 ? (
          <View className="flex-row items-center justify-center py-6">
            <CheckCircle2 size={16} color="#47ff8a" />
            <Text className="text-[#47ff8a] text-[10px] tracking-widest uppercase font-bold ml-2">
              NO ISSUES!
            </Text>
          </View>
        ) : (
          openBugs.slice(0, 4).map((b, idx) => (
            <View
              key={b._id || idx}
              className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}
            >
              <View className="flex-1 mr-2">
                <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{b.title}</Text>
                <Text className={`text-[10px] mt-0.5 ${textMuted}`}>
                  {b.projectId?.name || 'Project'}
                </Text>
              </View>
              <View
                className={`border px-2 py-0.5 rounded ${
                  b.severity === 'CRITICAL'
                    ? 'border-[#ff47474d] bg-[#ff47471a]'
                    : b.severity === 'HIGH'
                    ? 'border-[#e8a8474d] bg-[#e8a8471a]'
                    : 'border-[#88888833] bg-[#8888881a]'
                }`}
              >
                <Text
                  className={`text-[10px] uppercase font-bold tracking-widest ${
                    b.severity === 'CRITICAL'
                      ? 'text-[#ff4747]'
                      : b.severity === 'HIGH'
                      ? 'text-[#e8a847]'
                      : 'text-[#888]'
                  }`}
                >
                  {b.severity || 'MEDIUM'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View className="h-6" />
    </ScrollView>
  );
}
