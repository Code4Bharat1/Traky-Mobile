const fs = require('fs');
const path = 'c:/Users/DELL/OneDrive/Desktop/traky/Task-Tracker-Mobile-VB/src/screens/Employee/TasksScreen.js';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

const selectDateIndex = lines.findIndex(l => l.includes('Select start and end date/time'));

console.log('Found select date at:', selectDateIndex);

if (selectDateIndex !== -1) {
  const block = `                 </View>
               </View>

               <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>
                 Assign Employees {formData.projectId ? '(Project Members)' : '(Your Department)'}
               </Text>
               <View className={\`border rounded mb-4 \${bgInputAlt} \${borderColor}\`}>
                  <View className={\`flex-row items-center p-3 border-b \${borderColor}\`}>
                     <Search size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
                     <TextInput 
                        value={employeeSearch}
                        onChangeText={setEmployeeSearch}
                        placeholder="Search users..."
                        placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
                        className={\`flex-1 text-xs \${textColor}\`}
                     />
                  </View>
                  <View className="max-h-40">
                     <ScrollView nestedScrollEnabled>
                        {getFilteredUsers().map(u => {
                           const isSelected = formData.assigneeIds.includes(u._id);
                           return (
                              <TouchableOpacity 
                                 key={u._id} 
                                 onPress={() => {
                                    if (isSelected) setFormData({...formData, assigneeIds: formData.assigneeIds.filter(id => id !== u._id)});
                                    else setFormData({...formData, assigneeIds: [...formData.assigneeIds, u._id]});
                                 }}
                                 className={\`flex-row items-center justify-between p-3 border-b \${borderColor}\`}
                              >
                                 <View>
                                    <Text className={\`text-xs font-bold \${textColor}\`}>{u.name}</Text>
                                    <Text className={\`text-[9px] tracking-widest uppercase mt-0.5 \${textMuted}\`}>{u.role?.name || u.role || 'EMPLOYEE'}</Text>
                                 </View>
                                 <View className={\`w-4 h-4 border rounded items-center justify-center \${isSelected ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : borderColor}\`}>
                                    {isSelected && <Check size={10} color={isDarkMode ? "#131313" : "#ffffff"} />}
                                 </View>
                              </TouchableOpacity>
                           );
                        })}
                     </ScrollView>
                  </View>
               </View>

               <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                   <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Priority</Text>
                   <TouchableOpacity onPress={() => { setDropdownType('addPriority'); setDropdownVisible(true); }} className={\`border rounded p-3 flex-row justify-between items-center \${bgInputAlt} \${borderColor}\`}>
                      <Text className={\`text-xs \${textColor}\`}>{formData.priority.charAt(0) + formData.priority.slice(1).toLowerCase()}</Text>
                      <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                   </TouchableOpacity>
                 </View>
                 <View className="flex-1 ml-2">
                   <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Status</Text>
                   <TouchableOpacity onPress={() => { setDropdownType('addStatus'); setDropdownVisible(true); }} className={\`border rounded p-3 flex-row justify-between items-center \${bgInputAlt} \${borderColor}\`}>
                      <Text className={\`text-xs \${textColor}\`}>{formData.status.replace('_', ' ')}</Text>
                      <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
                   </TouchableOpacity>
                 </View>
               </View>

               <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Proof Required</Text>
               <View className="flex-row mb-4">
                  <TouchableOpacity onPress={() => setFormData({...formData, proofRequired: true})} className={\`flex-1 py-3 border rounded-l \${formData.proofRequired ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : (bgInputAlt + ' ' + borderColor)}\`}>
                     <Text className={\`text-[10px] text-center font-bold tracking-widest uppercase \${formData.proofRequired ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}\`}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setFormData({...formData, proofRequired: false})} className={\`flex-1 py-3 border border-l-0 rounded-r \${!formData.proofRequired ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-[#2573e6] border-[#2573e6]') : (bgInputAlt + ' ' + borderColor)}\`}>
                     <Text className={\`text-[10px] text-center font-bold tracking-widest uppercase \${!formData.proofRequired ? (isDarkMode ? 'text-[#131313]' : 'text-white') : textColor}\`}>No</Text>
                  </TouchableOpacity>
               </View>

               <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Start - End</Text>
               <TouchableOpacity onPress={() => setShowDatePicker(true)} className={\`border rounded p-3 mb-6 flex-row items-center \${bgInputAlt} \${borderColor}\`}>
                  <Calendar size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
                  <Text className={\`text-xs \${textColor}\`}>Select start and end date/time</Text>`;
                  
  const blockLines = block.split('\\n');
  
  // We want to replace line 648 (the empty line) and line 649 (Select start and end date/time)
  // Which corresponds to index: selectDateIndex - 1 and selectDateIndex
  lines.splice(selectDateIndex - 1, 2, ...blockLines);
  
  fs.writeFileSync(path, lines.join('\\n'), 'utf8');
  console.log('Successfully spliced the file!');
} else {
  console.log('Could not find the indices.');
}
