import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', style, ...props }) {
  const baseClasses = "py-3 px-4 rounded items-center justify-center";
  const variantClasses = {
    primary: "bg-primary",
    outline: "bg-transparent border border-outline",
    ghost: "bg-transparent",
  };
  
  const textClasses = {
    primary: "text-on-primary font-bold",
    outline: "text-foreground font-bold",
    ghost: "text-foreground font-bold",
  };

  return (
    <TouchableOpacity 
      className={`${baseClasses} ${variantClasses[variant]} ${style || ''}`}
      onPress={onPress}
      {...props}
    >
      <Text className={textClasses[variant]}>{title}</Text>
    </TouchableOpacity>
  );
}
