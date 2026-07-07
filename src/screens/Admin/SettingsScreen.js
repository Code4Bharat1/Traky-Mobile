import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native';
import { getCompanyById, updateCompany, updateMe, getMe, uploadProfilePic } from '../../api/services';
import { Settings, Save, User, Building, Clock, Trophy, Globe, Edit2, X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import useThemeStore from '../../store/themeStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsScreen() {
  const { isDarkMode } = useThemeStore();
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
      const user = await getMe();
      setProfile(user);
      
      const companyId = user.companyId?._id || user.companyId;
      if (!companyId) throw new Error("No companyId found");
      
      const companyData = await getCompanyById(companyId);
      
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
      await updateCompany(compId, settings);
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
      name: profile?.name || ''
    });
    setProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSavingProfile(true);
    try {
      const payload = { name: profileForm.name };
      
      await updateMe(payload);
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

  const handleImagePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadAvatar(result.assets[0]);
    }
  };

  const uploadAvatar = async (asset) => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('profilePic', {
        uri: asset.uri,
        name: 'avatar.jpg',
        type: 'image/jpeg'
      });
      
      await uploadProfilePic(profile._id, formData);
      
      Alert.alert('Success', 'Profile photo updated successfully');
      fetchData();
    } catch (e) {
      console.error("Failed to upload avatar", e);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
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

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgInputDeep = isDarkMode ? 'bg-[#201f1f]' : 'bg-gray-100';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  if (loading || !settings) {
    return (
      <View className={`flex-1 items-center justify-center ${bgScreen}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
      </View>
    );
  }

  const getScoringColor = (key) => {
    switch(key) {
      case 'taskEarly': return isDarkMode ? 'text-[#10b981]' : 'text-green-600';
      case 'taskOnTime': return isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]';
      case 'taskOverdue': return isDarkMode ? 'text-[#f59e0b]' : 'text-yellow-600';
      case 'taskMissed': return isDarkMode ? 'text-[#ef4444]' : 'text-red-600';
      case 'dailyLogOnTime': return isDarkMode ? 'text-[#10b981]' : 'text-green-600';
      case 'dailyLogMissed': return isDarkMode ? 'text-[#ef4444]' : 'text-red-600';
      case 'absentees': return isDarkMode ? 'text-[#ef4444]' : 'text-red-600';
      case 'discipline': return isDarkMode ? 'text-[#ef4444]' : 'text-red-600';
      default: return textMuted;
    }
  };

  const renderScoringInput = (label, key) => (
    <View className={`flex-1 border rounded p-3 mb-3 mx-1 ${isDarkMode ? 'bg-[#161616]' : 'bg-gray-50'} ${borderColor}`}>
      <Text className={`${getScoringColor(key)} text-[10px] font-bold uppercase mb-2`}>{label}</Text>
      <TextInput 
        className={`text-lg font-bold ${textColor}`}
        value={String(settings.scoringRules[key] || 0)}
        onChangeText={(val) => updateScoringRule(key, val)}
        keyboardType="numeric"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className={`flex-1 ${bgScreen}`}
    >
      <View className={`p-4 flex-row justify-between items-center mt-4 border-b pb-4 ${borderColor}`}>
        <View className="flex-row items-center">
          <Settings size={24} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-3" />
          <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>SETTINGS</Text>
        </View>
        <TouchableOpacity 
          className={`px-4 py-2 rounded-lg flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} />
          ) : (
            <>
              <Save size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-2" />
              <Text className={`font-bold ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        
        {/* Profile Card */}
        <View className={`rounded-lg p-4 border mb-6 ${bgCard} ${borderColor}`}>
          <View className="flex-row justify-between items-start">
            <View className="flex-row flex-1 pr-2">
              <TouchableOpacity onPress={handleImagePicker} className="relative mr-3">
                <View className={`h-16 w-16 rounded-full items-center justify-center overflow-hidden border-2 ${isDarkMode ? 'border-[#333]' : 'border-white'} ${bgInputDeep}`}>
                  {profile?.avatar ? (
                    <Image source={{ uri: profile.avatar }} className="h-full w-full" />
                  ) : (
                    <User size={28} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
                  )}
                </View>
                <View className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 ${isDarkMode ? 'bg-[#adc6ff] border-[#1c1b1b]' : 'bg-[#2573e6] border-white'}`}>
                  <Camera size={12} color={isDarkMode ? "#131313" : "#ffffff"} />
                </View>
              </TouchableOpacity>
              <View className="flex-1 justify-center">
                <View className="flex-row items-center flex-wrap mb-1">
                  <Text className={`font-bold text-lg uppercase tracking-wider mr-2 ${textColor}`}>{profile?.name || 'User'}</Text>
                  <View className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-[#adc6ff2a] border-[#adc6ff4a]' : 'bg-blue-50 border-blue-200'}`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600'}`}>{profile?.globalRole?.replace('_', ' ')}</Text>
                  </View>
                </View>
                <Text className={`text-sm mb-1 ${isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600'}`}>{profile?.email}</Text>
                <Text className={`text-xs capitalize ${textMuted}`}>{settings.companyName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openProfileModal} className={`flex-row items-center px-2 py-1.5 rounded border ${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'} ${borderColor}`}>
              <Edit2 size={10} color={isDarkMode ? "#fff" : "#111827"} className="mr-1" />
              <Text className={`text-[10px] font-bold ${textColor}`}>EDIT PROFILE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Company Info */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Building size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
            <Text className={`font-bold tracking-widest uppercase ${textColor}`}>Company Information</Text>
          </View>
          <View className={`rounded-lg p-4 border ${bgCard} ${borderColor}`}>
            <Text className={`text-xs uppercase mb-2 ${textMuted}`}>Company Name</Text>
            <TextInput 
              className={`text-base border-b pb-2 ${textColor} ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}
              value={settings.companyName}
              onChangeText={(val) => updateField('companyName', val)}
              placeholderTextColor={isDarkMode ? "#555" : "#9ca3af"}
              placeholder="Enter company name"
            />
          </View>
        </View>

        {/* Work Policy */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Globe size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
            <Text className={`font-bold tracking-widest uppercase ${textColor}`}>Work Policy</Text>
          </View>
          <View className={`rounded-lg p-4 border ${bgCard} ${borderColor}`}>
            <Text className={`text-xs uppercase mb-4 ${textMuted}`}>Working Days</Text>
            <View className="flex-row flex-wrap gap-2">
              {DAYS.map(day => {
                const isActive = settings.workingDays?.includes(day);
                return (
                  <TouchableOpacity 
                    key={day}
                    onPress={() => toggleWorkingDay(day)}
                    className={`px-3 py-2 rounded border ${isActive ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : (isDarkMode ? 'bg-[#131313] border-[#333]' : 'bg-gray-50 border-gray-200')}`}
                  >
                    <Text className={`text-xs font-bold uppercase ${isActive ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textMuted}`}>{day.substring(0,3)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Daily Log Policy */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Clock size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
            <Text className={`font-bold tracking-widest uppercase ${textColor}`}>Daily Log Policy</Text>
          </View>
          <View className={`rounded-lg p-4 border ${bgCard} ${borderColor}`}>
            <Text className={`text-xs uppercase mb-2 ${textMuted}`}>Log Submission Deadlines</Text>
            <TextInput 
              className={`text-base border-b pb-2 w-32 mb-2 ${textColor} ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}
              value={settings.logDeadlines?.[0] || '22:00'}
              onChangeText={(val) => {
                const arr = [...(settings.logDeadlines || [])];
                arr[0] = val;
                updateField('logDeadlines', arr);
              }}
              placeholder="22:00"
              placeholderTextColor={isDarkMode ? "#555" : "#9ca3af"}
            />
            <Text className={`text-[10px] ${isDarkMode ? 'text-[#555]' : 'text-gray-400'}`}>Employees must submit their work log before one of these times each day.</Text>
          </View>
        </View>

        {/* Scoring Rules */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Trophy size={18} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
            <Text className={`font-bold tracking-widest uppercase ${textColor}`}>Scoring Rules</Text>
          </View>
          <View className={`rounded-lg p-4 border ${bgCard} ${borderColor}`}>
            
            <View className="flex-row justify-between mb-6">
              <View className="flex-1 mr-2">
                <Text className={`text-xs uppercase mb-2 ${textMuted}`}>Default Task Deadline</Text>
                <TextInput 
                  className={`text-base border-b pb-2 mb-2 ${textColor} ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}
                  value={settings.defaultTaskDeadline}
                  onChangeText={(val) => updateField('defaultTaskDeadline', val)}
                />
                <Text className={`text-[10px] ${isDarkMode ? 'text-[#555]' : 'text-gray-400'}`}>Auto-applied when a task has no explicit deadline.</Text>
              </View>
              <View className="flex-1 ml-2">
                <Text className={`text-xs uppercase mb-2 ${textMuted}`}>Grace Period (Hours)</Text>
                <TextInput 
                  className={`text-base border-b pb-2 mb-2 ${textColor} ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}
                  value={String(settings.missedTaskGracePeriod || 24)}
                  onChangeText={(val) => updateField('missedTaskGracePeriod', Number(val) || 0)}
                  keyboardType="numeric"
                />
                <Text className={`text-[10px] ${isDarkMode ? 'text-[#555]' : 'text-gray-400'}`}>Hours after deadline before a task counts as missed.</Text>
              </View>
            </View>

            <Text className={`text-xs uppercase mb-4 tracking-widest ${textMuted}`}>Points Per Action</Text>
            
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
          <View className={`border rounded-lg w-11/12 p-6 ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Edit Profile</Text>
               <TouchableOpacity onPress={() => setProfileModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <View className={`border rounded p-2 mb-6 ${bgInputAlt} ${borderColor}`}>
               <TextInput 
                 value={profileForm.name} 
                 onChangeText={v => setProfileForm({...profileForm, name: v})} 
                 placeholder="John Doe" 
                 placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                 className={`text-sm py-1 ${textColor}`} 
               />
            </View>

            <View className="flex-row justify-end pt-2">
               <TouchableOpacity onPress={() => setProfileModalVisible(false)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile} className={`px-4 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  {savingProfile ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
