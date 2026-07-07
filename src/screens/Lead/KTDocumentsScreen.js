import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Search, X, Eye, FileText, Film, Globe, Users, Lock, Calendar, Download } from 'lucide-react-native';
import { getKtDocuments, getProjects } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const VISIBILITY_META = { team:{label:'Team',Icon:Lock,color:'#e8a847'}, department:{label:'Department',Icon:Users,color:'#47c8ff'}, company:{label:'Company',Icon:Globe,color:'#47ff8a'} };

export default function KTDocumentsScreen() {
  const { isDarkMode } = useThemeStore();
  const [docs, setDocs]         = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [projFilter, setProjFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const [d, p] = await Promise.allSettled([getKtDocuments({ projectId: projFilter||undefined }), getProjects()]);
      setDocs(d.status==='fulfilled'?d.value:[]);
      setProjects(p.status==='fulfilled'?p.value:[]);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [projFilter]);

  React.useEffect(()=>{load();},[load]);
  const onRefresh = ()=>{setRefreshing(true);load();};

  const filtered = docs.filter(d=>!search||d.title?.toLowerCase().includes(search.toLowerCase())||d.content?.toLowerCase().includes(search.toLowerCase())||d.tags?.some(t=>t.toLowerCase().includes(search.toLowerCase())));
  const hasFiles = d=>(d.files?.length||0)>0||!!d.fileUrl;
  const isVideo  = d=>{const f=d.files?.[0]||{type:d.fileType};return['webm','mp4','mov','avi'].includes(f?.type?.toLowerCase());};

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-end px-4 py-3 border-b ${borderColor}`}>
        <View className={`flex-row items-center gap-1.5 border rounded-lg px-3 py-1.5 ${bgCard} ${borderColor}`}>
          <Eye size={12} color={isDarkMode?'#888':'#6b7280'}/><Text className={`text-[10px] font-bold uppercase ${textMuted}`}>VIEW ONLY</Text>
        </View>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'}/>}>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-3 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode?'#888':'#9ca3af'}/>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by title, tag..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`}/>
          {!!search&&<TouchableOpacity onPress={()=>setSearch('')}><X size={14} color={isDarkMode?'#888':'#9ca3af'}/></TouchableOpacity>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <TouchableOpacity onPress={()=>setProjFilter('')} className={`mr-2 px-4 py-1.5 rounded-full border ${!projFilter?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}>
            <Text className={`text-[10px] font-bold ${!projFilter?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>All Projects</Text>
          </TouchableOpacity>
          {projects.map(p=>(<TouchableOpacity key={p._id} onPress={()=>setProjFilter(p._id)} className={`mr-2 px-4 py-1.5 rounded-full border ${projFilter===p._id?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}><Text className={`text-[10px] font-bold ${projFilter===p._id?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{p.name}</Text></TouchableOpacity>))}
        </ScrollView>
        {loading?<ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/>:
         filtered.length===0?(
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}><BookOpen size={32} color={isDarkMode?'#888':'#9ca3af'}/><Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No KT documents found</Text></View>
         ):filtered.map(doc=>{
           const vm = VISIBILITY_META[doc.visibility]||VISIBILITY_META.team;
           const VIcon = vm.Icon;
           return (
             <TouchableOpacity key={doc._id} onPress={()=>setSelected(doc)} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row gap-3 items-start">
                 <View className="w-10 h-10 rounded-lg items-center justify-center" style={{backgroundColor:'#2573e620',borderWidth:1,borderColor:'#2573e640'}}>
                   {hasFiles(doc)&&isVideo(doc)?<Film size={18} color="#2573e6"/>:<FileText size={18} color="#2573e6"/>}
                 </View>
                 <View className="flex-1">
                   <Text className={`text-sm font-bold mb-1 ${textColor}`} numberOfLines={1}>{doc.title}</Text>
                   {doc.content&&<Text className={`text-xs ${textMuted}`} numberOfLines={2}>{doc.content}</Text>}
                   <View className="flex-row flex-wrap gap-2 mt-2">
                     <View className="flex-row items-center gap-1 px-2 py-1 rounded border" style={{borderColor:vm.color+'40',backgroundColor:vm.color+'18'}}><VIcon size={10} color={vm.color}/><Text style={{color:vm.color}} className="text-[9px] font-bold uppercase">{vm.label}</Text></View>
                     {doc.tags?.slice(0,2).map(t=>(<View key={t} className={`px-2 py-0.5 rounded border ${bgCard} ${borderColor}`}><Text className={`text-[9px] ${textMuted}`}>#{t}</Text></View>))}
                   </View>
                 </View>
                 <View className="flex-row items-center gap-1 px-2 py-1.5 rounded border border-[#2573e640] bg-[#2573e618]">
                   <Eye size={11} color="#2573e6"/><Text className="text-[9px] font-bold text-[#2573e6]">VIEW</Text>
                 </View>
               </View>
             </TouchableOpacity>
           );
         })}
        <View className="h-8"/>
      </ScrollView>
      {selected&&<DocDetailModal doc={selected} isDarkMode={isDarkMode} onClose={()=>setSelected(null)}/>}
    </SafeAreaView>
  );
}

function DocDetailModal({ doc, isDarkMode, onClose }) {
  const bgScreen=isDarkMode?'bg-[#131313]':'bg-gray-100'; const bgCard=isDarkMode?'bg-[#1c1b1b]':'bg-white'; const bgInputAlt=isDarkMode?'bg-[#131313]':'bg-gray-50'; const borderColor=isDarkMode?'border-[#ffffff1a]':'border-gray-200'; const textColor=isDarkMode?'text-white':'text-gray-900'; const textMuted=isDarkMode?'text-[#888]':'text-gray-500';
  const vm = VISIBILITY_META[doc.visibility]||VISIBILITY_META.team;
  const VIcon = vm.Icon;
  const allFiles = doc.files?.length ? doc.files : doc.fileUrl ? [{url:doc.fileUrl,name:'Attachment',type:doc.fileType}] : [];
  const videoFiles = allFiles.filter(f=>['webm','mp4','mov','avi'].includes(f.type?.toLowerCase()));
  const otherFiles = allFiles.filter(f=>!['webm','mp4','mov','avi'].includes(f.type?.toLowerCase()));

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 mt-10 rounded-t-2xl border-t ${bgScreen} ${borderColor}`}>
        <View className={`p-4 border-b flex-row justify-between items-start rounded-t-2xl ${bgCard} ${borderColor}`}>
          <View className="flex-1 mr-4"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>KT DOCUMENT</Text><Text className={`font-bold text-lg ${textColor}`} numberOfLines={2}>{doc.title}</Text></View>
          <TouchableOpacity onPress={onClose} className="bg-gray-500 p-2 rounded-full"><X size={16} color="#fff"/></TouchableOpacity>
        </View>
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-2 bg-[#2573e610] border border-[#2573e640] rounded-lg p-3 mb-4">
            <Eye size={12} color="#2573e6"/><Text className="text-[10px] font-bold text-[#2573e6] uppercase tracking-widest">VIEW-ONLY MODE</Text>
          </View>
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border" style={{borderColor:vm.color+'40',backgroundColor:vm.color+'18'}}><VIcon size={10} color={vm.color}/><Text style={{color:vm.color}} className="text-[10px] font-bold uppercase">{vm.label}</Text></View>
            {doc.created_at&&<View className="flex-row items-center gap-1"><Calendar size={11} color={isDarkMode?'#888':'#9ca3af'}/><Text className={`text-[10px] ${textMuted}`}>{new Date(doc.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</Text></View>}
          </View>
          {doc.tags?.length>0&&<View className="flex-row flex-wrap gap-2 mb-4">{doc.tags.map(t=>(<View key={t} className={`border rounded px-2 py-1 ${bgCard} ${borderColor}`}><Text className={`text-[9px] ${textMuted}`}>#{t}</Text></View>))}</View>}
          {doc.content&&<View className="mb-4"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>DESCRIPTION</Text><View className={`border rounded-lg p-3 ${bgInputAlt} ${borderColor}`}><Text className={`text-xs leading-5 ${textColor}`}>{doc.content}</Text></View></View>}
          {videoFiles.length>0&&<View className="mb-4"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>VIDEO ATTACHMENTS ({videoFiles.length})</Text>{videoFiles.map((f,i)=>(<View key={i} className={`flex-row items-center gap-3 border rounded-lg p-3 mb-2 ${bgInputAlt} ${borderColor}`}><Film size={16} color="#2573e6"/><Text className={`flex-1 text-xs ${textColor}`} numberOfLines={1}>{f.name||`Video ${i+1}`}</Text><Text className={`text-[9px] uppercase font-bold ${textMuted}`}>{f.type}</Text></View>))}</View>}
          {otherFiles.length>0&&<View className="mb-4"><Text className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>DOCUMENTS ({otherFiles.length})</Text>{otherFiles.map((f,i)=>(<View key={i} className={`flex-row items-center gap-3 border rounded-lg p-3 mb-2 ${bgInputAlt} ${borderColor}`}><FileText size={16} color="#2573e6"/><Text className={`flex-1 text-xs ${textColor}`} numberOfLines={1}>{f.name||`File ${i+1}`}</Text><Download size={14} color={isDarkMode?'#888':'#6b7280'}/></View>))}</View>}
        </ScrollView>
        <View className={`p-4 border-t ${bgCard} ${borderColor}`}>
          <TouchableOpacity onPress={onClose} className={`w-full border py-3 rounded-lg items-center ${isDarkMode?'bg-[#201f1f]':'bg-gray-100'} ${borderColor}`}><Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>CLOSE VIEWER</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
