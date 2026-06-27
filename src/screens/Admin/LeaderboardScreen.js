import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import client from '../../api/client';
import { Trophy, Medal, Award, User, RefreshCw, BarChart2, TrendingUp, CheckCircle, Clock, Users } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function LeaderboardScreen() {
  const { isDarkMode } = useThemeStore();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // UI state
  const [activeTab, setActiveTab] = useState('COMPANY');
  const [filterTab, setFilterTab] = useState('ALL TIME');

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const periodMap = {
        'ALL TIME': 'all',
        'WEEKLY': 'weekly',
        'MONTHLY': 'monthly',
        'YEARLY': 'yearly'
      };
      const period = periodMap[filterTab] || 'all';
      
      // The backend does not support pagination for this endpoint, so we fetch all at once
      let endpoint = `/leaderboard?period=${period}`;
      if (activeTab === 'TEAM') {
        // We'd need projectId here if we fully supported team, but for now fallback to company if we don't have it
        // To be safe, just use /leaderboard
      }

      const response = await client.get(endpoint);
      const newData = response.data?.data || response.data?.leaderboard || response.data || [];
      
      setLeaders(Array.isArray(newData) ? newData : []);
    } catch (error) {
      console.error("Failed to load leaderboard", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, filterTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(true);
  };

  const handleRecalculate = async () => {
    Alert.alert("Recalculate Scores", "Are you sure you want to recalculate all scores? This may take a moment.", [
      { text: "Cancel", style: "cancel" },
      { text: "Recalculate", onPress: async () => {
          try {
            await client.post('/leaderboard/recalculate');
            handleRefresh();
          } catch (e) {
            handleRefresh(); // refetch anyway
          }
      }}
    ]);
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-[#f3f4f6]';
  const bgCard = isDarkMode ? 'bg-[#18181b]' : 'bg-white';
  const bgAvatar = isDarkMode ? 'bg-[#27272a]' : 'bg-gray-100';
  const borderColor = isDarkMode ? 'border-[#27272a]' : 'border-gray-200';
  const borderAvatar = isDarkMode ? 'border-[#3f3f46]' : 'border-gray-300';
  const textColor = isDarkMode ? 'text-[#f4f4f5]' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500';

  const renderItem = ({ item, index }) => {
    const isTop3 = index < 3;
    const rankHex = index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : (isDarkMode ? '#a1a1aa' : '#6b7280');
    const borderHex = index === 0 ? 'border-[#fbbf24]' : index === 1 ? 'border-[#9ca3af]' : index === 2 ? 'border-[#b45309]' : (isDarkMode ? 'border-[#3f3f46]' : 'border-gray-300');

    const doneCount = item.tasksCompleted !== undefined ? item.tasksCompleted : (item.tasks?.completed || 0);
    const totalCount = item.tasksTotal !== undefined ? item.tasksTotal : (item.tasks?.total || 0);
    const overdueCount = item.tasksOverdue !== undefined ? item.tasksOverdue : (item.tasks?.overdue || 0);
    const score = item.behaviourScore || item.score || 0;
    const topScore = leaders[0]?.behaviourScore || leaders[0]?.score || 100;
    const progressWidth = Math.min(100, Math.max(5, (score / (topScore || 100)) * 100));

    return (
      <View className={`rounded-lg p-4 mb-4 border ${bgCard} ${borderColor}`}>
        {/* Top row: Rank, Avatar, Name */}
        <View className="flex-row items-center mb-5">
          <View className={`w-10 h-10 border items-center justify-center mr-3 rounded-sm ${borderHex} ${isDarkMode ? 'bg-[#18181b]' : 'bg-white'}`}>
             {index === 0 ? <Trophy size={18} color="#fbbf24" /> : 
              index === 1 ? <Medal size={18} color="#9ca3af" /> : 
              index === 2 ? <Award size={18} color="#b45309" /> : 
              <Text className="font-bold text-lg" style={{ color: rankHex }}>{index + 1}</Text>}
          </View>
          <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 border ${bgAvatar} ${borderAvatar}`}>
            {item.avatar ? <Image source={{ uri: item.avatar }} className="w-full h-full rounded-full" /> : <User size={18} color={isDarkMode ? "#a1a1aa" : "#6b7280"} />}
          </View>
          <Text className={`font-bold text-lg ${textColor}`}>{item.name || 'Anonymous'}</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row mb-5">
          <View className={`flex-1 p-3 rounded-l-md border-y border-l ${isDarkMode ? 'border-[#27272a] bg-[#1f1f22]' : 'border-gray-200 bg-gray-50'}`}>
             <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${textColor}`}>Done</Text>
             <View className="flex-row items-center">
                <CheckCircle size={14} color="#10b981" className="mr-1.5" />
                <Text className={`font-bold text-sm ${textColor}`}>{doneCount}/{totalCount}</Text>
             </View>
          </View>
          <View className={`flex-1 p-3 rounded-r-md border ${isDarkMode ? 'border-[#27272a] bg-[#1f1f22]' : 'border-gray-200 bg-gray-50'}`}>
             <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${textColor}`}>Overdue</Text>
             <View className="flex-row items-center">
                <Clock size={14} color="#ef4444" className="mr-1.5" />
                <Text className={`font-bold text-sm ${textColor}`}>{overdueCount}</Text>
             </View>
          </View>
        </View>

        <View className={`h-[1px] w-full mb-5 ${isDarkMode ? 'bg-[#27272a]' : 'bg-gray-200'}`} />

        {/* Score & Progress */}
        <View className="flex-row items-center justify-between">
           <View className={`px-3 py-1.5 rounded border ${isDarkMode ? 'bg-[#ef44442a] border-[#ef44444a]' : 'bg-red-50 border-red-200'}`}>
              <Text className="text-red-500 font-bold tracking-widest text-xs">{score} PTS</Text>
           </View>
           <View className={`flex-1 h-1.5 ml-6 rounded-full ${isDarkMode ? 'bg-[#27272a]' : 'bg-gray-200'}`}>
              <View className={`h-full rounded-full ${isDarkMode ? 'bg-[#818cf8]' : 'bg-blue-500'}`} style={{ width: `${progressWidth}%` }} />
           </View>
        </View>

      </View>
    );
  };

  const renderHeader = () => {
    const topScore = leaders[0]?.behaviourScore || leaders[0]?.score || 0;
    const topName = leaders[0]?.name || 'N/A';
    const averageScore = leaders.length ? (leaders.reduce((acc, curr) => acc + (curr.behaviourScore || curr.score || 0), 0) / leaders.length).toFixed(1) : 0;

    return (
      <View className="mb-2 mt-4">
        <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${textMuted}`}>COMPANY</Text>
        <Text className={`text-3xl font-bold tracking-wider mb-8 ${textColor}`}>Leaderboard</Text>

        <TouchableOpacity 
           onPress={handleRecalculate}
           className={`w-full py-4 rounded-lg flex-row items-center justify-center mb-8 ${isDarkMode ? 'bg-[#93c5fd]' : 'bg-[#2573e6]'}`}
        >
           <RefreshCw size={16} color={isDarkMode ? '#1e3a8a' : '#fff'} className="mr-2" />
           <Text className={`font-bold tracking-widest ${isDarkMode ? 'text-[#1e3a8a]' : 'text-white'}`}>RECALCULATE SCORES</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View className={`flex-row border-b mb-8 ${isDarkMode ? 'border-[#27272a]' : 'border-gray-200'}`}>
           <TouchableOpacity onPress={() => setActiveTab('COMPANY')} className={`flex-1 flex-row items-center justify-center pb-3 ${activeTab === 'COMPANY' ? (isDarkMode ? 'border-b-2 border-white' : 'border-b-2 border-blue-600') : ''}`}>
              <BarChart2 size={16} color={activeTab === 'COMPANY' ? (isDarkMode ? '#fff' : '#2573e6') : (isDarkMode ? '#a1a1aa' : '#9ca3af')} className="mr-2" />
              <Text className={`font-bold tracking-widest text-xs ${activeTab === 'COMPANY' ? (isDarkMode ? 'text-white' : 'text-blue-600') : textMuted}`}>COMPANY</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => setActiveTab('TEAM')} className={`flex-1 flex-row items-center justify-center pb-3 ${activeTab === 'TEAM' ? (isDarkMode ? 'border-b-2 border-white' : 'border-b-2 border-blue-600') : ''}`}>
              <Users size={16} color={activeTab === 'TEAM' ? (isDarkMode ? '#fff' : '#2573e6') : (isDarkMode ? '#a1a1aa' : '#9ca3af')} className="mr-2" />
              <Text className={`font-bold tracking-widest text-xs ${activeTab === 'TEAM' ? (isDarkMode ? 'text-white' : 'text-blue-600') : textMuted}`}>TEAM</Text>
           </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className={`border rounded-lg p-5 mb-4 flex-row items-center ${bgCard} ${borderColor}`}>
           <View className={`h-12 w-12 items-center justify-center mr-4 rounded border ${isDarkMode ? 'border-[#3f3f46] bg-[#27272a]' : 'border-gray-200 bg-gray-100'}`}>
              <TrendingUp size={20} color={isDarkMode ? '#f4f4f5' : '#111827'} />
           </View>
           <View>
              <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${textMuted}`}>TOP SCORE</Text>
              <Text className={`text-2xl font-bold ${textColor}`}>
                 {topScore} <Text className="text-xs font-normal text-gray-500">pts — {topName}</Text>
              </Text>
           </View>
        </View>

        <View className={`border rounded-lg p-5 mb-8 flex-row items-center ${bgCard} ${borderColor}`}>
           <View className={`h-12 w-12 items-center justify-center mr-4 rounded border ${isDarkMode ? 'border-[#3f3f46] bg-[#27272a]' : 'border-gray-200 bg-gray-100'}`}>
              <BarChart2 size={20} color={isDarkMode ? '#60a5fa' : '#2573e6'} />
           </View>
           <View>
              <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${textMuted}`}>COMPANY AVERAGE</Text>
              <Text className={`text-2xl font-bold ${textColor}`}>
                 {averageScore} <Text className="text-xs font-normal text-gray-500">pts</Text>
              </Text>
           </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row flex-wrap mb-4">
           {['ALL TIME', 'WEEKLY', 'MONTHLY', 'YEARLY'].map(f => (
              <TouchableOpacity 
                key={f} 
                onPress={() => setFilterTab(f)}
                className={`mr-2 mb-3 px-4 py-3 rounded border ${filterTab === f ? (isDarkMode ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-gray-800 border-gray-900') : (isDarkMode ? 'bg-transparent border-[#27272a]' : 'bg-transparent border-gray-200')}`}
              >
                 <Text className={`text-xs font-bold tracking-widest ${filterTab === f ? (isDarkMode ? 'text-white' : 'text-white') : textMuted}`}>{f}</Text>
              </TouchableOpacity>
           ))}
        </View>

      </View>
    );
  };

  return (
    <View className={`flex-1 px-4 pt-4 ${bgScreen}`}>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          data={leaders}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDarkMode ? "#adc6ff" : "#2573e6"}
              colors={[isDarkMode ? "#adc6ff" : "#2573e6"]}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <Text className={`text-center mt-10 ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>No leaderboard data found.</Text>
          }
        />
      )}
    </View>
  );
}
