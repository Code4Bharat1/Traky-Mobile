import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import client from '../../api/client';
import { Search, User, Edit2, Trash2 } from 'lucide-react-native';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await client.get('/users?limit=100');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a] flex-row items-center">
      <View className="h-10 w-10 rounded-full bg-[#201f1f] items-center justify-center mr-4">
        <User size={20} color="#adc6ff" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-bold">{item.name}</Text>
        <Text className="text-[#c2c6d6] text-xs">{item.email}</Text>
        <Text className="text-[#adc6ff] text-[10px] mt-1 tracking-widest uppercase">
          {item.role?.name || item.role || 'User'}
        </Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity className="p-2">
          <Edit2 size={16} color="#c2c6d6" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2 ml-1">
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <Text className="text-white text-2xl font-bold mb-4 mt-4 tracking-wider">USER DIRECTORY</Text>
      
      <View className="flex-row items-center bg-[#201f1f] border border-[#ffffff33] rounded h-10 px-3 mb-6">
        <Search size={16} color="#c2c6d6" />
        <TextInput 
          className="flex-1 text-white text-sm ml-2"
          placeholder="Search by name or email..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No users found.</Text>
          }
        />
      )}
    </View>
  );
}
