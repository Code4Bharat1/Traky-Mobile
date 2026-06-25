import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { CheckSquare, Plus, Clock, Tag } from 'lucide-react-native';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await client.get('/tasks');
      setTasks(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white text-base font-bold flex-1 mr-2">{item.title || 'Untitled Task'}</Text>
        <View className={`px-2 py-1 rounded text-xs ${item.status === 'completed' ? 'bg-green-900/50' : 'bg-yellow-900/50'}`}>
          <Text className={`text-xs uppercase font-bold ${item.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-2 border-t border-[#ffffff1a] pt-3">
        <View className="flex-row items-center mr-4">
          <Clock size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">
            {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Tag size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">{item.priority || 'Normal'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">TASKS</Text>
        <TouchableOpacity className="bg-[#adc6ff] p-2 rounded-full">
          <Plus size={20} color="#131313" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={tasks}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No tasks found.</Text>
          }
        />
      )}
    </View>
  );
}
