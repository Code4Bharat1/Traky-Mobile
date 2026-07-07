import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookCheck, Search, X, Calendar, ChevronRight, BookOpen, Layers } from 'lucide-react-native';
import { getAllLogs, getUsers, getProjects } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const fmt = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

export default function DailyLogsScreen() {
  const { isDarkMode } = useThemeStore();
  const [logs, setLogs]         = useState([]);
  const [users, setUsers]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      const [l, u, p] = await Promise.allSettled([getAllLogs(), getUsers(), getProjects()]);
      setLogs(l.status==='fulfilled'?l.value:[]);
      setUsers(u.status==='fulfilled'?u.value:[]);
      setProjects(p.status==='fulfilled'?p.value:[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(()=>{load();},[load]);
  const onRefresh = ()=>{setRefreshing(true);load();};

  const getEmp = log => users.find(u=>String(u._id)===String(log.userId));
  const filtered = logs.filter(l=>{const emp=getEmp(l);const name=emp?.name||l.userName||'';return !search||name.toLowerCase().includes(search.toLowerCase());});
  const submittedToday = logs.filter(l=>(l.logDate||l.date||l.createdAt||'').startsWith(today)).length;
  const missingToday   = users.filter(u=>['employee','lead','contributor','reviewer'].includes(u.globalRole)&&!logs.some(l=>String(l.userId)===String(u._id)&&(l.logDate||'').startsWith(today))).length;

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
        <View className="flex-row gap-3">
          <View className={`border rounded-lg px-3 py-1.5 items-center ${bgCard} ${borderColor}`}>
            <Text className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${textMuted}`}>SUBMITTED</Text>
            <Text className="text-sm font-bold text-[#47c8ff]">{loading?'—':submittedToday}</Text>
          </View>
          <View className={`border rounded-lg px-3 py-1.5 items-center ${bgCard} ${borderColor}`}>
            <Text className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${textMuted}`}>MISSING</Text>
            <Text className="text-sm font-bold text-[#ef4444]">{loading?'—':missingToday}</Text>
          </View>
        </View>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'}/>}>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-4 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode?'#888':'#9ca3af'}/>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search employee or project..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`}/>
          {!!search&&<TouchableOpacity onPress={()=>setSearch('')}><X size={14} color={isDarkMode?'#888':'#9ca3af'}/></TouchableOpacity>}
        </View>
        {loading?<ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/>:
         filtered.length===0&&<View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}><BookOpen size={32} color={isDarkMode?'#888':'#9ca3af'}/><Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No logs found</Text></View>}
        {!loading&&filtered.map(log=>{
          const emp = getEmp(log);
          const firstEntry = log.entries?.[0]||{projectId:log.projectId,moduleName:log.moduleName};
          const proj = projects.find(p=>p._id===(firstEntry.projectId?._id||firstEntry.projectId));
          return (
            <TouchableOpacity key={log._id} onPress={()=>setSelected(log)} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className={`text-sm font-bold ${textColor}`}>{emp?.name||log.userName||'Unknown'}</Text>
                  <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{proj?.name||'No project'}</Text>
                  {firstEntry.moduleName&&<View className="flex-row items-center gap-1 mt-0.5"><Layers size={10} color={isDarkMode?'#888':'#9ca3af'}/><Text className={`text-[10px] ${textMuted}`}>{firstEntry.moduleName}</Text></View>}
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="bg-[#10b9811a] border border-[#10b98140] px-2 py-1 rounded-full"><Text className="text-[9px] font-bold text-[#10b981] uppercase">SUBMITTED</Text></View>
                  <ChevronRight size={14} color={isDarkMode?'#888':'#9ca3af'}/>
                </View>
              </View>
              <View className="flex-row items-center"><Calendar size={11} color={isDarkMode?'#888':'#9ca3af'}/><Text className={`text-xs ml-1 ${textMuted}`}>{fmt(log.logDate||log.date||log.createdAt)}</Text></View>
            </TouchableOpacity>
          );
        })}
        {/* Missing logs */}
        {!loading&&!search&&users.filter(u=>['employee','lead'].includes(u.globalRole)&&!logs.some(l=>String(l.userId)===String(u._id)&&(l.logDate||'').startsWith(today))).map(u=>(
          <View key={`missing-${u._id}`} className={`border rounded-lg p-4 mb-3 opacity-70 ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center">
              <View><Text className={`text-sm font-bold ${textColor}`}>{u.name}</Text><Text className={`text-[10px] mt-0.5 ${textMuted}`}>No log submitted today</Text></View>
              <View className="bg-[#ef44441a] border border-[#ef44444d] px-2 py-1 rounded-full"><Text className="text-[9px] font-bold text-[#ef4444] uppercase">MISSING</Text></View>
            </View>
          </View>
        ))}
        <View className="h-8"/>
      </ScrollView>
      {selected&&<LogDetailModal log={selected} users={users} projects={projects} isDarkMode={isDarkMode} onClose={()=>setSelected(null)}/>}
    </SafeAreaView>
  );
}

function LogDetailModal({ log, users, projects, isDarkMode, onClose }) {
  const bgScreen=isDarkMode?'bg-[#131313]':'bg-gray-100'; const bgCard=isDarkMode?'bg-[#1c1b1b]':'bg-white'; const bgInputAlt=isDarkMode?'bg-[#131313]':'bg-gray-50'; const borderColor=isDarkMode?'border-[#ffffff1a]':'border-gray-200'; const textColor=isDarkMode?'text-white':'text-gray-900'; const textMuted=isDarkMode?'text-[#888]':'text-gray-500';
  const emp = users.find(u=>String(u._id)===String(log.userId));
  const entries = log.entries?.length ? log.entries : [{projectId:log.projectId,moduleName:log.moduleName,description:log.description}];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 mt-10 rounded-t-2xl border-t ${bgScreen} ${borderColor}`}>
        <View className={`p-4 border-b flex-row justify-between items-center rounded-t-2xl ${bgCard} ${borderColor}`}>
          <View className="flex-row items-center"><BookCheck size={16} color={isDarkMode?'#adc6ff':'#2573e6'}/><Text className={`font-bold text-lg tracking-wider ml-2 ${textColor}`}>LOG DETAILS</Text></View>
          <TouchableOpacity onPress={onClose} className="bg-gray-500 p-2 rounded-full"><X size={16} color="#fff"/></TouchableOpacity>
        </View>
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className={`border rounded-lg p-4 mb-4 ${bgCard} ${borderColor}`}>
            <View className="flex-row gap-4 mb-3">
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>EMPLOYEE</Text><Text className={`text-sm font-bold ${textColor}`}>{emp?.name||log.userName||'Unknown'}</Text></View>
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>DATE</Text><Text className={`text-sm font-bold ${textColor}`}>{fmt(log.logDate||log.date||log.createdAt)}</Text></View>
            </View>
          </View>
          <Text className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>WORK ENTRIES ({entries.length})</Text>
          {entries.map((entry,i)=>{
            const proj = projects.find(p=>p._id===(entry.projectId?._id||entry.projectId));
            return (
              <View key={i} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
                <View className="flex-row gap-4 mb-3">
                  <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>PROJECT</Text><Text className={`text-sm font-bold ${textColor}`}>{proj?.name||entry.projectName||'—'}</Text></View>
                  <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>MODULE</Text><Text className={`text-sm font-bold ${textColor}`}>{entry.moduleTitle||entry.moduleName||'N/A'}</Text></View>
                </View>
                <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>DESCRIPTION</Text>
                <View className={`border rounded-lg p-3 ${bgInputAlt} ${borderColor}`}><Text className={`text-xs leading-5 ${textColor}`}>{entry.description||'No description.'}</Text></View>
              </View>
            );
          })}
          {log.todos?.length>0&&<View className="mb-4">
            <Text className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>TODAY'S PLANNED TASKS</Text>
            {log.todos.map((t,i)=>(<View key={i} className="flex-row items-center gap-2 mb-2">
              <View className={`w-4 h-4 rounded border items-center justify-center ${t.completed?'bg-[#10b9811a] border-[#10b98140]':borderColor}`}>{t.completed&&<Text className="text-[#10b981] text-[8px]">✓</Text>}</View>
              <Text className={`text-xs ${t.completed?'text-[#10b981]':textColor} ${t.completed?'line-through':''}`}>{t.task}</Text>
            </View>))}
          </View>}
        </ScrollView>
        <View className={`p-4 border-t ${bgCard} ${borderColor}`}>
          <TouchableOpacity onPress={onClose} className={`w-full border py-3 rounded-lg items-center ${isDarkMode?'bg-[#201f1f]':'bg-gray-100'} ${borderColor}`}><Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>CLOSE</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
