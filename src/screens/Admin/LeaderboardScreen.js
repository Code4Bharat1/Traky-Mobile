import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import client from '../../api/client';
import { Trophy, Medal, Award, User } from 'lucide-react-native';

export default function LeaderboardScreen() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const response = await client.get('/leaderboard');
      setLeaders(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={24} color="#fbbf24" />; // Gold
    if (index === 1) return <Medal size={24} color="#9ca3af" />; // Silver
    if (index === 2) return <Award size={24} color="#b45309" />; // Bronze
    return <Text className="text-[#6b7280] font-bold text-lg w-6 text-center">{index + 1}</Text>;
  };

  const renderItem = ({ item, index }) => (
    <View className="bg-[#1c1b1b] rounded-lg p-4 mb-3 border border-[#ffffff1a] flex-row items-center">
      <View className="w-8 items-center justify-center mr-3">
        {getRankIcon(index)}
      </View>
      
      <View className="flex-row items-center flex-1">
        <View className="h-10 w-10 rounded-full bg-[#2a2a2a] items-center justify-center mr-3 border border-[#333]">
          <User size={18} color="#adc6ff" />
        </View>
        <View>
          <Text className="text-white font-bold text-base">{item.name || 'Anonymous'}</Text>
          <Text className="text-[#6b7280] text-xs">{item.department?.departmentName || 'Employee'}</Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-white font-bold text-lg">{item.behaviourScore || item.score || 0}</Text>
        <Text className="text-[#adc6ff] text-xs font-bold uppercase">Points</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">LEADERBOARD</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <FlatList 
          data={leaders}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-[#c2c6d6] text-center mt-10">No leaderboard data found.</Text>
          }
        />
      )}
    </View>
  );
}
