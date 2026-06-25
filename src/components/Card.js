import React from 'react';
import { View } from 'react-native';

export default function Card({ children, style, ...props }) {
  // Using Tailwind to mimic the video-shadow from globals.css
  // Note: True layered shadows often require custom styling in RN, but we use elevation and shadow props here
  return (
    <View 
      className={`bg-surface-low rounded-xl p-4 shadow-sm border border-outline ${style || ''}`}
      style={{
        shadowColor: '#020617', // tailwind slate-950
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}
      {...props}
    >
      {children}
    </View>
  );
}
