import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Switch, Alert } from 'react-native';
import client from '../../api/client';
import { Shield, ChevronDown, ChevronRight, Save } from 'lucide-react-native';

export default function PermissionsScreen() {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);

  const RESOURCES = [
    { key: 'users', label: 'User Management' },
    { key: 'projects', label: 'Projects' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'dailyLogs', label: 'Daily Logs' },
    { key: 'bugs', label: 'Bug Reports' },
    { key: 'reports', label: 'Reports' },
    { key: 'ktDocuments', label: 'KT Documents' },
    { key: 'scoring', label: 'Leaderboard' },
    { key: 'activityLogs', label: 'Activity Logs' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leave', label: 'Leave Management' },
    { key: 'expenses', label: 'Expense Claims' },
    { key: 'salary', label: 'Salary Management' },
    { key: 'departments', label: 'Departments' },
    { key: 'categories', label: 'Categories' },
    { key: 'taskTemplates', label: 'Task Templates' },
  ];

  const fetchPermissions = async () => {
    try {
      const response = await client.get('/companies/permissions/roles');
      setPermissions(response.data.rolePermissions || response.data || {});
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
      Alert.alert("Success", "Permissions saved successfully!");
    } catch (error) {
      console.error("Failed to save permissions", error);
      Alert.alert("Error", "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <View className="flex-1 bg-[#131313] items-center justify-center">
        <ActivityIndicator size="large" color="#adc6ff" />
      </View>
    );
  }

  const renderResourceToggles = (roleKey, resourceKey, label) => {
    const resourcePerms = permissions?.[roleKey]?.[resourceKey] || {};
    return (
      <View key={resourceKey} className="border-t border-[#ffffff1a] py-4">
        <Text className="text-white font-bold mb-3">{label}</Text>
        <View className="flex-row justify-between">
          {['create', 'read', 'update', 'delete'].map(action => (
            <View key={action} className="items-center">
              <Text className="text-[#888] text-xs uppercase mb-2">
                {action === 'read' ? 'View' : action === 'update' ? 'Edit' : action}
              </Text>
              <Switch
                value={!!resourcePerms[action]}
                onValueChange={() => togglePermission(roleKey, resourceKey, action)}
                trackColor={{ false: '#333', true: '#adc6ff' }}
                thumbColor={!!resourcePerms[action] ? '#ffffff' : '#888'}
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
      <View key={roleKey} className="mb-4">
        <TouchableOpacity 
          className="bg-[#1c1b1b] rounded-t-lg p-5 border border-[#ffffff1a] flex-row items-center justify-between"
          style={!isExpanded && { borderRadius: 8 }}
          onPress={() => setExpandedRole(isExpanded ? null : roleKey)}
        >
          <View className="flex-row items-center">
            <Shield size={24} color="#adc6ff" className="mr-4" />
            <View>
              <Text className="text-white font-bold text-lg capitalize">{roleKey.replace('_', ' ')}</Text>
              <Text className="text-[#6b7280] text-xs">{isExpanded ? 'Tap to collapse' : 'Tap to configure access'}</Text>
            </View>
          </View>
          {isExpanded ? <ChevronDown size={20} color="#adc6ff" /> : <ChevronRight size={20} color="#6b7280" />}
        </TouchableOpacity>

        {isExpanded && (
          <View className="bg-[#161616] border border-t-0 border-[#ffffff1a] rounded-b-lg px-4 pb-2">
            {RESOURCES.map(res => renderResourceToggles(roleKey, res.key, res.label))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#131313]">
      <View className="p-4 flex-row justify-between items-center mt-4">
        <Text className="text-white text-2xl font-bold tracking-wider">PERMISSIONS</Text>
        <TouchableOpacity 
          className="bg-[#adc6ff] px-4 py-2 rounded-lg flex-row items-center"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#131313" />
          ) : (
            <>
              <Save size={16} color="#131313" className="mr-2" />
              <Text className="text-[#131313] font-bold">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-[#c2c6d6] text-sm mb-6">
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
