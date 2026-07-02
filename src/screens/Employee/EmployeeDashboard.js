import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import client from '../../api/client';
import { FolderKanban, ArrowRight, CheckSquare, Bug, ClipboardList, AlertCircle, Circle, Clock, CheckCircle2, User, Trophy } from 'lucide-react-native';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const STATUS_META = {
  IN_PROGRESS: { label: "In Progress", color: "text-[#47c8ff]", bg: "bg-[#47c8ff1a]", border: "border-[#47c8ff33]" },
  COMPLETED: { label: "Completed", color: "text-[#47ff8a]", bg: "bg-[#47ff8a1a]", border: "border-[#47ff8a33]" }
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.IN_PROGRESS;
  return (
    <View className={`flex-row items-center px-2 py-0.5 border rounded ${m.bg} ${m.border}`}>
      <Circle size={6} color={m.color.replace('text-[', '').replace(']', '')} fill={m.color.replace('text-[', '').replace(']', '')} style={{marginRight: 4}} />
      <Text className={`text-[10px] uppercase font-bold tracking-widest ${m.color}`}>{m.label}</Text>
    </View>
  );
};

const extractArray = (res, ...keys) => {
  if (res.status !== "fulfilled") return [];
  const d = res.value?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  for (const key of keys) {
    if (Array.isArray(d[key])) return d[key];
  }
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.records)) return d.records;
  return [];
};

export default function EmployeeDashboard({ navigation }) {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [data, setData] = useState({
    projects: [], tasks: [], logs: [], bugs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError(null);
      const [pR, tR, lR, bR] = await Promise.allSettled([
        client.get('/projects/my-projects?limit=20'),
        client.get(`/tasks?assignedTo=${user?._id}&limit=20`),
        client.get('/daily-logs?limit=20'),
        client.get('/bugs?assignedToMe=true&limit=20')
      ]);

      setData({
        projects: extractArray(pR, 'projects'),
        tasks: extractArray(tR, 'tasks'),
        logs: extractArray(lR, 'dailyLogs', 'logs', 'records'),
        bugs: extractArray(bR, 'bugs')
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
  const openTasks = data.tasks.filter((t) => t.status !== "DONE" && t.status !== "COMPLETED");
  
  const today = new Date();
  const todayLogs = data.logs.filter((l) => {
    const d = l.logDate ? new Date(l.logDate) : l.date ? new Date(l.date) : null;
    if (!d) return false;
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });
  
  const openBugs = data.bugs.filter((b) => ["OPEN", "REOPENED"].includes(b.status));

  const stats = [
    { icon: FolderKanban, label: "Active Projects", value: activeProjects.length, color: "#c847ff" },
    { icon: CheckSquare, label: "Open Tasks", value: openTasks.length, color: "#47c8ff" },
    { icon: Clock, label: "Logs Today", value: todayLogs.length, color: "#e8a847" },
    { icon: Bug, label: "Open Issues", value: openBugs.length, color: "#ff4747" },
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

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const thisWeekLogs = data.logs.filter(lg => new Date(lg.logDate || lg.created_at) >= weekStart);
  const countMap = {};
  thisWeekLogs.forEach(lg => {
    const uid = String(lg.userId?._id || lg.userId);
    if (!countMap[uid]) countMap[uid] = { userId: uid, userName: lg.userName || "Unknown", count: 0 };
    countMap[uid].count++;
  });
  const topPerformers = Object.values(countMap).sort((a, b) => b.count - a.count).slice(0, 3);
  
  
  return (
    <ScrollView 
      className={`flex-1 p-4 ${bgScreen}`} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={isDarkMode ? "#adc6ff" : "#2573e6"} />}
    >
      {/* Header */}
      <View className="mb-6 mt-2 flex-row justify-between items-center">
         <View className="flex-1 mr-3">
            <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>{user?.role?.name || user?.role || 'Employee'}</Text>
            <Text className={`text-xl font-bold ${textColor}`} numberOfLines={2}>Welcome back, <Text className={textAccent}>{user?.name || 'User'}</Text></Text>
         </View>
         <View className={`border px-3 py-2 flex-row items-center rounded flex-shrink-0 ${bgCard} ${borderColor}`}>
            <User size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
            <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>PORTAL</Text>
         </View>
      </View>

      {error && (
        <View className="bg-[#ff47471a] border border-[#ff47474d] rounded p-3 mb-4 flex-row items-center">
          <AlertCircle size={16} color="#ff4747" className="mr-2" />
          <Text className="text-[#ff4747] text-xs">{error}</Text>
        </View>
      )}

      {/* Stats Grid */}
      <View className="flex-row flex-wrap justify-between mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <View key={i} className={`w-[48%] mb-4 p-4 border rounded shadow-sm ${bgCard} ${borderColor}`}>
               <View className="flex-row justify-between items-start mb-2">
                 <Icon size={18} color={stat.color} />
                 <Text className={`text-2xl font-bold ${textColor}`}>{stat.value}</Text>
               </View>
               <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{stat.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Recent Tasks */}
      <View className={`border rounded shadow-sm mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center p-4 border-b ${borderColor}`}>
          <View className="flex-row items-center">
             <CheckSquare size={16} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
             <Text className={`font-bold uppercase tracking-widest text-xs ${textColor}`}>My Recent Tasks</Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('Tasks')} className="flex-row items-center">
             <Text className={`text-[10px] font-bold tracking-widest mr-1 ${textAccent}`}>VIEW ALL</Text>
             <ArrowRight size={12} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
          </TouchableOpacity>
        </View>
        <View className="p-2">
          {data.tasks.slice(0, 3).map((t, i) => (
             <View key={t._id || i} className={`p-3 border-b ${i === data.tasks.slice(0, 3).length - 1 ? 'border-transparent' : borderColor}`}>
               <View className="flex-row justify-between items-start mb-1">
                 <Text className={`flex-1 font-bold text-sm mr-2 ${textColor}`} numberOfLines={1}>{t.title}</Text>
                 <StatusBadge status={t.status} />
               </View>
               <Text className={`text-xs ${textMuted}`} numberOfLines={1}>{t.project?.name || 'No Project'}</Text>
             </View>
          ))}
          {data.tasks.length === 0 && !loading && (
             <Text className={`text-center py-6 text-sm ${textMuted}`}>No recent tasks found.</Text>
          )}
        </View>
      </View>

      {/* Recent Projects */}
      <View className={`border rounded shadow-sm mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center p-4 border-b ${borderColor}`}>
          <View className="flex-row items-center">
             <FolderKanban size={16} color="#c847ff" className="mr-2" />
             <Text className={`font-bold uppercase tracking-widest text-xs ${textColor}`}>Active Projects</Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('MyProjects')} className="flex-row items-center">
             <Text className={`text-[10px] font-bold tracking-widest mr-1 ${textAccent}`}>VIEW ALL</Text>
             <ArrowRight size={12} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
          </TouchableOpacity>
        </View>
        <View className="p-2">
          {activeProjects.slice(0, 3).map((p, i) => (
             <View key={p._id || i} className={`p-3 border-b ${i === activeProjects.slice(0, 3).length - 1 ? 'border-transparent' : borderColor}`}>
               <View className="flex-row justify-between items-start mb-1">
                 <Text className={`flex-1 font-bold text-sm mr-2 ${textColor}`} numberOfLines={1}>{p.name}</Text>
                 <StatusBadge status={p.status} />
               </View>
               {p.department?.departmentName && <Text className={`text-xs ${textMuted}`}>{p.department.departmentName}</Text>}
             </View>
          ))}
          {activeProjects.length === 0 && !loading && (
             <Text className={`text-center py-6 text-sm ${textMuted}`}>No active projects.</Text>
          )}
        </View>
      </View>

      {/* Top Performers */}
      <View className={`border rounded shadow-sm mb-6 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center p-4 border-b ${borderColor}`}>
          <View className="flex-row items-center">
             <Trophy size={16} color="#e8a847" className="mr-2" />
             <Text className={`font-bold uppercase tracking-widest text-xs ${textColor}`}>Top Performers This Week</Text>
          </View>
        </View>
        <View className="p-2">
          {topPerformers.map((p, i) => (
             <View key={p.userId || i} className={`p-3 border-b flex-row justify-between items-center ${i === topPerformers.length - 1 ? 'border-transparent' : borderColor}`}>
               <Text className={`font-bold text-sm flex-1 mr-2 ${textColor}`} numberOfLines={1}>{p.userName}</Text>
               <Text className={`text-xs font-bold ${textAccent}`}>{p.count} Logs</Text>
             </View>
          ))}
          {topPerformers.length === 0 && !loading && (
             <Text className={`text-center py-6 text-sm ${textMuted}`}>No top performers this week.</Text>
          )}
        </View>
      </View>

      {/* Open Issues */}
      <View className={`border rounded shadow-sm mb-8 ${bgCard} ${borderColor}`}>
        <View className={`flex-row justify-between items-center p-4 border-b ${borderColor}`}>
          <View className="flex-row items-center">
             <Bug size={16} color="#ff4747" className="mr-2" />
             <Text className={`font-bold uppercase tracking-widest text-xs ${textColor}`}>My Open Issues</Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('Issues')} className="flex-row items-center">
             <Text className={`text-[10px] font-bold tracking-widest mr-1 ${textAccent}`}>VIEW ALL</Text>
             <ArrowRight size={12} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
          </TouchableOpacity>
        </View>
        <View className="p-2">
          {openBugs.slice(0, 3).map((b, i) => (
             <View key={b._id || i} className={`p-3 border-b ${i === openBugs.slice(0, 3).length - 1 ? 'border-transparent' : borderColor}`}>
               <View className="flex-row justify-between items-start mb-1">
                 <Text className={`flex-1 font-bold text-sm mr-2 ${textColor}`} numberOfLines={1}>{b.title}</Text>
                 <Text className={`text-[10px] uppercase font-bold tracking-widest ${b.status === 'OPEN' ? 'text-[#ff4747]' : 'text-[#e8a847]'}`}>{b.status}</Text>
               </View>
               <Text className={`text-xs ${textMuted}`} numberOfLines={1}>{b.project?.name || 'No Project'}</Text>
             </View>
          ))}
          {openBugs.length === 0 && !loading && (
             <Text className={`text-center py-6 text-sm ${textMuted}`}>NO OPEN ISSUES — CREAT WORK!</Text>
          )}
        </View>
      </View>

    </ScrollView>
  );
}
