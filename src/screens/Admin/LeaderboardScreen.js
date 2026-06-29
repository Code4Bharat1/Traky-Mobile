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
    let cardStyle = `rounded-2xl p-5 mb-4 border shadow-sm ${bgCard} ${borderColor} ${isDarkMode ? 'shadow-black' : 'shadow-gray-200'}`;
    let badgeStyle = `w-12 h-12 rounded-full border-2 items-center justify-center mr-4 ${isDarkMode ? 'border-[#3f3f46] bg-[#18181b]' : 'border-gray-300 bg-white'}`;
    
    if (index === 0) {
      cardStyle = `rounded-2xl p-5 mb-5 border-2 shadow-md ${isDarkMode ? 'bg-[#fbbf241a] border-[#fbbf244a] shadow-[#fbbf241a]' : 'bg-yellow-50 border-yellow-300 shadow-yellow-100'}`;
      badgeStyle = `w-12 h-12 rounded-full items-center justify-center mr-4 bg-[#fbbf24] shadow-sm`;
    } else if (index === 1) {
      cardStyle = `rounded-2xl p-5 mb-4 border ${isDarkMode ? 'bg-[#9ca3af1a] border-[#9ca3af4a]' : 'bg-gray-50 border-gray-300'}`;
      badgeStyle = `w-12 h-12 rounded-full items-center justify-center mr-4 bg-[#9ca3af]`;
    } else if (index === 2) {
      cardStyle = `rounded-2xl p-5 mb-4 border ${isDarkMode ? 'bg-[#b453091a] border-[#b453094a]' : 'bg-orange-50 border-orange-200'}`;
      badgeStyle = `w-12 h-12 rounded-full items-center justify-center mr-4 bg-[#b45309]`;
    }

    const doneCount = item.tasksCompleted !== undefined ? item.tasksCompleted : (item.tasks?.completed || 0);
    const totalCount = item.tasksTotal !== undefined ? item.tasksTotal : (item.tasks?.total || 0);
    const overdueCount = item.tasksOverdue !== undefined ? item.tasksOverdue : (item.tasks?.overdue || 0);
    const score = item.behaviourScore || item.score || 0;
    const topScore = leaders[0]?.behaviourScore || leaders[0]?.score || 100;
    const progressWidth = Math.min(100, Math.max(5, (score / (topScore || 100)) * 100));

    return (
      <View className={cardStyle}>
        {/* Top row: Rank, Avatar, Name */}
        <View className="flex-row items-center mb-5">
          <View className={badgeStyle}>
             {index === 0 ? <Trophy size={20} color="#ffffff" /> : 
              index === 1 ? <Medal size={20} color="#ffffff" /> : 
              index === 2 ? <Award size={20} color="#ffffff" /> : 
              <Text className={`font-bold text-lg ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>#{index + 1}</Text>}
          </View>
          <View className={`h-12 w-12 rounded-full items-center justify-center mr-4 border-2 ${bgAvatar} ${isDarkMode ? 'border-[#3f3f46]' : 'border-white shadow-sm'}`}>
            {item.avatar ? <Image source={{ uri: item.avatar }} className="w-full h-full rounded-full" /> : <User size={20} color={isDarkMode ? "#a1a1aa" : "#6b7280"} />}
          </View>
          <View className="flex-1">
            <Text className={`font-bold text-lg ${textColor}`} numberOfLines={1}>{item.name || 'Anonymous'}</Text>
            {index === 0 && <Text className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-widest mt-0.5">Current Leader</Text>}
          </View>
          <View className="items-end ml-2">
             <Text className={`text-2xl font-black ${index === 0 ? 'text-[#fbbf24]' : (index === 1 ? 'text-[#9ca3af]' : (index === 2 ? 'text-[#b45309]' : textColor))}`}>{score}</Text>
             <Text className={`text-[9px] font-bold tracking-widest uppercase ${textMuted}`}>PTS</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row mb-5 mt-1">
          <View className={`flex-1 p-3 rounded-l-xl border-y border-l ${isDarkMode ? 'border-[#27272a] bg-[#1f1f22]' : 'border-gray-200 bg-white'}`}>
             <Text className={`text-[9px] font-bold tracking-widest uppercase mb-1.5 ${textMuted}`}>Tasks Done</Text>
             <View className="flex-row items-center">
                <CheckCircle size={14} color="#10b981" className="mr-1.5" />
                <Text className={`font-bold text-sm ${textColor}`}>{doneCount}/{totalCount}</Text>
             </View>
          </View>
          <View className={`flex-1 p-3 rounded-r-xl border ${isDarkMode ? 'border-[#27272a] bg-[#1f1f22]' : 'border-gray-200 bg-white'}`}>
             <Text className={`text-[9px] font-bold tracking-widest uppercase mb-1.5 ${textMuted}`}>Overdue</Text>
             <View className="flex-row items-center">
                <Clock size={14} color="#ef4444" className="mr-1.5" />
                <Text className={`font-bold text-sm ${textColor}`}>{overdueCount}</Text>
             </View>
          </View>
        </View>

        {/* Score Progress */}
        <View className="flex-row items-center">
           <View className={`flex-1 h-2 rounded-full ${isDarkMode ? 'bg-[#27272a]' : 'bg-gray-200'}`}>
              <View 
                className={`h-full rounded-full ${index === 0 ? 'bg-[#fbbf24]' : (index === 1 ? 'bg-[#9ca3af]' : (index === 2 ? 'bg-[#b45309]' : (isDarkMode ? 'bg-[#818cf8]' : 'bg-blue-500')))}`} 
                style={{ width: `${progressWidth}%` }} 
              />
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
        <Text className={`text-3xl font-black tracking-wider mb-6 ${textColor}`}>Leaderboard</Text>

        <TouchableOpacity 
           onPress={handleRecalculate}
           className={`w-full py-4 rounded-xl flex-row items-center justify-center mb-8 shadow-sm ${isDarkMode ? 'bg-[#3b82f6] shadow-black' : 'bg-[#2573e6] shadow-blue-200'}`}
        >
           <RefreshCw size={16} color="#ffffff" className="mr-2" />
           <Text className="font-bold tracking-widest text-white">RECALCULATE SCORES</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View className={`flex-row border-b mb-6 ${isDarkMode ? 'border-[#27272a]' : 'border-gray-200'}`}>
           <TouchableOpacity onPress={() => setActiveTab('COMPANY')} className={`flex-1 flex-row items-center justify-center pb-4 ${activeTab === 'COMPANY' ? (isDarkMode ? 'border-b-2 border-white' : 'border-b-2 border-blue-600') : ''}`}>
              <BarChart2 size={16} color={activeTab === 'COMPANY' ? (isDarkMode ? '#fff' : '#2573e6') : (isDarkMode ? '#a1a1aa' : '#9ca3af')} className="mr-2" />
              <Text className={`font-bold tracking-widest text-xs ${activeTab === 'COMPANY' ? (isDarkMode ? 'text-white' : 'text-blue-600') : textMuted}`}>COMPANY</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => setActiveTab('TEAM')} className={`flex-1 flex-row items-center justify-center pb-4 ${activeTab === 'TEAM' ? (isDarkMode ? 'border-b-2 border-white' : 'border-b-2 border-blue-600') : ''}`}>
              <Users size={16} color={activeTab === 'TEAM' ? (isDarkMode ? '#fff' : '#2573e6') : (isDarkMode ? '#a1a1aa' : '#9ca3af')} className="mr-2" />
              <Text className={`font-bold tracking-widest text-xs ${activeTab === 'TEAM' ? (isDarkMode ? 'text-white' : 'text-blue-600') : textMuted}`}>TEAM</Text>
           </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between mb-8">
           <View className={`flex-1 border rounded-2xl p-5 mr-2 items-center justify-center shadow-sm ${isDarkMode ? 'bg-[#18181b] border-[#27272a] shadow-black' : 'bg-white border-gray-100 shadow-gray-200'}`}>
              <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${isDarkMode ? 'bg-[#27272a]' : 'bg-blue-50'}`}>
                <TrendingUp size={20} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              </View>
              <Text className={`text-[9px] font-bold tracking-widest uppercase mb-2 ${textMuted}`}>TOP SCORE</Text>
              <Text className={`text-3xl font-black ${textColor}`}>{topScore}</Text>
              <Text className={`text-[10px] mt-1.5 font-bold ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-400'}`} numberOfLines={1}>{topName}</Text>
           </View>
           
           <View className={`flex-1 border rounded-2xl p-5 ml-2 items-center justify-center shadow-sm ${isDarkMode ? 'bg-[#18181b] border-[#27272a] shadow-black' : 'bg-white border-gray-100 shadow-gray-200'}`}>
              <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${isDarkMode ? 'bg-[#27272a]' : 'bg-purple-50'}`}>
                <BarChart2 size={20} color={isDarkMode ? '#a78bfa' : '#8b5cf6'} />
              </View>
              <Text className={`text-[9px] font-bold tracking-widest uppercase mb-2 ${textMuted}`}>AVG SCORE</Text>
              <Text className={`text-3xl font-black ${textColor}`}>{averageScore}</Text>
              <Text className={`text-[10px] mt-1.5 font-bold ${isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-400'}`}>Company Wide</Text>
           </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row flex-wrap mb-4">
           {['ALL TIME', 'WEEKLY', 'MONTHLY', 'YEARLY'].map(f => (
              <TouchableOpacity 
                key={f} 
                onPress={() => setFilterTab(f)}
                className={`mr-2 mb-3 px-5 py-2.5 rounded-full border ${filterTab === f ? (isDarkMode ? 'bg-white border-white' : 'bg-gray-900 border-gray-900') : (isDarkMode ? 'bg-transparent border-[#3f3f46]' : 'bg-white border-gray-300 shadow-sm shadow-gray-100')}`}
              >
                 <Text className={`text-[10px] font-bold tracking-widest ${filterTab === f ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textMuted}`}>{f}</Text>
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
