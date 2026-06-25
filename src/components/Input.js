import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default function Input({ label, error, style, ...props }) {
  return (
    <View className={`w-full mb-4 ${style || ''}`}>
      {label && <Text className="text-sm font-semibold text-foreground mb-1">{label}</Text>}
      <TextInput
        className="w-full bg-surface-highest border border-outline py-3 px-4 rounded text-foreground placeholder:text-foreground-muted"
        placeholderTextColor="#1f2937"
        {...props}
      />
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
