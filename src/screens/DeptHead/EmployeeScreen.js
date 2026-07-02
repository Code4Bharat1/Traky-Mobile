import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, UserPlus, Search, X, Check, AlertCircle, Pencil, Trash2, ChevronDown } from 'lucide-react-native';
import { getUsers, createUser, updateUser, deleteUser, getDepartments } from '../../api/services';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const ROLE_META = { department_head:{label:'Dept Head',color:'#47c8ff'}, lead:{label:'Lead',color:'#2573e6'}, employee:{label:'Employee',color:'#9ca3af'} };

function initials(name) { return name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '??'; }

export default function EmployeeScreen() {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [members, setMembers]   = useState([]);
  const [depts, setDepts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);

  const myDeptId = typeof user?.departmentId === 'object' ? user.departmentId?._id : user?.departmentId;

  const load = useCallback(async () => {
    try {
      const [u, d] = await Promise.allSettled([getUsers(), getDepartments()]);
      const usersArr = u.status==='fulfilled' ? u.value : [];
      const deptsArr = d.status==='fulfilled' ? d.value : [];
      const scoped = myDeptId ? usersArr.filter(u => { const did = typeof u.departmentId==='object' ? u.departmentId?._id : u.departmentId; return String(did) === String(myDeptId); }) : usersArr;
      const deptMap = Object.fromEntries(deptsArr.map(d => [String(d._id), d.departmentName]));
      setMembers(scoped.map(u => { const dkey = typeof u.departmentId==='object' ? String(u.departmentId?._id) : String(u.departmentId||''); return { ...u, departmentName: deptMap[dkey] || null }; }));
      setDepts(deptsArr);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [myDeptId]);

  React.useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSave(form) {
    try {
      setSaving(true);
      if (modal.type==='add') await createUser({ ...form, departmentId: form.departmentId || myDeptId });
      else await updateUser(modal.member._id, form);
      setModal(null); load();
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(member) {
    Alert.alert('Delete Employee', `Delete "${member.name}"?`, [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => { try { await deleteUser(member._id); load(); } catch { Alert.alert('Error','Failed to delete.'); } } },
    ]);
  }

  const filtered = members.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()));

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-between items-center px-4 py-3 border-b ${borderColor}`}>
        <View className={`border rounded-lg px-3 py-1.5 ${bgCard} ${borderColor}`}>
          <Text className={`text-[9px] font-bold uppercase tracking-widest ${textMuted}`}>TOTAL: <Text className={textColor}>{filtered.length}</Text></Text>
        </View>
        <TouchableOpacity onPress={() => setModal({ type:'add' })}
          className={`flex-row items-center px-4 py-2 rounded-lg ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <UserPlus size={14} color={isDarkMode ? '#131313' : '#fff'} />
          <Text className={`text-xs font-bold ml-1.5 uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>ADD EMPLOYEE</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? '#adc6ff' : '#2573e6'} />}>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-4 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode ? '#888' : '#9ca3af'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by name or email…"
            placeholderTextColor={isDarkMode ? '#888' : '#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`} />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color={isDarkMode ? '#888' : '#9ca3af'} /></TouchableOpacity>}
        </View>
        {loading ? <ActivityIndicator color={isDarkMode ? '#adc6ff' : '#2573e6'} className="mt-10" /> :
         filtered.length === 0 ? (
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <Users size={32} color={isDarkMode ? '#888' : '#9ca3af'} />
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No employees found</Text>
           </View>
         ) : filtered.map(m => {
           const rm = ROLE_META[m.globalRole] || ROLE_META.employee;
           return (
             <View key={m._id} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row items-center">
                 <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#2573e620', borderWidth:1, borderColor:'#2573e640' }}>
                   <Text style={{ color:'#2573e6', fontSize:13, fontWeight:'700' }}>{initials(m.name)}</Text>
                 </View>
                 <View className="flex-1">
                   <Text className={`text-sm font-bold ${textColor}`}>{m.name}</Text>
                   <Text className={`text-[10px] mt-0.5 ${textMuted}`}>{m.email}</Text>
                 </View>
                 <View className="items-end gap-1.5">
                   <View className="px-2 py-1 rounded border" style={{ borderColor: rm.color + '50', backgroundColor: rm.color + '18' }}>
                     <Text style={{ color: rm.color }} className="text-[9px] font-bold uppercase">{rm.label}</Text>
                   </View>
                   <View className={`px-2 py-0.5 rounded border ${m.isActive!==false ? 'border-[#10b9814a] bg-[#10b9811a]' : 'border-[#6b728040] bg-[#6b72801a]'}`}>
                     <Text className={`text-[9px] font-bold uppercase ${m.isActive!==false ? 'text-[#10b981]' : 'text-[#6b7280]'}`}>{m.isActive!==false ? 'ACTIVE' : 'INACTIVE'}</Text>
                   </View>
                 </View>
                 <View className="flex-col gap-3 ml-3">
                   <TouchableOpacity onPress={() => setModal({ type:'edit', member:m })}><Pencil size={13} color={isDarkMode ? '#888' : '#6b7280'} /></TouchableOpacity>
                   <TouchableOpacity onPress={() => handleDelete(m)}><Trash2 size={13} color="#ef4444" /></TouchableOpacity>
                 </View>
               </View>
             </View>
           );
         })}
        <View className="h-8" />
      </ScrollView>
      {(modal?.type==='add' || modal?.type==='edit') && (
        <EmployeeFormModal mode={modal.type} initial={modal.member} departments={depts} currentDeptId={myDeptId}
          creatorRole={user?.globalRole||user?.role} isDarkMode={isDarkMode}
          saving={saving} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </SafeAreaView>
  );
}

function EmployeeFormModal({ mode, initial, departments, currentDeptId, creatorRole, isDarkMode, saving, onClose, onSave }) {
  const isDH = creatorRole === 'department_head';
  const [form, setForm] = useState({ name: initial?.name||'', email: initial?.email||'', globalRole: initial?.globalRole||'employee', departmentId: (typeof initial?.departmentId==='object' ? initial?.departmentId?._id : initial?.departmentId) || currentDeptId || '', isActive: initial?.isActive!==false, branch: initial?.branch||'', shiftTiming: initial?.shiftTiming||'' });
  const [err, setErr] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const ROLES = isDH ? ['employee','lead'] : ['department_head','lead','employee'];
  const BRANCHES = ['Main Office', 'Branch A', 'Branch B'];
  const SHIFTS = ['09:00 AM - 06:00 PM', '10:00 AM - 07:00 PM', 'Night Shift'];
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  function handle() {
    if (!form.name.trim()) { setErr('Full name is required.'); return; }
    if (!/^[a-zA-Z\s]+$/.test(form.name)) { setErr('Name must only contain letters.'); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Valid email is required.'); return; }
    setErr(''); onSave(form);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[#000000cc]">
        <View className={`border-t rounded-t-2xl max-h-[92%] ${bgCard} ${borderColor}`}>
          <View className={`flex-row justify-between items-center p-6 pb-4 border-b ${borderColor}`}>
            <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{mode==='add' ? 'ADD EMPLOYEE' : 'EDIT EMPLOYEE'}</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}><X size={20} color={isDarkMode ? '#888' : '#6b7280'} /></TouchableOpacity>
          </View>
          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            <View className="h-4" />
            {!!err && <View className="flex-row items-center bg-[#ef44441a] border border-[#ef44444d] rounded-lg p-3 mb-4"><AlertCircle size={14} color="#ef4444" /><Text className="text-[#ef4444] text-xs ml-2">{err}</Text></View>}
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Full Name *</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}><TextInput value={form.name} onChangeText={v=>setForm({...form,name:v})} placeholder="John Doe" placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`text-xs ${textColor}`} /></View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Email Address *</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}><TextInput value={form.email} onChangeText={v=>setForm({...form,email:v})} placeholder="john@company.com" placeholderTextColor={isDarkMode?'#888':'#9ca3af'} keyboardType="email-address" autoCapitalize="none" className={`text-xs ${textColor}`} /></View>
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Global Role *</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='role'?null:'role')} className={`border rounded-lg p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={`text-xs ${textColor}`}>{ROLE_META[form.globalRole]?.label || 'Select role...'}</Text>
                  <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
                </TouchableOpacity>
                {openDropdown === 'role' && (
                  <View className={`border rounded-lg mt-1 overflow-hidden ${bgCard} ${borderColor}`}>
                    {ROLES.map(r => (
                      <TouchableOpacity key={r} onPress={() => { setForm({...form, globalRole: r}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                        <Text className={`text-xs ${textColor}`}>{ROLE_META[r]?.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              {!isDH && (
              <View className="flex-1">
                <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Department *</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='dept'?null:'dept')} className={`border rounded-lg p-3 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={`text-xs ${textColor}`}>{departments.find(d=>d._id===form.departmentId)?.departmentName || 'Select dept...'}</Text>
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
              )}
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Branch</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='branch'?null:'branch')} className={`border rounded-lg p-3 mb-4 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
              <Text className={`text-xs ${textColor}`}>{form.branch || 'No branch assigned'}</Text>
              <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
            </TouchableOpacity>
            {openDropdown === 'branch' && (
              <View className={`border rounded-lg mt-[-12px] mb-4 overflow-hidden ${bgCard} ${borderColor}`}>
                {BRANCHES.map(b => (
                  <TouchableOpacity key={b} onPress={() => { setForm({...form, branch: b}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                    <Text className={`text-xs ${textColor}`}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Shift Timing *</Text>
            <TouchableOpacity onPress={() => setOpenDropdown(openDropdown==='shift'?null:'shift')} className={`border rounded-lg p-3 mb-4 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
              <Text className={`text-xs ${textColor}`}>{form.shiftTiming || 'Select shift timing...'}</Text>
              <ChevronDown size={14} color={isDarkMode?'#888':'#9ca3af'} />
            </TouchableOpacity>
            {openDropdown === 'shift' && (
              <View className={`border rounded-lg mt-[-12px] mb-4 overflow-hidden ${bgCard} ${borderColor}`}>
                {SHIFTS.map(s => (
                  <TouchableOpacity key={s} onPress={() => { setForm({...form, shiftTiming: s}); setOpenDropdown(null); }} className={`p-3 border-b ${borderColor}`}>
                    <Text className={`text-xs ${textColor}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Status</Text>
            <View className="flex-row gap-3 mb-6">
              {[{v:true,l:'Active'},{v:false,l:'Inactive'}].map(({v,l}) => (
                <TouchableOpacity key={l} onPress={()=>setForm({...form,isActive:v})}
                  className={`flex-1 py-2.5 rounded-full border items-center ${form.isActive===v ? (v ? 'bg-[#10b981] border-[#10b981]' : 'border-[#ef44444d] bg-[#ef44441a]') : `${bgInputAlt} ${borderColor}`}`}>
                  <Text className={`text-[10px] font-bold ${form.isActive===v ? (v?'text-white':'text-[#ef4444]') : textColor}`}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View className={`flex-row justify-end p-6 pt-4 border-t ${borderColor}`}>
            <TouchableOpacity onPress={onClose} disabled={saving} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handle} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode?'bg-[#adc6ff]':'bg-[#2573e6]'} ${saving?'opacity-50':''}`}>
              {saving ? <ActivityIndicator size="small" color={isDarkMode?'#131313':'#fff'} /> :
                <><Check size={14} color={isDarkMode?'#131313':'#fff'} /><Text className={`font-bold text-sm ml-1.5 uppercase tracking-wider ${isDarkMode?'text-[#131313]':'text-white'}`}>{mode==='add'?'ADD':'SAVE'}</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


