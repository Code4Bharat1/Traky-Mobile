import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Medal, Award, CheckCircle2, Clock, ClipboardList, Star, TrendingUp, BarChart2, X } from 'lucide-react-native';
import { getLeaderboard } from '../../api/services';
import { Modal } from 'react-native';
import useThemeStore from '../../store/themeStore';

const PERIODS = [{ key:'all', label:'All Time' }, { key:'weekly', label:'Weekly' }, { key:'monthly', label:'Monthly' }, { key:'quarterly', label:'Quarterly' }];

function scoreColor(s) { if(s>=80)return'#47ff8a'; if(s>=60)return'#2573e6'; if(s>=40)return'#e8a847'; return'#ef4444'; }

export default function LeaderboardScreen() {
  const { isDarkMode } = useThemeStore();
  const [data, setData]       = useState([]);
  const [deptAvg, setDeptAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]   = useState('all');
  const [selectedEmp, setSelectedEmp] = useState(null);

  const load = useCallback(async () => {
    try { const result = await getLeaderboard(period); setData(result?.data||[]); setDeptAvg(result?.departmentAverage||0); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  React.useEffect(()=>{load();},[load]);
  const onRefresh = ()=>{setRefreshing(true);load();};

  const topScore = data[0]?.score || 0;

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
            <Text className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${textMuted}`}>DEPT AVG</Text>
            <Text className="text-sm font-bold text-[#e8a847]">{deptAvg} pts</Text>
          </View>
          <View className={`border rounded-lg px-3 py-1.5 items-center ${bgCard} ${borderColor}`}>
            <Text className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${textMuted}`}>TOP SCORE</Text>
            <Text className="text-sm font-bold text-[#47ff8a]">{topScore} pts</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'}/>}>

        {/* Info note */}
        <View className={`flex-row items-center gap-2 border rounded-lg p-3 mb-4 ${bgCard} ${borderColor}`}>
          <Star size={12} color="#e8a847"/>
          <Text className={`text-xs flex-1 ${textMuted}`}>Points: task completion, daily logs. Deductions: missed deadlines, overdue tasks.</Text>
        </View>

        {/* Period chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {PERIODS.map(p=>(
            <TouchableOpacity key={p.key} onPress={()=>setPeriod(p.key)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${period===p.key?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${period===p.key?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/> :
         data.length === 0 ? (
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <Trophy size={32} color={isDarkMode?'#888':'#9ca3af'}/>
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No data available</Text>
           </View>
         ) : data.map((emp, i) => {
           const sColor = scoreColor(emp.score);
           const barW = topScore > 0 ? Math.round((emp.score / topScore) * 100) : 0;
           const isGold = i === 0, isSilver = i === 1, isBronze = i === 2;
           const cardStyle = isGold ? `border-2 ${isDarkMode?'bg-[#e8a8471a] border-[#e8a84740]':'bg-yellow-50 border-yellow-200'}` :
                            isSilver ? `border ${isDarkMode?'bg-[#9ca3af1a] border-[#9ca3af40]':'bg-gray-50 border-gray-300'}` :
                            isBronze ? `border ${isDarkMode?'bg-[#f873431a] border-[#f8734340]':'bg-orange-50 border-orange-200'}` :
                            `border ${bgCard} ${borderColor}`;
           return (
             <TouchableOpacity key={emp.userId||i} onPress={() => setSelectedEmp(emp)} className={`rounded-2xl p-5 mb-4 ${cardStyle}`}>
               <View className="flex-row items-center mb-4">
                 {/* Rank badge */}
                 <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isGold?'bg-[#e8a847]':isSilver?'bg-[#9ca3af]':isBronze?'bg-[#b45309]':(isDarkMode?'bg-[#1f1f22]':'bg-gray-100')}`}>
                   {isGold?<Trophy size={18} color="#fff"/>:isSilver?<Medal size={18} color="#fff"/>:isBronze?<Award size={18} color="#fff"/>:<Text style={{color:isDarkMode?'#a1a1aa':'#6b7280',fontWeight:'700'}} className="text-sm">#{i+1}</Text>}
                 </View>
                 {/* Avatar */}
                 <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${isDarkMode?'bg-[#27272a] border-[#3f3f46]':'bg-gray-100 border-gray-300'}`}>
                   <Text style={{color:isDarkMode?'#a1a1aa':'#6b7280',fontWeight:'700',fontSize:13}}>{emp.name?.charAt(0)?.toUpperCase()||'?'}</Text>
                 </View>
                 <View className="flex-1">
                   <Text className={`text-base font-bold ${textColor}`} numberOfLines={1}>{emp.name||'Anonymous'}</Text>
                   {i===0&&<Text className="text-[10px] font-bold text-[#e8a847] uppercase tracking-widest mt-0.5">Current Leader</Text>}
                 </View>
                 <View className="items-end">
                   <Text style={{color:isGold?'#e8a847':isSilver?'#9ca3af':isBronze?'#b45309':sColor}} className="text-2xl font-black">{emp.score}</Text>
                   <Text className={`text-[9px] font-bold uppercase tracking-widest ${textMuted}`}>PTS</Text>
                 </View>
               </View>
               {/* Stats row */}
               <View className="flex-row gap-3 mb-4">
                 <View className={`flex-1 flex-row items-center gap-1.5 border rounded-xl p-2.5 ${isDarkMode?'bg-[#1f1f22] border-[#27272a]':'bg-white border-gray-200'}`}>
                   <CheckCircle2 size={13} color="#10b981"/>
                   <Text className={`text-[10px] font-bold ${textColor}`}>{emp.tasksCompleted||0}/{emp.tasksTotal||0}</Text>
                   <Text className={`text-[9px] ${textMuted}`}>tasks</Text>
                 </View>
                 <View className={`flex-1 flex-row items-center gap-1.5 border rounded-xl p-2.5 ${isDarkMode?'bg-[#1f1f22] border-[#27272a]':'bg-white border-gray-200'}`}>
                   <Clock size={13} color={(emp.tasksOverdue||0)>0?'#ef4444':'#10b981'}/>
                   <Text className={`text-[10px] font-bold ${textColor}`}>{emp.tasksOverdue||0}</Text>
                   <Text className={`text-[9px] ${textMuted}`}>overdue</Text>
                 </View>
                 {emp.logsCount!=null&&<View className={`flex-1 flex-row items-center gap-1.5 border rounded-xl p-2.5 ${isDarkMode?'bg-[#1f1f22] border-[#27272a]':'bg-white border-gray-200'}`}>
                   <ClipboardList size={13} color="#47c8ff"/>
                   <Text className={`text-[10px] font-bold ${textColor}`}>{emp.logsCount}</Text>
                   <Text className={`text-[9px] ${textMuted}`}>logs</Text>
                 </View>}
               </View>
               {/* Score bar */}
               <View className={`h-2 rounded-full overflow-hidden ${isDarkMode?'bg-[#27272a]':'bg-gray-200'}`}>
                 <View className="h-full rounded-full" style={{width:`${barW}%`,backgroundColor:isGold?'#e8a847':isSilver?'#9ca3af':isBronze?'#b45309':sColor}}/>
               </View>
             </TouchableOpacity>
           );
         })}
        <View className="h-8"/>
      </ScrollView>

      {selectedEmp && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setSelectedEmp(null)}>
          <View className="flex-1 justify-end bg-[#000000cc]">
            <View className={`border-t rounded-t-2xl p-6 pb-8 ${bgCard} ${borderColor}`}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>EMPLOYEE STATS</Text>
                <TouchableOpacity onPress={() => setSelectedEmp(null)}><X size={20} color={isDarkMode ? '#888' : '#6b7280'} /></TouchableOpacity>
              </View>
              <View className="items-center mb-6">
                 <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 border ${isDarkMode?'bg-[#27272a] border-[#3f3f46]':'bg-gray-100 border-gray-300'}`}>
                   <Text style={{color:isDarkMode?'#a1a1aa':'#6b7280',fontWeight:'700',fontSize:24}}>{selectedEmp.name?.charAt(0)?.toUpperCase()||'?'}</Text>
                 </View>
                 <Text className={`text-lg font-bold ${textColor}`}>{selectedEmp.name}</Text>
                 <Text className={`text-2xl font-black mt-2`} style={{ color: scoreColor(selectedEmp.score) }}>{selectedEmp.score} PTS</Text>
              </View>
              <View className={`border rounded-lg p-4 mb-4 ${isDarkMode?'bg-[#131313]':'bg-gray-50'} ${borderColor}`}>
                <View className="flex-row justify-between py-2 border-b border-[#ffffff1a]"><Text className={textMuted}>Tasks Completed</Text><Text className={`font-bold ${textColor}`}>{selectedEmp.tasksCompleted||0}</Text></View>
                <View className="flex-row justify-between py-2 border-b border-[#ffffff1a]"><Text className={textMuted}>Tasks Total</Text><Text className={`font-bold ${textColor}`}>{selectedEmp.tasksTotal||0}</Text></View>
                <View className="flex-row justify-between py-2 border-b border-[#ffffff1a]"><Text className={textMuted}>Tasks Overdue</Text><Text className={`font-bold text-[#ef4444]`}>{selectedEmp.tasksOverdue||0}</Text></View>
                <View className="flex-row justify-between py-2"><Text className={textMuted}>Logs Submitted</Text><Text className={`font-bold ${textColor}`}>{selectedEmp.logsCount||0}</Text></View>
              </View>
              <TouchableOpacity onPress={() => setSelectedEmp(null)} className={`w-full py-3 rounded-lg items-center ${isDarkMode?'bg-[#adc6ff]':'bg-[#2573e6]'}`}>
                <Text className={`font-bold text-sm uppercase tracking-wider ${isDarkMode?'text-[#131313]':'text-white'}`}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
