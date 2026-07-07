import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import client from '../../api/client';
import { clearAllNotifications, deleteNotification, getNotifications, markAsRead } from '../../api/services';
import { Bell, Clock, CheckCircle, Trash2, RefreshCcw } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function NotificationsScreen() {
  const { isDarkMode } = useThemeStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = async (pageNum = 1, shouldAppend = false) => {
    try {
      const response = await client.get(`/notifications?page=${pageNum}&limit=15`);
      const newData = response.data.notifications || response.data.data || response.data || [];
      
      if (response.data.total) setTotalCount(response.data.total);
      else if (!shouldAppend) setTotalCount(newData.length);

      if (shouldAppend) {
        setNotifications(prev => {
          // Prevent duplicates just in case
          const existingIds = new Set(prev.map(n => n._id));
          const filteredNew = newData.filter(n => !existingIds.has(n._id));
          return [...prev, ...filteredNew];
        });
      } else {
        setNotifications(newData);
      }

      setHasMore(newData.length >= 15);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setPage(1);
    fetchNotifications(1, false);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  const clearAll = async () => {
    Alert.alert(
      "Clear All",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              // Try the generic clear endpoint
              await client.delete('/notifications/clear-all').catch(() => client.delete('/notifications'));
              setNotifications([]);
              setTotalCount(0);
            } catch (error) {
              console.error("Failed to clear notifications", error);
              Alert.alert("Error", "Failed to clear notifications.");
            }
          }
        }
      ]
    );
  };

  const markAsRead = async (id, isRead) => {
    if (isRead) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    
    try {
      await client.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark as read", error);
      // Revert if failed
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: false } : n));
    }
  };

  const deleteNotification = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n._id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));
    
    try {
      await client.delete(`/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification", error);
      fetchNotifications(1, false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    return true;
  });

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => markAsRead(item._id, item.read)}
      className={`rounded-lg p-4 mb-3 border ${item.read ? (isDarkMode ? 'bg-[#131313] border-[#ffffff0a]' : 'bg-gray-50 border-gray-200') : (isDarkMode ? 'bg-[#1c1b1b] border-[#adc6ff50]' : 'bg-white border-blue-200')}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start flex-1 pr-2">
          <View className={`h-2 w-2 rounded-full mt-1.5 mr-3 ${item.read ? 'bg-transparent' : (isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]')}`} />
          <View className="flex-1">
            <Text className={`text-base font-bold mb-1 ${item.read ? (isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-500') : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
              {item.title || 'System Notification'}
            </Text>
            <Text className={`text-sm leading-5 mb-2 ${isDarkMode ? 'text-[#888]' : 'text-gray-500'}`}>
              {item.message || item.body || 'No details provided.'}
            </Text>
            <View className="flex-row items-center">
              <Clock size={12} color={isDarkMode ? "#6b7280" : "#9ca3af"} className="mr-1" />
              <Text className={`text-xs ${isDarkMode ? 'text-[#6b7280]' : 'text-gray-400'}`}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => deleteNotification(item._id)}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-[#ffffff0a]' : 'bg-gray-100'}`}
        >
          <Trash2 size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className={`flex-1 ${bgScreen}`}>
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-1 mr-3">
             <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Employee / Notifications</Text>
             <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Notifications</Text>
             {totalCount > 0 && <Text className={`text-xs mt-1 ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-500'}`}>{totalCount} notifications</Text>}
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleRefresh} className={`p-2 mr-2 rounded-full border ${isDarkMode ? 'border-[#333] bg-[#1c1b1b]' : 'border-gray-300 bg-white'}`}>
              <RefreshCcw size={16} color={isDarkMode ? "#c2c6d6" : "#4b5563"} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={clearAll} className={`flex-row items-center px-3 py-1.5 rounded border border-red-900/30 ${isDarkMode ? 'bg-[#3f1919]' : 'bg-red-50'}`}>
              <Trash2 size={14} color={isDarkMode ? "#ef4444" : "#dc2626"} className="mr-2" />
              <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#ef4444]' : 'text-red-600'}`}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className={`flex-row border-b mt-4 ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}>
          <TouchableOpacity 
            onPress={() => setActiveTab('ALL')}
            className={`pb-3 px-4 mr-2 ${activeTab === 'ALL' ? 'border-b-2' : ''}`}
            style={{ borderBottomColor: activeTab === 'ALL' ? (isDarkMode ? '#adc6ff' : '#2573e6') : 'transparent' }}
          >
            <Text className={`font-bold text-xs uppercase tracking-widest ${activeTab === 'ALL' ? (isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600') : (isDarkMode ? 'text-[#888]' : 'text-gray-500')}`}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('UNREAD')}
            className={`pb-3 px-4 ${activeTab === 'UNREAD' ? 'border-b-2' : ''}`}
            style={{ borderBottomColor: activeTab === 'UNREAD' ? (isDarkMode ? '#adc6ff' : '#2573e6') : 'transparent' }}
          >
            <Text className={`font-bold text-xs uppercase tracking-widest ${activeTab === 'UNREAD' ? (isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600') : (isDarkMode ? 'text-[#888]' : 'text-gray-500')}`}>Unread</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <FlatList 
          className="px-4 pt-4"
          data={filteredNotifications}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Bell size={48} color={isDarkMode ? "#333" : "#d1d5db"} className="mb-4" />
              <Text className={`text-center ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-500'}`}>
                {activeTab === 'UNREAD' ? 'You have no unread notifications.' : 'You have no notifications.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore && filteredNotifications.length > 0 ? (
              <TouchableOpacity 
                onPress={loadMore} 
                disabled={loadingMore}
                className={`my-6 mx-auto px-6 py-3 border rounded-lg ${isDarkMode ? 'border-[#333] bg-[#131313]' : 'border-gray-300 bg-gray-50'}`}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
                ) : (
                  <Text className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Load More</Text>
                )}
              </TouchableOpacity>
            ) : <View className="h-10" />
          }
        />
      )}
    </View>
  );
}
