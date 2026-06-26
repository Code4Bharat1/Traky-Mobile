import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { GitBranch, MapPin, Plus, Edit2, Trash2, X, Phone, Mail, CheckCircle, XCircle, Search, ChevronDown, Users, Building2, Circle } from 'lucide-react-native';

export default function BranchesScreen() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({ branchName: '', branchCode: '', address: '', city: '', state: '', country: '', pincode: '', phone: '', email: '', description: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await client.get('/branches');
      setBranches(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load branches", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        branchName: branch.branchName || '',
        branchCode: branch.branchCode || '',
        address: branch.location?.address || '',
        city: branch.location?.city || '',
        state: branch.location?.state || '',
        country: branch.location?.country || '',
        pincode: branch.location?.pincode || '',
        phone: branch.contactInfo?.phone || '',
        email: branch.contactInfo?.email || '',
        description: branch.description || '',
        status: branch.status || 'active'
      });
    } else {
      setEditingBranch(null);
      setFormData({ branchName: '', branchCode: '', address: '', city: '', state: '', country: '', pincode: '', phone: '', email: '', description: '', status: 'active' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.branchName || !formData.branchCode) {
      Alert.alert('Error', 'Branch Name and Code are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        branchName: formData.branchName,
        branchCode: formData.branchCode,
        status: formData.status,
        description: formData.description,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode
        },
        contactInfo: {
          phone: formData.phone,
          email: formData.email
        }
      };

      if (editingBranch) {
        await client.patch(`/branches/${editingBranch._id}`, payload);
      } else {
        await client.post('/branches', payload);
      }
      setModalVisible(false);
      fetchBranches();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Branch', 'Are you sure you want to delete this branch?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/branches/${id}`);
            fetchBranches();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete branch');
          }
      }}
    ]);
  };

  const filteredBranches = branches.filter(b => {
    const matchesSearch = b.branchName?.toLowerCase().includes(searchQuery.toLowerCase()) || b.branchCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = branches.filter(b => b.status === 'active').length;
  const inactiveCount = branches.filter(b => b.status === 'inactive').length;
  const totalEmployees = branches.reduce((acc, b) => acc + (b.employeeCount || 0), 0);

  const stats = [
    { label: "Total Branches", value: branches.length, icon: Building2, color: "#adc6ff" },
    { label: "Active Branches", value: activeCount, icon: CheckCircle, color: "#47ff8a" },
    { label: "Inactive Branches", value: inactiveCount, icon: XCircle, color: "#ff4747" },
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "#47c8ff" },
  ];

  const renderItem = ({ item }) => {
    const isActive = item.status === 'active';
    const locationParts = [item.location?.city, item.location?.state, item.location?.country].filter(Boolean).join(', ');

    return (
      <View className="bg-[#1c1b1b] rounded-lg p-5 mb-4 border border-[#ffffff1a]">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-white text-base font-bold mb-1">{item.branchName}</Text>
            <Text className="text-[#adc6ff] text-[10px] font-bold uppercase tracking-widest">{item.branchCode}</Text>
          </View>
          <View className="flex-row items-center ml-2">
            <TouchableOpacity onPress={() => openModal(item)} className="p-1.5 mr-1">
              <Edit2 size={14} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5">
              <Trash2 size={14} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-start mb-2">
            <MapPin size={12} color="#888" className="mr-2 mt-0.5" />
            <Text className="text-[#888] text-xs flex-1">
              {item.location?.address ? `${item.location.address}${locationParts ? `, ${locationParts}` : ''}` : (locationParts || 'No location provided')}
            </Text>
          </View>
          {!!item.contactInfo?.phone && (
            <View className="flex-row items-center mb-2">
              <Phone size={12} color="#888" className="mr-2" />
              <Text className="text-[#888] text-xs">{item.contactInfo.phone}</Text>
            </View>
          )}
          {!!item.contactInfo?.email && (
            <View className="flex-row items-center">
              <Mail size={12} color="#888" className="mr-2" />
              <Text className="text-[#888] text-xs">{item.contactInfo.email}</Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-[#ffffff1a]">
          <View className="flex-row items-center">
             <Circle size={8} color={isActive ? '#47ff8a' : '#ff4747'} fill={isActive ? '#47ff8a' : '#ff4747'} className="mr-2" />
             <Text className="text-white text-[10px] font-bold tracking-widest uppercase">{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => Alert.alert("Switch Branch", `Switched to ${item.branchName}`)}
            className="border border-[#ffffff1a] bg-[#131313] px-3 py-1.5 rounded flex-row items-center hover:bg-[#ffffff1a]"
          >
            <GitBranch size={12} color="#c2c6d6" className="mr-1" />
            <Text className="text-[#c2c6d6] text-[10px] uppercase font-bold tracking-widest">Switch</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className="text-[#888] text-[10px] tracking-widest uppercase mb-1 font-bold">Admin / Branch Management</Text>
           <Text className="text-white text-2xl font-bold tracking-wider">Branches</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className="bg-[#adc6ff] flex-row items-center px-3 py-2 rounded">
          <Plus size={16} color="#131313" className="mr-1" />
          <Text className="text-[#131313] font-bold text-xs uppercase tracking-widest">Add Branch</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Carousel */}
      <View className="mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stats.map((s, i) => (
            <View key={s.label} className={`bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg w-36 ${i !== stats.length - 1 ? 'mr-3' : ''}`}>
               <View className="flex-row items-center mb-2">
                 <s.icon size={16} color={s.color} />
               </View>
               <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</Text>
               <Text className="text-white text-2xl font-bold">{s.value}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Search and Filters */}
      <View className="flex-row justify-between items-center mb-4">
         <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded flex-row items-center px-3 h-10 mr-3">
            <Search size={16} color="#888" className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search branches..."
               placeholderTextColor="#888"
               className="flex-1 text-white text-xs h-10"
            />
         </View>
         <TouchableOpacity 
            onPress={() => setFilterDropdownVisible(true)}
            className="bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10 flex-row items-center"
         >
            <Text className="text-[#c2c6d6] text-[10px] uppercase font-bold tracking-widest mr-2">
               {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Text>
            <ChevronDown size={14} color="#888" />
         </TouchableOpacity>
      </View>

      <View className="mb-4">
         <Text className="text-[#888] text-[10px] font-bold tracking-widest uppercase text-right">
            {filteredBranches.length} OF {branches.length} BRANCHES
         </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={filteredBranches}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#888] text-center mt-10 text-xs font-bold uppercase tracking-widest">No branches found.</Text>
          }
        />
      )}

      {/* Filter Dropdown Modal */}
      <Modal visible={filterDropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: '#00000088'}} activeOpacity={1} onPress={() => setFilterDropdownVisible(false)}>
          <View className="absolute top-48 right-4 bg-[#1c1b1b] border border-[#ffffff1a] rounded w-40">
             {['all', 'active', 'inactive'].map((status) => (
                <TouchableOpacity 
                   key={status}
                   className="p-4 border-b border-[#ffffff1a]"
                   onPress={() => { setStatusFilter(status); setFilterDropdownVisible(false); }}
                >
                   <Text className="text-white text-[10px] font-bold uppercase tracking-widest">
                     {status === 'all' ? 'All Status' : status}
                   </Text>
                </TouchableOpacity>
             ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">{editingBranch ? 'Edit Branch' : 'Add Branch'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Branch Name *</Text>
               <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                  <TextInput 
                    value={formData.branchName} 
                    onChangeText={v => setFormData({...formData, branchName: v})} 
                    placeholder="e.g. Headquarters" 
                    placeholderTextColor="#888" 
                    className="text-white text-sm py-1" 
                  />
               </View>

               <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Branch Code *</Text>
               <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                  <TextInput 
                    value={formData.branchCode} 
                    onChangeText={v => setFormData({...formData, branchCode: v})} 
                    placeholder="e.g. HQ-01" 
                    placeholderTextColor="#888" 
                    autoCapitalize="characters"
                    className="text-white text-sm py-1" 
                  />
               </View>

               <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Status *</Text>
               <View className="flex-row mb-4">
                  <TouchableOpacity 
                    className={`flex-1 py-2 items-center rounded-l border border-[#ffffff1a] ${formData.status === 'active' ? 'bg-[#47ff8a1a] border-[#47ff8a4d]' : 'bg-[#131313]'}`}
                    onPress={() => setFormData({...formData, status: 'active'})}
                  >
                     <Text className={`text-[10px] font-bold uppercase tracking-widest ${formData.status === 'active' ? 'text-[#47ff8a]' : 'text-[#888]'}`}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className={`flex-1 py-2 items-center rounded-r border-t border-r border-b border-[#ffffff1a] ${formData.status === 'inactive' ? 'bg-[#ff47471a] border-[#ff47474d]' : 'bg-[#131313]'}`}
                    onPress={() => setFormData({...formData, status: 'inactive'})}
                  >
                     <Text className={`text-[10px] font-bold uppercase tracking-widest ${formData.status === 'inactive' ? 'text-[#ff4747]' : 'text-[#888]'}`}>Inactive</Text>
                  </TouchableOpacity>
               </View>

               <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase mt-2">Address</Text>
               <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                  <TextInput 
                    value={formData.address} 
                    onChangeText={v => setFormData({...formData, address: v})} 
                    placeholder="Street address" 
                    placeholderTextColor="#888" 
                    className="text-white text-sm py-1" 
                  />
               </View>

               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">City</Text>
                    <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2">
                       <TextInput 
                         value={formData.city} 
                         onChangeText={v => setFormData({...formData, city: v})} 
                         placeholder="City" 
                         placeholderTextColor="#888" 
                         className="text-white text-sm py-1" 
                       />
                    </View>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">State</Text>
                    <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2">
                       <TextInput 
                         value={formData.state} 
                         onChangeText={v => setFormData({...formData, state: v})} 
                         placeholder="State" 
                         placeholderTextColor="#888" 
                         className="text-white text-sm py-1" 
                       />
                    </View>
                 </View>
               </View>
               
               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Country</Text>
                    <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2">
                       <TextInput 
                         value={formData.country} 
                         onChangeText={v => setFormData({...formData, country: v})} 
                         placeholder="Country" 
                         placeholderTextColor="#888" 
                         className="text-white text-sm py-1" 
                       />
                    </View>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Pincode</Text>
                    <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2">
                       <TextInput 
                         value={formData.pincode} 
                         onChangeText={v => setFormData({...formData, pincode: v})} 
                         placeholder="Pincode" 
                         placeholderTextColor="#888" 
                         keyboardType="numeric"
                         className="text-white text-sm py-1" 
                       />
                    </View>
                 </View>
               </View>

               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Phone</Text>
                    <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2">
                       <TextInput 
                         value={formData.phone} 
                         onChangeText={v => setFormData({...formData, phone: v})} 
                         placeholder="Phone No" 
                         placeholderTextColor="#888" 
                         keyboardType="phone-pad"
                         className="text-white text-sm py-1" 
                       />
                    </View>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Email</Text>
                    <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2">
                       <TextInput 
                         value={formData.email} 
                         onChangeText={v => setFormData({...formData, email: v})} 
                         placeholder="Email ID" 
                         placeholderTextColor="#888" 
                         keyboardType="email-address"
                         className="text-white text-sm py-1" 
                       />
                    </View>
                 </View>
               </View>

               <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase mt-2">Description</Text>
               <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-6">
                  <TextInput 
                    value={formData.description} 
                    onChangeText={v => setFormData({...formData, description: v})} 
                    placeholder="Enter description..." 
                    placeholderTextColor="#888" 
                    multiline
                    numberOfLines={3}
                    className="text-white text-sm py-1 text-vertical-top" 
                  />
               </View>

            </ScrollView>

            <View className="flex-row justify-end pt-4 border-t border-[#ffffff1a] mt-2">
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-2"><Text className="text-[#888] font-bold text-xs uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-[#adc6ff] px-6 py-2 rounded flex-row items-center">
                  {saving ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Save</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
