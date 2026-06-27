import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { Search, User, Edit2, Trash2, Plus, X, ChevronDown, CheckCircle, Shield } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function UserManagement() {
  const { isDarkMode } = useThemeStore();
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

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgRow = isDarkMode ? 'bg-[#161616]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => (
    <View className={`flex-row border-b py-3 px-4 items-center ${borderColor} ${bgRow}`}>
      <View className="w-48 flex-row items-center">
        <View className={`h-6 w-6 rounded items-center justify-center mr-2 ${bgInput}`}>
           <Text className={`text-[10px] font-bold uppercase ${textMuted}`}>{item.name?.charAt(0)}</Text>
        </View>
        <Text className={`text-xs font-bold w-[80%] ${textColor}`} numberOfLines={1}>{item.name}</Text>
      </View>
      <Text className={`w-56 text-xs ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`} numberOfLines={1}>{item.email}</Text>
      <View className="w-32 items-start">
         <View className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-[#adc6ff1a] border-[#adc6ff4a]' : 'bg-blue-50 border-blue-200'}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>
              {formatRole(item.globalRole || item.role?.name || item.role)}
            </Text>
         </View>
      </View>
      <Text className={`w-32 text-xs uppercase ${textMuted}`} numberOfLines={1}>{item.departmentId?.departmentName || '—'}</Text>
      <Text className={`w-32 text-xs uppercase ${textMuted}`} numberOfLines={1}>{item.branchId?.branchName || '—'}</Text>
      <View className="w-24 flex-row items-center">
         <View className={`h-1.5 w-1.5 rounded-full mr-1 ${item.isActive ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
         <Text className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>{item.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
      </View>
      <View className="w-24 flex-row items-center">
        <TouchableOpacity onPress={() => openPermModal(item)} className="p-1.5">
          <Shield size={14} color={isDarkMode ? "#888" : "#555"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openModal(item)} className="p-1.5 ml-1">
          <Edit2 size={14} color={isDarkMode ? "#c2c6d6" : "#4b5563"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5 ml-1">
          <Trash2 size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      <View className="flex-row justify-between items-center mb-4 mt-4">
        <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>USER DIRECTORY</Text>
        <TouchableOpacity onPress={() => openModal()} className={`p-2 rounded-full ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={20} color={isDarkMode ? "#131313" : "#ffffff"} />
        </TouchableOpacity>
      </View>
      
      <View className={`flex-row items-center border rounded h-10 px-3 mb-4 ${bgInput} ${borderColor}`}>
        <Search size={16} color={isDarkMode ? "#c2c6d6" : "#6b7280"} />
        <TextInput 
          className={`flex-1 text-sm ml-2 py-0 ${textColor}`}
          placeholder="Search by name or email..."
          placeholderTextColor={isDarkMode ? "#6b7280" : "#9ca3af"}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
           <TouchableOpacity onPress={() => { setDropdownType('filterRole'); setDropdownVisible(true); }} className={`border rounded px-3 py-2 flex-row items-center mr-2 ${bgCard} ${borderColor}`}>
              <Text className={`text-xs mr-2 capitalize ${textColor}`}>{filterRole === 'all' ? 'All Roles' : formatRole(filterRole)}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('filterStatus'); setDropdownVisible(true); }} className={`border rounded px-3 py-2 flex-row items-center mr-2 ${bgCard} ${borderColor}`}>
              <Text className={`text-xs mr-2 capitalize ${textColor}`}>{filterStatus === 'all' ? 'All Status' : filterStatus}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('filterDept'); setDropdownVisible(true); }} className={`border rounded px-3 py-2 flex-row items-center mr-2 ${bgCard} ${borderColor}`}>
              <Text className={`text-xs mr-2 capitalize ${textColor}`}>{filterDept === 'all' ? 'All Depts' : departments.find(d => d._id === filterDept)?.departmentName || 'Unknown'}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('filterBranch'); setDropdownVisible(true); }} className={`border rounded px-3 py-2 flex-row items-center mr-2 ${bgCard} ${borderColor}`}>
              <Text className={`text-xs mr-2 capitalize ${textColor}`}>{filterBranch === 'all' ? 'All Branches' : branches.find(b => b._id === filterBranch)?.branchName || 'Unknown'}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#555"} />
           </TouchableOpacity>
        </ScrollView>
      </View>

      <Text className={`text-xs font-bold tracking-widest uppercase mb-3 ${textMuted}`}>
        {filteredUsers.length} OF {users.length} USERS
      </Text>

      {/* Table */}
      <View className={`flex-1 border rounded-lg overflow-hidden mt-2 ${bgCard} ${borderColor}`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{ minWidth: 1000 }}>
            <View className={`flex-row border-b py-3 px-4 ${borderColor} ${bgRow}`}>
              <Text className={`w-48 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>Name</Text>
              <Text className={`w-56 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>Email</Text>
              <Text className={`w-32 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>Role</Text>
              <Text className={`w-32 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>Department</Text>
              <Text className={`w-32 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>Branch</Text>
              <Text className={`w-24 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>Status</Text>
              <Text className={`w-24 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>Action</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
            ) : (
              <FlatList 
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <Text className={`text-center py-6 text-xs ${textMuted}`}>No users found.</Text>
                }
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className={`border-t rounded-t-2xl p-6 h-[85%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-lg font-bold tracking-widest uppercase ${textColor}`}>{editingUser ? 'Edit User' : 'Add User'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={isDarkMode ? "#888" : "#555"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Full Name *</Text>
              <View className={`border rounded p-3 mb-4 ${bgScreen} ${borderColor}`}>
                 <TextInput 
                   value={formData.name} 
                   onChangeText={v => setFormData({...formData, name: v})} 
                   placeholder="e.g. John Doe" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={`text-base py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Email Address *</Text>
              <View className={`border rounded p-3 mb-4 ${bgScreen} ${borderColor}`}>
                 <TextInput 
                   value={formData.email} 
                   onChangeText={v => setFormData({...formData, email: v})} 
                   placeholder="john@example.com" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   keyboardType="email-address"
                   autoCapitalize="none"
                   className={`text-base py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>{editingUser ? 'New Password (Optional)' : 'Password *'}</Text>
              <View className={`border rounded p-3 mb-4 ${bgScreen} ${borderColor}`}>
                 <TextInput 
                   value={formData.password} 
                   onChangeText={v => setFormData({...formData, password: v})} 
                   placeholder={editingUser ? "Leave blank to keep current" : "••••••••"} 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   secureTextEntry
                   className={`text-base py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Global Role *</Text>
              <TouchableOpacity onPress={() => { setDropdownType('role'); setDropdownVisible(true); }} className={`border rounded p-4 mb-4 flex-row justify-between items-center ${bgScreen} ${borderColor}`}>
                 <Text className={`text-base capitalize ${textColor}`}>{formatRole(formData.globalRole)}</Text>
                 <ChevronDown size={20} color={isDarkMode ? "#888" : "#555"} />
              </TouchableOpacity>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Department (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('department'); setDropdownVisible(true); }} className={`border rounded p-4 mb-4 flex-row justify-between items-center ${bgScreen} ${borderColor}`}>
                 <Text className={formData.departmentId ? `text-base capitalize ${textColor}` : `text-base ${textMuted}`}>
                   {formData.departmentId ? departments.find(d => d._id === formData.departmentId)?.departmentName || 'Unknown' : 'Select a department'}
                 </Text>
                 <ChevronDown size={20} color={isDarkMode ? "#888" : "#555"} />
              </TouchableOpacity>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Branch (Optional)</Text>
              <TouchableOpacity onPress={() => { setDropdownType('branch'); setDropdownVisible(true); }} className={`border rounded p-4 mb-4 flex-row justify-between items-center ${bgScreen} ${borderColor}`}>
                 <Text className={formData.branchId ? `text-base capitalize ${textColor}` : `text-base ${textMuted}`}>
                   {formData.branchId ? branches.find(b => b._id === formData.branchId)?.branchName || 'Unknown' : 'Select a branch'}
                 </Text>
                 <ChevronDown size={20} color={isDarkMode ? "#888" : "#555"} />
              </TouchableOpacity>
              
              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Status</Text>
              <View className="flex-row mb-8">
                 <TouchableOpacity onPress={() => setFormData({...formData, isActive: true})} className={`flex-1 border py-3 rounded-l items-center ${formData.isActive ? (isDarkMode ? 'border-[#adc6ff] bg-[#adc6ff1a]' : 'border-blue-500 bg-blue-50') : `border-r-0 ${borderColor} ${bgScreen}`}`}>
                    <Text className={`text-xs font-bold tracking-widest uppercase ${formData.isActive ? (isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]') : textMuted}`}>ACTIVE</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => setFormData({...formData, isActive: false})} className={`flex-1 border py-3 rounded-r items-center ${!formData.isActive ? (isDarkMode ? 'border-[#adc6ff] bg-[#adc6ff1a]' : 'border-blue-500 bg-blue-50') : `border-l-0 ${borderColor} ${bgScreen}`}`}>
                    <Text className={`text-xs font-bold tracking-widest uppercase ${!formData.isActive ? (isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]') : textMuted}`}>INACTIVE</Text>
                 </TouchableOpacity>
              </View>
            </ScrollView>

            <View className={`flex-row justify-end pt-4 border-t mt-2 pb-6 ${borderColor}`}>
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-sm uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save User</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generic Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className={`border rounded-lg w-5/6 max-h-[60%] p-2 ${bgCard} ${borderColor}`}>
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item) => item._id || 'none'}
              renderItem={({item}) => (
                <TouchableOpacity className={`py-4 px-4 border-b flex-row items-center justify-between ${borderColor}`} onPress={() => selectDropdownItem(item)}>
                  <Text className={`text-base capitalize ${textColor}`}>{item.name}</Text>
                  {((dropdownType === 'role' && formData.globalRole === item._id) || 
                    (dropdownType === 'department' && formData.departmentId === item._id) ||
                    (dropdownType === 'branch' && formData.branchId === item._id) ||
                    (dropdownType === 'filterRole' && filterRole === item._id) ||
                    (dropdownType === 'filterStatus' && filterStatus === item._id) ||
                    (dropdownType === 'filterDept' && filterDept === item._id) ||
                    (dropdownType === 'filterBranch' && filterBranch === item._id)) && (
                    <CheckCircle size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
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
          <View className={`border-t rounded-t-2xl p-6 h-[90%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <View>
                 <Text className={`text-lg font-bold tracking-widest uppercase ${textColor}`}>Edit Permissions</Text>
                 <Text className={`text-xs ${textMuted}`}>User: {permUser?.name} • <Text className="capitalize">{formatRole(permUser?.globalRole)}</Text></Text>
               </View>
               <TouchableOpacity onPress={() => setPermModalVisible(false)}><X size={24} color={isDarkMode ? "#888" : "#555"} /></TouchableOpacity>
            </View>
            
            <View className={`flex-row border-b py-2 mb-2 ${borderColor}`}>
              <Text className={`w-1/3 text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>MODULE NAME</Text>
              <Text className="w-[16%] text-[#10b981] text-[10px] font-bold tracking-widest uppercase text-center">CREATE</Text>
              <Text className="w-[16%] text-[#38bdf8] text-[10px] font-bold tracking-widest uppercase text-center">VIEW</Text>
              <Text className="w-[16%] text-[#f59e0b] text-[10px] font-bold tracking-widest uppercase text-center">EDIT</Text>
              <Text className="w-[16%] text-[#ef4444] text-[10px] font-bold tracking-widest uppercase text-center">DELETE</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {RESOURCES.map(res => (
                <View key={res.key} className={`flex-row items-center border-b py-4 ${borderColor}`}>
                   <Text className={`w-1/3 text-xs font-bold ${textColor}`} numberOfLines={1}>{res.label}</Text>
                   {['create', 'read', 'update', 'delete'].map((action, i) => {
                     const isEnabled = customPerms[res.key]?.[action] || false;
                     return (
                       <View key={action} className="w-[16%] items-center">
                         <TouchableOpacity 
                           onPress={() => togglePermission(res.key, action)}
                           className={`w-10 h-5 rounded-full px-1 justify-center ${isEnabled ? (isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]') : (isDarkMode ? 'bg-[#333]' : 'bg-gray-300')}`}
                         >
                            <View className={`w-3.5 h-3.5 rounded-full bg-white ${isEnabled ? 'self-end' : 'self-start'}`} />
                         </TouchableOpacity>
                       </View>
                     );
                   })}
                </View>
              ))}
            </ScrollView>

            <View className={`flex-row justify-end pt-4 border-t mt-2 pb-6 ${borderColor}`}>
               <TouchableOpacity onPress={() => setPermModalVisible(false)} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSavePerms} disabled={savingPerms} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {savingPerms ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-sm uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Changes</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
