import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import client from '../../api/client';
import { Settings, Save, User, Building, Clock, Trophy, Globe, Edit2, X } from 'lucide-react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsScreen() {
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Modal State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchData = async () => {
    try {
      const meResponse = await client.get('/users/me');
      const user = meResponse.data?.user || meResponse.data?.data || {};
      setProfile(user);
      
      const companyId = user.companyId?._id || user.companyId;
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

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const compId = profile?.companyId?._id || profile?.companyId;
      await client.patch(`/companies/${compId}`, settings);
      Alert.alert("Success", "Company settings updated successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const openProfileModal = () => {
    setProfileForm({
      name: profile?.name || '',
      email: profile?.email || '',
      password: ''
    });
    setProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name || !profileForm.email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }
    setSavingProfile(true);
    try {
      const payload = { name: profileForm.name, email: profileForm.email };
      if (profileForm.password) {
        payload.password = profileForm.password;
      }
      await client.patch('/users/me', payload);
      setProfileModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
      fetchData(); // refresh profile data
    } catch (error) {
      console.error("Failed to save profile", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
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

  const getScoringColor = (key) => {
    switch(key) {
      case 'taskEarly': return 'text-[#10b981]';
      case 'taskOnTime': return 'text-[#adc6ff]';
      case 'taskOverdue': return 'text-[#f59e0b]';
      case 'taskMissed': return 'text-[#ef4444]';
      case 'dailyLogOnTime': return 'text-[#10b981]';
      case 'dailyLogMissed': return 'text-[#ef4444]';
      case 'absentees': return 'text-[#ef4444]';
      case 'discipline': return 'text-[#ef4444]';
      default: return 'text-[#888]';
    }
  };

  const renderScoringInput = (label, key) => (
    <View className="flex-1 bg-[#161616] border border-[#ffffff1a] rounded p-3 mb-3 mx-1">
      <Text className={`${getScoringColor(key)} text-[10px] font-bold uppercase mb-2`}>{label}</Text>
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
          onPress={handleSaveSettings}
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
        <View className="bg-[#1c1b1b] rounded-lg p-4 border border-[#ffffff1a] mb-6">
          <View className="flex-row justify-between items-start">
            <View className="flex-row flex-1 pr-2">
              <View className="h-14 w-14 rounded-full bg-[#333] items-center justify-center mr-3">
                <User size={24} color="#adc6ff" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center flex-wrap mb-1">
                  <Text className="text-white font-bold text-lg uppercase tracking-wider mr-2">{profile?.name || 'User'}</Text>
                  <View className="bg-[#adc6ff2a] px-2 py-0.5 rounded border border-[#adc6ff4a]">
                    <Text className="text-[#adc6ff] text-[10px] font-bold uppercase tracking-wider">{profile?.globalRole?.replace('_', ' ')}</Text>
                  </View>
                </View>
                <Text className="text-[#adc6ff] text-sm mb-1">{profile?.email}</Text>
                <Text className="text-[#888] text-xs capitalize">{settings.companyName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openProfileModal} className="bg-[#2a2a2a] flex-row items-center px-2 py-1.5 rounded border border-[#ffffff1a]">
              <Edit2 size={10} color="#fff" className="mr-1" />
              <Text className="text-white text-[10px] font-bold">EDIT PROFILE</Text>
            </TouchableOpacity>
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
            <Globe size={18} color="#adc6ff" className="mr-2" />
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
                    <Text className={`text-xs font-bold uppercase ${isActive ? 'text-[#131313]' : 'text-[#888]'}`}>{day.substring(0,3)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Daily Log Policy */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Clock size={18} color="#adc6ff" className="mr-2" />
            <Text className="text-white font-bold tracking-widest uppercase">Daily Log Policy</Text>
          </View>
          <View className="bg-[#1c1b1b] rounded-lg p-4 border border-[#ffffff1a]">
            <Text className="text-[#888] text-xs uppercase mb-2">Log Submission Deadlines</Text>
            <TextInput 
              className="text-white text-base border-b border-[#333] pb-2 w-32 mb-2"
              value={settings.logDeadlines?.[0] || '22:00'}
              onChangeText={(val) => {
                const arr = [...(settings.logDeadlines || [])];
                arr[0] = val;
                updateField('logDeadlines', arr);
              }}
              placeholder="22:00"
              placeholderTextColor="#555"
            />
            <Text className="text-[#555] text-[10px]">Employees must submit their work log before one of these times each day.</Text>
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
                  className="text-white text-base border-b border-[#333] pb-2 mb-2"
                  value={settings.defaultTaskDeadline}
                  onChangeText={(val) => updateField('defaultTaskDeadline', val)}
                />
                <Text className="text-[#555] text-[10px]">Auto-applied when a task has no explicit deadline.</Text>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-[#888] text-xs uppercase mb-2">Grace Period (Hours)</Text>
                <TextInput 
                  className="text-white text-base border-b border-[#333] pb-2 mb-2"
                  value={String(settings.missedTaskGracePeriod || 24)}
                  onChangeText={(val) => updateField('missedTaskGracePeriod', Number(val) || 0)}
                  keyboardType="numeric"
                />
                <Text className="text-[#555] text-[10px]">Hours after deadline before a task counts as missed.</Text>
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

      {/* Profile Edit Modal */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-6">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">Edit Profile</Text>
               <TouchableOpacity onPress={() => setProfileModalVisible(false)}><X size={20} color="#888" /></TouchableOpacity>
            </View>

            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Full Name *</Text>
            <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
               <TextInput 
                 value={profileForm.name} 
                 onChangeText={v => setProfileForm({...profileForm, name: v})} 
                 placeholder="John Doe" 
                 placeholderTextColor="#888" 
                 className="text-white text-sm py-1" 
               />
            </View>

            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Email Address *</Text>
            <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
               <TextInput 
                 value={profileForm.email} 
                 onChangeText={v => setProfileForm({...profileForm, email: v})} 
                 placeholder="john@example.com" 
                 placeholderTextColor="#888" 
                 keyboardType="email-address"
                 autoCapitalize="none"
                 className="text-white text-sm py-1" 
               />
            </View>

            <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">New Password (Optional)</Text>
            <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-6">
               <TextInput 
                 value={profileForm.password} 
                 onChangeText={v => setProfileForm({...profileForm, password: v})} 
                 placeholder="Leave blank to keep current" 
                 placeholderTextColor="#888" 
                 secureTextEntry
                 className="text-white text-sm py-1" 
               />
            </View>

            <View className="flex-row justify-end pt-2">
               <TouchableOpacity onPress={() => setProfileModalVisible(false)} className="mr-4 py-2"><Text className="text-white font-bold text-xs uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile} className="bg-[#adc6ff] px-4 py-2 rounded flex-row items-center">
                  {savingProfile ? <ActivityIndicator size="small" color="#131313" /> : <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Save</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
