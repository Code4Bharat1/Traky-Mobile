import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { createTaskTemplate, deleteTaskTemplate, getDepartments, getTaskTemplates } from '../../api/services';
import { Plus, Edit2, Trash2, X, ChevronDown, CheckCircle, Search, FileText, Bookmark } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function TaskTemplatesScreen() {
  const { isDarkMode } = useThemeStore();
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ templateName: '', title: '', description: '', points: '0', priority: 'MEDIUM', departmentId: '' });
  const [saving, setSaving] = useState(false);
  
  // Dropdown States
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tempRes, depRes] = await Promise.all([
        client.get('/task-templates').catch(e => ({ data: [] })),
        client.get('/departments').catch(() => ({ data: { data: [] } }))
      ]);
      setTemplates(tempRes.data.data || tempRes.data || []);
      setDepartments(depRes.data.allDepartments || depRes.data.data || []);
    } catch (error) {
      console.error("Failed to load templates data", error);
      Alert.alert('Error', 'Failed to load templates data: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        templateName: template.templateName || '',
        title: template.title || '',
        description: template.description || '',
        points: template.points?.toString() || '0',
        priority: template.priority || 'MEDIUM',
        departmentId: template.departmentId?._id || template.departmentId || ''
      });
    } else {
      setEditingTemplate(null);
      setFormData({ templateName: '', title: '', description: '', points: '0', priority: 'MEDIUM', departmentId: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.templateName || !formData.title) {
      Alert.alert('Error', 'Template Name and Task Title are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, points: Number(formData.points) };
      if (editingTemplate) {
        await client.patch(`/task-templates/${editingTemplate._id}`, payload).catch(e => client.patch(`/taskTemplates/${editingTemplate._id}`, payload));
      } else {
        await client.post('/task-templates', payload).catch(e => client.post('/taskTemplates', payload));
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Template', 'Are you sure you want to delete this template?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/task-templates/${id}`).catch(e => client.delete(`/taskTemplates/${id}`));
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete template');
          }
      }}
    ]);
  };

  // Processing Data
  const safeTemplates = Array.isArray(templates) ? templates : [];
  
  const filteredTemplates = safeTemplates.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tName = (t.templateName || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      if (!tName.includes(q) && !title.includes(q)) return false;
    }
    return true;
  });

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} className={`rounded-xl p-5 mb-4 border w-[48%] mx-[1%] ${bgCard} ${borderColor}`}>
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center flex-1 mr-2">
          <View className={`h-10 w-10 rounded-lg items-center justify-center border mr-3 ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-50'} ${borderColor}`}>
            <FileText size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
          </View>
          <View className="flex-1">
            <Text className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${textColor}`} numberOfLines={1}>{item.templateName || 'Unnamed'}</Text>
            <Text className={`text-[9px] uppercase tracking-widest font-bold ${textMuted}`}>{item.priority || 'MEDIUM'} PRIORITY</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1">
          <Trash2 size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
        </TouchableOpacity>
      </View>
      
      <Text className={`text-xs uppercase font-bold tracking-wider mb-6 ${textColor}`} numberOfLines={2}>{item.title || item.templateName}</Text>
      
      <View className="flex-row items-center mt-auto">
         <View className="flex-row items-center bg-[#f59e0b1a] px-2 py-1 rounded border border-[#f59e0b4a]">
            <Bookmark size={10} color="#f59e0b" className="mr-1" />
            <Text className="text-[#f59e0b] text-[9px] font-bold uppercase tracking-widest">{item.points || 0} PTS</Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View className="flex-1 mr-3">
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Employee / Templates</Text>
           <Text className={`text-2xl font-bold tracking-wider mb-1 ${textColor}`}>Template Library</Text>
           <Text className={`text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>Manage your reusable task templates</Text>
        </View>
      </View>

      {/* Search */}
      <View className="mb-6">
         <View className={`border rounded px-3 h-10 flex-row items-center ${bgInput} ${borderColor}`}>
            <Search size={16} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search templates..."
               placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
               className={`flex-1 text-xs h-10 ${textColor}`}
            />
         </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={filteredTemplates}
          keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className={`items-center justify-center py-16 px-6 border border-dashed rounded-xl mt-4 ${bgCard} ${borderColor}`}>
               <FileText size={48} color={isDarkMode ? "#444" : "#ccc"} className="mb-4" />
               <Text className={`font-bold text-base mb-1 tracking-wider ${textColor}`}>No templates found</Text>
               <Text className={`text-xs text-center ${textMuted}`}>Save a task as a template from the Task Modal to see it here</Text>
            </View>
          }
        />
      )}

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className={`border-t rounded-t-2xl p-6 h-[85%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-lg font-bold tracking-widest uppercase ${textColor}`}>{editingTemplate ? 'Edit Template' : 'Create Template'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Template Name *</Text>
              <View className={`border rounded p-3 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.templateName} 
                   onChangeText={v => setFormData({...formData, templateName: v})} 
                   placeholder="e.g. Daily Standup Prep" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={`text-base py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Task Title *</Text>
              <View className={`border rounded p-3 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.title} 
                   onChangeText={v => setFormData({...formData, title: v})} 
                   placeholder="e.g. Prepare standup notes" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={`text-base py-1 ${textColor}`} 
                 />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Description</Text>
              <View className={`border rounded p-3 mb-4 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Task description..." 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   multiline numberOfLines={3}
                   className={`text-base py-1 min-h-[60px] ${textColor}`} 
                   textAlignVertical="top"
                 />
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="flex-1 mr-2">
                  <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Points</Text>
                  <View className={`border rounded p-3 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                     <TextInput 
                       value={formData.points} 
                       onChangeText={v => setFormData({...formData, points: v})} 
                       keyboardType="numeric"
                       className={`text-base py-1 ${textColor}`} 
                     />
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Priority</Text>
                  <View className={`flex-row justify-between border rounded p-1 ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <TouchableOpacity key={p} onPress={() => setFormData({...formData, priority: p})} className={`flex-1 py-2 items-center rounded ${formData.priority === p ? (isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]') : ''}`}>
                        <Text className={`text-[10px] font-bold ${formData.priority === p ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>{p[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Department (Optional)</Text>
              <TouchableOpacity onPress={() => setDropdownVisible(true)} className={`border rounded p-4 mb-8 flex-row justify-between items-center ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
                 <Text className={formData.departmentId ? `text-base capitalize ${textColor}` : `text-base ${textMuted}`}>
                   {formData.departmentId ? departments.find(d => d._id === formData.departmentId)?.departmentName || 'Unknown' : 'Select a department'}
                 </Text>
                 <ChevronDown size={20} color={isDarkMode ? "#888" : "#9ca3af"} />
              </TouchableOpacity>
            </ScrollView>

            <View className={`flex-row justify-end pt-4 border-t mt-2 pb-6 ${borderColor}`}>
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-sm uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Template</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className={`border rounded-lg w-5/6 max-h-[60%] p-2 ${bgCard} ${borderColor}`}>
            <FlatList
              data={[{_id: '', departmentName: 'No Department'}, ...departments]}
              keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
              renderItem={({item}) => (
               <TouchableOpacity className={`py-4 px-4 border-b flex-row items-center justify-between ${borderColor}`} onPress={() => { setFormData({...formData, departmentId: item._id}); setDropdownVisible(false); }}>
                  <Text className={`text-base capitalize ${textColor}`}>{item.departmentName}</Text>
                  {formData.departmentId === item._id && <CheckCircle size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} />}
               </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
