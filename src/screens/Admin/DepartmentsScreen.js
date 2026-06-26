import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { Building2, Plus, Edit2, Trash2, X, ChevronDown, Search, Users, UserCog } from 'lucide-react-native';

export default function DepartmentsScreen() {
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
    { label: "Total Departments", value: departments.length || 0, icon: Building2, color: "#adc6ff" },
    { label: "Total Employee", value: totalEmployees, icon: Users, color: "#47c8ff" },
  ];

  const renderItem = ({ item }) => {
    const head = getDepartmentHead(item._id);
    
    return (
      <View className="bg-[#1c1b1b] rounded-lg p-5 mb-4 border border-[#ffffff1a]">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 flex-row items-center">
            <View className="h-10 w-10 rounded-full bg-[#201f1f] items-center justify-center mr-3 border border-[#ffffff1a]">
              <Building2 size={16} color="#adc6ff" />
            </View>
            <View>
              <Text className="text-white text-base font-bold capitalize mb-1">{item.departmentName}</Text>
              <Text className="text-[#888] text-[10px] tracking-widest uppercase font-bold">
                 {head ? head.name : 'NO HEAD ASSIGNED'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center ml-2">
            <TouchableOpacity onPress={() => openAssignHeadModal(item)} className="p-1.5 mr-1 bg-[#131313] rounded border border-[#ffffff1a]" title="Assign Head">
              <UserCog size={14} color="#47c8ff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openModal(item)} className="p-1.5 mr-1 bg-[#131313] rounded border border-[#ffffff1a]">
              <Edit2 size={14} color="#c2c6d6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5 bg-[#ff47471a] rounded border border-[#ff47474a]">
              <Trash2 size={14} color="#ff4747" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-[#ffffff1a]">
          <View className="flex-row items-center">
             <Users size={12} color="#888" className="mr-2" />
             <Text className="text-[#888] text-xs font-bold">{item.employeeCount || 0} Members</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className="text-[#888] text-[10px] tracking-widest uppercase mb-1 font-bold">Admin / Department Management</Text>
           <Text className="text-white text-2xl font-bold tracking-wider">Departments</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className="bg-[#adc6ff] flex-row items-center px-3 py-2 rounded">
          <Plus size={16} color="#131313" className="mr-1" />
          <Text className="text-[#131313] font-bold text-[10px] uppercase tracking-widest">Create Department</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Grid */}
      <View className="flex-row mb-6">
        {stats.map((s, i) => (
          <View key={s.label} className={`flex-1 bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg ${i === 0 ? 'mr-3' : ''}`}>
             <View className="flex-row items-center mb-2">
               <s.icon size={16} color={s.color} />
             </View>
             <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</Text>
             <Text className="text-white text-2xl font-bold">{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Search and Filters */}
      <View className="flex-row justify-between items-center mb-4">
         <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded flex-row items-center px-3 h-10 mr-3">
            <Search size={16} color="#888" className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search by name or head..."
               placeholderTextColor="#888"
               className="flex-1 text-white text-xs h-10"
            />
         </View>
      </View>

      <View className="mb-4">
         <Text className="text-[#888] text-[10px] font-bold tracking-widest uppercase text-right">
            {filteredDepartments.length} OF {(departments || []).length} DEPARTMENTS
         </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={filteredDepartments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#888] text-center mt-10 text-xs font-bold uppercase tracking-widest">No departments found.</Text>
          }
        />
      )}

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-6">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">{editingDepartment ? 'Edit Department' : 'Create Department'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>

            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Department Name *</Text>
            <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-6">
               <TextInput 
                 value={formData.departmentName} 
                 onChangeText={v => setFormData({...formData, departmentName: v})} 
                 placeholder="e.g. Engineering" 
                 placeholderTextColor="#888" 
                 className="text-white text-sm py-1" 
               />
            </View>

            <View className="flex-row justify-end pt-2 border-t border-[#ffffff1a] mt-2 pt-4">
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-2"><Text className="text-[#888] font-bold text-xs uppercase tracking-widest">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-[#adc6ff] px-6 py-2 rounded flex-row items-center">
                  {saving ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Save Changes</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Head Modal */}
      <Modal visible={assignHeadModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">Assign Department Head</Text>
               <TouchableOpacity onPress={() => setAssignHeadModalVisible(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>
            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Select User</Text>
            <ScrollView className="mb-4">
               {users.map(u => (
                  <TouchableOpacity 
                    key={u._id} 
                    className={`p-3 border-b border-[#ffffff1a] flex-row items-center justify-between ${headForm.headId === u._id ? 'bg-[#ffffff1a]' : ''}`}
                    onPress={() => setHeadForm({...headForm, headId: u._id})}
                  >
                     <View>
                        <Text className="text-white text-sm font-bold">{u.name}</Text>
                        <Text className="text-[#888] text-[10px]">{u.email}</Text>
                     </View>
                     {headForm.headId === u._id && <View className="w-3 h-3 rounded-full bg-[#47c8ff]" />}
                  </TouchableOpacity>
               ))}
               {users.length === 0 && <Text className="text-[#888] text-center text-xs mt-4">No users found.</Text>}
            </ScrollView>
            
            <View className="flex-row justify-end border-t border-[#ffffff1a] mt-2 pt-4">
               <TouchableOpacity onPress={() => setAssignHeadModalVisible(false)} className="mr-4 py-2"><Text className="text-[#888] font-bold text-xs uppercase tracking-widest">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleAssignHead} disabled={saving} className="bg-[#adc6ff] px-6 py-2 rounded flex-row items-center">
                  {saving ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Assign</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
