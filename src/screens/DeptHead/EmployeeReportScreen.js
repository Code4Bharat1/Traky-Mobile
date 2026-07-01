import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, CheckCircle2, Clock, ClipboardList, Bug, Users, TrendingUp } from 'lucide-react-native';
import { getLeaderboard, getUsers } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const PERIODS = [{ key:'all', label:'All Time' }, { key:'weekly', label:'Weekly' }, { key:'monthly', label:'Monthly' }, { key:'quarterly', label:'Quarterly' }];

function scoreColor(s) { if(s>=80)return'#47ff8a'; if(s>=60)return'#2573e6'; if(s>=40)return'#e8a847'; return'#ef4444'; }
const ROLE_META = { department_head:'Dept Head', lead:'Lead', project_manager:'Manager', employee:'Employee' };

export default function EmployeeReportScreen() {
  const { isDarkMode } = useThemeStore();
  const [data, setData]       = useState([]);
  const [users, setUsers]     = useState([]);
  const [deptAvg, setDeptAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]   = useState('all');

  const load = useCallback(async () => {
    try {
      const [lb, u] = await Promise.allSettled([getLeaderboard(period), getUsers()]);
      setData(lb.status==='fulfilled'?lb.value?.data||[]:[]);
      setDeptAvg(lb.status==='fulfilled'?lb.value?.departmentAverage||0:0);
      setUsers(u.status==='fulfilled'?u.value:[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  React.useEffect(()=>{load();},[load]);
  const onRefresh = ()=>{setRefreshing(true);load();};

  const enriched = data.map(entry => {
    const user = users.find(u=>String(u._id)===String(entry.userId));
    return { ...entry, email:user?.email, role:user?.globalRole };
  });

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-end items-center px-4 py-3 border-b ${borderColor}`}>
        <View className={`border rounded-lg px-3 py-1.5 ${bgCard} ${borderColor}`}>
          <Text className={`text-[9px] font-bold uppercase tracking-widest ${textMuted}`}>DEPT AVG: <Text className={textColor}>{deptAvg} pts</Text></Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'}/>}>

        {/* Summary stats */}
        <View className="flex-row gap-2 mb-4">
          {[{label:'EMPLOYEES',value:data.length,color:isDarkMode?'#adc6ff':'#2573e6'},{label:'AVG SCORE',value:`${deptAvg}`,color:'#e8a847'},{label:'TOP SCORE',value:data[0]?.score||0,color:'#47ff8a'}].map(s=>(
            <View key={s.label} className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
              <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{s.label}</Text>
              <Text style={{color:s.color}} className="text-xl font-bold">{loading?'—':s.value}</Text>
            </View>
          ))}
        </View>

        {/* Period selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {PERIODS.map(p=>(
            <TouchableOpacity key={p.key} onPress={()=>setPeriod(p.key)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${period===p.key?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${period===p.key?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/> :
         enriched.length === 0 ? (
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <BarChart3 size={32} color={isDarkMode?'#888':'#9ca3af'}/>
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No data available</Text>
           </View>
         ) : enriched.map((emp, i) => {
           const sColor = scoreColor(emp.score);
           const topScore = data[0]?.score || 1;
           const barW = Math.round((emp.score / topScore) * 100);
           return (
             <View key={emp.userId||i} className={`border rounded-2xl p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row items-center mb-3">
                 {/* Rank */}
                 <View className={`w-8 h-8 rounded items-center justify-center mr-3 border ${isDarkMode?'bg-[#1f2937] border-[#374151]':'bg-gray-100 border-gray-200'}`}>
                   <Text className={`text-xs font-bold uppercase ${textMuted}`}>{emp.rank}</Text>
                 </View>
                 {/* Avatar */}
                 <View className="w-9 h-9 rounded-full items-center justify-center mr-3 border" style={{backgroundColor:'#2573e620',borderColor:'#2573e640'}}>
                   <Text style={{color:'#2573e6',fontSize:13,fontWeight:'700'}}>{emp.name?.charAt(0)?.toUpperCase()||'?'}</Text>
                 </View>
                 <View className="flex-1">
                   <Text className={`text-sm font-bold ${textColor}`} numberOfLines={1}>{emp.name}</Text>
                   {emp.role&&<Text className={`text-[10px] mt-0.5 ${textMuted}`}>{ROLE_META[emp.role]||emp.role}</Text>}
                 </View>
                 <View className="border rounded-lg px-2 py-1.5" style={{borderColor:sColor+'40',backgroundColor:sColor+'18'}}>
                   <Text style={{color:sColor}} className="text-xs font-black">{emp.score} pts</Text>
                 </View>
               </View>
               {/* Metrics */}
               <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mb-3">
                 <View className="flex-row items-center gap-1"><CheckCircle2 size={12} color="#10b981"/><Text className={`text-[10px] ${textMuted}`}>Tasks: </Text><Text className={`text-[10px] font-bold ${textColor}`}>{emp.tasksCompleted||0}/{emp.tasksTotal||0}</Text></View>
                 <View className="flex-row items-center gap-1"><Clock size={12} color={(emp.tasksOverdue||0)>0?'#ef4444':'#10b981'}/><Text className={`text-[10px] ${textMuted}`}>Overdue: </Text><Text className={`text-[10px] font-bold ${textColor}`}>{emp.tasksOverdue||0}</Text></View>
                 {emp.logsCount!=null&&<View className="flex-row items-center gap-1"><ClipboardList size={12} color="#47c8ff"/><Text className={`text-[10px] ${textMuted}`}>Logs: </Text><Text className={`text-[10px] font-bold ${textColor}`}>{emp.logsCount}</Text></View>}
                 {emp.openBugs!=null&&<View className="flex-row items-center gap-1"><Bug size={12} color={(emp.openBugs||0)>0?'#ef4444':'#10b981'}/><Text className={`text-[10px] ${textMuted}`}>Bugs: </Text><Text className={`text-[10px] font-bold ${textColor}`}>{emp.openBugs}</Text></View>}
               </View>
               {/* Score bar */}
               <View className={`h-2 rounded-full overflow-hidden ${isDarkMode?'bg-[#27272a]':'bg-gray-200'}`}>
                 <View className="h-full rounded-full" style={{width:`${barW}%`,backgroundColor:sColor}}/>
               </View>
             </View>
           );
         })}
        <View className="h-8"/>
      </ScrollView>
    </SafeAreaView>
  );
}
