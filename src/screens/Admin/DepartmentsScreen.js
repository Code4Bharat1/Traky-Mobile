import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { Building2, Plus, Edit2, Trash2, X, ChevronDown, Search, Users, UserCog } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function DepartmentsScreen() {
  const { isDarkMode } = useThemeStore();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  
  // Assign Head Modal
  const [assignHeadModalVisible, setAssignHeadModalVisible] = useState(false);
  const [headForm, setHeadForm] = useState({ departmentId: '', headId: '' });
  
  const [formData, setFormData] = useState({ departmentName: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depRes, usersRes] = await Promise.all([
        client.get('/departments?limit=100'),
        client.get('/users?limit=500')
      ]);
      setDepartments(depRes.data.allDepartments || depRes.data.data || []);
      setUsers(usersRes.data.data || usersRes.data.users || []);
    } catch (error) {
      console.error("Failed to load departments data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        departmentName: department.departmentName || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({ departmentName: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.departmentName) {
      Alert.alert('Error', 'Department Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingDepartment) {
        await client.patch(`/departments/${editingDepartment._id}`, formData);
      } else {
        await client.post('/departments', formData);
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Department', 'Are you sure you want to delete this department?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/departments/${id}`);
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete department');
          }
      }}
    ]);
  };

  const handleAssignHead = async () => {
    if (!headForm.headId) {
      Alert.alert('Error', 'Please select a user to assign as Head');
      return;
    }
    setSaving(true);
    try {
      // In web, updating the head involves updating the User's globalRole and departmentId
      await client.patch(`/users/${headForm.headId}`, {
         globalRole: 'department_head',
         departmentId: headForm.departmentId
      });
      setAssignHeadModalVisible(false);
      fetchData();
      Alert.alert("Success", "Department head assigned successfully");
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign head');
    } finally {
      setSaving(false);
    }
  };

  const openAssignHeadModal = (department) => {
     setHeadForm({ departmentId: department._id, headId: '' });
     setAssignHeadModalVisible(true);
  };

  // Find department heads by scanning users
  const getDepartmentHead = (deptId) => {
     return users.find(u => u.departmentId === deptId && (u.globalRole === 'department_head' || u.globalRole === 'lead'));
  };

  const filteredDepartments = (Array.isArray(departments) ? departments : []).filter(d => {
    const head = getDepartmentHead(d._id);
    const matchesSearch = d.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (head?.name && head.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalEmployees = (Array.isArray(departments) ? departments : []).reduce((acc, d) => acc + (d.employeeCount || 0), 0);

  const stats = [
    { label: "Total Departments", value: departments.length || 0, icon: Building2, color: isDarkMode ? "#adc6ff" : "#2573e6" },
    { label: "Total Employee", value: totalEmployees, icon: Users, color: "#47c8ff" },
  ];

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => {
    const head = getDepartmentHead(item._id);
    
    return (
      <View className={`rounded-lg p-5 mb-4 border ${bgCard} ${borderColor}`}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 flex-row items-center">
            <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 border ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100'} ${borderColor}`}>
              <Building2 size={16} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
            </View>
            <View>
              <Text className={`text-base font-bold capitalize mb-1 ${textColor}`}>{item.departmentName}</Text>
              <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>
                 {head ? head.name : 'NO HEAD ASSIGNED'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center ml-2">
            <TouchableOpacity onPress={() => openAssignHeadModal(item)} className={`p-1.5 mr-1 rounded border ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`} title="Assign Head">
              <UserCog size={14} color="#47c8ff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openModal(item)} className={`p-1.5 mr-1 rounded border ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
              <Edit2 size={14} color={isDarkMode ? "#c2c6d6" : "#6b7280"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5 bg-[#ff47471a] rounded border border-[#ff47474a]">
              <Trash2 size={14} color="#ff4747" />
            </TouchableOpacity>
          </View>
        </View>

        <View className={`flex-row justify-between items-center pt-3 border-t ${borderColor}`}>
          <View className="flex-row items-center">
             <Users size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
             <Text className={`text-xs font-bold ${textMuted}`}>{item.employeeCount || 0} Members</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin / Department Management</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Departments</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Create Department</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Grid */}
      <View className="flex-row mb-6">
        {stats.map((s, i) => (
          <View key={s.label} className={`flex-1 border p-4 rounded-lg ${bgCard} ${borderColor} ${i === 0 ? 'mr-3' : ''}`}>
             <View className="flex-row items-center mb-2">
               <s.icon size={16} color={s.color} />
             </View>
             <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>{s.label}</Text>
             <Text className={`text-2xl font-bold ${textColor}`}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Search and Filters */}
      <View className="flex-row justify-between items-center mb-4">
         <View className={`flex-1 border rounded flex-row items-center px-3 h-10 mr-3 ${bgInput} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search by name or head..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
      </View>

      <View className="mb-4">
         <Text className={`text-[10px] font-bold tracking-widest uppercase text-right ${textMuted}`}>
            {filteredDepartments.length} OF {(departments || []).length} DEPARTMENTS
         </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={filteredDepartments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className={`text-center mt-10 text-xs font-bold uppercase tracking-widest ${textMuted}`}>No departments found.</Text>
          }
        />
      )}

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={`border rounded-lg w-11/12 p-6 ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{editingDepartment ? 'Edit Department' : 'Create Department'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Department Name *</Text>
            <View className={`border rounded p-2 mb-6 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
               <TextInput 
                 value={formData.departmentName} 
                 onChangeText={v => setFormData({...formData, departmentName: v})} 
                 placeholder="e.g. Engineering" 
                 placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                 className={`text-sm py-1 ${textColor}`} 
               />
            </View>

            <View className={`flex-row justify-end pt-2 border-t mt-2 pt-4 ${borderColor}`}>
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase tracking-widest ${textMuted}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`px-6 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Changes</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Head Modal */}
      <Modal visible={assignHeadModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={`border rounded-lg w-11/12 p-6 max-h-[80%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Assign Department Head</Text>
               <TouchableOpacity onPress={() => setAssignHeadModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>
            <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Select User</Text>
            <ScrollView className="mb-4">
               {users.map(u => (
                  <TouchableOpacity 
                    key={u._id} 
                    className={`p-3 border-b flex-row items-center justify-between ${borderColor} ${headForm.headId === u._id ? (isDarkMode ? 'bg-[#ffffff1a]' : 'bg-gray-100') : ''}`}
                    onPress={() => setHeadForm({...headForm, headId: u._id})}
                  >
                     <View>
                        <Text className={`text-sm font-bold ${textColor}`}>{u.name}</Text>
                        <Text className={`text-[10px] ${textMuted}`}>{u.email}</Text>
                     </View>
                     {headForm.headId === u._id && <View className="w-3 h-3 rounded-full bg-[#47c8ff]" />}
                  </TouchableOpacity>
               ))}
               {users.length === 0 && <Text className={`text-center text-xs mt-4 ${textMuted}`}>No users found.</Text>}
            </ScrollView>
            
            <View className={`flex-row justify-end border-t mt-2 pt-4 ${borderColor}`}>
               <TouchableOpacity onPress={() => setAssignHeadModalVisible(false)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase tracking-widest ${textMuted}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleAssignHead} disabled={saving} className={`px-6 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Assign</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
