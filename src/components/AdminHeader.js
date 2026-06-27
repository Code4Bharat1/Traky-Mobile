import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Menu, Building, Sun, Moon, Bell, ChevronDown, User, Settings as SettingsIcon, LogOut, Check, X, Trash2, ListFilter, Mail } from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

export default function AdminHeader({ navigation, title }) {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  const [activeModal, setActiveModal] = useState(null); // 'branch', 'notification', 'profile', or null
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  const branches = [
    { id: 'all', name: 'All Branches', code: null },
    { id: 'abc', name: 'ABC', code: 'DT002' },
    { id: 'nexcore', name: 'Nexcore Education', code: 'DT001' }
  ];

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Task overdue: "erty"', desc: 'Deadline was Jun 24, 2026.', time: '1 day ago', read: false },
    { id: 2, title: 'Task overdue: "FSD Lecture and mycoachi..."', desc: 'Deadline was Jun 23, 2026.', time: '2 days ago', read: false },
    { id: 3, title: 'Task overdue: "Kokani Rishtey frontend tes..."', desc: 'Deadline was Jun 23, 2026.', time: '2 days ago', read: false },
    { id: 4, title: 'Task overdue: "ARTWORK"', desc: 'Deadline was Jun 23, 2026.', time: '2 days ago', read: false },
    { id: 5, title: 'Task overdue: "SCRIPTING OF REELS"', desc: 'Deadline was Jun 23, 2026.', time: '2 days ago', read: false },
  ]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteAllNotifications = () => {
    setNotifications([]);
  };

  // Dynamic user data
  const userName = user?.name || 'AWAB FAKIH1';
  const userRole = user?.role?.name || user?.role || 'Admin';
  const userEmail = user?.email || 'tiwariv31@proton.me';
  const initials = userName.substring(0, 3).toUpperCase();

  const allRead = notifications.length === 0 || notifications.every(n => n.read);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View className={`flex-row items-center justify-between border-b px-4 pt-12 pb-3 ${isDarkMode ? 'bg-[#131313] border-[#ffffff1a]' : 'bg-white border-gray-200'}`}>
      
      {/* Left Section: Menu & Title */}
      <View className="flex-row items-center flex-1">
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} className="mr-4 p-1">
          <Menu color={isDarkMode ? "#adc6ff" : "#2573e6"} size={24} />
        </TouchableOpacity>
        <Text 
          className={`font-bold text-lg tracking-widest uppercase flex-shrink ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>

      {/* Right Section: Actions */}
      <View className="flex-row items-center z-50">
        
        {/* Branch Selector */}
        <TouchableOpacity 
          onPress={() => setActiveModal('branch')}
          className={`flex-row items-center border px-2 py-1.5 rounded mr-3 ${isDarkMode ? 'bg-[#1c1b1b] border-[#ffffff1a]' : 'bg-gray-100 border-gray-300'}`}
        >
          <Building color={isDarkMode ? "#888" : "#555"} size={14} className="mr-1.5" />
          <ChevronDown color={isDarkMode ? "#888" : "#555"} size={12} />
        </TouchableOpacity>

        {/* Theme Toggle */}
        <TouchableOpacity onPress={toggleTheme} className="mr-3 p-1">
          {isDarkMode ? (
            <Sun color="#888" size={20} />
          ) : (
            <Moon color="#555" size={20} />
          )}
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity onPress={() => setActiveModal('notification')} className="mr-4 relative p-1">
          <Bell color={isDarkMode ? "#888" : "#555"} size={20} />
          {unreadCount > 0 && (
            <View className="absolute -top-0.5 -right-1.5 bg-[#2573e6] px-1 py-0.5 rounded-full items-center justify-center">
              <Text className="text-white text-[8px] font-bold">{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity onPress={() => setActiveModal('profile')} className={`h-8 w-8 rounded-full items-center justify-center border ${isDarkMode ? 'bg-white border-[#ffffff1a]' : 'bg-[#e2e8f0] border-gray-300'}`}>
           <Text className={`text-[9px] font-bold uppercase text-center leading-3 ${isDarkMode ? 'text-black' : 'text-[#333]'}`}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      
      {/* 1. Branch Modal */}
      <Modal visible={activeModal === 'branch'} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View className="flex-1 bg-[#00000020]">
            <TouchableWithoutFeedback>
              <View className={`absolute top-24 right-20 w-56 rounded-md shadow-lg border ${isDarkMode ? 'bg-[#1c1b1b] border-[#333]' : 'bg-white border-gray-200'}`}>
                <Text className={`px-4 py-3 text-xs font-bold tracking-wider border-b ${isDarkMode ? 'text-[#888] border-[#333]' : 'text-gray-500 border-gray-100'}`}>SWITCH BRANCH</Text>
                {branches.map((b) => (
                  <TouchableOpacity 
                    key={b.id} 
                    onPress={() => { setSelectedBranch(b.name); setActiveModal(null); }}
                    className={`flex-row items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-50'}`}
                  >
                    <View>
                      <Text className={`text-sm font-semibold ${selectedBranch === b.name ? (isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]') : (isDarkMode ? 'text-white' : 'text-gray-800')}`}>{b.name}</Text>
                      {b.code && <Text className="text-[10px] text-gray-500 mt-0.5">{b.code}</Text>}
                    </View>
                    {selectedBranch === b.name && <Check color={isDarkMode ? "#adc6ff" : "#2573e6"} size={16} />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. Notification Modal */}
      <Modal visible={activeModal === 'notification'} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View className="flex-1 bg-[#00000020]">
            <TouchableWithoutFeedback>
              <View className={`absolute top-24 right-4 w-80 rounded-md shadow-lg border ${isDarkMode ? 'bg-[#1c1b1b] border-[#333]' : 'bg-white border-gray-200'}`}>
                <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                  <View className="flex-row items-center">
                    <Bell color={isDarkMode ? "#ccc" : "#333"} size={14} className="mr-2" />
                    <Text className={`text-xs font-bold tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>NOTIFICATIONS</Text>
                    {notifications.length > 0 && (
                      <View className="bg-[#2573e6] px-1.5 py-0.5 rounded-full ml-2">
                        <Text className="text-white text-[10px] font-bold">{notifications.length}</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={markAllAsRead} disabled={allRead}>
                      <Check color={isDarkMode ? (allRead ? "#444" : "#888") : (allRead ? "#ccc" : "#555")} size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deleteAllNotifications}>
                      <Trash2 color={isDarkMode ? "#888" : "#555"} size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                      <X color={isDarkMode ? "#888" : "#555"} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView style={{ maxHeight: 350 }}>
                  {notifications.map((n) => (
                    <TouchableOpacity key={n.id} className={`flex-row px-4 py-3 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-100'}`}>
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-blue-50'}`}>
                         <ListFilter color={isDarkMode ? (n.read ? '#555' : '#adc6ff') : (n.read ? '#aaa' : '#2573e6')} size={14} />
                      </View>
                      <View className="flex-1">
                        <Text className={`text-sm font-semibold mb-1 ${isDarkMode ? (n.read ? 'text-[#888]' : 'text-white') : (n.read ? 'text-gray-500' : 'text-gray-800')}`}>{n.title}</Text>
                        <Text className={`text-xs mb-1 ${isDarkMode ? (n.read ? 'text-[#555]' : 'text-gray-400') : (n.read ? 'text-gray-400' : 'text-gray-500')}`}>{n.desc}</Text>
                        <Text className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{n.time}</Text>
                      </View>
                      {!n.read && <View className="w-2 h-2 rounded-full bg-[#2573e6] mt-1.5" />}
                    </TouchableOpacity>
                  ))}
                  {notifications.length === 0 && (
                     <View className="p-4 items-center justify-center">
                        <Text className={`text-sm ${isDarkMode ? 'text-[#888]' : 'text-gray-500'}`}>No notifications</Text>
                     </View>
                  )}
                </ScrollView>
                <TouchableOpacity 
                  onPress={() => { setActiveModal(null); navigation.navigate('Notifications'); }}
                  className={`py-3 border-t items-center ${isDarkMode ? 'border-[#333]' : 'border-gray-200'}`}
                >
                  <Text className={`text-xs font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>VIEW ALL NOTIFICATIONS</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 3. Profile Modal */}
      <Modal visible={activeModal === 'profile'} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View className="flex-1 bg-[#00000020]">
            <TouchableWithoutFeedback>
              <View className={`absolute top-24 right-4 w-64 rounded-xl shadow-lg border ${isDarkMode ? 'bg-[#1c1b1b] border-[#333]' : 'bg-white border-gray-200'}`}>
                <View className={`p-4 border-b ${isDarkMode ? 'bg-[#131313] border-[#333] rounded-t-xl' : 'bg-[#ebf3fc] border-gray-200 rounded-t-xl'}`}>
                  <View className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${isDarkMode ? 'bg-white' : 'bg-white shadow-sm'}`}>
                    <Text className={`text-sm font-bold uppercase ${isDarkMode ? 'text-black' : 'text-black'}`}>{initials}</Text>
                  </View>
                  <Text className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userName}</Text>
                  <View className="flex-row items-center mt-1">
                    <User color="#2573e6" size={12} className="mr-1.5" />
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{userRole}</Text>
                  </View>
                  <View className="flex-row items-center mt-1.5">
                    <Mail color={isDarkMode ? "#888" : "#555"} size={12} className="mr-1.5" />
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{userEmail}</Text>
                  </View>
                </View>
                <View className="py-2">
                  <TouchableOpacity className="flex-row items-center px-4 py-2.5">
                    <User color={isDarkMode ? "#888" : "#555"} size={16} className="mr-3" />
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>My Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center px-4 py-2.5">
                    <SettingsIcon color={isDarkMode ? "#888" : "#555"} size={16} className="mr-3" />
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Settings</Text>
                  </TouchableOpacity>
                </View>
                <View className={`border-t ${isDarkMode ? 'border-[#333]' : 'border-gray-200'} py-2`}>
                  <TouchableOpacity onPress={() => { setActiveModal(null); logout(); }} className="flex-row items-center px-4 py-2.5">
                    <LogOut color="#ef4444" size={16} className="mr-3" />
                    <Text className="text-sm font-medium text-[#ef4444]">Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}
