import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import client from '../../api/client';
import { Users, Activity } from 'lucide-react-native';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We fetch users and activity logs just to derive some basic stats since there is no admin/stats endpoint
    const fetchBasicStats = async () => {
      try {
        const [usersRes, logsRes] = await Promise.all([
          client.get('/users?limit=1'),
          client.get('/activity-logs?limit=1')
        ]);
        setStats({
          totalUsers: usersRes.data.totalCount || usersRes.data.data?.length || 0,
          totalLogs: logsRes.data.totalCount || logsRes.data.data?.length || 0
        });
      } catch (error) {
        console.error("Failed to load admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBasicStats();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#131313]">
        <ActivityIndicator size="large" color="#adc6ff" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#131313] p-4">
      <Text className="text-white text-2xl font-bold mb-6 mt-4 tracking-wider">SYSTEM DASHBOARD</Text>
      
      <View className="flex-row justify-between mb-4">
        {/* Total Users Card */}
        <View className="flex-1 bg-[#1c1b1b] rounded-lg p-5 border border-[#ffffff1a] mr-2">
          <Users size={24} color="#adc6ff" className="mb-2" />
          <Text className="text-[#c2c6d6] text-xs font-bold uppercase tracking-widest mb-1">Total Users</Text>
          <Text className="text-white text-3xl font-bold">{stats?.totalUsers || 0}</Text>
        </View>

        {/* Activity Logs Card */}
        <View className="flex-1 bg-[#1c1b1b] rounded-lg p-5 border border-[#ffffff1a] ml-2">
          <Activity size={24} color="#adc6ff" className="mb-2" />
          <Text className="text-[#c2c6d6] text-xs font-bold uppercase tracking-widest mb-1">Recent Logs</Text>
          <Text className="text-white text-3xl font-bold">{stats?.totalLogs || 0}</Text>
        </View>
      </View>

    </ScrollView>
  );
}
