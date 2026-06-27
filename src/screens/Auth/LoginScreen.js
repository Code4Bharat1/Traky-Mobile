import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import useAuthStore from '../../store/authStore';
import { AtSign, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react-native';
import Svg, { Pattern, Circle, Rect, Defs } from 'react-native-svg';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    await login(email, password);
  };

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#131313]">
      {/* SVG Dot Pattern Background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <Circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.18)" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dots)" />
        </Svg>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          
          {/* Header Section */}
          <View className="items-center mb-12">
          <Text className="text-white text-3xl font-bold tracking-[6px] mb-2">TRAKY</Text>
          <Text className="text-[#c2c6d6] text-xs font-medium">Precision Instrument for Global Operations</Text>
        </View>

        {/* Login Card */}
        <View className="w-full bg-[#1c1b1b] rounded-md p-6 border border-[#ffffff1a]">
          
          <Text className="text-white text-2xl font-bold mb-1">Sign In</Text>
          <Text className="text-[#c2c6d6] text-sm mb-8">
            Please enter your credentials to access the platform.
          </Text>

          {error ? (
            <View className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-6">
              <Text className="text-red-400 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-[#c2c6d6] text-[10px] font-bold tracking-widest uppercase mb-2">
              Email Address
            </Text>
            <View className="flex-row items-center bg-[#201f1f] border border-[#ffffff33] rounded h-12 px-4">
              <TextInput 
                className="flex-1 text-white text-sm"
                placeholder="name@company.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AtSign size={16} color="#c2c6d6" />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-8">
            <View className="flex-row justify-between mb-2">
              <Text className="text-[#c2c6d6] text-[10px] font-bold tracking-widest uppercase">
                Password
              </Text>
              <TouchableOpacity>
                <Text className="text-[#adc6ff] text-[10px] font-bold">Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-[#201f1f] border border-[#ffffff33] rounded h-12 px-4">
              <TextInput 
                className="flex-1 text-white text-sm"
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={16} color="#c2c6d6" />
                ) : (
                  <Eye size={16} color="#c2c6d6" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            className="w-full bg-[#adc6ff] h-12 rounded flex-row items-center justify-center opacity-100 disabled:opacity-50 mb-8"
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <ActivityIndicator color="#002e6a" />
            ) : (
              <>
                <Text className="text-[#002e6a] text-sm font-bold mr-2">Secure Sign In</Text>
                <ArrowRight size={16} color="#002e6a" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-[#ffffff1a]" />
            <Text className="text-[#c2c6d6] text-[10px] tracking-widest px-4">OR CONTINUE WITH</Text>
            <View className="flex-1 h-[1px] bg-[#ffffff1a]" />
          </View>

          {/* Alternate Login Options */}
          <TouchableOpacity className="w-full h-12 flex-row items-center justify-center border border-[#ffffff33] rounded mb-3">
            <Mail size={16} color="#e5e7eb" className="mr-2" />
            <Text className="text-[#e5e7eb] text-sm font-semibold">Login via OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-full h-12 flex-row items-center justify-center border border-[#ffffff33] rounded">
            {/* Using text "G" as placeholder for Google icon */}
            <Text className="text-[#ea4335] font-bold text-lg mr-2">G</Text>
            <Text className="text-[#e5e7eb] text-sm font-semibold">Sign-in with Google</Text>
          </TouchableOpacity>

        </View>
        
        {/* Footer */}
        <View className="mt-8 flex-row justify-center items-center flex-wrap">
          <Text className="text-[#c2c6d6] text-[10px] tracking-widest mr-2 uppercase">Authorized Roles:</Text>
          <Text className="text-[#c2c6d6] text-[10px] tracking-widest mx-1">Administrator</Text>
          <Text className="text-[#c2c6d6] text-[10px] tracking-widest mx-1">Dept Head</Text>
          <Text className="text-[#c2c6d6] text-[10px] tracking-widest mx-1">Employee</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}
