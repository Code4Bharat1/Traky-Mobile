import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { Tags, Plus } from 'lucide-react-native';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await client.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a] flex-row items-center">
      <View className="h-10 w-10 rounded-full bg-[#201f1f] items-center justify-center mr-4">
        <Tags size={20} color="#adc6ff" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-bold">{item.name}</Text>
        <Text className="text-[#6b7280] text-xs mt-1">{item.description || 'No description'}</Text>
      </View>
      <View className="bg-[#201f1f] px-2 py-1 rounded">
        <Text className="text-[#adc6ff] text-[10px] tracking-widest uppercase">
          {item.type || 'General'}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">CATEGORIES</Text>
        <TouchableOpacity className="bg-[#adc6ff] p-2 rounded-full">
          <Plus size={20} color="#131313" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No categories found.</Text>
          }
        />
      )}
    </View>
  );
}
