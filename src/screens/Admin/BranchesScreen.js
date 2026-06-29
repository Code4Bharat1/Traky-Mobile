import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { GitBranch, MapPin, Plus, Edit2, Trash2, X, Phone, Mail, CheckCircle, XCircle, Search, ChevronDown, Users, Building2, Circle, CheckCircle2 } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';
import useBranchStore from '../../store/branchStore';

export default function BranchesScreen() {
  const { isDarkMode } = useThemeStore();
  const { activeBranchId, switchBranch, initBranch } = useBranchStore();
  const [branches, setBranches] = useState([]);
  const [statsData, setStatsData] = useState({ totalEmployees: 0 });
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
      const [bRes, sRes] = await Promise.allSettled([
        client.get('/branches'),
        client.get('/branches/stats')
      ]);
      const fetchedBranches = bRes.status === 'fulfilled' ? (bRes.value.data?.data || bRes.value.data || []) : [];
      setBranches(fetchedBranches);
      if (sRes.status === 'fulfilled') {
        setStatsData(sRes.value.data?.data || sRes.value.data || { totalEmployees: 0 });
      }
      initBranch(fetchedBranches);
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
  const totalEmployees = statsData.totalEmployees || 0;

  const stats = [
    { label: "Total Branches", value: branches.length, icon: Building2, color: isDarkMode ? "#adc6ff" : "#2573e6" },
    { label: "Active Branches", value: activeCount, icon: CheckCircle, color: "#10b981" },
    { label: "Inactive Branches", value: inactiveCount, icon: XCircle, color: "#ff4747" },
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "#47c8ff" },
  ];

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => {
    const isActiveStatus = item.status === 'active';
    const locationParts = [item.location?.city, item.location?.state, item.location?.country].filter(Boolean).join(', ');
    const isSelectedView = activeBranchId === item._id;

    return (
      <View className={`rounded-lg p-5 mb-4 border relative ${isSelectedView ? (isDarkMode ? 'border-[#adc6ff80] bg-[#2573e61a]' : 'border-blue-300 bg-blue-50') : `${bgCard} ${borderColor}`}`}>
        {isSelectedView && (
           <View className="absolute top-3 right-3 flex-row items-center px-2 py-0.5 rounded bg-[#2573e6]">
              <CheckCircle2 size={10} color="#fff" className="mr-1" />
              <Text className="text-[9px] uppercase font-bold tracking-widest text-white">Active View</Text>
           </View>
        )}
        <View className={`flex-row justify-between items-start mb-3 ${isSelectedView ? 'pr-20' : ''}`}>
          <View className="flex-1">
            <Text className={`text-base font-bold mb-1 ${isSelectedView ? (isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]') : textColor}`}>{item.branchName}</Text>
            <Text className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>{item.branchCode}</Text>
          </View>
          <View className="flex-row items-center ml-2">
            <TouchableOpacity onPress={() => openModal(item)} className="p-1.5 mr-1">
              <Edit2 size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5">
              <Trash2 size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-start mb-2">
            <MapPin size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2 mt-0.5" />
            <Text className={`text-xs flex-1 ${textMuted}`}>
              {item.location?.address ? `${item.location.address}${locationParts ? `, ${locationParts}` : ''}` : (locationParts || 'No location provided')}
            </Text>
          </View>
          {!!item.contactInfo?.phone && (
            <View className="flex-row items-center mb-2">
              <Phone size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
              <Text className={`text-xs ${textMuted}`}>{item.contactInfo.phone}</Text>
            </View>
          )}
          {!!item.contactInfo?.email && (
            <View className="flex-row items-center">
              <Mail size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
              <Text className={`text-xs ${textMuted}`}>{item.contactInfo.email}</Text>
            </View>
          )}
        </View>

        <View className={`flex-row justify-between items-center pt-3 border-t ${borderColor}`}>
          <View className="flex-row items-center">
             <Circle size={8} color={isActiveStatus ? '#10b981' : '#ff4747'} fill={isActiveStatus ? '#10b981' : '#ff4747'} className="mr-2" />
             <Text className={`text-[10px] font-bold tracking-widest uppercase ${textColor}`}>{isActiveStatus ? 'ACTIVE' : 'INACTIVE'}</Text>
          </View>
          
          {isSelectedView ? (
             <TouchableOpacity 
               onPress={() => switchBranch(null)}
               className={`border px-3 py-1.5 rounded flex-row items-center ${isDarkMode ? 'bg-[#2573e633] border-[#adc6ff4d]' : 'bg-blue-100 border-blue-300'}`}
             >
               <X size={12} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-1" />
               <Text className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>Clear</Text>
             </TouchableOpacity>
          ) : (
             <TouchableOpacity 
               onPress={() => switchBranch(item)}
               className={`border px-3 py-1.5 rounded flex-row items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}
             >
               <GitBranch size={12} color={isDarkMode ? "#c2c6d6" : "#4b5563"} className="mr-1" />
               <Text className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>Switch</Text>
             </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin / Branch Management</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Branches</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Add Branch</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Grid (2x2) */}
      <View className="mb-6">
        <View className="flex-row flex-wrap justify-between">
          {stats.map((s, i) => (
            <View key={s.label} className={`border p-4 rounded-lg w-[48%] mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row items-center justify-between mb-2">
                 <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{s.label}</Text>
                 <s.icon size={16} color={s.color} />
               </View>
               <Text className={`text-2xl font-bold ${textColor}`}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Search and Filters */}
      <View className="flex-row justify-between items-center mb-4">
         <View className={`flex-1 border rounded flex-row items-center px-3 h-10 mr-3 ${bgInput} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search branches..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
         <TouchableOpacity 
            onPress={() => setFilterDropdownVisible(true)}
            className={`border rounded px-3 h-10 flex-row items-center ${bgInput} ${borderColor}`}
         >
            <Text className={`text-[10px] uppercase font-bold tracking-widest mr-2 ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>
               {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Text>
            <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
         </TouchableOpacity>
      </View>

      <View className="mb-4">
         <Text className={`text-[10px] font-bold tracking-widest uppercase text-right ${textMuted}`}>
            {filteredBranches.length} OF {branches.length} BRANCHES
         </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={filteredBranches}
          keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className={`text-center mt-10 text-xs font-bold uppercase tracking-widest ${textMuted}`}>No branches found.</Text>
          }
        />
      )}

      {/* Filter Dropdown Modal */}
      <Modal visible={filterDropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: '#00000088'}} activeOpacity={1} onPress={() => setFilterDropdownVisible(false)}>
          <View className={`absolute top-48 right-4 border rounded w-40 ${bgCard} ${borderColor}`}>
             {['all', 'active', 'inactive'].map((status) => (
                <TouchableOpacity 
                   key={status}
                   className={`p-4 border-b ${borderColor}`}
                   onPress={() => { setStatusFilter(status); setFilterDropdownVisible(false); }}
                >
                   <Text className={`text-[10px] font-bold uppercase tracking-widest ${textColor}`}>
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
          <View className={`border rounded-lg w-11/12 p-6 max-h-[80%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{editingBranch ? 'Edit Branch' : 'Add Branch'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Branch Name *</Text>
               <View className={`border rounded p-2 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                  <TextInput 
                    value={formData.branchName} 
                    onChangeText={v => setFormData({...formData, branchName: v})} 
                    placeholder="e.g. Headquarters" 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    className={`text-sm py-1 ${textColor}`} 
                  />
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Branch Code *</Text>
               <View className={`border rounded p-2 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                  <TextInput 
                    value={formData.branchCode} 
                    onChangeText={v => setFormData({...formData, branchCode: v})} 
                    placeholder="e.g. HQ-01" 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    autoCapitalize="characters"
                    className={`text-sm py-1 ${textColor}`} 
                  />
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Status *</Text>
               <View className="flex-row mb-4">
                  <TouchableOpacity 
                    className={`flex-1 py-2 items-center rounded-l border ${formData.status === 'active' ? (isDarkMode ? 'bg-[#10b9811a] border-[#10b9814d]' : 'bg-green-50 border-green-200') : (isDarkMode ? 'bg-[#131313]' : 'bg-gray-50')} ${borderColor}`}
                    onPress={() => setFormData({...formData, status: 'active'})}
                  >
                     <Text className={`text-[10px] font-bold uppercase tracking-widest ${formData.status === 'active' ? 'text-[#10b981]' : (isDarkMode ? 'text-[#888]' : 'text-gray-500')}`}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className={`flex-1 py-2 items-center rounded-r border-t border-r border-b ${formData.status === 'inactive' ? (isDarkMode ? 'bg-[#ff47471a] border-[#ff47474d]' : 'bg-red-50 border-red-200') : (isDarkMode ? 'bg-[#131313]' : 'bg-gray-50')} ${borderColor}`}
                    onPress={() => setFormData({...formData, status: 'inactive'})}
                  >
                     <Text className={`text-[10px] font-bold uppercase tracking-widest ${formData.status === 'inactive' ? 'text-[#ff4747]' : (isDarkMode ? 'text-[#888]' : 'text-gray-500')}`}>Inactive</Text>
                  </TouchableOpacity>
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase mt-2 ${textMuted}`}>Address</Text>
               <View className={`border rounded p-2 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                  <TextInput 
                    value={formData.address} 
                    onChangeText={v => setFormData({...formData, address: v})} 
                    placeholder="Street address" 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    className={`text-sm py-1 ${textColor}`} 
                  />
               </View>

               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>City</Text>
                    <View className={`border rounded p-2 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <TextInput 
                         value={formData.city} 
                         onChangeText={v => setFormData({...formData, city: v})} 
                         placeholder="City" 
                         placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                         className={`text-sm py-1 ${textColor}`} 
                       />
                    </View>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>State</Text>
                    <View className={`border rounded p-2 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <TextInput 
                         value={formData.state} 
                         onChangeText={v => setFormData({...formData, state: v})} 
                         placeholder="State" 
                         placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                         className={`text-sm py-1 ${textColor}`} 
                       />
                    </View>
                 </View>
               </View>
               
               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Country</Text>
                    <View className={`border rounded p-2 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <TextInput 
                         value={formData.country} 
                         onChangeText={v => setFormData({...formData, country: v})} 
                         placeholder="Country" 
                         placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                         className={`text-sm py-1 ${textColor}`} 
                       />
                    </View>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Pincode</Text>
                    <View className={`border rounded p-2 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <TextInput 
                         value={formData.pincode} 
                         onChangeText={v => setFormData({...formData, pincode: v})} 
                         placeholder="Pincode" 
                         placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                         keyboardType="numeric"
                         className={`text-sm py-1 ${textColor}`} 
                       />
                    </View>
                 </View>
               </View>

               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Phone</Text>
                    <View className={`border rounded p-2 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <TextInput 
                         value={formData.phone} 
                         onChangeText={v => setFormData({...formData, phone: v})} 
                         placeholder="Phone No" 
                         placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                         keyboardType="phone-pad"
                         className={`text-sm py-1 ${textColor}`} 
                       />
                    </View>
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Email</Text>
                    <View className={`border rounded p-2 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                       <TextInput 
                         value={formData.email} 
                         onChangeText={v => setFormData({...formData, email: v})} 
                         placeholder="Email ID" 
                         placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                         keyboardType="email-address"
                         className={`text-sm py-1 ${textColor}`} 
                       />
                    </View>
                 </View>
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase mt-2 ${textMuted}`}>Description</Text>
               <View className={`border rounded p-2 mb-6 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                  <TextInput 
                    value={formData.description} 
                    onChangeText={v => setFormData({...formData, description: v})} 
                    placeholder="Enter description..." 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    multiline
                    numberOfLines={3}
                    className={`text-sm py-1 text-vertical-top ${textColor}`} 
                  />
               </View>

            </ScrollView>

            <View className={`flex-row justify-end pt-4 border-t mt-2 ${borderColor}`}>
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase ${textMuted}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`px-6 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
