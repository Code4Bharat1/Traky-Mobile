import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users2, Search, X, Clock, MapPin, Calendar } from 'lucide-react-native';
import { getAllAttendance, updateApprovalStatus } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const fmt = d => d ? new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
const STATUS_META = { pending:{label:'Pending',color:'#e8a847',bg:'bg-[#e8a8471a]',border:'border-[#e8a84740]'}, approved:{label:'Approved',color:'#10b981',bg:'bg-[#10b9811a]',border:'border-[#10b98140]'}, rejected:{label:'Rejected',color:'#ef4444',bg:'bg-[#ef44441a]',border:'border-[#ef444440]'} };
const FILTERS = ['all','pending','approved','rejected'];

export default function TeamAttendanceScreen() {
  const { isDarkMode } = useThemeStore();
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try { const { records: r } = await getAllAttendance({ limit: 100 }); setRecords(r || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleReview(id, action, notes) {
    await updateApprovalStatus(id, action, notes);
    setRecords(prev => prev.map(r => r._id === id ? { ...r, approvalStatus: action } : r));
    setSelected(null);
  }

  const filtered = records.filter(r => {
    const name = r.userId?.name || r.employeeName || '';
    return (!search || name.toLowerCase().includes(search.toLowerCase())) && (statusF==='all' || r.approvalStatus?.toLowerCase()===statusF);
  });

  const counts = { approved: records.filter(r=>r.approvalStatus==='approved').length, pending: records.filter(r=>!r.approvalStatus||r.approvalStatus==='pending').length };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className="h-2" />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'} />}>
        <View className="flex-row gap-2 mb-4">
          {[{label:'APPROVED',value:counts.approved,color:'#10b981'},{label:'PENDING REVIEW',value:counts.pending,color:'#e8a847'}].map(s=>(
            <View key={s.label} className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
              <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{s.label}</Text>
              <Text style={{color:s.color}} className="text-xl font-bold">{loading?'—':s.value}</Text>
            </View>
          ))}
        </View>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-3 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode?'#888':'#9ca3af'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search employee..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`} />
          {!!search && <TouchableOpacity onPress={()=>setSearch('')}><X size={14} color={isDarkMode?'#888':'#9ca3af'} /></TouchableOpacity>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {FILTERS.map(f=>(
            <TouchableOpacity key={f} onPress={()=>setStatusF(f)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${statusF===f?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${statusF===f?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{f==='all'?'All':STATUS_META[f]?.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading?<ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/>:
         filtered.length===0?(
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <Users2 size={32} color={isDarkMode?'#888':'#9ca3af'} />
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No attendance records</Text>
           </View>
         ):filtered.map(r=>{
           const name = r.userId?.name||r.employeeName||'Employee';
           const status = r.approvalStatus||'pending';
           const sm = STATUS_META[status]||STATUS_META.pending;
           const punchIn = r.punchIn?.time||r.checkIn;
           const punchOut = r.punchOut?.time||r.checkOut;
           return (
             <TouchableOpacity key={r._id} onPress={()=>setSelected(r)} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row justify-between items-start mb-2">
                 <View className="flex-1"><Text className={`text-sm font-bold ${textColor}`}>{name}</Text><Text className={`text-[10px] mt-0.5 ${textMuted}`}>{fmtDate(r.date||r.created_at)}</Text></View>
                 <View className={`px-2 py-1 rounded border ${sm.bg} ${sm.border}`}><Text style={{color:sm.color}} className="text-[9px] font-bold uppercase">{sm.label}</Text></View>
               </View>
               <View className="flex-row gap-4 mb-2">
                 <View className="flex-row items-center"><Clock size={11} color={isDarkMode?'#888':'#9ca3af'} /><Text className={`text-xs ml-1 ${textMuted}`}>In: {fmt(punchIn)}</Text></View>
                 <View className="flex-row items-center"><Clock size={11} color={isDarkMode?'#888':'#9ca3af'} /><Text className={`text-xs ml-1 ${textMuted}`}>Out: {punchOut?fmt(punchOut):'—'}</Text></View>
               </View>
               {status==='pending' && <Text className={`text-[10px] font-bold ${isDarkMode?'text-[#adc6ff]':'text-[#2573e6]'}`}>Tap to review →</Text>}
             </TouchableOpacity>
           );
         })}
        <View className="h-8" />
      </ScrollView>
      {selected && <AttendanceReviewModal record={selected} isDarkMode={isDarkMode} onClose={()=>setSelected(null)} onReview={handleReview} />}
    </SafeAreaView>
  );
}

function AttendanceReviewModal({ record, isDarkMode, onClose, onReview }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-100';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';
  const punchIn  = record.punchIn?.time||record.checkIn;
  const punchOut = record.punchOut?.time||record.checkOut;

  async function handle(action) {
    setSaving(true);
    try { await onReview(record._id, action, notes); }
    catch { Alert.alert('Error','Failed to update.'); setSaving(false); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 mt-10 rounded-t-2xl border-t ${bgScreen} ${borderColor}`}>
        <View className={`p-4 border-b flex-row justify-between items-center rounded-t-2xl ${bgCard} ${borderColor}`}>
          <Text className={`font-bold text-lg tracking-wider ${textColor}`}>ATTENDANCE REVIEW</Text>
          <TouchableOpacity onPress={onClose} className="bg-gray-500 p-2 rounded-full"><X size={16} color="#fff" /></TouchableOpacity>
        </View>
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className={`border rounded-lg p-4 mb-4 ${bgCard} ${borderColor}`}>
            {[{label:'EMPLOYEE',value:record.userId?.name||record.employeeName||'Employee'},{label:'DATE',value:fmtDate(record.date||record.created_at)}].map(({label,value})=>(
              <View key={label} className={`mb-3 pb-3 border-b ${borderColor}`}><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{label}</Text><Text className={`text-sm font-bold ${textColor}`}>{value}</Text></View>
            ))}
            <View className="flex-row gap-4">
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>PUNCH IN</Text><Text className={`text-sm font-bold ${textColor}`}>{fmt(punchIn)}</Text></View>
              <View className="flex-1"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>PUNCH OUT</Text><Text className={`text-sm font-bold ${textColor}`}>{punchOut?fmt(punchOut):'—'}</Text></View>
            </View>
            {record.punchIn?.address && <View className={`mt-3 pt-3 border-t ${borderColor}`}><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>LOCATION</Text><Text className={`text-xs ${textColor}`}>{record.punchIn.address}</Text></View>}
          </View>
          <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Review Notes (optional)</Text>
          <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
            <TextInput value={notes} onChangeText={setNotes} placeholder="Add review notes..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} multiline className={`text-xs min-h-[60px] ${textColor}`} textAlignVertical="top" />
          </View>
        </ScrollView>
        <View className={`p-4 flex-row gap-3 border-t ${bgCard} ${borderColor}`}>
          <TouchableOpacity onPress={onClose} className={`py-3 px-4 rounded-lg border items-center justify-center ${bgInputAlt} ${borderColor}`}><Text className={`font-bold text-xs uppercase ${textColor}`}>CANCEL</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>handle('rejected')} disabled={saving} className="flex-1 py-3 rounded-lg items-center border border-[#ef44444d] bg-[#ef44441a]">
            <Text className="text-[#ef4444] font-bold text-xs uppercase tracking-widest">REJECT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>handle('approved')} disabled={saving} className="flex-1 py-3 rounded-lg items-center justify-center bg-[#10b981]">
            {saving?<ActivityIndicator size="small" color="#fff"/>:<Text className="text-white font-bold text-xs uppercase tracking-widest">APPROVE</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
