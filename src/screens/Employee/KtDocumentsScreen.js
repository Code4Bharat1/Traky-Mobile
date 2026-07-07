import React from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '../../store/themeStore';

export default function PlaceholderScreen({ route }) {
  const { isDarkMode } = useThemeStore();
  
  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#c2c6d6]' : 'text-gray-500';

  return (
    <View className={`flex-1 items-center justify-center ${bgScreen}`}>
      <Text className={`${textColor} text-xl font-bold tracking-widest`}>{route.name.toUpperCase()}</Text>
      <Text className={`${textMuted} mt-2 text-sm`}>Module coming soon...</Text>
    </View>
  );
}
