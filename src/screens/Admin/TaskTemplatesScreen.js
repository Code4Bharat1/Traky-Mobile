import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { FileText, Plus, ChevronRight } from 'lucide-react-native';

export default function TaskTemplatesScreen() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const response = await client.get('/task-templates');
      setTemplates(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load templates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a] flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="h-10 w-10 rounded-full bg-[#201f1f] items-center justify-center mr-3">
          <FileText size={20} color="#adc6ff" />
        </View>
        <View>
          <Text className="text-white font-bold text-base mb-1">{item.name || item.title || 'Untitled Template'}</Text>
          <Text className="text-[#6b7280] text-xs">Used {item.usageCount || 0} times</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#6b7280" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">TEMPLATES</Text>
        <TouchableOpacity className="bg-[#adc6ff] p-2 rounded-full">
          <Plus size={20} color="#131313" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={templates}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No task templates found.</Text>
          }
        />
      )}
    </View>
  );
}
