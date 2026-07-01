import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bug, Plus, Search, X, Check, AlertCircle, Pencil, Trash2 } from 'lucide-react-native';
import { getAllBugs, getBugsReportedByMe, createBug, updateBug, deleteBug, getProjects, getUsers } from '../../api/services';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const SEV_META  = { LOW: { label:'Low', color:'#47c8ff' }, MEDIUM: { label:'Medium', color:'#e8a847' }, HIGH: { label:'High', color:'#f87343' }, CRITICAL: { label:'Critical', color:'#ef4444' } };
const STAT_META = { OPEN: { label:'Open', color:'#ef4444' }, IN_PROGRESS: { label:'In Progress', color:'#47c8ff' }, RESOLVED: { label:'Resolved', color:'#10b981' }, CLOSED: { label:'Closed', color:'#6b7280' } };
const SEVERITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];
const STATUSES_F = ['all','OPEN','IN_PROGRESS','RESOLVED'];

export default function IssuesScreen() {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [allBugs, setAllBugs]   = useState([]);
  const [myBugs, setMyBugs]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [modal, setModal]       = useState(null);

  const load = useCallback(async () => {
    try {
      const [a, m, p, u] = await Promise.allSettled([getAllBugs(), getBugsReportedByMe(), getProjects(), getUsers()]);
      setAllBugs(a.status==='fulfilled' ? a.value : []);
      setMyBugs(m.status==='fulfilled' ? m.value : []);
      setProjects(p.status==='fulfilled' ? p.value : []);
      setUsers(u.status==='fulfilled' ? u.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    try {
      if (modal.type === 'edit') await updateBug(modal.bug._id, form);
      else await createBug({ ...form, reportedBy: user?._id });
      setModal(null); load();
    } catch (e) { Alert.alert('Error', 'Failed to save issue.'); }
  }

  async function handleDelete(bug) {
    Alert.alert('Delete Issue', `Delete "${bug.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteBug(bug._id); load(); } catch { Alert.alert('Error','Failed to delete.'); } } },
    ]);
  }

  const bugs = activeTab === 'all' ? allBugs : myBugs;
  const filtered = bugs.filter(b => {
    const matchS = !search || b.title?.toLowerCase().includes(search.toLowerCase());
    const matchF = statusF === 'all' || b.status === statusF;
    return matchS && matchF;
  });

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-end px-4 py-3 border-b ${borderColor}`}>
        <TouchableOpacity onPress={() => setModal({ type: 'add' })}
          className="flex-row items-center px-4 py-2 rounded-lg bg-[#ef44441a] border border-[#ef44444d]">
          <Plus size={14} color="#ef4444" />
          <Text className="text-xs font-bold ml-1.5 uppercase tracking-widest text-[#ef4444]">REPORT ISSUE</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}>
        <View className="flex-row gap-2 mb-4">
          {[{ label:'OPEN', value: allBugs.filter(b=>b.status==='OPEN').length, color:'#ef4444' },
            { label:'IN PROGRESS', value: allBugs.filter(b=>b.status==='IN_PROGRESS').length, color:'#e8a847' },
            { label:'RESOLVED', value: allBugs.filter(b=>b.status==='RESOLVED').length, color:'#10b981' }].map(s => (
            <View key={s.label} className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
              <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{s.label}</Text>
              <Text style={{ color: s.color }} className="text-xl font-bold">{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>
        {/* Tabs */}
        <View className={`flex-row border-b mb-3 ${borderColor}`}>
          {[{ key:'all', label:`All (${allBugs.length})` }, { key:'mine', label:`Mine (${myBugs.length})` }].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)}
              className={`px-4 pb-3 border-b-2 ${activeTab === t.key ? 'border-[#ef4444]' : 'border-transparent'}`}>
              <Text className={`text-xs font-bold uppercase tracking-widest ${activeTab === t.key ? 'text-[#ef4444]' : textMuted}`}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-3 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode ? '#888' : '#9ca3af'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search issues..."
            placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`} />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color={isDarkMode ? '#888' : '#9ca3af'} /></TouchableOpacity>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {STATUSES_F.map(f => (
            <TouchableOpacity key={f} onPress={() => setStatusF(f)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${statusF === f ? 'bg-[#ef4444] border-[#ef4444]' : `${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${statusF === f ? 'text-white' : textColor}`}>{f === 'all' ? 'All' : STAT_META[f]?.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading ? <ActivityIndicator color="#ef4444" className="mt-10" /> :
         filtered.length === 0 ? (
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <Bug size={32} color={isDarkMode ? '#888' : '#9ca3af'} />
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No issues found</Text>
           </View>
         ) : filtered.map(bug => {
           const sm = SEV_META[bug.severity] || SEV_META.MEDIUM;
           const stm = STAT_META[bug.status] || STAT_META.OPEN;
           const proj = projects.find(p => p._id === (bug.projectId?._id || bug.projectId));
           const assignee = users.find(u => u._id === (bug.assignedTo?._id || bug.assignedTo));
           return (
             <View key={bug._id} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row justify-between items-start mb-2">
                 <View className="flex-1 mr-3">
                   <Text className={`text-sm font-bold ${textColor}`}>{bug.title}</Text>
                   <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{proj?.name || '—'}</Text>
                 </View>
                 <View className="flex-row gap-2 items-center">
                   <TouchableOpacity onPress={() => setModal({ type: 'edit', bug })}><Pencil size={13} color={isDarkMode ? '#888' : '#6b7280'} /></TouchableOpacity>
                   <TouchableOpacity onPress={() => handleDelete(bug)}><Trash2 size={13} color="#ef4444" /></TouchableOpacity>
                 </View>
               </View>
               <View className="flex-row flex-wrap gap-2">
                 <View className="px-2 py-1 rounded border" style={{ borderColor: sm.color + '50', backgroundColor: sm.color + '18' }}>
                   <Text style={{ color: sm.color }} className="text-[9px] font-bold uppercase">{sm.label}</Text>
                 </View>
                 <View className="px-2 py-1 rounded border" style={{ borderColor: stm.color + '50', backgroundColor: stm.color + '18' }}>
                   <Text style={{ color: stm.color }} className="text-[9px] font-bold uppercase">{stm.label}</Text>
                 </View>
                 {assignee && <Text className={`text-[10px] self-center ${textMuted}`}>{assignee.name}</Text>}
               </View>
             </View>
           );
         })}
        <View className="h-8" />
      </ScrollView>
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <IssueFormModal mode={modal.type} initial={modal.bug} projects={projects} users={users}
          isDarkMode={isDarkMode} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </SafeAreaView>
  );
}

function IssueFormModal({ mode, initial, projects, users, isDarkMode, onClose, onSave }) {
  const [form, setForm] = useState({ title: initial?.title||'', description: initial?.description||'', severity: initial?.severity||'MEDIUM', projectId: initial?.projectId?._id||initial?.projectId||'', assignedTo: initial?.assignedTo?._id||initial?.assignedTo||'', status: initial?.status||'OPEN' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  async function handle() {
    if (!form.title.trim() || !form.projectId) { setErr('Title and project are required.'); return; }
    setErr(''); setSaving(true);
    try { await onSave(form); } catch { setErr('Failed to save issue.'); } finally { setSaving(false); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[#000000cc]">
        <View className={`border-t rounded-t-2xl max-h-[92%] ${bgCard} ${borderColor}`}>
          <View className={`flex-row justify-between items-center p-6 pb-4 border-b ${borderColor}`}>
            <View className="flex-row items-center"><Bug size={16} color="#ef4444" /><Text className={`text-sm font-bold tracking-widest uppercase ml-2 ${textColor}`}>{mode==='add' ? 'REPORT ISSUE' : 'EDIT ISSUE'}</Text></View>
            <TouchableOpacity onPress={onClose}><X size={20} color={isDarkMode ? '#888' : '#6b7280'} /></TouchableOpacity>
          </View>
          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            <View className="h-4" />
            {!!err && <View className="flex-row items-center bg-[#ef44441a] border border-[#ef44444d] rounded-lg p-3 mb-4"><AlertCircle size={14} color="#ef4444" /><Text className="text-[#ef4444] text-xs ml-2">{err}</Text></View>}
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Issue Title *</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={form.title} onChangeText={v => setForm({...form, title:v})} placeholder="Brief description of the issue" placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`text-xs ${textColor}`} />
            </View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Description</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={form.description} onChangeText={v => setForm({...form, description:v})} placeholder="Steps to reproduce..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} multiline className={`text-xs min-h-[60px] ${textColor}`} textAlignVertical="top" />
            </View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Project *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {projects.map(p => (
                <TouchableOpacity key={p._id} onPress={() => setForm({...form, projectId:p._id})}
                  className={`mr-2 px-4 py-1.5 rounded-full border ${form.projectId===p._id ? (isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]') : `${bgInputAlt} ${borderColor}`}`}>
                  <Text className={`text-[10px] font-bold ${form.projectId===p._id ? (isDarkMode?'text-[#131313]':'text-white') : textColor}`}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Severity</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {SEVERITIES.map(sv => { const m = SEV_META[sv]; return (
                <TouchableOpacity key={sv} onPress={() => setForm({...form, severity:sv})}
                  className={`px-4 py-1.5 rounded-full border ${form.severity===sv ? '' : `${bgInputAlt} ${borderColor}`}`}
                  style={form.severity===sv ? { borderColor: m.color, backgroundColor: m.color + '25' } : {}}>
                  <Text style={{ color: form.severity===sv ? m.color : (isDarkMode ? '#9ca3af' : '#6b7280') }} className="text-[10px] font-bold">{m.label}</Text>
                </TouchableOpacity>
              ); })}
            </View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Assign To</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              <TouchableOpacity onPress={() => setForm({...form, assignedTo:''})}
                className={`mr-2 px-4 py-1.5 rounded-full border ${!form.assignedTo ? (isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]') : `${bgInputAlt} ${borderColor}`}`}>
                <Text className={`text-[10px] font-bold ${!form.assignedTo ? (isDarkMode?'text-[#131313]':'text-white') : textColor}`}>Unassigned</Text>
              </TouchableOpacity>
              {users.map(u => (
                <TouchableOpacity key={u._id} onPress={() => setForm({...form, assignedTo:u._id})}
                  className={`mr-2 px-4 py-1.5 rounded-full border ${form.assignedTo===u._id ? (isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]') : `${bgInputAlt} ${borderColor}`}`}>
                  <Text className={`text-[10px] font-bold ${form.assignedTo===u._id ? (isDarkMode?'text-[#131313]':'text-white') : textColor}`}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
          <View className={`flex-row justify-end p-6 pt-4 border-t ${borderColor}`}>
            <TouchableOpacity onPress={onClose} disabled={saving} className="mr-4 py-3 px-4">
              <Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handle} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center bg-[#ef4444] ${saving?'opacity-50':''}`}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="font-bold text-sm uppercase tracking-wider text-white">{mode==='add'?'REPORT':'SAVE'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
