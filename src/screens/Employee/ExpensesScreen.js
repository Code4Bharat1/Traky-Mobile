import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { getMyExpenses, submitExpense } from '../../api/services';
import { CreditCard, Plus, X, ChevronDown, CheckCircle, Calendar, Paperclip } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';

const EXPENSE_CATEGORIES = [
  'Travel', 'Meals', 'Office Supplies', 'Internet', 'Training', 'Other'
];

export default function ExpensesScreen() {
  const { isDarkMode } = useThemeStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Travel',
    amount: '',
    expenseDate: new Date(),
    description: '',
    paymentMethod: 'cash',
  });

  const fetchExpenses = async () => {
    try {
      const response = await client.get('/expenses/my');
      setExpenses(response.data.records || response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openAddModal = () => {
    setFormData({
      title: '',
      category: 'Travel',
      amount: '',
      expenseDate: new Date(),
      description: '',
      paymentMethod: 'cash',
    });
    setAddModalVisible(true);
  };

  
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, attachment: result.assets[0] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate.toISOString(),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
      };

      await client.post('/expenses', payload);
      setAddModalVisible(false);
      fetchExpenses();
      Alert.alert('Success', 'Expense request submitted successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit expense');
    } finally {
      setSaving(false);
    }
  };

  const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

  const filteredExpenses = expenses.filter(expense => {
    if (activeTab === 'ALL') return true;
    return expense.status?.toUpperCase() === activeTab;
  });

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';

  const renderItem = ({ item }) => (
    <View className={`rounded-lg p-4 mb-3 border ${bgCard} ${borderColor}`}>
      <View className="flex-row justify-between mb-2">
        <Text className={`font-bold ${textColor}`}>{item.title}</Text>
        <Text className={`font-bold ${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}`}>₹{item.amount}</Text>
      </View>
      <View className="flex-row justify-between mb-2">
        <Text className={`text-xs ${isDarkMode ? 'text-[#6b7280]' : 'text-gray-500'}`}>{item.category} • {new Date(item.expenseDate).toLocaleDateString()}</Text>
        <Text className={`text-xs font-bold ${
          item.status === 'approved' ? 'text-[#10b981]' : 
          item.status === 'rejected' ? 'text-[#ef4444]' : 
          'text-[#f59e0b]'
        }`}>
          {item.status?.toUpperCase() || 'PENDING'}
        </Text>
      </View>
      {item.description && (
        <Text className={`text-xs ${textMuted} mt-1`} numberOfLines={2}>{item.description}</Text>
      )}
    </View>
  );

  if (loading && expenses.length === 0) {
    return (
      <View className={`flex-1 items-center justify-center ${bgScreen}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} />
      </View>
    );
  }

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <View className="flex-1 mr-3">
          <Text className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${textMuted}`}>EMPLOYEE / EXPENSES</Text>
          <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>My Expenses</Text>
        </View>
        <TouchableOpacity onPress={() => openAddModal()} className={`flex-row items-center px-3 py-2 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
          <Plus size={16} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
          <Text className={`font-bold text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>ADD EXPENSE</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap mb-4">
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-2 mb-2 px-4 py-1.5 rounded-full border ${activeTab === tab ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : `${bgCard} ${borderColor}`}`}
          >
            <Text className={`text-[10px] font-bold tracking-widest ${activeTab === tab ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredExpenses.length === 0 ? (
        <View className={`border rounded-lg py-12 px-4 items-center justify-center mt-2 flex-1 max-h-[300px] ${isDarkMode ? 'bg-[#161616]' : 'bg-gray-100'} ${borderColor}`}>
          <CreditCard size={48} color={isDarkMode ? "#444" : "#ccc"} className="mb-4" />
          <Text className={`font-bold text-base mb-1 ${textColor}`}>No expenses found</Text>
          <Text className={`text-xs mb-6 text-center ${textMuted}`}>
            {activeTab === 'ALL' 
              ? "You haven't submitted any expense requests yet."
              : `There are no ${activeTab.toLowerCase()} expense requests.`}
          </Text>
          <TouchableOpacity onPress={() => openAddModal()} className={`px-6 py-3 rounded ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
             <Text className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Add Expense Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList 
          data={filteredExpenses}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Expense Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center bg-black/50 p-4">
          <View className={`p-6 rounded-lg ${bgCard} border ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-lg font-bold tracking-widest uppercase ${textColor}`}>New Expense</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X color={isDarkMode ? "#fff" : "#000"} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={`text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Expense Title *</Text>
              <TextInput
                className={`border p-3 rounded mb-4 text-sm ${bgInput} ${borderColor} ${textColor}`}
                placeholder="e.g. Client Meeting Dinner"
                placeholderTextColor={isDarkMode ? "#555" : "#999"}
                value={formData.title}
                onChangeText={t => setFormData({...formData, title: t})}
              />

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2 relative">
                    <Text className={`text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Category *</Text>
                    <TouchableOpacity 
                      className={`border p-3 rounded flex-row justify-between items-center ${bgInput} ${borderColor}`}
                      onPress={() => setDropdownVisible(!dropdownVisible)}
                    >
                      <Text className={textColor}>{formData.category}</Text>
                      <ChevronDown size={16} color={isDarkMode ? "#888" : "#ccc"} />
                    </TouchableOpacity>
                    {dropdownVisible && (
                      <View className={`absolute top-16 left-0 right-0 z-50 border rounded max-h-40 ${bgInput} ${borderColor}`}>
                        <ScrollView nestedScrollEnabled>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <TouchableOpacity 
                              key={cat} 
                              className={`p-3 border-b ${borderColor}`}
                              onPress={() => {
                                setFormData({...formData, category: cat});
                                setDropdownVisible(false);
                              }}
                            >
                              <Text className={textColor}>{cat}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className={`text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Amount *</Text>
                    <TextInput
                      className={`border p-3 rounded text-sm ${bgInput} ${borderColor} ${textColor}`}
                      placeholder="0.00"
                      placeholderTextColor={isDarkMode ? "#555" : "#999"}
                      keyboardType="numeric"
                      value={formData.amount}
                      onChangeText={t => setFormData({...formData, amount: t})}
                    />
                 </View>
              </View>

              <View className="flex-row justify-between mb-4 z-10">
                 <View className="flex-1 mr-2">
                    <Text className={`text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Expense Date *</Text>
                    <TouchableOpacity onPress={() => setShowPicker(true)} className={`border p-3 rounded flex-row items-center justify-between ${bgInput} ${borderColor}`}>
                      <Text className={textColor}>{formData.expenseDate.toLocaleDateString()}</Text>
                      <Calendar size={16} color={isDarkMode ? '#888' : '#ccc'} />
                    </TouchableOpacity>
                    {showPicker && (
                      <DateTimePicker
                        value={formData.expenseDate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowPicker(false);
                          if (selectedDate) {
                            setFormData(prev => ({ ...prev, expenseDate: selectedDate }));
                          }
                        }}
                      />
                    )}
                 </View>
                 <View className="flex-1 ml-2">
                    <Text className={`text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Payment Method</Text>
                    <TextInput
                      className={`border p-3 rounded text-sm ${bgInput} ${borderColor} ${textColor}`}
                      placeholder="e.g. Corporate Card, Cash"
                      placeholderTextColor={isDarkMode ? "#555" : "#999"}
                      value={formData.paymentMethod}
                      onChangeText={t => setFormData({...formData, paymentMethod: t})}
                    />
                 </View>
              </View>

              <Text className={`text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Reason / Description *</Text>
              <TextInput
                className={`border p-3 rounded mb-4 text-sm ${bgInput} ${borderColor} ${textColor}`}
                placeholder="Briefly explain the purpose of this expense..."
                placeholderTextColor={isDarkMode ? "#555" : "#999"}
                value={formData.description}
                onChangeText={t => setFormData({...formData, description: t})}
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: 'top' }}
              />

              <Text className={`text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Receipt / Bill (Optional)</Text>
              <TouchableOpacity onPress={pickDocument} className={`border border-dashed p-4 rounded mb-8 flex-row items-center justify-center ${borderColor}`}>
                 <Paperclip size={16} color={isDarkMode ? '#888' : '#9ca3af'} className="mr-2" />
                 <Text className={`text-sm ${textMuted}`}>
                    {formData.attachment ? formData.attachment.name : 'Upload receipt image or document'}
                 </Text>
              </TouchableOpacity>

              <View className={`flex-row justify-end pt-4 border-t ${borderColor}`}>
                 <TouchableOpacity onPress={() => setAddModalVisible(false)} className="mr-4 py-3 px-4">
                    <Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={handleSave} 
                   disabled={saving}
                   className={`px-6 py-3 rounded flex-row items-center justify-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'} ${saving ? 'opacity-50' : ''}`}
                 >
                   {saving ? <ActivityIndicator size="small" color={isDarkMode ? '#131313' : '#fff'} /> : (
                     <Text className={`font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Submit Request</Text>
                   )}
                 </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
