import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import client from '../../api/client';
import { Tags, Plus, Edit2, Trash2, X, FolderKanban } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function CategoriesScreen() {
  const { isDarkMode } = useThemeStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#6366f1' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await client.get('/categories');
      setCategories(response.data.categories || response.data.data || []);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#6366f1'
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', color: '#6366f1' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Category Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingCategory) {
        await client.patch(`/categories/${editingCategory._id}`, formData);
      } else {
        await client.post('/categories', formData);
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/categories/${id}`);
            fetchCategories();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete category');
          }
      }}
    ]);
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const totalCategories = safeCategories.length;
  const projectsCategorised = safeCategories.reduce((acc, c) => acc + (c.projectCount || 0), 0);

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#131313]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => (
    <View className={`rounded-lg p-5 mb-4 border ${bgCard} ${borderColor}`}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1">
          <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 border ${borderColor}`} style={{ backgroundColor: `${item.color || '#6366f1'}2a` }}>
            <Tags size={16} color={item.color || (isDarkMode ? '#adc6ff' : '#2573e6')} />
          </View>
          <View className="flex-1">
            <Text className={`text-base font-bold capitalize mb-1 ${textColor}`}>{item.name}</Text>
            <Text className={`text-[10px] uppercase font-bold tracking-widest ${textMuted}`}>{item.description || 'NO DESCRIPTION'}</Text>
          </View>
        </View>
        <View className="flex-row ml-2 items-center">
          <TouchableOpacity onPress={() => openModal(item)} className={`p-1.5 mr-1 rounded border ${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} ${borderColor}`}>
            <Edit2 size={14} color={isDarkMode ? "#c2c6d6" : "#4b5563"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1.5 bg-[#ff47471a] rounded border border-[#ff47474a]">
            <Trash2 size={14} color="#ff4747" />
          </TouchableOpacity>
        </View>
      </View>
      <View className={`flex-row justify-between items-center pt-3 border-t ${borderColor}`}>
        <View className="flex-row items-center">
           <FolderKanban size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
           <Text className={`text-xs font-bold ${textMuted}`}>{item.projectCount || 0} Projects</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Admin / Categories</Text>
           <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Project Categories</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>New Category</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Grid */}
      <View className="flex-row mb-6">
        <View className={`flex-1 border p-4 rounded-lg mr-3 ${bgCard} ${borderColor}`}>
           <View className="flex-row items-center mb-2">
             <Tags size={14} color={isDarkMode ? "#c2c6d6" : "#6b7280"} className="mr-2" />
             <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Total Categories</Text>
           </View>
           <Text className={`text-2xl font-bold ${textColor}`}>{totalCategories}</Text>
        </View>
        <View className={`flex-1 border p-4 rounded-lg ${bgCard} ${borderColor}`}>
           <View className="flex-row items-center mb-2">
             <FolderKanban size={14} color="#47c8ff" className="mr-2" />
             <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Projects Categorised</Text>
           </View>
           <Text className={`text-2xl font-bold ${textColor}`}>{projectsCategorised}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={safeCategories}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className={`items-center justify-center mt-10 p-6 border rounded-lg ${bgCard} ${borderColor}`}>
               <View className={`h-12 w-12 rounded-full items-center justify-center mb-4 ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100'}`}>
                 <Tags size={24} color={isDarkMode ? "#c2c6d6" : "#9ca3af"} />
               </View>
               <Text className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${textMuted}`}>No categories yet</Text>
               <TouchableOpacity onPress={() => openModal()} className={`flex-row items-center px-4 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                 <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-2" />
                 <Text className={`font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Create First Category</Text>
               </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={`border rounded-lg w-11/12 p-6 ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>{editingCategory ? 'Edit Category' : 'Create Category'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#555"} /></TouchableOpacity>
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Category Name *</Text>
            <View className={`border rounded p-2 mb-4 ${bgInput} ${borderColor}`}>
               <TextInput 
                 value={formData.name} 
                 onChangeText={v => setFormData({...formData, name: v})} 
                 placeholder="e.g. Design, Frontend" 
                 placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                 className={`text-sm py-1 ${textColor}`} 
               />
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Description</Text>
            <View className={`border rounded p-2 mb-4 ${bgInput} ${borderColor}`}>
               <TextInput 
                 value={formData.description} 
                 onChangeText={v => setFormData({...formData, description: v})} 
                 placeholder="Short description..." 
                 placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                 className={`text-sm py-1 ${textColor}`} 
               />
            </View>

            <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Color (Hex)</Text>
            <View className={`border rounded p-2 mb-6 flex-row items-center ${bgInput} ${borderColor}`}>
               <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: formData.color || '#6366f1' }} />
               <TextInput 
                 value={formData.color} 
                 onChangeText={v => setFormData({...formData, color: v})} 
                 placeholder="#6366f1" 
                 placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                 className={`text-sm py-1 flex-1 ${textColor}`} 
                 autoCapitalize="none"
               />
            </View>

            <View className={`flex-row justify-end pt-2 border-t mt-2 pt-4 ${borderColor}`}>
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase tracking-widest ${textMuted}`}>Cancel</Text></TouchableOpacity>
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
