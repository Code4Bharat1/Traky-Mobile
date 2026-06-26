import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, LayoutAnimation, UIManager, Platform, ScrollView, TextInput, Modal } from 'react-native';
import client from '../../api/client';
import { Activity, Clock, RefreshCw, ChevronDown, ChevronUp, Search, User, Layers } from 'lucide-react-native';

export default function ActivityLogs() {
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
  const limit = 20;

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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const renderMetadataRow = (label, value) => (
    <View className="flex-row justify-between border-b border-[#333] py-2">
      <Text className="text-[#888] text-[10px]">{label}</Text>
      <Text className="text-white text-[10px] text-right flex-1 ml-4" numberOfLines={1} ellipsizeMode="middle">{value || 'N/A'}</Text>
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
    const payload = item.payload || {};
    const method = item.method || metadata.method || 'API';
    const status = item.status || metadata.status || '200';
    
    return (
      <View className="border-b border-[#ffffff1a] bg-[#1c1b1b]">
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => toggleExpand(item._id)}
          className="flex-row items-center py-4 px-4"
        >
          {/* Timestamp */}
          <View className="w-32 pr-2">
            <Text className="text-white text-xs">{formatDate(item.created_at || item.createdAt)}</Text>
          </View>
          
          {/* User */}
          <View className="w-48 flex-row items-center pr-2">
            <View className="h-6 w-6 rounded-full bg-[#333] items-center justify-center mr-2">
              <Text className="text-white font-bold text-[10px] uppercase">
                {item.userId?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View>
              <Text className="text-white text-xs font-bold" numberOfLines={1}>{item.userId?.name || 'System'}</Text>
              <Text className="text-[#888] text-[10px] uppercase">{item.userId?.globalRole?.replace('_', ' ') || 'USER'}</Text>
            </View>
          </View>

          {/* Action */}
          <View className="w-56 pr-2">
            <Text className="text-white text-xs font-bold mb-1">{item.action}</Text>
            {metadata.path && (
              <Text className="text-[#888] text-[10px]" numberOfLines={1}>{metadata.path}</Text>
            )}
          </View>

          {/* Entity */}
          <View className="w-24 pr-2">
             <View className="bg-[#f59e0b2a] px-2 py-1 rounded self-start border border-[#f59e0b4a]">
              <Text className="text-[#f59e0b] text-[10px] font-bold uppercase">{item.entity || 'N/A'}</Text>
             </View>
          </View>

          {/* Method */}
          <View className="w-20 pr-2">
             <View className="bg-[#adc6ff2a] px-2 py-1 rounded self-start border border-[#adc6ff4a]">
              <Text className="text-[#adc6ff] text-[10px] font-bold uppercase">{method}</Text>
             </View>
          </View>

          {/* Status */}
          <View className="w-16 pr-2">
             <Text className="text-[#10b981] text-xs font-bold">{status}</Text>
          </View>

          {/* Details toggle */}
          <View className="w-12 items-center">
            <View className="border border-[#ffffff1a] rounded p-1">
              {isExpanded ? <ChevronUp size={12} color="#fff" /> : <ChevronDown size={12} color="#fff" />}
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View className="bg-[#131313] p-4 border-t border-[#ffffff1a]">
            <Text className="text-white font-bold tracking-widest text-[10px] mb-4">_ REQUEST EXECUTION PAYLOAD</Text>
            
            <View className="flex-row">
              <View className="flex-1 pr-2 border-r border-[#333]">
                <Text className="text-white font-bold text-[10px] uppercase mb-2">Metadata Info</Text>
                <View className="bg-[#1c1b1b] rounded p-2 border border-[#333]">
                  {renderMetadataRow('Client IP', item.ipAddress || metadata.ipAddress || '127.0.0.1')}
                  {renderMetadataRow('Execution Duration', metadata.duration ? `${metadata.duration}ms` : 'N/A')}
                  {renderMetadataRow('Entity Target ID', item.entityId || 'N/A')}
                  {renderMetadataRow('Role Auth Scope', item.userId?.globalRole || 'EMPLOYEE')}
                </View>
              </View>
              
              <View className="flex-1 px-2 border-r border-[#333]">
                <Text className="text-white font-bold text-[10px] uppercase mb-2">Query Parameters</Text>
                <View className="bg-[#1c1b1b] rounded p-2 border border-[#333] min-h-[100px]">
                  <Text className="text-[#888] text-[10px] italic">
                    {metadata.query && Object.keys(metadata.query).length > 0 
                      ? JSON.stringify(metadata.query, null, 2) 
                      : 'No query parameters provided.'}
                  </Text>
                </View>
              </View>

              <View className="flex-1 pl-2">
                <Text className="text-white font-bold text-[10px] uppercase mb-2">Request Body</Text>
                <View className="bg-[#1c1b1b] rounded p-2 border border-[#333] min-h-[100px]">
                  <Text className="text-[#888] text-[10px] italic">
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
      <View className="flex-row justify-between items-center py-4 px-4 bg-[#131313]">
        <Text className="text-white text-xs">Page <Text className="font-bold">{page}</Text> of <Text className="font-bold">{totalPages}</Text></Text>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={handlePrev}
            disabled={page === 1}
            className={`px-4 py-2 border border-[#ffffff1a] rounded mr-2 ${page === 1 ? 'opacity-50 bg-[#131313]' : 'bg-[#1c1b1b]'}`}
          >
            <Text className="text-white text-xs font-bold uppercase">Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNext}
            disabled={page === totalPages}
            className={`px-4 py-2 border border-[#ffffff1a] rounded ${page === totalPages ? 'opacity-50 bg-[#131313]' : 'bg-[#1c1b1b]'}`}
          >
            <Text className="text-white text-xs font-bold uppercase">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TableHeader = () => (
    <View className="flex-row items-center py-3 px-4 bg-[#131313] border-b border-t border-[#ffffff1a]">
      <Text className="w-32 text-[#888] font-bold text-[10px] uppercase tracking-wider">Timestamp</Text>
      <Text className="w-48 text-[#888] font-bold text-[10px] uppercase tracking-wider">User</Text>
      <Text className="w-56 text-[#888] font-bold text-[10px] uppercase tracking-wider">Action</Text>
      <Text className="w-24 text-[#888] font-bold text-[10px] uppercase tracking-wider">Entity</Text>
      <Text className="w-20 text-[#888] font-bold text-[10px] uppercase tracking-wider">Method</Text>
      <Text className="w-16 text-[#888] font-bold text-[10px] uppercase tracking-wider">Status</Text>
      <Text className="w-12 text-[#888] font-bold text-[10px] uppercase tracking-wider text-center">Details</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2 mt-4 border-b border-[#ffffff1a] pb-4">
        <Text className="text-white text-xl font-bold tracking-wider">AUDIT TRAIL LOGS</Text>
        <TouchableOpacity 
          onPress={handleRefresh}
          className="flex-row items-center border border-[#ffffff1a] bg-[#1c1b1b] px-3 py-1.5 rounded"
        >
          <RefreshCw size={12} color="#adc6ff" className={refreshing ? "opacity-50" : ""} />
          <Text className="text-white text-xs font-bold ml-2">REFRESH</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-[#888] text-xs mb-4 leading-5">Real-time automated logging record of system operations and administrative behaviors.</Text>

      {/* Filters */}
      <View className="flex-row flex-wrap mb-4">
        <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded flex-row items-center px-3 py-2 mr-2 mb-2 flex-1 min-w-[200px]">
          <Search size={14} color="#888" />
          <TextInput
            placeholder="Search action or path..."
            placeholderTextColor="#888"
            className="text-white text-xs ml-2 flex-1 py-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          onPress={() => setUserModalVisible(true)}
          className="bg-[#1c1b1b] border border-[#ffffff1a] rounded flex-row items-center justify-between px-3 py-2 mr-2 mb-2 flex-1 min-w-[150px]"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <User size={14} color="#888" className="mr-2" />
            <Text className="text-white text-xs" numberOfLines={1}>{getSelectedUserLabel()}</Text>
          </View>
          <ChevronDown size={14} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setEntityModalVisible(true)}
          className="bg-[#1c1b1b] border border-[#ffffff1a] rounded flex-row items-center justify-between px-3 py-2 mr-2 mb-2 flex-1 min-w-[150px]"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <Layers size={14} color="#888" className="mr-2" />
            <Text className="text-white text-xs" numberOfLines={1}>{getSelectedEntityLabel()}</Text>
          </View>
          <ChevronDown size={14} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleFilter}
          className="bg-[#adc6ff] rounded items-center justify-center px-6 py-2 mb-2 min-w-[100px]"
        >
          <Text className="text-[#131313] text-xs font-bold tracking-widest">FILTER</Text>
        </TouchableOpacity>
      </View>

      {/* Table Area */}
      {loading && !refreshing && !filteredLogs.length ? (
        <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
      ) : (
        <View className="flex-1 bg-[#161616] border border-[#ffffff1a] rounded-lg overflow-hidden">
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ minWidth: 900, flex: 1 }}>
              <TableHeader />
              <FlatList 
                data={filteredLogs}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={true}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                  <Text className="text-[#c2c6d6] text-center mt-10">No activity logs match your criteria.</Text>
                }
              />
            </View>
          </ScrollView>
        </View>
      )}

      {/* Modals for Dropdowns */}
      <Modal visible={userModalVisible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-[#000000a0] justify-center items-center p-4" onPress={() => setUserModalVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-full max-h-[80%] overflow-hidden">
            <View className="p-4 border-b border-[#ffffff1a] bg-[#131313]">
              <Text className="text-white font-bold">Select User</Text>
            </View>
            <ScrollView>
              <TouchableOpacity 
                className={`p-4 border-b border-[#333] ${!selectedUserId ? 'bg-[#adc6ff1a]' : ''}`}
                onPress={() => { setSelectedUserId(''); setUserModalVisible(false); }}
              >
                <Text className="text-white">All Users</Text>
              </TouchableOpacity>
              {users.map(u => (
                <TouchableOpacity 
                  key={u._id}
                  className={`p-4 border-b border-[#333] ${selectedUserId === u._id ? 'bg-[#adc6ff1a]' : ''}`}
                  onPress={() => { setSelectedUserId(u._id); setUserModalVisible(false); }}
                >
                  <Text className="text-white font-bold">{u.name}</Text>
                  <Text className="text-[#888] text-xs">{u.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={entityModalVisible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-[#000000a0] justify-center items-center p-4" onPress={() => setEntityModalVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-full max-h-[80%] overflow-hidden">
            <View className="p-4 border-b border-[#ffffff1a] bg-[#131313]">
              <Text className="text-white font-bold">Select Entity</Text>
            </View>
            <ScrollView>
              {ENTITIES.map(ent => (
                <TouchableOpacity 
                  key={ent.value}
                  className={`p-4 border-b border-[#333] ${selectedEntity === ent.value ? 'bg-[#adc6ff1a]' : ''}`}
                  onPress={() => { setSelectedEntity(ent.value); setEntityModalVisible(false); }}
                >
                  <Text className="text-white">{ent.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
