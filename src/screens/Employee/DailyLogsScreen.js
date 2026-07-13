import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { createDailyLog, getAllLogs, getMyProjects, getTasks, getTodayLog } from '../../api/services';
import { ClipboardList, Clock, Plus, Folder, CheckSquare, X, Calendar, AlertCircle, ChevronDown, Trash2 } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../../store/authStore';

import client from '../../api/client';

export default function DailyLogsScreen() {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [todayLog, setTodayLog] = useState(null);
  
  // Dropdown options
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formProjectId, setFormProjectId] = useState('');
  const [formTaskId, setFormTaskId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartTime, setFormStartTime] = useState(new Date());
  const [formEndTime, setFormEndTime] = useState(new Date());
  const [formTodos, setFormTodos] = useState('');
  const [formTomorrowTodos, setFormTomorrowTodos] = useState('');
  
  // Date picker states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, todayRes] = await Promise.all([
        client.get('/daily-logs', { params: { limit: 100 } }),
        client.get('/daily-logs/today').catch(() => ({ data: { log: null } }))
      ]);
      setLogs(logsRes.data.data || logsRes.data || []);
      setTodayLog(todayRes.data.log || null);
    } catch (error) {
      console.error("Failed to load daily logs", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        client.get('/projects/my-projects?limit=500').catch(() => ({ data: { data: [] } })),
        client.get('/tasks', { params: { assignedTo: user?._id, limit: 500 } }).catch(() => ({ data: { data: [] } }))
      ]);
      setProjects(projRes.data.data || projRes.data || []);
      const rawTasks = taskRes.data.data || taskRes.data || [];
      // Backend validates that logs can only be created for tasks with these statuses
      const validTasks = rawTasks.filter(t => ['IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(t.status));
      setTasks(validTasks);
    } catch (e) {
      console.error("Failed to load filters:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
      fetchFilters();
    }, [])
  );

  const openAddModal = () => {
    setFormProjectId('');
    setFormTaskId('');
    setFormDescription('');
    setFormStartTime(new Date());
    setFormEndTime(new Date());
    setFormTodos(todayLog?.todos?.map(t => t.task).join('\n') || '');
    setFormTomorrowTodos(todayLog?.tomorrowTodos?.map(t => t.task).join('\n') || '');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formDescription.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    if (!formStartTime || !formEndTime) {
      Alert.alert('Error', 'Start and End times are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newEntries = [{
        projectId: formProjectId || null,
        taskId: formTaskId || null,
        description: formDescription,
        startTime: formStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        endTime: formEndTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        logType: 'task_work'
      }];

      let allEntries = [];
      if (todayLog && todayLog.entries) {
        allEntries = [...todayLog.entries];
      }
      allEntries = [...allEntries, ...newEntries];
      
      const todayString = new Date().toISOString().split('T')[0];
      
      const processTodos = (text) => text.split('\n').map(t => t.trim()).filter(Boolean).map(task => ({ task, completed: false }));

      const payload = {
        logDate: todayString,
        entries: allEntries,
        todos: formTodos ? processTodos(formTodos) : (todayLog?.todos || []),
        tomorrowTodos: formTomorrowTodos ? processTodos(formTomorrowTodos) : (todayLog?.tomorrowTodos || [])
      };

      await client.post('/daily-logs', payload);
      
      setModalVisible(false);
      fetchLogs();
    } catch (error) {
      console.error("Failed to submit log", error);
      Alert.alert("Error", "Failed to submit log");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grouping logic for the list
  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach(log => {
      const dateObj = new Date(log.logDate || log.createdAt);
      const dateKey = dateObj.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = { parsed: dateObj, logs: [] };
      }
      groups[dateKey].logs.push(log);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, val]) => ({ key, ...val }));
  }, [logs]);

  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  useEffect(() => {
    // Expand today by default
    const todayStr = new Date().toISOString().split('T')[0];
    if (groupedLogs.some(g => g.key === todayStr)) {
      setExpandedGroups(new Set([todayStr]));
    } else if (groupedLogs.length > 0) {
      setExpandedGroups(new Set([groupedLogs[0].key]));
    }
  }, [groupedLogs.length]);

  const toggleGroup = (key) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const hasLogToday = !!todayLog;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderGroup = ({ item }) => {
    const isToday = item.key === new Date().toISOString().split('T')[0];
    const isOpen = expandedGroups.has(item.key);
    
    // Compute total entries for this group
    const entryCount = item.logs.reduce((sum, l) => sum + (l.entries?.length || 1), 0);

    return (
      <View className={`mb-3 border ${bgCard} ${borderColor} rounded-lg overflow-hidden`}>
        <TouchableOpacity 
          onPress={() => toggleGroup(item.key)}
          className={`flex-row items-center px-4 py-3 ${isOpen ? 'border-b ' + borderColor : ''}`}
        >
          <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} style={{ transform: [{ rotate: isOpen ? '0deg' : '-90deg' }] }} className="mr-3" />
          <View className="flex-1 flex-row items-center">
            <Text className={`text-[13px] font-bold ${textColor}`}>
              {item.parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            {isToday && (
              <View className="ml-2 bg-[#47ff8a]/10 border border-[#47ff8a]/30 px-1.5 py-0.5 rounded">
                <Text className="text-[9px] font-bold uppercase tracking-widest text-[#47ff8a]">Today</Text>
              </View>
            )}
          </View>
          <Text className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>{entryCount} entries</Text>
        </TouchableOpacity>

        {isOpen && (
          <View className="p-4 space-y-3">
            {item.logs.map(log => {
              const entries = log.entries?.length ? log.entries : [{
                projectId: log.projectId,
                taskId: log.taskId,
                taskTitle: log.taskTitle,
                description: log.description,
              }];
              
              return entries.map((e, idx) => {
                // If populated
                const projName = typeof e.projectId === 'object' ? e.projectId?.name : (projects.find(p => p._id === e.projectId)?.name || '—');
                const taskName = typeof e.taskId === 'object' ? e.taskId?.title : (e.taskTitle || tasks.find(t => t._id === e.taskId)?.title || '—');
                
                return (
                  <View key={`${log._id}-${idx}`} className={`border ${borderColor} rounded p-3 mb-2 ${isDarkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Folder size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-1.5" />
                          <Text className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{projName}</Text>
                        </View>
                        <Text className={`text-sm font-bold ${textColor}`}>{taskName !== '—' ? taskName : 'General Log'}</Text>
                      </View>
                      
                      {e.startTime && e.endTime && (
                        <View className={`px-2 py-1 rounded border ${isDarkMode ? 'bg-[#1c1b1b] border-[#333]' : 'bg-white border-gray-200'}`}>
                          <Text className={`text-[10px] font-bold tracking-wider ${textMuted}`}>
                            {formatTime(e.startTime)} - {formatTime(e.endTime)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{e.description}</Text>
                  </View>
                );
              });
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={`flex-1 ${bgScreen}`}>
      <View className={`p-4 border-b ${borderColor} ${bgCard}`}>
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>EMPLOYEE / DAILY LOGS</Text>
            <Text className={`text-2xl font-bold mt-1 ${textColor}`}>Daily Logs</Text>
          </View>
          <TouchableOpacity 
            onPress={openAddModal}
            className="flex-row items-center bg-[#adc6ff] px-4 py-2 rounded"
          >
            <Plus size={16} color="#131313" className="mr-2" />
            <Text className="text-[#131313] font-bold text-xs uppercase tracking-widest">ADD LOG</Text>
          </TouchableOpacity>
        </View>

        {!loading && !hasLogToday && (
          <View className="flex-row items-center bg-[#ffb84d]/10 border border-[#ffb84d]/30 p-3 rounded mb-4">
            <AlertCircle size={16} color="#ffb84d" className="mr-2" />
            <Text className="text-[#ffb84d] text-xs">No log submitted today. Don't forget to submit before the deadline!</Text>
          </View>
        )}

        {/* Removed stats boxes for cleaner Employee view */}
      </View>

      {loading && groupedLogs.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
        </View>
      ) : (
        <FlatList
          data={groupedLogs}
          keyExtractor={item => item.key}
          renderItem={renderGroup}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="py-10 items-center">
              <ClipboardList size={40} color={isDarkMode ? "#333" : "#e5e7eb"} />
              <Text className={`mt-4 text-xs font-bold uppercase tracking-widest ${textMuted}`}>No Logs Found</Text>
            </View>
          }
        />
      )}

      {/* Add Log Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/60">
          <View className={`w-full max-h-[90%] rounded-t-xl ${bgCard} border-t ${borderColor}`}>
            <View className={`flex-row justify-between items-center p-4 border-b ${borderColor}`}>
              <Text className={`text-sm font-bold uppercase tracking-widest ${textColor}`}>Submit Log Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1">
                <X size={20} color={isDarkMode ? "#888" : "#9ca3af"} />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4">
              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Project (Optional)</Text>
              <View className={`border ${borderColor} rounded mb-4 overflow-hidden`}>
                <TextInput
                  placeholder="Select Project"
                  placeholderTextColor={isDarkMode ? "#555" : "#9ca3af"}
                  className={`px-3 py-2 text-sm ${textColor}`}
                  value={projects.find(p => p._id === formProjectId)?.name || (formProjectId === 'other' ? 'Other' : '')}
                  editable={false} 
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`border-t ${borderColor} p-2 flex-row`}>
                  <TouchableOpacity onPress={() => setFormProjectId('')} className={`mr-2 px-3 py-1.5 rounded-full border ${formProjectId === '' ? 'border-blue-500 bg-blue-500/10' : borderColor}`}>
                    <Text className={`text-xs ${formProjectId === '' ? 'text-blue-500 font-bold' : textMuted}`}>None</Text>
                  </TouchableOpacity>
                  {projects.map(p => (
                    <TouchableOpacity key={p._id} onPress={() => setFormProjectId(p._id)} className={`mr-2 px-3 py-1.5 rounded-full border ${formProjectId === p._id ? 'border-blue-500 bg-blue-500/10' : borderColor}`}>
                      <Text className={`text-xs ${formProjectId === p._id ? 'text-blue-500 font-bold' : textMuted}`}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Task</Text>
              <View className={`border ${borderColor} rounded mb-4 overflow-hidden`}>
                <TextInput
                  placeholder="Select Task"
                  placeholderTextColor={isDarkMode ? "#555" : "#9ca3af"}
                  className={`px-3 py-2 text-sm ${textColor}`}
                  value={tasks.find(t => t._id === formTaskId)?.title || ''}
                  editable={false}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`border-t ${borderColor} p-2 flex-row`}>
                  <TouchableOpacity onPress={() => setFormTaskId('')} className={`mr-2 px-3 py-1.5 rounded-full border ${formTaskId === '' ? 'border-blue-500 bg-blue-500/10' : borderColor}`}>
                    <Text className={`text-xs ${formTaskId === '' ? 'text-blue-500 font-bold' : textMuted}`}>None</Text>
                  </TouchableOpacity>
                  {tasks.filter(t => !formProjectId || t.projectId === formProjectId || t.projectId?._id === formProjectId).map(t => (
                    <TouchableOpacity key={t._id} onPress={() => setFormTaskId(t._id)} className={`mr-2 px-3 py-1.5 rounded-full border ${formTaskId === t._id ? 'border-blue-500 bg-blue-500/10' : borderColor}`}>
                      <Text className={`text-xs ${formTaskId === t._id ? 'text-blue-500 font-bold' : textMuted}`}>{t.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Description *</Text>
              <TextInput
                multiline
                numberOfLines={4}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="What did you work on?"
                placeholderTextColor={isDarkMode ? "#555" : "#9ca3af"}
                style={{ textAlignVertical: 'top' }}
                className={`border ${borderColor} rounded px-3 py-2 text-sm mb-4 ${textColor} ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-50'}`}
              />

              <View className="flex-row justify-between mb-8">
                <View className="flex-1 mr-2">
                  <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>Start Time</Text>
                  <TouchableOpacity onPress={() => setShowStartPicker(true)} className={`border ${borderColor} rounded px-3 py-2 ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-50'}`}>
                    <Text className={`text-sm ${textColor}`}>{formStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
                  {showStartPicker && (
                    <DateTimePicker
                      value={formStartTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartPicker(Platform.OS === 'ios');
                        if (selectedDate) setFormStartTime(selectedDate);
                      }}
                    />
                  )}
                </View>
                
                <View className="flex-1 ml-2">
                  <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>End Time</Text>
                  <TouchableOpacity onPress={() => setShowEndPicker(true)} className={`border ${borderColor} rounded px-3 py-2 ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-50'}`}>
                    <Text className={`text-sm ${textColor}`}>{formEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={formEndTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowEndPicker(Platform.OS === 'ios');
                        if (selectedDate) setFormEndTime(selectedDate);
                      }}
                    />
                  )}
                </View>
              </View>

              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>To Do For Today (Optional)</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={formTodos}
                onChangeText={setFormTodos}
                placeholder="List tasks, one per line..."
                placeholderTextColor={isDarkMode ? "#555" : "#9ca3af"}
                style={{ textAlignVertical: 'top' }}
                className={`border ${borderColor} rounded px-3 py-2 text-sm mb-4 ${textColor} ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-50'}`}
              />

              <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>To Do For Tomorrow (Optional)</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={formTomorrowTodos}
                onChangeText={setFormTomorrowTodos}
                placeholder="List tasks, one per line..."
                placeholderTextColor={isDarkMode ? "#555" : "#9ca3af"}
                style={{ textAlignVertical: 'top' }}
                className={`border ${borderColor} rounded px-3 py-2 text-sm mb-8 ${textColor} ${isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-50'}`}
              />
            </ScrollView>
            
            <View className={`p-4 border-t ${borderColor} flex-row justify-end`}>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="px-4 py-2 mr-3">
                <Text className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSubmit} 
                disabled={isSubmitting}
                className={`px-6 py-2 rounded flex-row items-center ${isSubmitting ? 'bg-blue-300' : 'bg-[#2573e6]'}`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-xs font-bold uppercase tracking-widest">Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
