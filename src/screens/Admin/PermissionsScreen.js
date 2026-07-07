import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Switch, Alert } from 'react-native';
import { getRolePermissions, updateRolePermissions } from '../../api/services';
import { Shield, ChevronDown, ChevronRight, Save, Users, FolderKanban, CheckSquare, FileText, Bug, BarChart2, BookOpen, Trophy, Activity, Calendar, Umbrella, CreditCard, DollarSign, Building, Tag, Copy, RotateCcw } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

export default function PermissionsScreen() {
  const { isDarkMode } = useThemeStore();
  const [permissions, setPermissions] = useState(null);
  const [originalPermissions, setOriginalPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);

  const RESOURCES = [
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'projects', label: 'Projects', icon: FolderKanban },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'dailyLogs', label: 'Daily Logs', icon: CheckSquare },
    { key: 'bugs', label: 'Bug Reports', icon: Bug },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'ktDocuments', label: 'KT Documents', icon: BookOpen },
    { key: 'scoring', label: 'Leaderboard', icon: Trophy },
    { key: 'activityLogs', label: 'Activity Logs', icon: Activity },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'leave', label: 'Leave Management', icon: Umbrella },
    { key: 'expenses', label: 'Expense Claims', icon: CreditCard },
    { key: 'salary', label: 'Salary Management', icon: DollarSign },
    { key: 'departments', label: 'Departments', icon: Building },
    { key: 'categories', label: 'Task Categories', icon: Tag },
    { key: 'taskTemplates', label: 'Task Templates', icon: Copy },
  ];

  const fetchPermissions = async () => {
    try {
      const response = await client.get('/companies/permissions/roles');
      const perms = response.data.rolePermissions || response.data || {};
      setPermissions(perms);
      setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
    } catch (error) {
      console.error("Failed to load permissions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.patch('/companies/permissions/roles', { rolePermissions: permissions });
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      Alert.alert("Success", "Permissions saved successfully!");
    } catch (error) {
      console.error("Failed to save permissions", error);
      Alert.alert("Error", "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Permissions",
      "Are you sure you want to discard your changes and reset to the original defaults?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: () => {
            if (originalPermissions) {
              setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
            }
          }
        }
      ]
    );
  };

  const togglePermission = (roleKey, resourceKey, actionKey) => {
    setPermissions(prev => {
      const updated = { ...prev };
      if (!updated[roleKey]) updated[roleKey] = {};
      if (!updated[roleKey][resourceKey]) updated[roleKey][resourceKey] = {};
      
      updated[roleKey][resourceKey][actionKey] = !updated[roleKey][resourceKey][actionKey];
      return updated;
    });
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgRow = isDarkMode ? 'bg-[#161616]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${bgScreen}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
      </View>
    );
  }

  const getPermissionSummaryTags = (roleKey) => {
    if (!permissions || !permissions[roleKey]) return [];
    const rolePerms = permissions[roleKey];
    const tags = [];
    RESOURCES.forEach(res => {
      const resPerms = rolePerms[res.key];
      if (resPerms) {
        const actions = [];
        if (resPerms.create) actions.push('Create');
        if (resPerms.read) actions.push('View');
        if (resPerms.update) actions.push('Edit');
        if (resPerms.delete) actions.push('Delete');
        if (actions.length > 0) {
          tags.push({ label: res.label, actions: actions.join(', '), icon: res.icon });
        }
      }
    });
    return tags;
  };

  const renderPermissionSummary = (roleKey) => {
    const tags = getPermissionSummaryTags(roleKey);
    if (tags.length === 0) return <Text className={`text-xs italic mt-3 ${textMuted}`}>No permissions assigned.</Text>;
    
    return (
      <View className="mt-4 border-t pt-4 flex-row flex-wrap" style={{ borderColor: isDarkMode ? '#ffffff1a' : '#e5e7eb' }}>
        <Text className={`w-full text-[10px] font-bold uppercase tracking-widest mb-3 ${textMuted}`}>{roleKey.replace('_', ' ')} — PERMISSION SUMMARY</Text>
        {tags.map((tag, i) => {
          const Icon = tag.icon;
          return (
            <View key={i} className={`flex-row items-center border rounded px-2 py-1.5 mr-2 mb-2 ${isDarkMode ? 'bg-[#131313] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
              <Icon size={12} color={isDarkMode ? '#888' : '#6b7280'} className="mr-1.5" />
              <Text className={`text-[10px] ${textColor}`}>{tag.label}: </Text>
              <Text className={`text-[10px] font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600'}`}>{tag.actions}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderResourceToggles = (roleKey, resourceKey, label) => {
    const resourcePerms = permissions?.[roleKey]?.[resourceKey] || {};
    return (
      <View key={resourceKey} className={`border-t py-4 ${borderColor}`}>
        <Text className={`font-bold mb-3 ${textColor}`}>{label}</Text>
        <View className="flex-row justify-between">
          {['create', 'read', 'update', 'delete'].map(action => (
            <View key={action} className="items-center">
              <Text className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${textMuted}`}>
                {action === 'read' ? 'View' : action === 'update' ? 'Edit' : action}
              </Text>
              <Switch
                value={!!resourcePerms[action]}
                onValueChange={() => togglePermission(roleKey, resourceKey, action)}
                trackColor={{ false: isDarkMode ? '#333' : '#d1d5db', true: isDarkMode ? '#adc6ff' : '#2573e6' }}
                thumbColor={!!resourcePerms[action] ? '#ffffff' : (isDarkMode ? '#888' : '#f9fafb')}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRoleCard = (roleKey) => {
    const isExpanded = expandedRole === roleKey;
    return (
      <View key={roleKey} className="mb-4 shadow-sm shadow-black drop-shadow-sm">
        <TouchableOpacity 
          className={`rounded-t-lg p-5 border ${bgCard} ${borderColor}`}
          style={!isExpanded && { borderRadius: 8 }}
          onPress={() => setExpandedRole(isExpanded ? null : roleKey)}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Shield size={24} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-4" />
              <View className="flex-1">
                <Text className={`font-bold text-lg capitalize ${textColor}`}>{roleKey.replace('_', ' ')}</Text>
                <Text className={`text-xs ${isDarkMode ? 'text-[#6b7280]' : 'text-gray-500'}`}>{isExpanded ? 'Tap to collapse' : 'Tap to configure access'}</Text>
              </View>
            </View>
            {isExpanded ? <ChevronDown size={20} color={isDarkMode ? "#adc6ff" : "#2573e6"} /> : <ChevronRight size={20} color={isDarkMode ? "#6b7280" : "#9ca3af"} />}
          </View>
          
          {/* Always show permission summary when not expanded */}
          {!isExpanded && renderPermissionSummary(roleKey)}
        </TouchableOpacity>

        {isExpanded && (
          <View className={`border border-t-0 rounded-b-lg px-4 pb-2 ${bgRow} ${borderColor}`}>
            <Text className={`w-full text-[10px] font-bold uppercase tracking-widest mt-4 mb-2 ${textMuted}`}>Configure Permissions</Text>
            {RESOURCES.map(res => renderResourceToggles(roleKey, res.key, res.label))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={`flex-1 ${bgScreen}`}>
      <View className="p-4 flex-row justify-between items-center mt-4">
        <Text className={`text-lg font-bold tracking-wider ${textColor}`}>PERMISSIONS</Text>
        <View className="flex-row items-center">
          <TouchableOpacity 
            className={`px-3 py-2 rounded-lg flex-row items-center mr-2 border ${isDarkMode ? 'border-[#333] bg-[#1c1b1b]' : 'border-gray-300 bg-white'}`}
            onPress={handleReset}
            disabled={saving}
          >
            <RotateCcw size={14} color={isDarkMode ? "#c2c6d6" : "#4b5563"} className="mr-1.5" />
            <Text className={`font-bold text-xs ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`px-3 py-2 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} />
            ) : (
              <>
                <Save size={14} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1.5" />
                <Text className={`font-bold text-xs ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-2">
        <Text className={`text-sm mb-6 ${isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-600'}`}>
          Admin always has full access to all features and cannot be restricted. All other roles are configurable below.
        </Text>

        {renderRoleCard('department_head')}
        {renderRoleCard('lead')}
        {renderRoleCard('employee')}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
