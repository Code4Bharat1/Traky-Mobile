import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import client from '../../api/client';
import { Settings, Save, User, Building, Clock, Trophy } from 'lucide-react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsScreen() {
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const meResponse = await client.get('/users/me');
      const user = meResponse.data?.user || meResponse.data?.data || {};
      setProfile(user);
      
      const companyId = user.companyId;
      if (!companyId) throw new Error("No companyId found");
      
      const response = await client.get(`/companies/${companyId}`);
      const companyData = response.data.company || response.data.data || response.data || {};
      
      // Ensure nested objects exist to prevent crashes during edits
      if (!companyData.scoringRules) companyData.scoringRules = {};
      if (!companyData.workingDays) companyData.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      if (!companyData.logDeadlines) companyData.logDeadlines = ['22:00'];
      
      setSettings(companyData);
    } catch (error) {
      console.error("Failed to load settings", error);
      Alert.alert("Error", "Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.patch(`/companies/${profile.companyId}`, settings);
      Alert.alert("Success", "Company settings updated successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateScoringRule = (rule, value) => {
    setSettings(prev => ({
      ...prev,
      scoringRules: { ...prev.scoringRules, [rule]: Number(value) || 0 }
    }));
  };

  const toggleWorkingDay = (day) => {
    setSettings(prev => {
      const days = [...(prev.workingDays || [])];
      if (days.includes(day)) {
        return { ...prev, workingDays: days.filter(d => d !== day) };
      } else {
        return { ...prev, workingDays: [...days, day] };
      }
    });
  };

  if (loading || !settings) {
    return (
      <View className="flex-1 bg-[#131313] items-center justify-center">
        <ActivityIndicator size="large" color="#adc6ff" />
      </View>
    );
  }

  const renderScoringInput = (label, key) => (
    <View className="flex-1 bg-[#161616] border border-[#ffffff1a] rounded p-3 mb-3 mx-1">
      <Text className="text-[#888] text-xs uppercase mb-2">{label}</Text>
      <TextInput 
        className="text-white text-lg font-bold"
        value={String(settings.scoringRules[key] || 0)}
        onChangeText={(val) => updateScoringRule(key, val)}
        keyboardType="numeric"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-[#131313]"
    >
      <View className="p-4 flex-row justify-between items-center mt-4 border-b border-[#ffffff1a] pb-4">
        <View className="flex-row items-center">
          <Settings size={24} color="#adc6ff" className="mr-3" />
          <Text className="text-white text-2xl font-bold tracking-wider">SETTINGS</Text>
        </View>
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

      <ScrollView className="flex-1 px-4 pt-4">
        
        {/* Profile Card */}
        <View className="bg-[#1c1b1b] rounded-lg p-5 border border-[#ffffff1a] mb-6 flex-row items-center">
          <View className="h-14 w-14 rounded-full bg-[#333] items-center justify-center mr-4">
            <User size={24} color="#adc6ff" />
          </View>
          <View>
            <Text className="text-white font-bold text-xl uppercase tracking-wider">{profile?.name || 'User'}</Text>
            <Text className="text-[#adc6ff]">{profile?.email}</Text>
            <Text className="text-[#888] text-xs mt-1 capitalize">{profile?.globalRole?.replace('_', ' ')} • {settings.companyName}</Text>
          </View>
        </View>

        {/* Company Info */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Building size={18} color="#adc6ff" className="mr-2" />
            <Text className="text-white font-bold tracking-widest uppercase">Company Information</Text>
          </View>
          <View className="bg-[#1c1b1b] rounded-lg p-4 border border-[#ffffff1a]">
            <Text className="text-[#888] text-xs uppercase mb-2">Company Name</Text>
            <TextInput 
              className="text-white text-base border-b border-[#333] pb-2"
              value={settings.companyName}
              onChangeText={(val) => updateField('companyName', val)}
              placeholderTextColor="#555"
              placeholder="Enter company name"
            />
          </View>
        </View>

        {/* Work Policy */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Clock size={18} color="#adc6ff" className="mr-2" />
            <Text className="text-white font-bold tracking-widest uppercase">Work Policy</Text>
          </View>
          <View className="bg-[#1c1b1b] rounded-lg p-4 border border-[#ffffff1a]">
            <Text className="text-[#888] text-xs uppercase mb-4">Working Days</Text>
            <View className="flex-row flex-wrap gap-2">
              {DAYS.map(day => {
                const isActive = settings.workingDays?.includes(day);
                return (
                  <TouchableOpacity 
                    key={day}
                    onPress={() => toggleWorkingDay(day)}
                    className={`px-3 py-2 rounded border ${isActive ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#131313] border-[#333]'}`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? 'text-[#131313]' : 'text-[#888]'}`}>{day.substring(0,3)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Text className="text-[#888] text-xs uppercase mt-6 mb-2">Log Submission Deadline</Text>
            <TextInput 
              className="text-white text-base border-b border-[#333] pb-2 w-32"
              value={settings.logDeadlines?.[0] || '22:00'}
              onChangeText={(val) => {
                const arr = [...(settings.logDeadlines || [])];
                arr[0] = val;
                updateField('logDeadlines', arr);
              }}
              placeholder="22:00"
              placeholderTextColor="#555"
            />
          </View>
        </View>

        {/* Scoring Rules */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Trophy size={18} color="#adc6ff" className="mr-2" />
            <Text className="text-white font-bold tracking-widest uppercase">Scoring Rules</Text>
          </View>
          <View className="bg-[#1c1b1b] rounded-lg p-4 border border-[#ffffff1a]">
            
            <View className="flex-row justify-between mb-6">
              <View className="flex-1 mr-2">
                <Text className="text-[#888] text-xs uppercase mb-2">Default Task Deadline</Text>
                <TextInput 
                  className="text-white text-base border-b border-[#333] pb-2"
                  value={settings.defaultTaskDeadline}
                  onChangeText={(val) => updateField('defaultTaskDeadline', val)}
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-[#888] text-xs uppercase mb-2">Grace Period (Hours)</Text>
                <TextInput 
                  className="text-white text-base border-b border-[#333] pb-2"
                  value={String(settings.missedTaskGracePeriod || 24)}
                  onChangeText={(val) => updateField('missedTaskGracePeriod', Number(val) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text className="text-[#888] text-xs uppercase mb-4 tracking-widest">Points Per Action</Text>
            
            <View className="flex-row justify-between">
              {renderScoringInput('Task Completed Early', 'taskEarly')}
              {renderScoringInput('Task On Time', 'taskOnTime')}
            </View>
            <View className="flex-row justify-between">
              {renderScoringInput('Task Overdue', 'taskOverdue')}
              {renderScoringInput('Task Missed', 'taskMissed')}
            </View>
            <View className="flex-row justify-between">
              {renderScoringInput('Daily Log On Time', 'dailyLogOnTime')}
              {renderScoringInput('Daily Log Missed', 'dailyLogMissed')}
            </View>
            <View className="flex-row justify-between">
              {renderScoringInput('Absentees', 'absentees')}
              {renderScoringInput('Discipline', 'discipline')}
            </View>

          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
