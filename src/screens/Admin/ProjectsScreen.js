import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../../api/client';
import { FolderKanban, Plus, Clock, Users } from 'lucide-react-native';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      // Fetching all projects for the company
      const response = await client.get('/projects');
      setProjects(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a]">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <FolderKanban size={18} color="#adc6ff" className="mr-2" />
          <Text className="text-white text-base font-bold">{item.projectName || item.name || 'Unnamed Project'}</Text>
        </View>
        <View className={`px-2 py-1 rounded text-xs ${item.status === 'completed' ? 'bg-green-900/50' : 'bg-[#adc6ff]/20'}`}>
          <Text className={`text-xs ${item.status === 'completed' ? 'text-green-400' : 'text-[#adc6ff]'} uppercase font-bold`}>
            {item.status || 'Active'}
          </Text>
        </View>
      </View>
      
      {item.description && (
        <Text className="text-[#c2c6d6] text-sm mb-3" numberOfLines={2}>{item.description}</Text>
      )}

      <View className="flex-row justify-between items-center mt-2 border-t border-[#ffffff1a] pt-3">
        <View className="flex-row items-center">
          <Clock size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">
            {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Users size={14} color="#6b7280" className="mr-1" />
          <Text className="text-[#6b7280] text-xs">{item.members?.length || 0} Members</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">PROJECTS</Text>
        <TouchableOpacity className="bg-[#adc6ff] p-2 rounded-full">
          <Plus size={20} color="#131313" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={projects}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No projects found.</Text>
          }
        />
      )}
    </View>
  );
}
