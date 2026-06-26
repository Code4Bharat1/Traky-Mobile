import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, Building, Sun, Bell, ChevronDown } from 'lucide-react-native';

export default function AdminHeader({ navigation, title }) {
  return (
    <View className="flex-row items-center justify-between bg-[#131313] border-b border-[#ffffff1a] px-4 pt-12 pb-3">
      {/* Left Section: Menu & Title */}
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} className="mr-4">
          <Menu color="#adc6ff" size={24} />
        </TouchableOpacity>
        <Text className="text-[#adc6ff] font-bold text-lg tracking-widest uppercase">{title}</Text>
      </View>

      {/* Right Section: Actions */}
      <View className="flex-row items-center">
        {/* Branch Selector Mock */}
        <TouchableOpacity className="flex-row items-center bg-[#1c1b1b] border border-[#ffffff1a] px-2 py-1.5 rounded mr-3">
          <Building color="#888" size={14} className="mr-1.5" />
          <ChevronDown color="#888" size={12} />
        </TouchableOpacity>

        {/* Theme Toggle Mock */}
        <TouchableOpacity className="mr-3">
          <Sun color="#888" size={20} />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity className="mr-4 relative">
          <Bell color="#888" size={20} />
          <View className="absolute -top-1.5 -right-2 bg-[#adc6ff] px-1 py-0.5 rounded-full items-center justify-center">
            <Text className="text-[#131313] text-[8px] font-bold">99+</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Mock */}
        <TouchableOpacity className="h-8 w-8 rounded-full bg-white items-center justify-center border border-[#ffffff1a]">
           <Text className="text-black text-[8px] font-bold uppercase text-center leading-3">NEX</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
