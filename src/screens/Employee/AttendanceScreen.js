import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import client from '../../api/client';
import { CalendarCheck, Clock, MapPin, CheckCircle2, LogOut, Camera, Award, ChevronLeft, ChevronRight, CheckCircle, XCircle, TrendingUp } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export default function AttendanceScreen() {
  const { isDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const OLA_MAPS_API_KEY = 'g4rU6waGMob5HqlqyiBIJSryR7HYrBUrCdEPyx6S';

  const fetchData = async () => {
    try {
      setLoading(true);
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const [todayRes, historyRes, summaryRes] = await Promise.all([
        client.get('/attendance/today'),
        client.get('/attendance/my-records?limit=10'),
        client.get('/attendance/summary', { params: { month, year } })
      ]);
      setTodayAttendance(todayRes.data?.attendance || null);
      setHistory(historyRes.data?.data || historyRes.data?.records || []);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentAddress('Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await fetch(`https://api.olamaps.io/places/v1/reverse-geocode?latlng=${latitude},${longitude}&api_key=${OLA_MAPS_API_KEY}`);
      const data = await response.json();
      
      if (data.status === 'ok' && data.results && data.results.length > 0) {
        setCurrentAddress(data.results[0].formatted_address);
      } else {
        setCurrentAddress('Address not found');
      }
    } catch (err) {
      console.error('Location fetch error:', err);
      setCurrentAddress('Failed to fetch address');
    } finally {
      setFetchingLocation(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const handlePunch = async (type) => {
    setPunching(true);
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Camera Permission Denied', 'Photo is required for attendance.');
        setPunching(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
      });

      if (result.canceled) {
        setPunching(false);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Denied', 'Location is required for attendance.');
        setPunching(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      const formData = new FormData();
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());
      
      const photoUri = result.assets[0].uri;
      const filename = photoUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const typeStr = match ? `image/${match[1]}` : `image`;
      
      formData.append('photo', {
        uri: photoUri,
        name: filename,
        type: typeStr
      });

      const endpoint = type === 'in' ? '/attendance/punch-in' : '/attendance/punch-out';
      
      await client.post(endpoint, formData, {
        transformRequest: (data, headers) => {
          // Remove default application/json header to let Axios/XHR set the boundary automatically
          delete headers['Content-Type'];
          return data;
        }
      });
      
      Alert.alert('Success', `Punched ${type} successfully!`);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || error.message || `Failed to punch ${type}`);
    } finally {
      setPunching(false);
    }
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';
  
  const hasPunchedIn = !!todayAttendance?.punchIn?.time;
  const hasPunchedOut = !!todayAttendance?.punchOut?.time;

  const renderHistoryItem = ({ item }) => (
    <View className={`p-4 border rounded mb-3 flex-row justify-between items-center ${bgCard} ${borderColor}`}>
      <View>
        <Text className={`font-bold mb-1 ${textColor}`}>{new Date(item.date).toLocaleDateString()}</Text>
        <View className="flex-row items-center">
           <Clock size={12} color="#47c8ff" className="mr-1" />
           <Text className={`text-[10px] font-bold mr-3 ${textMuted}`}>{item.punchIn ? new Date(item.punchIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</Text>
           <LogOut size={12} color="#ff4747" className="mr-1" />
           <Text className={`text-[10px] font-bold ${textMuted}`}>{item.punchOut ? new Date(item.punchOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className={`text-[10px] uppercase font-bold tracking-widest ${item.status === 'present' ? 'text-[#47ff8a]' : 'text-[#e8a847]'}`}>
           {item.status}
        </Text>
        {item.totalHours > 0 && <Text className={`text-xs mt-1 ${textMuted}`}>{item.totalHours.toFixed(1)} hrs</Text>}
      </View>
    </View>
  );

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="mb-6 mt-4">
         <Text className={`text-[10px] tracking-widest uppercase mb-1 font-bold ${textMuted}`}>Employee / Attendance</Text>
         <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Attendance</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
        </View>
      ) : (
        <>
          {/* Action Card */}
          <View className={`p-6 rounded-xl border items-center mb-6 shadow-sm ${bgCard} ${borderColor}`}>
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDarkMode ? 'bg-[#adc6ff1a]' : 'bg-[#e0e7ff]'}`}>
               <CalendarCheck size={32} color={isDarkMode ? "#adc6ff" : "#2573e6"} />
            </View>
            <Text className={`text-xl font-bold mb-1 ${textColor}`}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            
            <View className="flex-row items-center mb-4">
              <Clock size={14} color="#888" className="mr-1.5" />
              <Text className={`text-sm ${textMuted}`}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>

            {/* Current Location Display */}
            <View className={`w-full p-3 rounded-lg mb-6 flex-row items-center ${isDarkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>
              <MapPin size={16} color="#47c8ff" className="mr-3" />
              <View className="flex-1">
                <Text className={`text-[10px] uppercase font-bold tracking-widest ${textMuted}`}>Current Location</Text>
                {fetchingLocation ? (
                  <Text className={`text-xs mt-0.5 ${textColor}`}>Detecting location...</Text>
                ) : (
                  <Text className={`text-xs mt-0.5 ${textColor}`} numberOfLines={2}>
                    {currentAddress || 'Location not available'}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={fetchCurrentLocation} className="p-2 ml-2">
                <Text className="text-[#47c8ff] text-xs font-bold uppercase tracking-widest">Refresh</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row w-full justify-between space-x-2">
              <TouchableOpacity 
                disabled={punching || hasPunchedIn}
                onPress={() => handlePunch('in')}
                className={`flex-1 flex-row justify-center items-center py-4 rounded-lg mr-2 ${hasPunchedIn ? (isDarkMode ? 'bg-[#333]' : 'bg-gray-200') : 'bg-[#47c8ff]'}`}
              >
                {punching ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <MapPin size={18} color={hasPunchedIn ? '#888' : '#131313'} className="mr-2" />
                    <Text className={`font-bold uppercase tracking-widest ${hasPunchedIn ? 'text-[#888]' : 'text-[#131313]'}`}>
                      {hasPunchedIn ? 'Punched In' : 'Punch In'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                disabled={punching || !hasPunchedIn || hasPunchedOut}
                onPress={() => handlePunch('out')}
                className={`flex-1 flex-row justify-center items-center py-4 rounded-lg ml-2 ${!hasPunchedIn || hasPunchedOut ? (isDarkMode ? 'bg-[#333]' : 'bg-gray-200') : 'bg-[#ff4747]'}`}
              >
                {punching ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <LogOut size={18} color={!hasPunchedIn || hasPunchedOut ? '#888' : '#fff'} className="mr-2" />
                    <Text className={`font-bold uppercase tracking-widest ${!hasPunchedIn || hasPunchedOut ? 'text-[#888]' : 'text-white'}`}>
                      {hasPunchedOut ? 'Punched Out' : 'Punch Out'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Monthly Summary */}
          {summary && (
            <View className={`mb-6 border rounded ${bgCard} ${borderColor}`}>
              <View className={`p-4 border-b flex-row justify-between items-center ${borderColor}`}>
                <View className="flex-row items-center">
                  <Award size={16} color="#47c8ff" className="mr-2" />
                  <Text className={`text-[10px] uppercase font-bold tracking-widest ${textMuted}`}>
                    Monthly Summary — {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <View className="flex-row">
                  <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
                    <ChevronLeft size={16} color={isDarkMode ? '#888' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
                    <ChevronRight size={16} color={isDarkMode ? '#888' : '#666'} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className={`w-1/2 p-4 border-b border-r ${borderColor}`}>
                  <View className="flex-row items-center mb-2">
                    <CheckCircle size={14} color="#47ff8a" className="mr-2" />
                    <Text className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Present</Text>
                  </View>
                  <Text className="text-xl font-bold text-[#47ff8a]">{summary.stats?.present || 0}</Text>
                </View>
                <View className={`w-1/2 p-4 border-b ${borderColor}`}>
                  <View className="flex-row items-center mb-2">
                    <XCircle size={14} color="#ff4747" className="mr-2" />
                    <Text className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Absent</Text>
                  </View>
                  <Text className="text-xl font-bold text-[#ff4747]">{summary.stats?.absent || 0}</Text>
                </View>
                <View className={`w-1/2 p-4 border-r ${borderColor}`}>
                  <View className="flex-row items-center mb-2">
                    <Clock size={14} color="#47c8ff" className="mr-2" />
                    <Text className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Total Hours</Text>
                  </View>
                  <Text className="text-xl font-bold text-[#47c8ff]">{summary.stats?.totalWorkingHours?.toFixed(1) || '0.0'}</Text>
                </View>
                <View className={`w-1/2 p-4 ${borderColor}`}>
                  <View className="flex-row items-center mb-2">
                    <TrendingUp size={14} color="#e8a847" className="mr-2" />
                    <Text className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Overtime</Text>
                  </View>
                  <Text className="text-xl font-bold text-[#e8a847]">{summary.stats?.totalOvertime?.toFixed(1) || '0.0'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* History */}
          <Text className={`font-bold uppercase tracking-widest text-xs mb-3 ${textColor}`}>Recent Attendance</Text>
          <FlatList
            data={history}
            keyExtractor={item => item._id}
            renderItem={renderHistoryItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center py-6">
                <Text className={textMuted}>No recent records found</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}
