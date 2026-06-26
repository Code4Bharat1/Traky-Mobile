import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import client from '../../api/client';
import { Plus, Edit2, Trash2, X, ChevronDown, CheckCircle, Search, FileText, Bookmark } from 'lucide-react-native';

export default function TaskTemplatesScreen() {
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
        client.get('/task-templates').catch(e => client.get('/taskTemplates')), // fallback just in case
        client.get('/departments')
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

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} className="bg-[#1c1b1b] rounded-xl p-5 mb-4 border border-[#ffffff1a] w-[48%] mx-[1%]">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="h-10 w-10 rounded-lg bg-[#201f1f] items-center justify-center border border-[#ffffff1a] mr-3">
            <FileText size={18} color="#adc6ff" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-xs font-bold uppercase tracking-wider mb-0.5" numberOfLines={1}>{item.templateName || 'Unnamed'}</Text>
            <Text className="text-[#888] text-[9px] uppercase tracking-widest font-bold">{item.priority || 'MEDIUM'} PRIORITY</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1">
          <Trash2 size={14} color="#888" />
        </TouchableOpacity>
      </View>
      
      <Text className="text-white text-xs uppercase font-bold tracking-wider mb-6" numberOfLines={2}>{item.title || item.templateName}</Text>
      
      <View className="flex-row items-center mt-auto">
         <View className="flex-row items-center bg-[#f59e0b1a] px-2 py-1 rounded border border-[#f59e0b4a]">
            <Bookmark size={10} color="#f59e0b" className="mr-1" />
            <Text className="text-[#f59e0b] text-[9px] font-bold uppercase tracking-widest">{item.points || 0} PTS</Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className="text-white text-2xl font-bold tracking-wider mb-1">TASK TEMPLATES</Text>
           <Text className="text-[#888] text-xs">Manage all company task templates</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className="bg-[#adc6ff] p-3 rounded-full">
          <Plus size={20} color="#131313" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="mb-6">
         <View className="flex-row items-center bg-[#1c1b1b] border border-[#ffffff1a] rounded px-3 h-10">
            <Search size={16} color="#888" className="mr-2" />
            <TextInput 
               value={searchQuery}
               onChangeText={setSearchQuery}
               placeholder="Search templates..."
               placeholderTextColor="#888"
               className="flex-1 text-white text-xs h-10"
            />
         </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={filteredTemplates}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-10 p-6">
               <Text className="text-[#888] text-xs">No templates found.</Text>
            </View>
          }
        />
      )}

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border-t border-[#ffffff1a] rounded-t-2xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-lg font-bold tracking-widest uppercase">{editingTemplate ? 'Edit Template' : 'Create Template'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#888" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Template Name *</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.templateName} 
                   onChangeText={v => setFormData({...formData, templateName: v})} 
                   placeholder="e.g. Daily Standup Prep" 
                   placeholderTextColor="#888" 
                   className="text-white text-base py-1" 
                 />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Task Title *</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.title} 
                   onChangeText={v => setFormData({...formData, title: v})} 
                   placeholder="e.g. Prepare standup notes" 
                   placeholderTextColor="#888" 
                   className="text-white text-base py-1" 
                 />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Description</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3 mb-4">
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Task description..." 
                   placeholderTextColor="#888" 
                   multiline numberOfLines={3}
                   className="text-white text-base py-1 min-h-[60px]" 
                   textAlignVertical="top"
                 />
              </View>

              <View className="flex-row justify-between mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Points</Text>
                  <View className="border border-[#ffffff1a] bg-[#131313] rounded p-3">
                     <TextInput 
                       value={formData.points} 
                       onChangeText={v => setFormData({...formData, points: v})} 
                       keyboardType="numeric"
                       className="text-white text-base py-1" 
                     />
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Priority</Text>
                  <View className="flex-row justify-between border border-[#ffffff1a] bg-[#131313] rounded p-1">
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <TouchableOpacity key={p} onPress={() => setFormData({...formData, priority: p})} className={`flex-1 py-2 items-center rounded ${formData.priority === p ? 'bg-[#adc6ff]' : ''}`}>
                        <Text className={`text-[10px] font-bold ${formData.priority === p ? 'text-[#131313]' : 'text-white'}`}>{p[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Department (Optional)</Text>
              <TouchableOpacity onPress={() => setDropdownVisible(true)} className="border border-[#ffffff1a] bg-[#131313] rounded p-4 mb-8 flex-row justify-between items-center">
                 <Text className={formData.departmentId ? "text-white text-base capitalize" : "text-[#888] text-base"}>
                   {formData.departmentId ? departments.find(d => d._id === formData.departmentId)?.departmentName || 'Unknown' : 'Select a department'}
                 </Text>
                 <ChevronDown size={20} color="#888" />
              </TouchableOpacity>
            </ScrollView>

            <View className="flex-row justify-end pt-4 border-t border-[#ffffff1a] mt-2 pb-6">
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-3 px-4"><Text className="text-white font-bold text-sm uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-[#adc6ff] px-6 py-3 rounded-lg flex-row items-center">
                  {saving ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-sm uppercase tracking-wider">Save Template</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-5/6 max-h-[60%] p-2">
            <FlatList
              data={[{_id: '', departmentName: 'No Department'}, ...departments]}
              keyExtractor={(item) => item._id || 'none'}
              renderItem={({item}) => (
               <TouchableOpacity className="py-4 px-4 border-b border-[#ffffff1a] flex-row items-center justify-between" onPress={() => { setFormData({...formData, departmentId: item._id}); setDropdownVisible(false); }}>
                  <Text className="text-white text-base capitalize">{item.departmentName}</Text>
                  {formData.departmentId === item._id && <CheckCircle size={18} color="#adc6ff" />}
               </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
