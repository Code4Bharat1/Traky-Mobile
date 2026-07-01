import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderKanban, Plus, Search, X, Check, AlertCircle, Calendar, Pencil, Trash2, ChevronDown } from 'lucide-react-native';
import { getProjects, getUsers, createProject, updateProject, deleteProject, getDepartments } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const STATUS_OPTS = ['IN_PROGRESS', 'COMPLETED'];
const STATUS_META = {
  IN_PROGRESS: { label: 'In Progress', color: '#47c8ff' },
  COMPLETED:   { label: 'Completed',   color: '#10b981' },
};

export default function ProjectsScreen() {
  const { isDarkMode } = useThemeStore();
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [modal, setModal]       = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, u, d] = await Promise.allSettled([getProjects(), getUsers(), getDepartments()]);
      setProjects(p.status === 'fulfilled' ? p.value : []);
      setUsers(u.status === 'fulfilled' ? u.value : []);
      setDepartments(d.status === 'fulfilled' ? d.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    try {
      setSaving(true);
      if (modal.type === 'edit') await updateProject(modal.project._id, form);
      else await createProject(form);
      setModal(null); load();
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed to save project.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(project) {
    Alert.alert('Delete Project', `Delete "${project.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteProject(project._id); load(); }
          catch { Alert.alert('Error', 'Failed to delete project.'); }
        }},
    ]);
  }

  const filtered = projects.filter(p => {
    const matchS = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchF = filter === 'all' || p.status === filter;
    return matchS && matchF;
  });
  const total = projects.length, inProgress = projects.filter(p => p.status !== 'COMPLETED').length, completed = projects.filter(p => p.status === 'COMPLETED').length;

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-end px-4 py-3 border-b ${borderColor}`}>
        <TouchableOpacity onPress={() => setModal({ type: 'add' })}
          className={`flex-row items-center px-4 py-2 rounded-lg ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={14} color={isDarkMode ? '#131313' : '#fff'} />
          <Text className={`text-xs font-bold ml-1.5 uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>NEW PROJECT</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? '#adc6ff' : '#2573e6'} />}>
        <View className="flex-row gap-2 mb-4">
          {[{ label: 'TOTAL', value: total, color: isDarkMode ? '#fff' : '#111' }, { label: 'IN PROGRESS', value: inProgress, color: '#47c8ff' }, { label: 'COMPLETED', value: completed, color: '#10b981' }].map(s => (
            <View key={s.label} className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
              <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{s.label}</Text>
              <Text style={{ color: s.color }} className="text-xl font-bold">{loading ? '—' : s.value}</Text>
            </View>
          ))}
        </View>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-3 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode ? '#888' : '#9ca3af'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search projects..."
            placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`} />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color={isDarkMode ? '#888' : '#9ca3af'} /></TouchableOpacity>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {['all', ...STATUS_OPTS].map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${filter === f ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : `${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${filter === f ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>
                {f === 'all' ? 'All' : STATUS_META[f]?.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading ? <ActivityIndicator color={isDarkMode ? '#adc6ff' : '#2573e6'} className="mt-10" /> :
         filtered.length === 0 ? (
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <FolderKanban size={32} color={isDarkMode ? '#888' : '#9ca3af'} />
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No projects found</Text>
           </View>
         ) : filtered.map(project => {
           const sm = STATUS_META[project.status] || STATUS_META.IN_PROGRESS;
           const lead = users.find(u => (project.managerIds || []).includes(u._id));
           return (
             <View key={project._id} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row justify-between items-start mb-3">
                 <View className="flex-1 mr-3">
                   <Text className={`text-sm font-bold ${textColor}`}>{project.name}</Text>
                   {project.description && <Text className={`text-xs mt-1 ${textMuted}`} numberOfLines={2}>{project.description}</Text>}
                 </View>
                 <View className="px-2 py-1 rounded border" style={{ borderColor: sm.color + '50', backgroundColor: sm.color + '18' }}>
                   <Text style={{ color: sm.color }} className="text-[9px] font-bold uppercase tracking-widest">• {sm.label}</Text>
                 </View>
               </View>
               <View className={`border-t pt-3 ${borderColor}`}>
                 <View className="flex-row justify-between mb-1"><Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Lead</Text><Text className={`text-xs ${textColor}`}>{lead?.name || 'Unassigned'}</Text></View>
                 {project.endDate && <View className="flex-row justify-between mb-1"><Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Deadline</Text><Text className={`text-xs ${textColor}`}>{new Date(project.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</Text></View>}
               </View>
               <View className="flex-row justify-end gap-4 mt-3">
                 <TouchableOpacity onPress={() => setModal({ type: 'edit', project })} className="flex-row items-center">
                   <Pencil size={13} color={isDarkMode ? '#888' : '#6b7280'} /><Text className={`text-[10px] font-bold ml-1 ${textMuted}`}>EDIT</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => handleDelete(project)} className="flex-row items-center">
                   <Trash2 size={13} color="#ef4444" /><Text className="text-[10px] font-bold ml-1 text-[#ef4444]">DELETE</Text>
                 </TouchableOpacity>
               </View>
             </View>
           );
         })}
        <View className="h-8" />
      </ScrollView>
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <ProjectFormModal mode={modal.type} initial={modal.project} users={users} departments={departments} isDarkMode={isDarkMode}
          saving={saving} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </SafeAreaView>
  );
}

function ProjectFormModal({ mode, initial, users, departments, isDarkMode, saving, onClose, onSave }) {
  const [form, setForm] = useState({ name: initial?.name || '', description: initial?.description || '', status: initial?.status || 'IN_PROGRESS', departmentId: initial?.departmentId || '', leadId: initial?.managerIds?.[0] || '', reviewerId: initial?.reviewerId || '', endDate: initial?.endDate ? new Date(initial.endDate).toISOString().split('T')[0] : '', category: initial?.category || '' });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [err, setErr] = useState('');
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  function handle() {
    if (!form.name.trim()) { setErr('Project name is required.'); return; }
    setErr(''); onSave(form);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[#000000cc]">
        <View className={`border-t rounded-t-2xl max-h-[85%] ${bgCard} ${borderColor}`}>
          <View className={`flex-row justify-between items-center p-6 pb-4 border-b ${borderColor}`}>
            <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{mode === 'add' ? 'CREATE PROJECT' : 'EDIT PROJECT'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}><X size={20} color={isDarkMode ? '#888' : '#6b7280'} /></TouchableOpacity>
          </View>
          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            <View className="h-4" />
            {!!err && <View className="flex-row items-center bg-[#ef44441a] border border-[#ef44444d] rounded-lg p-3 mb-4"><AlertCircle size={14} color="#ef4444" /><Text className="text-[#ef4444] text-xs ml-2">{err}</Text></View>}

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Project Name *</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder="e.g. Website Redesign"
                placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} className={`text-xs ${textColor}`} />
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Department *</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='dept'?null:'dept')} className={`border rounded-lg p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={`text-xs ${textColor}`} numberOfLines={1}>{departments.find(d=>d._id===form.departmentId)?.departmentName || 'Select'}</Text>
                  <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
                </TouchableOpacity>
                {openDropdown === 'dept' && (
                  <View className={`border rounded-lg mt-1 overflow-hidden ${bgCard} ${borderColor}`}>
                    {departments.map(d => (
                      <TouchableOpacity key={d._id} onPress={() => { setForm({...form, departmentId: d._id}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                        <Text className={`text-xs ${textColor}`}>{d.departmentName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Status</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='status'?null:'status')} className={`border rounded-lg p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={`text-xs ${textColor}`}>{STATUS_META[form.status]?.label}</Text>
                  <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
                </TouchableOpacity>
                {openDropdown === 'status' && (
                  <View className={`border rounded-lg mt-1 overflow-hidden ${bgCard} ${borderColor}`}>
                    {STATUS_OPTS.map(s => (
                      <TouchableOpacity key={s} onPress={() => { setForm({...form, status: s}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                        <Text className={`text-xs ${textColor}`}>{STATUS_META[s]?.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Lead</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='lead'?null:'lead')} className={`border rounded-lg p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={`text-xs ${textColor}`} numberOfLines={1}>{users.find(u=>u._id===form.leadId)?.name || 'Unassigned'}</Text>
                  <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
                </TouchableOpacity>
                {openDropdown === 'lead' && (
                  <View className={`border rounded-lg mt-1 max-h-32 overflow-hidden ${bgCard} ${borderColor}`}>
                    <ScrollView nestedScrollEnabled>
                    {users.map(u => (
                      <TouchableOpacity key={u._id} onPress={() => { setForm({...form, leadId: u._id}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                        <Text className={`text-xs ${textColor}`}>{u.name}</Text>
                      </TouchableOpacity>
                    ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Reviewer</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='reviewer'?null:'reviewer')} className={`border rounded-lg p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={`text-xs ${textColor}`} numberOfLines={1}>{users.find(u=>u._id===form.reviewerId)?.name || 'Unassigned'}</Text>
                  <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
                </TouchableOpacity>
                {openDropdown === 'reviewer' && (
                  <View className={`border rounded-lg mt-1 max-h-32 overflow-hidden ${bgCard} ${borderColor}`}>
                    <ScrollView nestedScrollEnabled>
                    {users.map(u => (
                      <TouchableOpacity key={u._id} onPress={() => { setForm({...form, reviewerId: u._id}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                        <Text className={`text-xs ${textColor}`}>{u.name}</Text>
                      </TouchableOpacity>
                    ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Deadline (YYYY-MM-DD)</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={form.endDate} onChangeText={v => setForm({...form, endDate: v})} placeholder="e.g. 2026-12-31"
                placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} className={`text-xs ${textColor}`} />
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Category (Optional)</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='category'?null:'category')} className={`border rounded-lg p-3 mb-4 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
              <Text className={`text-xs ${textColor}`}>{form.category || 'Select a category'}</Text>
              <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
            </TouchableOpacity>
            {openDropdown === 'category' && (
              <View className={`border rounded-lg mt-[-12px] mb-4 overflow-hidden ${bgCard} ${borderColor}`}>
                {['Design', 'Development', 'Marketing', 'Other'].map(c => (
                  <TouchableOpacity key={c} onPress={() => { setForm({...form, category: c}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                    <Text className={`text-xs ${textColor}`}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Description</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
              <TextInput value={form.description} onChangeText={v => setForm({...form, description: v})} placeholder="Brief project description…"
                placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} multiline numberOfLines={3}
                className={`text-xs min-h-[60px] ${textColor}`} textAlignVertical="top" />
            </View>
          </ScrollView>
          <View className={`flex-row justify-end p-6 pt-4 border-t ${borderColor}`}>
            <TouchableOpacity onPress={onClose} disabled={saving} className="mr-4 py-3 px-4">
              <Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handle} disabled={saving}
              className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'} ${saving ? 'opacity-50' : ''}`}>
              {saving ? <ActivityIndicator size="small" color={isDarkMode ? '#131313' : '#fff'} /> :
                <><Check size={14} color={isDarkMode ? '#131313' : '#fff'} /><Text className={`font-bold text-sm ml-1.5 uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>{mode === 'add' ? 'CREATE' : 'SAVE'}</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
