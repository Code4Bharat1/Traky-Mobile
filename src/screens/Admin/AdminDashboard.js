import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { getProjects, getDepartments, getAllBugs, getTasks, getActivityLogs, getLeaderboard, getAllExpenses } from '../../api/services';
import { FolderKanban, ArrowRight, Building2, Trophy, Bug, CheckCircle2, ClipboardList, Shield, AlertCircle, Circle, Clock, Users, CreditCard } from 'lucide-react-native';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const STATUS_META = {
  IN_PROGRESS: { label: "In Progress", color: "text-[#47c8ff]", bg: "bg-[#47c8ff1a]", border: "border-[#47c8ff33]" },
  COMPLETED: { label: "Completed", color: "text-[#47ff8a]", bg: "bg-[#47ff8a1a]", border: "border-[#47ff8a33]" }
};

const MEDALS = [
  { label: "1st", color: "text-[#e8a847]", bg: "bg-[#e8a8471a]", border: "border-[#e8a8474d]" },
  { label: "2nd", color: "text-[#888]", bg: "bg-[#8888881a]", border: "border-[#88888833]" },
  { label: "3rd", color: "text-[#c47a3a]", bg: "bg-[#c47a3a1a]", border: "border-[#c47a3a4d]" }
];

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.IN_PROGRESS;
  return (
    <View className={`flex-row items-center px-2 py-0.5 border rounded ${m.bg} ${m.border}`}>
      <Circle size={6} color={m.color.replace('text-[', '').replace(']', '')} fill={m.color.replace('text-[', '').replace(']', '')} style={{marginRight: 4}} />
      <Text className={`text-[10px] uppercase font-bold tracking-widest ${m.color}`}>{m.label}</Text>
    </View>
  );
};

export default function AdminDashboard({ navigation }) {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [data, setData] = useState({
    projects: [], depts: [], bugs: [], tasks: [], logs: [], leaderboard: [], approvedExpenses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pR, dR, bR, tR, lR, lbR, exR] = await Promise.allSettled([
        getProjects({ limit: 100 }),
        getDepartments(),
        getAllBugs(),
        getTasks(),
        getActivityLogs({ limit: 50 }),
        getLeaderboard('all'),
        getAllExpenses({ status: 'approved', limit: 100 })
      ]);

      const safe = (r) => r.status === 'fulfilled' ? r.value : [];

      setData({
        projects: Array.isArray(safe(pR)) ? safe(pR) : [],
        depts: Array.isArray(safe(dR)) ? safe(dR) : [],
        bugs: Array.isArray(safe(bR)) ? safe(bR) : [],
        tasks: Array.isArray(safe(tR)) ? safe(tR) : [],
        logs: (() => { const v = safe(lR); return v?.activityLogs ?? v?.logs ?? (Array.isArray(v) ? v : []); })(),
        leaderboard: (() => { const v = safe(lbR); return v?.topOverall ?? v?.leaderboard ?? (Array.isArray(v) ? v : []); })(),
        approvedExpenses: (() => { const v = safe(exR); return v?.records ?? v?.expenses ?? (Array.isArray(v) ? v : []); })()
      });
    } catch (e) {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeProjects = data.projects.filter((p) => p.status !== "COMPLETED");
  const openBugs = data.bugs.filter((b) => ["OPEN", "REOPENED"].includes(b.status));
  const openTasks = data.tasks.filter((t) => t.status !== "DONE");
  
  const today = new Date();
  const todayLogs = data.logs.filter((l) => {
    const d = l.logDate ? new Date(l.logDate) : l.date ? new Date(l.date) : null;
    if (!d) return false;
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });

  const totalExpense = data.approvedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(0);

  const stats = [
    { icon: Users, label: "Departments", value: data.depts.length, color: "#47ff8a" },
    { icon: FolderKanban, label: "Active Projects", value: activeProjects.length, color: "#c847ff" },
    { icon: ClipboardList, label: "Open Tasks", value: openTasks.length, color: "#47c8ff" },
    { icon: Clock, label: "Logs Today", value: todayLogs.length, color: "#e8a847" },
    { icon: Bug, label: "Issues", value: openBugs.length, color: "#ff4747" },
    { icon: CreditCard, label: "Approved Expenses", value: `₹${totalExpense}`, color: "#47ff8a" }
  ];

  if (loading && !data.projects.length) {
    return (
      <View className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'}`}>
         <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
      </View>
    );
  }

  const navigateTo = (screen) => {
    if (navigation) navigation.navigate(screen);
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';
  const textAccent = isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]';

  return (
    <ScrollView 
      className={`flex-1 p-4 ${bgScreen}`} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={isDarkMode ? "#adc6ff" : "#2573e6"} />}
    >
      {/* Header */}
      <View className="mb-6 mt-2 flex-row justify-between items-center">
         <View className="flex-1 mr-3">
            <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin</Text>
            <Text className={`text-xl font-bold ${textColor}`} numberOfLines={2}>Welcome back, <Text className={textAccent}>{user?.name || 'User'}</Text></Text>
         </View>
         <View className={`border px-3 py-2 flex-row items-center rounded flex-shrink-0 ${bgCard} ${borderColor}`}>
            <Shield size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
            <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Administrator</Text>
         </View>
      </View>

      {error && (
        <View className="bg-[#ff47471a] border border-[#ff47474d] rounded p-3 mb-4 flex-row items-center">
          <AlertCircle size={16} color="#ff4747" className="mr-2" />
          <Text className="text-[#ff4747] text-xs">{error}</Text>
        </View>
      )}

      {/* Grid Stats Cards */}
      <View className="flex-row flex-wrap justify-between mb-6">
        {stats.map((s, i) => (
          <View key={s.label} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`} style={{ width: '48%' }}>
             <View className="flex-row items-center mb-3">
               <s.icon size={16} color={s.color} />
             </View>
             <Text className={`text-[10px] tracking-widest uppercase font-bold mb-1 ${textMuted}`} numberOfLines={1}>{s.label}</Text>
             <Text style={{color: s.color}} className="text-2xl font-bold">{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Active Projects */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
           <View className="flex-row items-center">
             <FolderKanban size={16} color="#c847ff" className="mr-2" />
             <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Active Projects</Text>
           </View>
           <TouchableOpacity onPress={() => navigateTo('ProjectsOverview')} className="flex-row items-center">
             <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
             <ArrowRight size={12} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
        </View>
        <View>
          {activeProjects.length === 0 ? (
            <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>No active projects</Text>
          ) : (
            activeProjects.map((p, idx) => (
              <View key={`proj_${p._id || idx}`} className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}>
                <Text className={`text-xs font-bold flex-1 mr-2 ${textColor}`} numberOfLines={1}>{p.name}</Text>
                <StatusBadge status={p.status} />
              </View>
            ))
          )}
        </View>
      </View>

      {/* Departments */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
           <View className="flex-row items-center">
             <Building2 size={16} color="#47c8ff" className="mr-2" />
             <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Departments</Text>
           </View>
           <TouchableOpacity onPress={() => navigateTo('Departments')} className="flex-row items-center">
             <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>Manage</Text>
             <ArrowRight size={12} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
        </View>
        <View>
          {data.depts.length === 0 ? (
             <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>No departments yet</Text>
          ) : (
             data.depts.map((d, idx) => (
                <View key={`dept_${d._id || idx}`} className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}>
                   <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{(d.departmentName || d.name || '').toUpperCase()}</Text>
                   <Text className={`text-[10px] tracking-widest ${textMuted}`}>{d.employeeCount ?? 0} Employee</Text>
                </View>
             ))
          )}
        </View>
      </View>

      {/* Top Performers */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
           <View className="flex-row items-center">
             <Trophy size={16} color="#e8a847" className="mr-2" />
             <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Top Performers</Text>
           </View>
           <TouchableOpacity onPress={() => navigateTo('Leaderboard')} className="flex-row items-center">
             <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>Leaderboard</Text>
             <ArrowRight size={12} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
        </View>
        <View>
          {data.leaderboard.length === 0 ? (
            <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>No data yet</Text>
          ) : (
            data.leaderboard.map((emp, idx) => {
              const m = MEDALS[idx] || MEDALS[2];
              return (
                <View key={`emp_${emp.userId || emp._id || idx}`} className={`flex-row items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}>
                  <View className={`border rounded px-2 py-0.5 mr-3 ${m.bg} ${m.border}`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${m.color}`}>{m.label}</Text>
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{emp.name}</Text>
                    <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{emp.score ?? 0} pts</Text>
                  </View>
                  <Text className={`text-lg font-bold ${m.color}`}>{emp.score ?? 0}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Issues */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
           <View className="flex-row items-center">
             <Bug size={16} color="#ff4747" className="mr-2" />
             <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Issues</Text>
           </View>
           <TouchableOpacity onPress={() => navigateTo('Issues')} className="flex-row items-center">
             <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
             <ArrowRight size={12} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
        </View>
        <View>
          {openBugs.length === 0 ? (
            <View className="flex-row items-center justify-center py-6">
               <CheckCircle2 size={16} color="#47ff8a" className="mr-2" />
               <Text className="text-[#47ff8a] text-[10px] tracking-widest uppercase font-bold">NO ISSUES !</Text>
            </View>
          ) : (
            openBugs.map((b, idx) => {
              const proj = data.projects.find((p) => p._id === b.projectId);
              return (
                <View key={`bug_${b._id || idx}`} className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}>
                  <View className="flex-1 mr-2">
                    <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{b.title}</Text>
                    <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{proj?.name || "Project"}</Text>
                  </View>
                  <View className={`border px-2 py-0.5 rounded ${b.severity === 'CRITICAL' ? 'border-[#ff47474d] bg-[#ff47471a]' : b.severity === 'HIGH' ? 'border-[#e8a8474d] bg-[#e8a8471a]' : 'border-[#88888833] bg-[#8888881a]'}`}>
                    <Text className={`text-[10px] uppercase font-bold tracking-widest ${b.severity === 'CRITICAL' ? 'text-[#ff4747]' : b.severity === 'HIGH' ? 'text-[#e8a847]' : 'text-[#888]'}`}>{b.severity}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Tasks */}
      <View className={`border rounded-lg mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
           <View className="flex-row items-center">
             <ClipboardList size={16} color="#47c8ff" className="mr-2" />
             <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Tasks</Text>
           </View>
           <TouchableOpacity onPress={() => navigateTo('Tasks')} className="flex-row items-center">
             <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
             <ArrowRight size={12} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
        </View>
        <View>
          {openTasks.length === 0 ? (
            <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>No open tasks</Text>
          ) : (
            openTasks.map((t, idx) => (
              <View key={`task_${t._id || idx}`} className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}>
                <View className="flex-1 mr-2">
                  <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{t.title}</Text>
                  <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{t.created_by?.name || "Admin"}</Text>
                </View>
                <View className={`border px-2 py-0.5 rounded ${t.priority === 'HIGH' ? 'border-[#ff47474d] bg-[#ff47471a]' : t.priority === 'MEDIUM' ? 'border-[#47c8ff4d] bg-[#47c8ff1a]' : 'border-[#88888833] bg-[#8888881a]'}`}>
                  <Text className={`text-[10px] uppercase font-bold tracking-widest ${t.priority === 'HIGH' ? 'text-[#ff4747]' : t.priority === 'MEDIUM' ? 'text-[#47c8ff]' : 'text-[#888]'}`}>{t.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Recent Expenses */}
      <View className={`border rounded-lg mb-8 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
           <View className="flex-row items-center">
             <CreditCard size={16} color="#47ff8a" className="mr-2" />
             <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Recent Expenses</Text>
           </View>
           <TouchableOpacity onPress={() => navigateTo('Expenses')} className="flex-row items-center">
             <Text className={`text-[10px] tracking-widest uppercase mr-1 ${textMuted}`}>View All</Text>
             <ArrowRight size={12} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
        </View>
        <View>
          {data.approvedExpenses.length === 0 ? (
            <Text className={`text-[10px] tracking-widest uppercase text-center py-6 ${textMuted}`}>No approved expenses</Text>
          ) : (
            data.approvedExpenses.map((exp, idx) => (
              <View key={`exp_${exp._id || idx}`} className={`flex-row justify-between items-center px-4 py-3 ${idx !== 0 ? `border-t ${borderColor}` : ''}`}>
                <View className="flex-1 mr-2">
                  <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{exp.title}</Text>
                  <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{exp.userId?.name || "User"} • {exp.category}</Text>
                </View>
                <Text className="text-sm font-bold text-[#47ff8a]">₹{exp.amount?.toFixed(0)}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View className="h-6" />
    </ScrollView>
  );
}
