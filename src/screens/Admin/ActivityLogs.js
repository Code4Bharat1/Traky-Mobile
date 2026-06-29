import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, LayoutAnimation, UIManager, Platform, ScrollView, TextInput, Modal } from 'react-native';
import client from '../../api/client';
import { Activity, Clock, RefreshCw, ChevronDown, ChevronUp, Search, User, Layers } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function ActivityLogs() {
  const { isDarkMode } = useThemeStore();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  
  // Modals for dropdowns
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [entityModalVisible, setEntityModalVisible] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  // Expanded items tracking
  const [expandedIds, setExpandedIds] = useState({});

  const ENTITIES = [
    { label: 'All Entities', value: '' },
    { label: 'Task', value: 'task' },
    { label: 'Project', value: 'project' },
    { label: 'Issue/Bug', value: 'bug' },
    { label: 'Daily Log', value: 'daily_log' },
    { label: 'User', value: 'user' },
    { label: 'Department', value: 'department' },
    { label: 'KT Doc', value: 'kt_document' },
    { label: 'Scoring', value: 'score' },
  ];

  const fetchUsers = async () => {
    try {
      const res = await client.get('/users?limit=500');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchLogs = async (currentPage = 1, isRefresh = false, isPagination = false) => {
    if (!isRefresh && !isPagination) setLoading(true);
    try {
      let url = `/activity-logs?page=${currentPage}&limit=${limit}`;
      if (selectedUserId) url += `&userId=${selectedUserId}`;
      if (selectedEntity) url += `&entity=${selectedEntity}`;

      const response = await client.get(url);
      const data = response.data.data || [];
      setLogs(data);
      
      const pages = response.data.pagination?.pages || 1;
      setTotalPages(pages);
      setPage(currentPage);
    } catch (error) {
      console.error("Failed to load activity logs", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  // Client-side search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = logs.filter(log => {
      const actionMatch = log.action?.toLowerCase().includes(lowerQuery);
      const pathMatch = log.meta?.path?.toLowerCase().includes(lowerQuery) || false;
      return actionMatch || pathMatch;
    });
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs(1, true);
  };

  const handleFilter = () => {
    setPage(1);
    fetchLogs(1);
  };

  const toggleExpand = (id) => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      // no-op in fabric but keep for old architecture if it exists
      try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch(e){}
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return { datePart: '', timePart: '' };
    const date = new Date(dateString);
    return {
      datePart: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timePart: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    };
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderMetadataRow = (label, value) => (
    <View className={`flex-row justify-between border-b py-2 ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}>
      <Text className={`text-[10px] ${textMuted}`}>{label}</Text>
      <Text className={`text-[10px] text-right flex-1 ml-4 ${textColor}`} numberOfLines={1} ellipsizeMode="middle">{value || 'N/A'}</Text>
    </View>
  );

  const getSelectedUserLabel = () => {
    if (!selectedUserId) return 'All Users';
    const user = users.find(u => u._id === selectedUserId);
    return user ? user.name : 'All Users';
  };

  const getSelectedEntityLabel = () => {
    const ent = ENTITIES.find(e => e.value === selectedEntity);
    return ent ? ent.label : 'All Entities';
  };

  const renderItem = ({ item }) => {
    const isExpanded = !!expandedIds[item._id];
    
    const metadata = item.meta || item.metadata || {};
    const method = item.method || metadata.method || 'API';
    const status = item.status || metadata.statusCode || '200';
    
    const statusCode = parseInt(status, 10);
    const isSuccess = statusCode >= 200 && statusCode < 300;
    const isError = statusCode >= 400;

    const { datePart, timePart } = formatDate(item.created_at || item.createdAt);

    return (
      <View className={`mb-3 border rounded-xl overflow-hidden ${bgCard} ${borderColor}`}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => toggleExpand(item._id)}
          className="p-4"
        >
          {/* Header row: Entity, Method, Status */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <View className={`px-2 py-1 rounded border ${isDarkMode ? 'bg-[#f59e0b2a] border-[#f59e0b4a]' : 'bg-yellow-50 border-yellow-200'}`}>
                <Text className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#f59e0b]' : 'text-yellow-600'}`}>{item.entity || 'N/A'}</Text>
              </View>
              <View className={`px-2 py-1 rounded border ${isDarkMode ? 'bg-[#adc6ff2a] border-[#adc6ff4a]' : 'bg-blue-50 border-blue-200'}`}>
                <Text className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600'}`}>{method}</Text>
              </View>
            </View>
            <View className={`px-2 py-1 rounded border ${isSuccess ? (isDarkMode ? 'bg-[#10b9812a] border-[#10b9814a]' : 'bg-green-50 border-green-200') : isError ? (isDarkMode ? 'bg-[#ff47472a] border-[#ff47474a]' : 'bg-red-50 border-red-200') : (isDarkMode ? 'bg-[#f59e0b2a] border-[#f59e0b4a]' : 'bg-yellow-50 border-yellow-200')}`}>
              <Text className={`text-[10px] font-bold font-mono tracking-wider ${isSuccess ? (isDarkMode ? 'text-[#10b981]' : 'text-green-600') : isError ? (isDarkMode ? 'text-[#ff4747]' : 'text-red-600') : (isDarkMode ? 'text-[#f59e0b]' : 'text-yellow-600')}`}>{status}</Text>
            </View>
          </View>

          {/* Action Row */}
          <View className="mb-4">
            <Text className={`text-sm font-bold mb-1 tracking-wide uppercase ${textColor}`}>{item.action}</Text>
            {metadata.path && (
              <Text className={`text-[10px] font-mono ${textMuted}`} numberOfLines={1}>{metadata.path}</Text>
            )}
          </View>

          {/* Footer row: User and Timestamp */}
          <View className={`flex-row items-center justify-between pt-3 border-t ${isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-100'}`}>
            <View className="flex-row items-center flex-1 pr-2">
              <View className={`h-8 w-8 rounded-full items-center justify-center mr-3 ${isDarkMode ? 'bg-[#adc6ff3a]' : 'bg-blue-100'}`}>
                <Text className={`font-bold text-xs uppercase ${isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600'}`}>
                  {item.userId?.name?.charAt(0) || 'S'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`text-xs font-bold ${textColor}`} numberOfLines={1}>{item.userId?.name || 'System'}</Text>
                <Text className={`text-[9px] font-mono tracking-widest uppercase ${textMuted}`}>{item.userId?.globalRole?.replace('_', ' ') || 'USER'}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <View className="items-end mr-3">
                <Text className={`text-[10px] font-bold ${textColor}`}>{datePart}</Text>
                <Text className={`text-[10px] font-mono ${textMuted}`}>{timePart}</Text>
              </View>
              <View className={`border rounded p-1 ${borderColor}`}>
                {isExpanded ? <ChevronUp size={14} color={isDarkMode ? "#fff" : "#111827"} /> : <ChevronDown size={14} color={isDarkMode ? "#fff" : "#111827"} />}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View className={`p-4 border-t ${bgInputAlt} ${borderColor}`}>
            <Text className={`font-bold tracking-widest text-[10px] mb-4 ${textColor}`}>_ REQUEST EXECUTION PAYLOAD</Text>
            
            <View className="flex-col gap-4">
              <View className="">
                <Text className={`font-bold text-[9px] uppercase tracking-wider mb-2 ${textMuted}`}>Metadata Info</Text>
                <View className={`rounded p-3 border ${bgCard} ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                  {renderMetadataRow('Client IP', item.ipAddress || metadata.ipAddress || '127.0.0.1')}
                  {renderMetadataRow('Execution Duration', metadata.durationMs ? `${metadata.durationMs}ms` : (metadata.duration ? `${metadata.duration}ms` : 'N/A'))}
                  {renderMetadataRow('Entity Target ID', item.entityId || 'N/A')}
                  {renderMetadataRow('Role Auth Scope', item.userId?.globalRole || 'EMPLOYEE')}
                </View>
              </View>
              
              <View className="">
                <Text className={`font-bold text-[9px] uppercase tracking-wider mb-2 ${textMuted}`}>Query Parameters</Text>
                <View className={`rounded p-3 border ${bgCard} ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                  <Text className={`text-[10px] font-mono ${textMuted}`}>
                    {metadata.query && Object.keys(metadata.query).length > 0 
                      ? JSON.stringify(metadata.query, null, 2) 
                      : 'No query parameters provided.'}
                  </Text>
                </View>
              </View>

              <View className="">
                <Text className={`font-bold text-[9px] uppercase tracking-wider mb-2 ${textMuted}`}>Request Body</Text>
                <View className={`rounded p-3 border ${bgCard} ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                  <Text className={`text-[10px] font-mono ${textMuted}`}>
                    {metadata.body && Object.keys(metadata.body).length > 0 
                      ? JSON.stringify(metadata.body, null, 2) 
                      : 'No write parameters or empty payload body.'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handlePrev = () => {
    if (page > 1) fetchLogs(page - 1, false, true);
  };

  const handleNext = () => {
    if (page < totalPages) fetchLogs(page + 1, false, true);
  };

  const renderFooter = () => {
    if (filteredLogs.length === 0) return null;
    return (
      <View className={`flex-row justify-between items-center py-4 px-4 ${bgScreen}`}>
        <Text className={`text-xs ${textColor}`}>Page <Text className="font-bold">{page}</Text> of <Text className="font-bold">{totalPages}</Text></Text>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={handlePrev}
            disabled={page === 1}
            className={`px-4 py-2 border rounded mr-2 ${borderColor} ${page === 1 ? `opacity-50 ${bgScreen}` : bgCard}`}
          >
            <Text className={`text-xs font-bold uppercase ${textColor}`}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNext}
            disabled={page === totalPages}
            className={`px-4 py-2 border rounded ${borderColor} ${page === totalPages ? `opacity-50 ${bgScreen}` : bgCard}`}
          >
            <Text className={`text-xs font-bold uppercase ${textColor}`}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className={`flex-row justify-between items-center mb-2 mt-4 border-b pb-4 ${borderColor}`}>
        <Text className={`text-xl font-bold tracking-wider ${textColor}`}>AUDIT TRAIL LOGS</Text>
        <TouchableOpacity 
          onPress={handleRefresh}
          className={`flex-row items-center border px-3 py-1.5 rounded ${bgCard} ${borderColor}`}
        >
          <RefreshCw size={12} color={isDarkMode ? "#adc6ff" : "#2573e6"} className={refreshing ? "opacity-50" : ""} />
          <Text className={`text-xs font-bold ml-2 ${textColor}`}>REFRESH</Text>
        </TouchableOpacity>
      </View>
      <Text className={`text-xs mb-4 leading-5 ${textMuted}`}>Real-time automated logging record of system operations and administrative behaviors.</Text>

      {/* Filters */}
      <View className="flex-row flex-wrap mb-4">
        <View className={`border rounded flex-row items-center px-3 py-2 mr-2 mb-2 flex-1 min-w-[200px] ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
          <TextInput
            placeholder="Search action or path..."
            placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
            className={`text-xs ml-2 flex-1 py-0 ${textColor}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          onPress={() => setUserModalVisible(true)}
          className={`border rounded flex-row items-center justify-between px-3 py-2 mr-2 mb-2 flex-1 min-w-[150px] ${bgCard} ${borderColor}`}
        >
          <View className="flex-row items-center flex-1 pr-2">
            <User size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <Text className={`text-xs ${textColor}`} numberOfLines={1}>{getSelectedUserLabel()}</Text>
          </View>
          <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setEntityModalVisible(true)}
          className={`border rounded flex-row items-center justify-between px-3 py-2 mr-2 mb-2 flex-1 min-w-[150px] ${bgCard} ${borderColor}`}
        >
          <View className="flex-row items-center flex-1 pr-2">
            <Layers size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
            <Text className={`text-xs ${textColor}`} numberOfLines={1}>{getSelectedEntityLabel()}</Text>
          </View>
          <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleFilter}
          className={`rounded items-center justify-center px-6 py-2 mb-2 min-w-[100px] ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}
        >
          <Text className={`text-xs font-bold tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>FILTER</Text>
        </TouchableOpacity>
      </View>

      {/* Table Area */}
      {loading && !refreshing && !filteredLogs.length ? (
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
      ) : (
        <View className="flex-1 mt-2">
          <FlatList 
            data={filteredLogs}
            keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text className={`text-center mt-10 ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-500'}`}>No activity logs match your criteria.</Text>
            }
          />
        </View>
      )}

      {/* Modals for Dropdowns */}
      <Modal visible={userModalVisible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-[#000000a0] justify-center items-center p-4" onPress={() => setUserModalVisible(false)}>
          <View className={`border rounded-lg w-full max-h-[80%] overflow-hidden ${bgCard} ${borderColor}`}>
            <View className={`p-4 border-b ${bgInputAlt} ${borderColor}`}>
              <Text className={`font-bold ${textColor}`}>Select User</Text>
            </View>
            <ScrollView>
              <TouchableOpacity 
                className={`p-4 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-200'} ${!selectedUserId ? (isDarkMode ? 'bg-[#adc6ff1a]' : 'bg-blue-50') : ''}`}
                onPress={() => { setSelectedUserId(''); setUserModalVisible(false); }}
              >
                <Text className={textColor}>All Users</Text>
              </TouchableOpacity>
              {users.map(u => (
                <TouchableOpacity 
                  key={u._id}
                  className={`p-4 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-200'} ${selectedUserId === u._id ? (isDarkMode ? 'bg-[#adc6ff1a]' : 'bg-blue-50') : ''}`}
                  onPress={() => { setSelectedUserId(u._id); setUserModalVisible(false); }}
                >
                  <Text className={`font-bold ${textColor}`}>{u.name}</Text>
                  <Text className={`text-xs ${textMuted}`}>{u.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={entityModalVisible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-[#000000a0] justify-center items-center p-4" onPress={() => setEntityModalVisible(false)}>
          <View className={`border rounded-lg w-full max-h-[80%] overflow-hidden ${bgCard} ${borderColor}`}>
            <View className={`p-4 border-b ${bgInputAlt} ${borderColor}`}>
              <Text className={`font-bold ${textColor}`}>Select Entity</Text>
            </View>
            <ScrollView>
              {ENTITIES.map(ent => (
                <TouchableOpacity 
                  key={ent.value}
                  className={`p-4 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-200'} ${selectedEntity === ent.value ? (isDarkMode ? 'bg-[#adc6ff1a]' : 'bg-blue-50') : ''}`}
                  onPress={() => { setSelectedEntity(ent.value); setEntityModalVisible(false); }}
                >
                  <Text className={textColor}>{ent.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
