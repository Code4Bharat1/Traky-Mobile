import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Plus, Search, X, Check, AlertCircle, Eye, Pencil, Trash2 } from 'lucide-react-native';
import { getMyReports, getReports, createReport, updateReport, deleteReport, getProjects } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const UPDATE_TYPES = [
  { key:'call', label:'Call', color:'#47c8ff' }, { key:'email', label:'Email', color:'#e879a0' },
  { key:'demo', label:'Demo', color:'#e8a847' }, { key:'whatsapp', label:'WhatsApp', color:'#47ff8a' },
  { key:'review', label:'Review Meeting', color:'#f87343' },
];
const fmt = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const normalize = r => ({ id:r._id??r.id, types:r.types??[], projectId:typeof r.projectId==='object'?r.projectId?._id:(r.projectId??''), projectName:typeof r.projectId==='object'?r.projectId?.name:'', createdByName:typeof r.createdBy==='object'?r.createdBy?.name:'', date:r.date?new Date(r.date).toISOString().slice(0,10):'', notes:r.notes??'', clientResponse:r.clientResponse??'', weeklyIncluded:r.weeklyIncluded??false, monthlyIncluded:r.monthlyIncluded??false });

export default function ReportsScreen() {
  const { isDarkMode } = useThemeStore();
  const [myReports, setMyReports]     = useState([]);
  const [deptReports, setDeptReports] = useState([]);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [activeTab, setActiveTab]     = useState('department');
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState(null);

  const load = useCallback(async () => {
    try {
      const [my, dept, p] = await Promise.allSettled([getMyReports(), getReports(), getProjects()]);
      setMyReports(my.status==='fulfilled'?my.value.map(normalize):[]);
      setDeptReports(dept.status==='fulfilled'?dept.value.map(normalize):[]);
      setProjects(p.status==='fulfilled'?p.value:[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(()=>{load();},[load]);
  const onRefresh = ()=>{setRefreshing(true);load();};

  async function handleSave(form) {
    try {
      setSaving(true);
      if(modal.type==='edit') await updateReport(modal.report.id, form);
      else await createReport(form);
      setModal(null); load();
    } catch { Alert.alert('Error','Failed to save report.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(report) {
    Alert.alert('Delete Report','Delete this report?',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:async()=>{try{await deleteReport(report.id);load();}catch{Alert.alert('Error','Failed to delete.');}}},
    ]);
  }

  const activeList = activeTab==='department'?deptReports:myReports;
  const filtered = activeList.filter(r=>!search||r.notes?.toLowerCase().includes(search.toLowerCase())||r.projectName?.toLowerCase().includes(search.toLowerCase()));

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
        <View className={`flex-row border-b-0`}>
          {[{key:'department',label:'Dept'},{key:'mine',label:'Mine'}].map(t=>(
            <TouchableOpacity key={t.key} onPress={()=>setActiveTab(t.key)} className={`px-3 py-1.5 rounded-full border mr-2 ${activeTab===t.key?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${activeTab===t.key?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {activeTab==='mine'&&(
          <TouchableOpacity onPress={()=>setModal({type:'add'})} className={`flex-row items-center px-4 py-2 rounded-lg ${isDarkMode?'bg-[#adc6ff]':'bg-[#2573e6]'}`}>
            <Plus size={14} color={isDarkMode?'#131313':'#fff'}/>
            <Text className={`text-xs font-bold ml-1.5 uppercase tracking-widest ${isDarkMode?'text-[#131313]':'text-white'}`}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'}/>}>
        <View className="flex-row gap-2 mb-4">
          {[{label:'TOTAL',value:activeList.length,color:isDarkMode?'#fff':'#111'},{label:'IN WEEKLY',value:activeList.filter(r=>r.weeklyIncluded).length,color:'#10b981'},{label:'IN MONTHLY',value:activeList.filter(r=>r.monthlyIncluded).length,color:'#e8a847'}].map(s=>(
            <View key={s.label} className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
              <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{s.label}</Text>
              <Text style={{color:s.color}} className="text-xl font-bold">{loading?'—':s.value}</Text>
            </View>
          ))}
        </View>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-4 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode?'#888':'#9ca3af'}/>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search notes, project..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`}/>
          {!!search&&<TouchableOpacity onPress={()=>setSearch('')}><X size={14} color={isDarkMode?'#888':'#9ca3af'}/></TouchableOpacity>}
        </View>
        {loading?<ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/>:
         filtered.length===0?(
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <FileText size={32} color={isDarkMode?'#888':'#9ca3af'}/>
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No reports found</Text>
           </View>
         ):filtered.map(r=>(
           <View key={r.id} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
             <View className="flex-row justify-between items-start mb-2">
               <View className="flex-1"><Text className={`text-sm font-bold ${textColor}`}>{fmt(r.date)}</Text>{r.projectName&&<Text className={`text-[10px] mt-0.5 ${textMuted}`}>{r.projectName}</Text>}{r.createdByName&&<Text className={`text-[10px] ${textMuted}`}>By: {r.createdByName}</Text>}</View>
               <View className="flex-row gap-3 items-center">
                 <TouchableOpacity onPress={()=>setModal({type:'view',report:r})}><Eye size={14} color={isDarkMode?'#888':'#6b7280'}/></TouchableOpacity>
                 {activeTab==='mine'&&<><TouchableOpacity onPress={()=>setModal({type:'edit',report:r})}><Pencil size={13} color={isDarkMode?'#888':'#6b7280'}/></TouchableOpacity><TouchableOpacity onPress={()=>handleDelete(r)}><Trash2 size={13} color="#ef4444"/></TouchableOpacity></>}
               </View>
             </View>
             <View className="flex-row flex-wrap gap-2 mb-2">
               {r.types.map(t=>{const tm=UPDATE_TYPES.find(x=>x.key===t)||{label:t,color:'#9ca3af'};return(<View key={t} className="px-2 py-1 rounded border" style={{borderColor:tm.color+'50',backgroundColor:tm.color+'25'}}><Text style={{color:tm.color}} className="text-[9px] font-bold uppercase">{tm.label}</Text></View>);})}
             </View>
             {r.notes&&<Text className={`text-xs ${textMuted}`} numberOfLines={2}>{r.notes}</Text>}
             <View className="flex-row gap-2 mt-2">
               {r.weeklyIncluded&&<View className="bg-[#10b9811a] border border-[#10b98140] px-2 py-0.5 rounded"><Text className="text-[9px] font-bold text-[#10b981] uppercase">WEEKLY</Text></View>}
               {r.monthlyIncluded&&<View className="bg-[#e8a8471a] border border-[#e8a84740] px-2 py-0.5 rounded"><Text className="text-[9px] font-bold text-[#e8a847] uppercase">MONTHLY</Text></View>}
             </View>
           </View>
         ))}
        <View className="h-8"/>
      </ScrollView>
      {(modal?.type==='add'||modal?.type==='edit')&&(
        <ReportFormModal mode={modal.type} initial={modal.report} projects={projects} isDarkMode={isDarkMode} saving={saving} onClose={()=>setModal(null)} onSave={handleSave}/>
      )}
      {modal?.type==='view'&&<ReportDetailModal report={modal.report} isDarkMode={isDarkMode} onClose={()=>setModal(null)}/>}
    </SafeAreaView>
  );
}

function ReportFormModal({ mode, initial, projects, isDarkMode, saving, onClose, onSave }) {
  const today = new Date().toISOString().slice(0,10);
  const [form,setForm] = useState({ types:initial?.types??[], projectId:initial?.projectId??'', date:initial?.date??today, notes:initial?.notes??'', clientResponse:initial?.clientResponse??'', weeklyIncluded:initial?.weeklyIncluded??false, monthlyIncluded:initial?.monthlyIncluded??false });
  const [err,setErr] = useState('');
  const bgCard=isDarkMode?'bg-[#1c1b1b]':'bg-white'; const bgInputAlt=isDarkMode?'bg-[#131313]':'bg-gray-50'; const borderColor=isDarkMode?'border-[#ffffff1a]':'border-gray-200'; const textColor=isDarkMode?'text-white':'text-gray-900'; const textMuted=isDarkMode?'text-[#888]':'text-gray-500';
  function handle(){if(!form.types.length){setErr('Select at least one update type.');return;}setErr('');onSave(form);}
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[#000000cc]">
        <View className={`border-t rounded-t-2xl max-h-[92%] ${bgCard} ${borderColor}`}>
          <View className={`flex-row justify-between items-center p-6 pb-4 border-b ${borderColor}`}>
            <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{mode==='add'?'ADD REPORT':'EDIT REPORT'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}><X size={20} color={isDarkMode?'#888':'#6b7280'}/></TouchableOpacity>
          </View>
          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            <View className="h-4"/>
            {!!err&&<View className="flex-row items-center bg-[#ef44441a] border border-[#ef44444d] rounded-lg p-3 mb-4"><AlertCircle size={14} color="#ef4444"/><Text className="text-[#ef4444] text-xs ml-2">{err}</Text></View>}
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Update Type *</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {UPDATE_TYPES.map(t=>{const sel=form.types.includes(t.key);return(<TouchableOpacity key={t.key} onPress={()=>setForm(prev=>({...prev,types:sel?prev.types.filter(k=>k!==t.key):[...prev.types,t.key]}))} className="px-4 py-1.5 rounded-full border" style={{borderColor:sel?t.color:'#ffffff1a',backgroundColor:sel?t.color+'25':'transparent'}}><Text style={{color:sel?t.color:(isDarkMode?'#9ca3af':'#6b7280')}} className="text-[10px] font-bold">{t.label}</Text></TouchableOpacity>);})}
            </View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Project</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <TouchableOpacity onPress={()=>setForm({...form,projectId:''})} className={`mr-2 px-4 py-1.5 rounded-full border ${!form.projectId?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgInputAlt} ${borderColor}`}`}><Text className={`text-[10px] font-bold ${!form.projectId?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>None</Text></TouchableOpacity>
              {projects.map(p=>(<TouchableOpacity key={p._id} onPress={()=>setForm({...form,projectId:p._id})} className={`mr-2 px-4 py-1.5 rounded-full border ${form.projectId===p._id?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgInputAlt} ${borderColor}`}`}><Text className={`text-[10px] font-bold ${form.projectId===p._id?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{p.name}</Text></TouchableOpacity>))}
            </ScrollView>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Notes / Update</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}><TextInput value={form.notes} onChangeText={v=>setForm({...form,notes:v})} placeholder="What was discussed or done..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} multiline className={`text-xs min-h-[70px] ${textColor}`} textAlignVertical="top"/></View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Client Response</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}><TextInput value={form.clientResponse} onChangeText={v=>setForm({...form,clientResponse:v})} placeholder="Client feedback..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} multiline className={`text-xs min-h-[50px] ${textColor}`} textAlignVertical="top"/></View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Include In</Text>
            <View className="flex-row gap-3 mb-6">
              {[['weeklyIncluded','Weekly Report'],['monthlyIncluded','Monthly Report']].map(([field,label])=>(<TouchableOpacity key={field} onPress={()=>setForm(prev=>({...prev,[field]:!prev[field]}))} className={`flex-1 py-2.5 rounded-full border items-center ${form[field]?'bg-[#10b981] border-[#10b981]':`${bgInputAlt} ${borderColor}`}`}><Text className={`text-[10px] font-bold ${form[field]?'text-white':textColor}`}>{label}: {form[field]?'YES':'NO'}</Text></TouchableOpacity>))}
            </View>
          </ScrollView>
          <View className={`flex-row justify-end p-6 pt-4 border-t ${borderColor}`}>
            <TouchableOpacity onPress={onClose} disabled={saving} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handle} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode?'bg-[#adc6ff]':'bg-[#2573e6]'} ${saving?'opacity-50':''}`}>
              {saving?<ActivityIndicator size="small" color={isDarkMode?'#131313':'#fff'}/>:<><Check size={14} color={isDarkMode?'#131313':'#fff'}/><Text className={`font-bold text-sm ml-1.5 uppercase tracking-wider ${isDarkMode?'text-[#131313]':'text-white'}`}>{mode==='add'?'ADD':'SAVE'}</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReportDetailModal({ report, isDarkMode, onClose }) {
  const bgScreen=isDarkMode?'bg-[#131313]':'bg-gray-100'; const bgCard=isDarkMode?'bg-[#1c1b1b]':'bg-white'; const borderColor=isDarkMode?'border-[#ffffff1a]':'border-gray-200'; const textColor=isDarkMode?'text-white':'text-gray-900'; const textMuted=isDarkMode?'text-[#888]':'text-gray-500';
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 mt-10 rounded-t-2xl border-t ${bgScreen} ${borderColor}`}>
        <View className={`p-4 border-b flex-row justify-between items-center rounded-t-2xl ${bgCard} ${borderColor}`}>
          <Text className={`font-bold text-lg tracking-wider ${textColor}`}>REPORT DETAILS</Text>
          <TouchableOpacity onPress={onClose} className="bg-gray-500 p-2 rounded-full"><X size={16} color="#fff"/></TouchableOpacity>
        </View>
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className={`border rounded-lg p-4 mb-4 ${bgCard} ${borderColor}`}>
            {[{label:'DATE',value:fmt(report.date)},{label:'PROJECT',value:report.projectName||'—'},{label:'BY',value:report.createdByName||'—'}].filter(f=>f.value&&f.value!=='—').map(({label,value},i,arr)=>(<View key={label} className={`mb-3 ${i<arr.length-1?`pb-3 border-b ${borderColor}`:''}`}><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{label}</Text><Text className={`text-sm font-bold ${textColor}`}>{value}</Text></View>))}
          </View>
          <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>UPDATE TYPE</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {report.types.map(t=>{const tm=UPDATE_TYPES.find(x=>x.key===t)||{label:t,color:'#9ca3af'};return(<View key={t} className="px-3 py-1.5 rounded-full border" style={{borderColor:tm.color+'50',backgroundColor:tm.color+'25'}}><Text style={{color:tm.color}} className="text-[10px] font-bold uppercase">{tm.label}</Text></View>);})}
          </View>
          <View className={`border rounded-lg p-4 mb-4 ${bgCard} ${borderColor}`}>
            <Text className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>NOTES / UPDATE</Text>
            <Text className={`text-xs leading-5 ${textColor}`}>{report.notes||'—'}</Text>
          </View>
          <View className={`border rounded-lg p-4 mb-4 ${bgCard} ${borderColor}`}>
            <Text className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>CLIENT RESPONSE</Text>
            <Text className={`text-xs leading-5 ${textColor}`}>{report.clientResponse||'—'}</Text>
          </View>
          <View className="flex-row gap-3 mb-6">
            {[['weeklyIncluded','Weekly Report'],['monthlyIncluded','Monthly Report']].map(([field,label])=>(<View key={field} className={`flex-1 border rounded-lg p-3 ${report[field]?'border-[#10b98140] bg-[#10b9811a]':`${borderColor}`}`}><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{label}</Text><Text className={`text-xs font-bold uppercase ${report[field]?'text-[#10b981]':'text-[#ef4444]'}`}>{report[field]?'YES':'NO'}</Text></View>))}
          </View>
        </ScrollView>
        <View className={`p-4 border-t ${bgCard} ${borderColor}`}>
          <TouchableOpacity onPress={onClose} className={`w-full border py-3 rounded-lg items-center ${isDarkMode?'bg-[#201f1f]':'bg-gray-100'} ${borderColor}`}><Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>CLOSE</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
