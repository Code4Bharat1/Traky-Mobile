import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { Search, User, Edit2, Trash2, Plus, X, ChevronDown, CheckCircle, Shield } from 'lucide-react-native';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', globalRole: 'employee', departmentId: '', branchId: '', isActive: true });
  const [saving, setSaving] = useState(false);
  
  // Permissions Modal State
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [permUser, setPermUser] = useState(null);
  const [customPerms, setCustomPerms] = useState({});
  const [savingPerms, setSavingPerms] = useState(false);
  const RESOURCES = [
    { key: 'users', label: 'User Management' },
    { key: 'projects', label: 'Projects' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'dailyLogs', label: 'Daily Logs' },
    { key: 'bugs', label: 'Bug Reports' },
    { key: 'reports', label: 'Reports' },
    { key: 'ktDocuments', label: 'KT Documents' }
  ];
  
  // Filter States
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');

  // Dropdown States
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState(''); // 'role', 'department', 'branch', 'filterRole', 'filterStatus', 'filterDept', 'filterBranch'

  const roles = ["super_admin", "admin", "department_head", "lead", "contributor", "reviewer", "employee"];

  const formatRole = (role) => {
    if (!role) return 'Employee';
    if (role === 'lead') return 'Employee - Lead';
    if (role === 'employee_lead') return 'Employee - Lead';
    return role.replace('_', ' ');
  };

  const fetchData = async () => {
    try {
      const [usersRes, depRes, branchRes] = await Promise.all([
        client.get('/users?limit=100'),
        client.get('/departments'),
        client.get('/branches')
      ]);
      setUsers(usersRes.data.data || usersRes.data || []);
      setDepartments(depRes.data.allDepartments || depRes.data.data || depRes.data || []);
      setBranches(branchRes.data.data || branchRes.data || []);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.globalRole === filterRole;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.isActive : !u.isActive);
    const matchesDept = filterDept === 'all' || (u.departmentId?._id || u.departmentId) === filterDept;
    const matchesBranch = filterBranch === 'all' || (u.branchId?._id || u.branchId) === filterBranch;
    return matchesSearch && matchesRole && matchesStatus && matchesDept && matchesBranch;
  });

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // blank password when editing
        globalRole: user.globalRole || 'employee',
        departmentId: user.departmentId?._id || user.departmentId || '',
        branchId: user.branchId?._id || user.branchId || '',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', globalRole: 'employee', departmentId: '', branchId: '', isActive: true });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }
    if (!editingUser && !formData.password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete payload.password; // Do not send empty password on update
      }

      if (editingUser) {
        await client.patch(`/users/${editingUser._id}`, payload);
      } else {
        await client.post('/users', payload);
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || error.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete User', 'Are you sure you want to delete this user? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/users/${id}`);
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete user');
          }
      }}
    ]);
  };

  const getDropdownOptions = () => {
    if (dropdownType === 'role') return roles.map(r => ({ _id: r, name: formatRole(r) }));
    if (dropdownType === 'department') return [{_id: '', name: 'No Department'}, ...departments.map(d => ({...d, name: d.departmentName}))];
    if (dropdownType === 'branch') return [{_id: '', name: 'No Branch'}, ...branches.map(b => ({...b, name: b.branchName}))];
    
    if (dropdownType === 'filterRole') return [{_id: 'all', name: 'All Roles'}, ...roles.map(r => ({ _id: r, name: formatRole(r) }))];
    if (dropdownType === 'filterStatus') return [{_id: 'all', name: 'All Status'}, {_id: 'active', name: 'Active'}, {_id: 'inactive', name: 'Inactive'}];
    if (dropdownType === 'filterDept') return [{_id: 'all', name: 'All Depts'}, ...departments.map(d => ({_id: d._id, name: d.departmentName}))];
    if (dropdownType === 'filterBranch') return [{_id: 'all', name: 'All Branches'}, ...branches.map(b => ({_id: b._id, name: b.branchName}))];
    
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'role') setFormData({...formData, globalRole: item._id});
    if (dropdownType === 'department') setFormData({...formData, departmentId: item._id});
    if (dropdownType === 'branch') setFormData({...formData, branchId: item._id});
    
    if (dropdownType === 'filterRole') setFilterRole(item._id);
    if (dropdownType === 'filterStatus') setFilterStatus(item._id);
    if (dropdownType === 'filterDept') setFilterDept(item._id);
    if (dropdownType === 'filterBranch') setFilterBranch(item._id);
    
    setDropdownVisible(false);
  };

  const openPermModal = (user) => {
    setPermUser(user);
    setCustomPerms(user.customPermissions || {});
    setPermModalVisible(true);
  };

  const handleSavePerms = async () => {
    setSavingPerms(true);
    try {
      await client.patch(`/users/${permUser._id}/permissions`, { customPermissions: customPerms });
      setPermModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const togglePermission = (resource, action) => {
    setCustomPerms(prev => {
      const updated = { ...prev };
      if (!updated[resource]) updated[resource] = {};
      updated[resource][action] = !updated[resource][action];
      return updated;
    });
  };

  const renderItem = ({ item }) => (
    <View className="flex-row border-b border-[#ffffff1a] bg-[#161616] py-3 px-4 items-center">
      <View className="w-48 flex-row items-center">
        <View className="h-6 w-6 rounded bg-[#201f1f] items-center justify-center mr-2">
           <Text className="text-[#888] text-[10px] font-bold uppercase">{item.name?.charAt(0)}</Text>
        </View>
        <Text className="text-white text-xs font-bold w-[80%]" numberOfLines={1}>{item.name}</Text>
      </View>
      <Text className="w-56 text-[#c2c6d6] text-xs" numberOfLines={1}>{item.email}</Text>
      <View className="w-32 items-start">
         <View className="bg-[#adc6ff1a] border border-[#adc6ff4a] px-2 py-0.5 rounded">
            <Text className="text-[#adc6ff] text-[10px] uppercase font-bold tracking-widest">
              {formatRole(item.globalRole || item.role?.name || item.role)}
            </Text>
         </View>
      </View>
      <Text className="w-32 text-[#888] text-xs uppercase" numberOfLines={1}>{item.departmentId?.departmentName || '—'}</Text>
      <Text className="w-32 text-[#888] text-xs uppercase" numberOfLines={1}>{item.branchId?.branchName || '—'}</Text>
      <View className="w-24 flex-row items-center">
         <View className={`h-1.5 w-1.5 rounded-full mr-1 ${item.isActive ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
         <Text className="text-[#c2c6d6] text-[10px] uppercase font-bold tracking-widest">{item.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
      </View>
      <View className="w-24 flex-row items-center">
        <TouchableOpacity onPress={() => openPermModal(item)} className="p-1.5">
          <Shield size={14} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openModal(item)} className="p-1.5 ml-1">
          <Edit2 size={14} color="#c2c6d6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5 ml-1">
          <Trash2 size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-4 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">USER DIRECTORY</Text>
        <TouchableOpacity onPress={() => openModal()} className="bg-[#adc6ff] p-2 rounded-full">
          <Plus size={20} color="#131313" />
        </TouchableOpacity>
      </View>
      
      <View className="flex-row items-center bg-[#201f1f] border border-[#ffffff33] rounded h-10 px-3 mb-4">
        <Search size={16} color="#c2c6d6" />
        <TextInput 
          className="flex-1 text-white text-sm ml-2 py-0"
          placeholder="Search by name or email..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
           <TouchableOpacity onPress={() => { setDropdownType('filterRole'); setDropdownVisible(true); }} className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 py-2 flex-row items-center mr-2">
              <Text className="text-white text-xs mr-2 capitalize">{filterRole === 'all' ? 'All Roles' : formatRole(filterRole)}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('filterStatus'); setDropdownVisible(true); }} className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 py-2 flex-row items-center mr-2">
              <Text className="text-white text-xs mr-2 capitalize">{filterStatus === 'all' ? 'All Status' : filterStatus}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('filterDept'); setDropdownVisible(true); }} className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 py-2 flex-row items-center mr-2">
              <Text className="text-white text-xs mr-2 capitalize">{filterDept === 'all' ? 'All Depts' : departments.find(d => d._id === filterDept)?.departmentName || 'Unknown'}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('filterBranch'); setDropdownVisible(true); }} className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 py-2 flex-row items-center mr-2">
              <Text className="text-white text-xs mr-2 capitalize">{filterBranch === 'all' ? 'All Branches' : branches.find(b => b._id === filterBranch)?.branchName || 'Unknown'}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
        </ScrollView>
      </View>

      <Text className="text-[#888] text-xs font-bold tracking-widest uppercase mb-3">
        {filteredUsers.length} OF {users.length} USERS
      </Text>

      {/* Table */}
      <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg overflow-hidden mt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{ minWidth: 1000 }}>
            <View className="flex-row border-b border-[#ffffff1a] bg-[#161616] py-3 px-4">
              <Text className="w-48 text-[#888] text-[10px] font-bold tracking-widest uppercase">Name</Text>
              <Text className="w-56 text-[#888] text-[10px] font-bold tracking-widest uppercase">Email</Text>
              <Text className="w-32 text-[#888] text-[10px] font-bold tracking-widest uppercase">Role</Text>
              <Text className="w-32 text-[#888] text-[10px] font-bold tracking-widest uppercase">Department</Text>
              <Text className="w-32 text-[#888] text-[10px] font-bold tracking-widest uppercase">Branch</Text>
              <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase">Status</Text>
              <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase">Action</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
            ) : (
              <FlatList 
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <Text className="text-[#888] text-center py-6 text-xs">No users found.</Text>
                }
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border-t border-[#ffffff1a] rounded-t-2xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-lg font-bold tracking-widest uppercase">{editingUser ? 'Edit User' : 'Add User'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#888" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Full Name *</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.name} 
                   onChangeText={v => setFormData({...formData, name: v})} 
                   placeholder="e.g. John Doe" 
                   placeholderTextColor="#888" 
                   className="text-white text-base py-1" 
                 />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Email Address *</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.email} 
                   onChangeText={v => setFormData({...formData, email: v})} 
                   placeholder="john@example.com" 
                   placeholderTextColor="#888" 
                   keyboardType="email-address"
                   autoCapitalize="none"
                   className="text-white text-base py-1" 
                 />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">{editingUser ? 'New Password (Optional)' : 'Password *'}</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.password} 
                   onChangeText={v => setFormData({...formData, password: v})} 
                   placeholder={editingUser ? "Leave blank to keep current" : "••••••••"} 
                   placeholderTextColor="#888" 
                   secureTextEntry
                   className="text-white text-base py-1" 
                 />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Global Role *</Text>
              <TouchableOpacity onPress={() => { setDropdownType('role'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-4 mb-4 flex-row justify-between items-center">
                 <Text className="text-white text-base capitalize">{formatRole(formData.globalRole)}</Text>
                 <ChevronDown size={20} color="#888" />
              </TouchableOpacity>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Department (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('department'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-4 mb-4 flex-row justify-between items-center">
                 <Text className={formData.departmentId ? "text-white text-base capitalize" : "text-[#888] text-base"}>
                   {formData.departmentId ? departments.find(d => d._id === formData.departmentId)?.departmentName || 'Unknown' : 'Select a department'}
                 </Text>
                 <ChevronDown size={20} color="#888" />
              </TouchableOpacity>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Branch (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('branch'); setDropdownVisible(true); }} className="border border-[#ffffff1a] bg-[#131313] rounded p-4 mb-4 flex-row justify-between items-center">
                 <Text className={formData.branchId ? "text-white text-base capitalize" : "text-[#888] text-base"}>
                   {formData.branchId ? branches.find(b => b._id === formData.branchId)?.branchName || 'Unknown' : 'Select a branch'}
                 </Text>
                 <ChevronDown size={20} color="#888" />
              </TouchableOpacity>
              
              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Status</Text>
              <View className="flex-row mb-8">
                 <TouchableOpacity onPress={() => setFormData({...formData, isActive: true})} className={`flex-1 border py-3 rounded-l items-center ${formData.isActive ? 'border-[#adc6ff] bg-[#adc6ff1a]' : 'border-[#ffffff1a] bg-[#131313]'}`}>
                    <Text className={`text-xs font-bold tracking-widest uppercase ${formData.isActive ? 'text-[#adc6ff]' : 'text-[#888]'}`}>ACTIVE</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => setFormData({...formData, isActive: false})} className={`flex-1 border border-l-0 py-3 rounded-r items-center ${!formData.isActive ? 'border-[#adc6ff] bg-[#adc6ff1a]' : 'border-[#ffffff1a] bg-[#131313]'}`}>
                    <Text className={`text-xs font-bold tracking-widest uppercase ${!formData.isActive ? 'text-[#adc6ff]' : 'text-[#888]'}`}>INACTIVE</Text>
                 </TouchableOpacity>
              </View>
            </ScrollView>

            <View className="flex-row justify-end pt-4 border-t border-[#ffffff1a] mt-2 pb-6">
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-3 px-4"><Text className="text-white font-bold text-sm uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-[#adc6ff] px-6 py-3 rounded-lg flex-row items-center">
                  {saving ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-sm uppercase tracking-wider">Save User</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generic Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-5/6 max-h-[60%] p-2">
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item) => item._id || 'none'}
              renderItem={({item}) => (
                <TouchableOpacity className="py-4 px-4 border-b border-[#ffffff1a] flex-row items-center justify-between" onPress={() => selectDropdownItem(item)}>
                  <Text className="text-white text-base capitalize">{item.name}</Text>
                  {((dropdownType === 'role' && formData.globalRole === item._id) || 
                    (dropdownType === 'department' && formData.departmentId === item._id) ||
                    (dropdownType === 'branch' && formData.branchId === item._id) ||
                    (dropdownType === 'filterRole' && filterRole === item._id) ||
                    (dropdownType === 'filterStatus' && filterStatus === item._id) ||
                    (dropdownType === 'filterDept' && filterDept === item._id) ||
                    (dropdownType === 'filterBranch' && filterBranch === item._id)) && (
                    <CheckCircle size={18} color="#adc6ff" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Permissions Modal */}
      <Modal visible={permModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border-t border-[#ffffff1a] rounded-t-2xl p-6 h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
               <View>
                 <Text className="text-white text-lg font-bold tracking-widest uppercase">Edit Permissions</Text>
                 <Text className="text-[#888] text-xs">User: {permUser?.name} • <Text className="capitalize">{formatRole(permUser?.globalRole)}</Text></Text>
               </View>
               <TouchableOpacity onPress={() => setPermModalVisible(false)}><X size={24} color="#888" /></TouchableOpacity>
            </View>
            
            <View className="flex-row border-b border-[#ffffff1a] py-2 mb-2">
              <Text className="w-1/3 text-[#888] text-[10px] font-bold tracking-widest uppercase">MODULE NAME</Text>
              <Text className="w-[16%] text-[#10b981] text-[10px] font-bold tracking-widest uppercase text-center">CREATE</Text>
              <Text className="w-[16%] text-[#38bdf8] text-[10px] font-bold tracking-widest uppercase text-center">VIEW</Text>
              <Text className="w-[16%] text-[#f59e0b] text-[10px] font-bold tracking-widest uppercase text-center">EDIT</Text>
              <Text className="w-[16%] text-[#ef4444] text-[10px] font-bold tracking-widest uppercase text-center">DELETE</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {RESOURCES.map(res => (
                <View key={res.key} className="flex-row items-center border-b border-[#ffffff1a] py-4">
                   <Text className="w-1/3 text-white text-xs font-bold" numberOfLines={1}>{res.label}</Text>
                   {['create', 'read', 'update', 'delete'].map((action, i) => {
                     const isEnabled = customPerms[res.key]?.[action] || false;
                     return (
                       <View key={action} className="w-[16%] items-center">
                         <TouchableOpacity 
                           onPress={() => togglePermission(res.key, action)}
                           className={`w-10 h-5 rounded-full px-1 justify-center ${isEnabled ? 'bg-[#adc6ff]' : 'bg-[#333]'}`}
                         >
                            <View className={`w-3.5 h-3.5 rounded-full bg-white ${isEnabled ? 'self-end' : 'self-start'}`} />
                         </TouchableOpacity>
                       </View>
                     );
                   })}
                </View>
              ))}
            </ScrollView>

            <View className="flex-row justify-end pt-4 border-t border-[#ffffff1a] mt-2 pb-6">
               <TouchableOpacity onPress={() => setPermModalVisible(false)} className="mr-4 py-3 px-4"><Text className="text-white font-bold text-sm uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSavePerms} disabled={savingPerms} className="bg-[#adc6ff] px-6 py-3 rounded-lg flex-row items-center">
                  {savingPerms ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-sm uppercase tracking-wider">Save Changes</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
