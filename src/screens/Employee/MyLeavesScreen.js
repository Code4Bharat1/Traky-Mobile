import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { applyLeave, cancelLeave, getMyLeaves } from '../../api/services';
import { Umbrella, Plus, X, ChevronDown, CheckCircle, Clock, Calendar, Check, AlertCircle, Paperclip } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

const LEAVE_TYPES = [
  { _id: 'sick', name: 'Sick Leave' },
  { _id: 'casual', name: 'Casual Leave' },
  { _id: 'earned', name: 'Earned Leave' },
  { _id: 'maternity', name: 'Maternity Leave' },
  { _id: 'paternity', name: 'Paternity Leave' },
  { _id: 'unpaid', name: 'Unpaid Leave' },
  { _id: 'other', name: 'Other' },
];

export default function MyLeavesScreen() {
  const { isDarkMode } = useThemeStore();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: 'sick',
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
  });

  const [showPicker, setShowPicker] = useState(null); // 'start' or 'end'

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await client.get('/leave/my?limit=50');
      setLeaves(res.data?.leaves || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load leaves:", err);
      Alert.alert('Error', 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const openAddModal = () => {
    setFormData({
      leaveType: 'sick',
      startDate: new Date(),
      endDate: new Date(),
      reason: '',
    });
    setAddModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.reason) {
      Alert.alert('Error', 'Reason is required');
      return;
    }
    setSaving(true);
    try {
      const start = formData.startDate.getTime();
      const end = formData.endDate.getTime();
      let diff = (end - start) / (1000 * 60 * 60 * 24) + 1;
      if (diff < 0.5) diff = 0.5;

      const payload = {
        leaveType: formData.leaveType,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        reason: formData.reason,
        totalDays: diff,
      };

      await client.post('/leave', payload);
      setAddModalVisible(false);
      fetchLeaves();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to apply for leave');
    } finally {
      setSaving(false);
    }
  };

  const cancelLeave = async (id) => {
    Alert.alert('Cancel Leave', 'Are you sure you want to cancel this leave request?', [
      { text: 'No' },
      {
        text: 'Yes', onPress: async () => {
          try {
            await client.patch(`/leave/${id}/cancel`);
            fetchLeaves();
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel leave');
          }
        }
      }
    ]);
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';

  const renderLeave = ({ item }) => {
    const isPending = item.status === 'pending';
    let statusColor = '#888';
    if (item.status === 'approved') statusColor = '#47ff8a';
    if (item.status === 'rejected') statusColor = '#ff4747';
    if (isPending) statusColor = '#47c8ff';

    return (
      <View className={`p-4 border rounded mb-3 ${bgCard} ${borderColor}`}>
        <View className="flex-row justify-between items-start mb-2">
          <View>
             <Text className={`font-bold uppercase tracking-widest text-xs mb-1 ${textColor}`}>
               {item.leaveType}
             </Text>
             <Text className={`text-[10px] tracking-widest font-bold ${textMuted}`}>
               {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
             </Text>
          </View>
          <View className={`px-2 py-1 border rounded`} style={{ borderColor: statusColor + '4d', backgroundColor: statusColor + '1a' }}>
            <Text style={{ color: statusColor, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{item.status}</Text>
          </View>
        </View>
        
        <Text className={`text-sm mt-2 ${textColor}`}>{item.reason}</Text>
        
        {isPending && (
          <TouchableOpacity onPress={() => cancelLeave(item._id)} className="mt-3 self-start border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded">
            <Text className="text-red-500 text-[10px] font-bold tracking-widest uppercase">Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filterStatus === 'ALL') return true;
    return leave.status.toUpperCase() === filterStatus;
  });

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View className="flex-1 mr-3">
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Employee / My Leaves</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>My Leaves</Text>
        </View>
        <TouchableOpacity onPress={() => openAddModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>APPLY LEAVE</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{ height: 40, marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(tab => {
            const isActive = filterStatus === tab;
            return (
              <TouchableOpacity 
                key={tab}
                onPress={() => setFilterStatus(tab)}
                className={`px-4 py-2 mr-2 rounded-full ${isActive ? (isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]') : (isDarkMode ? 'bg-[#1c1b1b]' : 'bg-gray-200')} ${!isActive ? 'border ' + borderColor : ''}`}
              >
                <Text className={`text-[10px] font-bold tracking-widest uppercase ${isActive ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textMuted}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
        </View>
      ) : (
        <FlatList
          data={filteredLeaves}
          keyExtractor={(item) => item._id}
          renderItem={renderLeave}
          ListEmptyComponent={
            <View className={`items-center justify-center py-12 px-4 border rounded ${bgCard} ${borderColor}`}>
              <Calendar size={48} color={isDarkMode ? "#444" : "#ccc"} className="mb-4" />
              <Text className={`font-bold text-base mb-1 ${textColor}`}>No leave requests</Text>
              <Text className={`text-xs mb-6 ${textMuted}`}>You haven't applied for any leaves yet.</Text>
              <TouchableOpacity onPress={() => openAddModal()} className={`px-6 py-3 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                 <Text className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Leave Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center bg-black/50 p-4">
          <View className={`rounded-xl overflow-hidden ${bgCard} border ${borderColor} w-full max-w-sm`}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-[#ffffff1a]">
              <View className="flex-row items-center">
                <Calendar size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-3" />
                <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>APPLY FOR LEAVE</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X color={isDarkMode ? "#fff" : "#000"} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="p-5">
              <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>LEAVE TYPE <Text className="text-red-500">*</Text></Text>
              <TouchableOpacity 
                className={`border p-3 rounded mb-4 flex-row justify-between items-center ${bgInput} ${borderColor}`}
                onPress={() => setDropdownVisible(!dropdownVisible)}
              >
                <Text className={textColor}>{LEAVE_TYPES.find(t => t._id === formData.leaveType)?.name || 'Select Type'}</Text>
                <ChevronDown size={16} color={isDarkMode ? "#888" : "#ccc"} />
              </TouchableOpacity>
              
              {dropdownVisible && (
                <View className={`border rounded mb-4 max-h-40 ${bgInput} ${borderColor}`}>
                  <ScrollView nestedScrollEnabled>
                    {LEAVE_TYPES.map(t => (
                      <TouchableOpacity 
                        key={t._id} 
                        className={`p-3 border-b ${borderColor}`}
                        onPress={() => {
                          setFormData({...formData, leaveType: t._id});
                          setDropdownVisible(false);
                        }}
                      >
                        <Text className={textColor}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest mt-1 ${textMuted}`}>LEAVE DURATION <Text className="text-red-500">*</Text></Text>
              <View className={`border rounded-lg mb-5 flex-row items-center justify-between overflow-hidden ${bgInput} ${borderColor}`}>
                <TouchableOpacity onPress={() => setShowPicker('start')} className="flex-1 p-3.5 items-center border-r border-[#ffffff1a]">
                  <Text className={`text-sm ${textColor}`}>{formData.startDate.toLocaleDateString()}</Text>
                  <Text className={`text-[9px] font-bold mt-1 tracking-widest uppercase ${textMuted}`}>START</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPicker('end')} className="flex-1 p-3.5 items-center">
                  <Text className={`text-sm ${textColor}`}>{formData.endDate.toLocaleDateString()}</Text>
                  <Text className={`text-[9px] font-bold mt-1 tracking-widest uppercase ${textMuted}`}>END</Text>
                </TouchableOpacity>
              </View>

              {showPicker && (
                <DateTimePicker
                  value={showPicker === 'start' ? formData.startDate : formData.endDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowPicker(null);
                    if (selectedDate) {
                      setFormData(prev => ({ ...prev, [showPicker === 'start' ? 'startDate' : 'endDate']: selectedDate }));
                    }
                  }}
                />
              )}

              <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>REASON <Text className="text-red-500">*</Text></Text>
              <TextInput
                className={`border p-3 rounded-lg mb-5 text-sm ${bgInput} ${borderColor} ${textColor}`}
                placeholder="Briefly describe the reason for your leave..."
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                value={formData.reason}
                onChangeText={t => setFormData({...formData, reason: t})}
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: 'top' }}
              />

              <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>ATTACHMENT (OPTIONAL)</Text>
              <TouchableOpacity className={`border border-dashed p-4 rounded-lg mb-6 flex-row items-center ${bgInput} ${borderColor}`}>
                 <Paperclip size={16} color={isDarkMode ? '#888' : '#ccc'} className="mr-3" />
                 <Text className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>Upload medical certificate or document</Text>
              </TouchableOpacity>
            </ScrollView>
            
            {/* Action Buttons */}
            <View className={`flex-row p-5 pt-0 bg-transparent`}>
               <TouchableOpacity 
                  onPress={() => setAddModalVisible(false)} 
                  className={`flex-1 p-3.5 rounded border border-[#ffffff1a] items-center mr-3 ${isDarkMode ? 'bg-[#1c1b1b]' : 'bg-gray-100'}`}
               >
                  <Text className={`font-bold tracking-widest uppercase text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CANCEL</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                  onPress={handleSave} 
                  disabled={saving}
                  className={`flex-1 p-3.5 rounded items-center justify-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'} ${saving ? 'opacity-50' : ''}`}
               >
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? '#131313' : '#fff'} /> : (
                     <Text className={`font-bold tracking-widest uppercase text-xs ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>SUBMIT REQUEST</Text>
                  )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
