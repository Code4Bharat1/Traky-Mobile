import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import client from '../../api/client';
import { Tags, Plus, Edit2, Trash2, X, FolderKanban } from 'lucide-react-native';

export default function CategoriesScreen() {
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

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-5 mb-4 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1">
          <View className="h-10 w-10 rounded-full items-center justify-center mr-3 border border-[#ffffff1a]" style={{ backgroundColor: `${item.color || '#6366f1'}2a` }}>
            <Tags size={16} color={item.color || '#adc6ff'} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold capitalize mb-1">{item.name}</Text>
            <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest">{item.description || 'NO DESCRIPTION'}</Text>
          </View>
        </View>
        <View className="flex-row ml-2 items-center">
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
           <FolderKanban size={12} color="#888" className="mr-2" />
           <Text className="text-[#888] text-xs font-bold">{item.projectCount || 0} Projects</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View>
           <Text className="text-[#888] text-[10px] tracking-widest uppercase mb-1 font-bold">Admin / Categories</Text>
           <Text className="text-white text-2xl font-bold tracking-wider">Project Categories</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} className="bg-[#adc6ff] flex-row items-center px-3 py-2 rounded">
          <Plus size={16} color="#131313" className="mr-1" />
          <Text className="text-[#131313] font-bold text-[10px] uppercase tracking-widest">New Category</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Grid */}
      <View className="flex-row mb-6">
        <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg mr-3">
           <View className="flex-row items-center mb-2">
             <Tags size={14} color="#c2c6d6" className="mr-2" />
             <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Total Categories</Text>
           </View>
           <Text className="text-white text-2xl font-bold">{totalCategories}</Text>
        </View>
        <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg">
           <View className="flex-row items-center mb-2">
             <FolderKanban size={14} color="#47c8ff" className="mr-2" />
             <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Projects Categorised</Text>
           </View>
           <Text className="text-white text-2xl font-bold">{projectsCategorised}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={safeCategories}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-10 p-6 border border-[#ffffff1a] bg-[#1c1b1b] rounded-lg">
               <View className="h-12 w-12 rounded-full bg-[#201f1f] items-center justify-center mb-4">
                 <Tags size={24} color="#c2c6d6" />
               </View>
               <Text className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-4">No categories yet</Text>
               <TouchableOpacity onPress={() => openModal()} className="bg-[#adc6ff] flex-row items-center px-4 py-2 rounded">
                 <Plus size={16} color="#131313" className="mr-2" />
                 <Text className="text-[#131313] font-bold text-xs uppercase tracking-widest">Create First Category</Text>
               </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* CRUD Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-6">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">{editingCategory ? 'Edit Category' : 'Create Category'}</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>

            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Category Name *</Text>
            <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
               <TextInput 
                 value={formData.name} 
                 onChangeText={v => setFormData({...formData, name: v})} 
                 placeholder="e.g. Design, Frontend" 
                 placeholderTextColor="#888" 
                 className="text-white text-sm py-1" 
               />
            </View>

            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Description</Text>
            <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
               <TextInput 
                 value={formData.description} 
                 onChangeText={v => setFormData({...formData, description: v})} 
                 placeholder="Short description..." 
                 placeholderTextColor="#888" 
                 className="text-white text-sm py-1" 
               />
            </View>

            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Color (Hex)</Text>
            <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-6 flex-row items-center">
               <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: formData.color || '#6366f1' }} />
               <TextInput 
                 value={formData.color} 
                 onChangeText={v => setFormData({...formData, color: v})} 
                 placeholder="#6366f1" 
                 placeholderTextColor="#888" 
                 className="text-white text-sm py-1 flex-1" 
                 autoCapitalize="none"
               />
            </View>

            <View className="flex-row justify-end pt-2 border-t border-[#ffffff1a] mt-2 pt-4">
               <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-4 py-2"><Text className="text-[#888] font-bold text-xs uppercase tracking-widest">Cancel</Text></TouchableOpacity>
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
