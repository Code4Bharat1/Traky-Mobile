import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { FileText, Plus, Search, X, Check, ChevronDown, Edit2, Trash2, Calendar, CheckCircle } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';

const UPDATE_TYPES = [
  { key: "call", label: "Call", bg: "#0284c7", text: "#ffffff" },
  { key: "email", label: "Email", bg: "#ec4899", text: "#ffffff" },
  { key: "demo", label: "Demo", bg: "#fbbf24", text: "#131313" },
  { key: "whatsapp", label: "WhatsApp", bg: "#059669", text: "#ffffff" },
  { key: "review", label: "Review", bg: "#b45309", text: "#ffffff" },
];

export default function ReportsScreen() {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ projectId: '', date: new Date(), duration: '', types: [], notes: '', clientResponse: '', weeklyIncluded: false, monthlyIncluded: false });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsRes, projsRes] = await Promise.all([
        client.get('/reports/my-reports').catch(() => ({ data: { data: [] } })),
        client.get('/projects/my-projects?limit=500').catch(() => ({ data: { data: [] } }))
      ]);
      setReports(reportsRes.data?.data || reportsRes.data || []);
      setProjects(projsRes.data?.data || projsRes.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!formData.projectId || !formData.notes || formData.types.length === 0) {
      Alert.alert('Error', 'Project, notes, and at least one update type are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        date: formData.date.toISOString(),
        duration: formData.duration ? Number(formData.duration) : 0
      };
      if (editingId) {
        await client.patch(`/reports/${editingId}`, payload);
      } else {
        await client.post('/reports', payload);
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await client.delete(`/reports/${id}`);
          setReports(prev => prev.filter(r => r._id !== id && r.id !== id));
        } catch (err) {
          Alert.alert('Error', 'Failed to delete report');
        }
      }}
    ]);
  };

  const toggleIncluded = async (id, field, currentValue) => {
    // Optimistic update
    setReports(prev => prev.map(r => (r._id === id || r.id === id) ? { ...r, [field]: !currentValue } : r));
    try {
      await client.patch(`/reports/${id}`, { [field]: !currentValue });
    } catch (err) {
      Alert.alert('Error', 'Failed to update report');
      setReports(prev => prev.map(r => (r._id === id || r.id === id) ? { ...r, [field]: currentValue } : r));
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ projectId: '', date: new Date(), duration: '', types: [], notes: '', clientResponse: '', weeklyIncluded: false, monthlyIncluded: false });
    setModalVisible(true);
  };

  const openEditModal = (report) => {
    setEditingId(report._id || report.id);
    setFormData({
      projectId: report.projectId || report.project?._id || '',
      date: report.date ? new Date(report.date) : new Date(),
      duration: report.duration ? String(report.duration) : '',
      types: report.types || [],
      notes: report.notes || '',
      clientResponse: report.clientResponse || '',
      weeklyIncluded: report.weeklyIncluded || false,
      monthlyIncluded: report.monthlyIncluded || false
    });
    setModalVisible(true);
  };

  // Colors
  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgInputDeep = isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const filteredReports = reports.filter(r => {
    if (searchQuery && !r.notes?.toLowerCase().includes(searchQuery.toLowerCase()) && !r.clientResponse?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'ALL' && !(r.types || []).includes(filterType)) return false;
    return true;
  });

  const getDropdownOptions = () => {
    if (dropdownType === 'project') return [{_id: '', name: 'Select Project'}, ...projects.map(p => ({_id: p._id, name: p.name || p.projectName}))];
    if (dropdownType === 'filterType') return [{_id: 'ALL', name: 'All Types'}, ...UPDATE_TYPES.map(t => ({_id: t.key, name: t.label}))];
    return [];
  };

  const renderItem = ({ item }) => {
    const projName = item.projectName || item.project?.name || 'Unknown Project';
    const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'No Date';
    return (
      <View className={`border rounded-lg p-4 mb-4 ${bgCard} ${borderColor}`}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <Text className={`text-base font-bold mb-1 ${textColor}`}>{projName}</Text>
            <Text className={`text-[10px] uppercase font-bold tracking-widest ${textMuted}`}>{dateStr}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => openEditModal(item)} className={`p-2 rounded mr-2 ${bgInputDeep}`}>
              <Edit2 size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id || item.id)} className={`p-2 rounded ${bgInputDeep}`}>
              <Trash2 size={14} color="#ff4747" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row flex-wrap mb-4">
          {(item.types || []).map(tKey => {
            const m = UPDATE_TYPES.find(x => x.key === tKey) || { label: tKey, bg: isDarkMode ? '#333' : '#eee', text: isDarkMode ? '#fff' : '#000' };
            return (
              <View key={tKey} className="px-2 py-1 rounded mr-2 mb-2" style={{ backgroundColor: m.bg }}>
                <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: m.text }}>{m.label}</Text>
              </View>
            );
          })}
        </View>

        <View className={`p-3 rounded mb-3 ${bgInputAlt} ${borderColor} border`}>
          <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Notes / Update</Text>
          <Text className={`text-xs leading-5 ${textColor}`}>{item.notes}</Text>
        </View>

        {!!item.clientResponse && (
          <View className={`p-3 rounded mb-4 ${bgInputDeep} ${borderColor} border`}>
            <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Client Response</Text>
            <Text className={`text-xs leading-5 ${textColor}`}>{item.clientResponse}</Text>
          </View>
        )}

        <View className="flex-row justify-between pt-3 border-t" style={{ borderColor: isDarkMode ? '#ffffff1a' : '#e5e7eb' }}>
          <View className="flex-1 mr-2">
             <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Weekly Included</Text>
             <TouchableOpacity onPress={() => toggleIncluded(item._id || item.id, 'weeklyIncluded', item.weeklyIncluded)} className={`py-1.5 px-3 rounded flex-row justify-center items-center ${item.weeklyIncluded ? (isDarkMode ? 'bg-[#10b9811a] border border-[#10b9814a]' : 'bg-green-50 border border-green-200') : (bgInputAlt + ' border ' + borderColor)}`}>
               {item.weeklyIncluded ? <Check size={12} color={isDarkMode ? "#10b981" : "#16a34a"} className="mr-1" /> : <X size={12} color={isDarkMode ? "#ef4444" : "#dc2626"} className="mr-1" />}
               <Text className={`text-[9px] font-bold uppercase tracking-widest ${item.weeklyIncluded ? (isDarkMode ? 'text-[#10b981]' : 'text-green-600') : (isDarkMode ? 'text-[#ef4444]' : 'text-red-600')}`}>{item.weeklyIncluded ? 'YES' : 'NO'}</Text>
             </TouchableOpacity>
          </View>
          <View className="flex-1 ml-2">
             <Text className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Monthly Included</Text>
             <TouchableOpacity onPress={() => toggleIncluded(item._id || item.id, 'monthlyIncluded', item.monthlyIncluded)} className={`py-1.5 px-3 rounded flex-row justify-center items-center ${item.monthlyIncluded ? (isDarkMode ? 'bg-[#10b9811a] border border-[#10b9814a]' : 'bg-green-50 border border-green-200') : (bgInputAlt + ' border ' + borderColor)}`}>
               {item.monthlyIncluded ? <Check size={12} color={isDarkMode ? "#10b981" : "#16a34a"} className="mr-1" /> : <X size={12} color={isDarkMode ? "#ef4444" : "#dc2626"} className="mr-1" />}
               <Text className={`text-[9px] font-bold uppercase tracking-widest ${item.monthlyIncluded ? (isDarkMode ? 'text-[#10b981]' : 'text-green-600') : (isDarkMode ? 'text-[#ef4444]' : 'text-red-600')}`}>{item.monthlyIncluded ? 'YES' : 'NO'}</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const weeklyCount = reports.filter(r => r.weeklyIncluded).length;
  const monthlyCount = reports.filter(r => r.monthlyIncluded).length;

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View className="flex-1 mr-3">
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Employee / Reports</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Reports</Text>
        </View>
        <TouchableOpacity onPress={() => openAddModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>ADD REPORT</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View className="flex-row justify-between mb-6 -mx-1">
        <View className={`border rounded p-4 flex-1 mx-1 ${bgCard} ${borderColor}`}>
          <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Total Reports</Text>
          <Text className={`text-2xl font-bold ${textColor}`}>{reports.length}</Text>
        </View>
        <View className={`border rounded p-4 flex-1 mx-1 ${bgCard} ${borderColor}`}>
          <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Weekly Inc.</Text>
          <Text className={`text-2xl font-bold text-[#10b981]`}>{weeklyCount}</Text>
        </View>
        <View className={`border rounded p-4 flex-1 mx-1 ${bgCard} ${borderColor}`}>
          <Text className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Monthly Inc.</Text>
          <Text className={`text-2xl font-bold text-[#f59e0b]`}>{monthlyCount}</Text>
        </View>
      </View>

      {/* Filters */}
      <View className="mb-4">
         <View className={`flex-row items-center border rounded px-3 h-10 mb-2 ${bgCard} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search reports..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
         <TouchableOpacity onPress={() => { setDropdownType('filterType'); setDropdownVisible(true); }} className={`w-full border rounded px-3 h-10 flex-row items-center justify-between ${bgCard} ${borderColor}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-widest ${textColor}`}>{filterType === 'ALL' ? 'All Types' : UPDATE_TYPES.find(t => t.key === filterType)?.label || filterType}</Text>
            <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
         </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={filteredReports}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={isDarkMode ? "#adc6ff" : "#2573e6"} />}
          ListEmptyComponent={
            <View className={`items-center justify-center mt-10 p-6 border rounded-lg ${bgCard} ${borderColor}`}>
               <View className={`h-12 w-12 rounded-full items-center justify-center mb-4 ${bgInputDeep}`}>
                 <FileText size={24} color={isDarkMode ? "#888" : "#9ca3af"} />
               </View>
               <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>No reports found</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4 pt-10">
          <View className={`border rounded-lg p-5 w-full max-h-[95%] ${bgCard} ${borderColor}`}>
            <View className={`flex-row justify-between items-center mb-5 border-b pb-4 ${borderColor}`}>
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{editingId ? 'Edit Report' : 'Add Report'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Project</Text>
               <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className={`border rounded p-3 mb-4 flex-row justify-between items-center ${bgInputAlt} ${borderColor}`}>
                  <Text className={formData.projectId ? `text-xs ${textColor}` : `text-xs ${textMuted}`}>
                    {formData.projectId ? projects.find(p => p._id === formData.projectId)?.name || projects.find(p => p._id === formData.projectId)?.projectName || 'Unknown Project' : 'Select Project'}
                  </Text>
                  <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
               </TouchableOpacity>

               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                   <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Date</Text>
                   <TouchableOpacity onPress={() => setShowDatePicker(true)} className={`border rounded p-3 flex-row items-center ${bgInputAlt} ${borderColor}`}>
                      <Calendar size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
                      <Text className={`text-xs ${textColor}`}>{formData.date.toLocaleDateString()}</Text>
                   </TouchableOpacity>
                 </View>
                 <View className="flex-1 ml-2">
                   <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Duration (hrs)</Text>
                   <View className={`border rounded px-3 py-1 ${bgInputAlt} ${borderColor}`}>
                     <TextInput 
                       value={formData.duration}
                       onChangeText={v => setFormData({...formData, duration: v})}
                       keyboardType="numeric"
                       placeholder="e.g. 2"
                       placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
                       className={`text-xs h-9 ${textColor}`}
                     />
                   </View>
                 </View>
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Update Types</Text>
               <View className="flex-row flex-wrap mb-2">
                 {UPDATE_TYPES.map(t => {
                   const isSel = formData.types.includes(t.key);
                   return (
                     <TouchableOpacity 
                        key={t.key} 
                        onPress={() => {
                          setFormData(prev => ({
                            ...prev, 
                            types: isSel ? prev.types.filter(k => k !== t.key) : [...prev.types, t.key]
                          }));
                        }}
                        className={`px-3 py-2 rounded mr-2 mb-2 border ${isSel ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : (bgInputAlt + ' ' + borderColor)}`}
                     >
                        <Text className={`text-[10px] font-bold uppercase tracking-widest ${isSel ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>{t.label}</Text>
                     </TouchableOpacity>
                   );
                 })}
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Notes / Update</Text>
               <View className={`border rounded p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
                  <TextInput 
                    value={formData.notes} 
                    onChangeText={v => setFormData({...formData, notes: v})} 
                    placeholder="Details about the update..." 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    multiline numberOfLines={4}
                    className={`text-xs min-h-[80px] ${textColor}`} 
                    textAlignVertical="top"
                  />
               </View>

               <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Client Response (Optional)</Text>
               <View className={`border rounded p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
                  <TextInput 
                    value={formData.clientResponse} 
                    onChangeText={v => setFormData({...formData, clientResponse: v})} 
                    placeholder="Any feedback from the client?" 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    multiline numberOfLines={3}
                    className={`text-xs min-h-[60px] ${textColor}`} 
                    textAlignVertical="top"
                  />
               </View>

            </ScrollView>

            <View className="flex-row justify-between pt-4 mt-2 border-t border-[#333]">
               <TouchableOpacity onPress={() => setModalVisible(false)} className={`flex-1 mr-2 py-3 border rounded items-center ${borderColor} ${bgInputAlt}`}>
                  <Text className={`font-bold text-xs uppercase tracking-widest ${textColor}`}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`flex-1 ml-2 py-3 rounded items-center flex-row justify-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : (
                     <>
                        <Check size={14} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
                        <Text className={`font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Report</Text>
                     </>
                  )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
              setFormData({...formData, date: selectedDate});
            }
          }}
        />
      )}

      {/* Shared Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className={`border rounded-lg w-5/6 max-h-[60%] p-2 ${bgCard} ${borderColor}`}>
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
              renderItem={({item}) => {
                let isSelected = false;
                if (dropdownType === 'project') isSelected = formData.projectId === item._id;
                if (dropdownType === 'filterType') isSelected = filterType === item._id;

                return (
                  <TouchableOpacity 
                    className={`py-4 px-4 border-b flex-row items-center justify-between ${borderColor}`} 
                    onPress={() => {
                      if (dropdownType === 'project') setFormData({...formData, projectId: item._id});
                      if (dropdownType === 'filterType') setFilterType(item._id);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text className={`text-base capitalize ${textColor}`}>{item.name || item.projectName || item.label}</Text>
                    {isSelected && <CheckCircle size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
