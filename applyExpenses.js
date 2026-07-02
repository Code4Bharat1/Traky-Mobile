const fs = require('fs');
const file = 'c:/Users/DELL/OneDrive/Desktop/traky/Task-Tracker-Mobile-VB/src/screens/Employee/ExpensesScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
if (!content.includes('expo-document-picker')) {
    content = content.replace("import DateTimePicker from '@react-native-community/datetimepicker';", "import DateTimePicker from '@react-native-community/datetimepicker';\nimport * as DocumentPicker from 'expo-document-picker';");
}
if (!content.includes('Paperclip')) {
    content = content.replace('Calendar }', 'Calendar, Paperclip }');
}

// 2. Extend formData state
const stateFind = "paymentMethod: 'cash',\n  });";
const stateRepl = "paymentMethod: '',\n    attachment: null,\n  });";
content = content.replace(stateFind, stateRepl);

const openFind = "paymentMethod: 'cash',\n    });\n    setAddModalVisible(true);";
const openRepl = "paymentMethod: '',\n      attachment: null,\n    });\n    setAddModalVisible(true);";
content = content.replace(openFind, openRepl);

// 3. Add pickDocument
const pickDocCode = `
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
`;
if (!content.includes('pickDocument')) {
    content = content.replace("const handleSave = async () => {", pickDocCode + "\n  const handleSave = async () => {");
}

// 4. Update handleSave
const handleSaveFind = "const payload = {\n        title: formData.title,\n        category: formData.category,\n        amount: Number(formData.amount),\n        expenseDate: formData.expenseDate.toISOString(),\n        description: formData.description,\n        paymentMethod: formData.paymentMethod,\n      };\n\n      await client.post('/expenses', payload);";
const handleSaveRepl = `const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('category', formData.category);
      payload.append('amount', formData.amount);
      payload.append('expenseDate', formData.expenseDate.toISOString());
      payload.append('description', formData.description);
      payload.append('paymentMethod', formData.paymentMethod);
      if (formData.attachment) {
        payload.append('attachment', {
          uri: formData.attachment.uri,
          name: formData.attachment.name,
          type: formData.attachment.mimeType || 'application/octet-stream',
        });
      }

      await client.post('/expenses', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });`;
if (content.includes("const payload = {\n        title: formData.title,")) {
    content = content.replace(handleSaveFind, handleSaveRepl);
}

// 5. Replace Modal UI
const modalStart = "<ScrollView showsVerticalScrollIndicator={false}>";
const modalEnd = "</ScrollView>";
const oldModalContent = content.substring(content.indexOf(modalStart), content.indexOf(modalEnd) + modalEnd.length);

const newModalContent = `<ScrollView showsVerticalScrollIndicator={false}>
              <Text className={\`text-xs font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Expense Title *</Text>
              <TextInput
                className={\`border p-3 rounded mb-4 text-sm \${bgInput} \${borderColor} \${textColor}\`}
                placeholder="e.g. Client Meeting Dinner"
                placeholderTextColor={isDarkMode ? "#555" : "#999"}
                value={formData.title}
                onChangeText={t => setFormData({...formData, title: t})}
              />

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2 relative">
                    <Text className={\`text-xs font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Category *</Text>
                    <TouchableOpacity 
                      className={\`border p-3 rounded flex-row justify-between items-center \${bgInput} \${borderColor}\`}
                      onPress={() => setDropdownVisible(!dropdownVisible)}
                    >
                      <Text className={textColor}>{formData.category}</Text>
                      <ChevronDown size={16} color={isDarkMode ? "#888" : "#ccc"} />
                    </TouchableOpacity>
                    {dropdownVisible && (
                      <View className={\`absolute top-16 left-0 right-0 z-50 border rounded max-h-40 \${bgInput} \${borderColor}\`}>
                        <ScrollView nestedScrollEnabled>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <TouchableOpacity 
                              key={cat} 
                              className={\`p-3 border-b \${borderColor}\`}
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
                    <Text className={\`text-xs font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Amount *</Text>
                    <TextInput
                      className={\`border p-3 rounded text-sm \${bgInput} \${borderColor} \${textColor}\`}
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
                    <Text className={\`text-xs font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Expense Date *</Text>
                    <TouchableOpacity onPress={() => setShowPicker(true)} className={\`border p-3 rounded flex-row items-center justify-between \${bgInput} \${borderColor}\`}>
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
                    <Text className={\`text-xs font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Payment Method</Text>
                    <TextInput
                      className={\`border p-3 rounded text-sm \${bgInput} \${borderColor} \${textColor}\`}
                      placeholder="e.g. Corporate Card, Cash"
                      placeholderTextColor={isDarkMode ? "#555" : "#999"}
                      value={formData.paymentMethod}
                      onChangeText={t => setFormData({...formData, paymentMethod: t})}
                    />
                 </View>
              </View>

              <Text className={\`text-xs font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Reason / Description *</Text>
              <TextInput
                className={\`border p-3 rounded mb-4 text-sm \${bgInput} \${borderColor} \${textColor}\`}
                placeholder="Briefly explain the purpose of this expense..."
                placeholderTextColor={isDarkMode ? "#555" : "#999"}
                value={formData.description}
                onChangeText={t => setFormData({...formData, description: t})}
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: 'top' }}
              />

              <Text className={\`text-xs font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Receipt / Bill (Optional)</Text>
              <TouchableOpacity onPress={pickDocument} className={\`border border-dashed p-4 rounded mb-8 flex-row items-center justify-center \${borderColor}\`}>
                 <Paperclip size={16} color={isDarkMode ? '#888' : '#9ca3af'} className="mr-2" />
                 <Text className={\`text-sm \${textMuted}\`}>
                    {formData.attachment ? formData.attachment.name : 'Upload receipt image or document'}
                 </Text>
              </TouchableOpacity>

              <View className={\`flex-row justify-end pt-4 border-t \${borderColor}\`}>
                 <TouchableOpacity onPress={() => setAddModalVisible(false)} className="mr-4 py-3 px-4">
                    <Text className={\`font-bold text-sm uppercase \${textColor}\`}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={handleSave} 
                   disabled={saving}
                   className={\`px-6 py-3 rounded flex-row items-center justify-center \${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'} \${saving ? 'opacity-50' : ''}\`}
                 >
                   {saving ? <ActivityIndicator size="small" color={isDarkMode ? '#131313' : '#fff'} /> : (
                     <Text className={\`font-bold tracking-widest uppercase \${isDarkMode ? 'text-[#131313]' : 'text-white'}\`}>Submit Request</Text>
                   )}
                 </TouchableOpacity>
              </View>
            </ScrollView>`;

content = content.replace(oldModalContent, newModalContent);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched ExpensesScreen.js');
