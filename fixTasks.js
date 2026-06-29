const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'Admin', 'TasksScreen.js');
let content = fs.readFileSync(file, 'utf8');

// Update formData initial state
content = content.replace(
  /const \[formData, setFormData\] = useState\(\{ title: '', description: '', points: '0', priority: 'MEDIUM', projectId: '', assigneeIds: \[\] \}\);/,
  `const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'IN_PROGRESS', projectId: '', assigneeIds: [], proofRequired: false, startTime: null, endTime: null });
  const [employeeSearch, setEmployeeSearch] = useState('');`
);

// Update openAddModal
content = content.replace(
  /const openAddModal = \(\) => \{[\s\S]*?setAddModalVisible\(true\);\n  \};/,
  `const openAddModal = () => {
    setFormData({ title: '', description: '', priority: 'MEDIUM', status: 'IN_PROGRESS', projectId: '', assigneeIds: [], proofRequired: false, startTime: null, endTime: null });
    setAddModalVisible(true);
  };`
);

// Update handleSave to include new fields
content = content.replace(
  /const payload = \{ \.\.\.formData, points: Number\(formData\.points\) \};/,
  `const payload = { 
        ...formData, 
        contributors: formData.assigneeIds,
        proofRequired: formData.proofRequired
      };
      // Format dates if available
      if (formData.startTime) payload.startTime = formData.startTime.toISOString();
      if (formData.endTime) payload.endTime = formData.endTime.toISOString();
      if (!payload.projectId) delete payload.projectId;`
);

// Update fetchData to fetch all tasks page by page
content = content.replace(
  /const \[taskRes, projRes, depRes, userRes\] = await Promise\.all\(\[[\s\S]*?\]\);\n\s*setTasks\(taskRes\.data\.data \|\| taskRes\.data \|\| \[\]\);/,
  `const [projRes, depRes, userRes] = await Promise.all([
        client.get('/projects?limit=500'),
        client.get('/departments?limit=100'),
        client.get('/users?limit=500')
      ]);
      
      let allTasks = [];
      let page = 1;
      while (true) {
        try {
          const res = await client.get(\`/tasks?limit=100&page=\${page}\`);
          const batch = res.data.data || res.data || [];
          allTasks = allTasks.concat(batch);
          if (!res.data.pagination || page >= res.data.pagination.pages) break;
          page++;
        } catch (e) {
          break;
        }
      }
      setTasks(allTasks);`
);

// Completely replace renderAddModal
const oldRenderAddModalMatch = content.match(/const renderAddModal = \(\) => \([\s\S]*?\n  \);/);
if (oldRenderAddModalMatch) {
  const newRenderAddModal = `const renderAddModal = () => (
    <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className={\`border rounded-lg p-6 w-full max-h-[90%] \${bgCard} \${borderColor}\`}>
            <View className="flex-row justify-between items-center mb-6 border-b pb-4 \${borderColor}">
               <Text className={\`text-sm font-bold tracking-widest uppercase \${textColor}\`}>Assign New Task</Text>
               <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Task Title</Text>
               <View className={\`border rounded p-3 mb-4 \${bgInputAlt} \${borderColor}\`}>
                  <TextInput 
                    value={formData.title} 
                    onChangeText={v => setFormData({...formData, title: v})} 
                    placeholder="e.g. Implement Login API" 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    className={\`text-xs \${textColor}\`} 
                  />
               </View>

               <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Project</Text>
               <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className={\`border rounded p-3 mb-4 flex-row justify-between items-center \${bgInputAlt} \${borderColor}\`}>
                  <Text className={formData.projectId ? \`text-xs \${textColor}\` : \`text-xs \${textMuted}\`}>
                    {formData.projectId ? projects.find(p => p._id === formData.projectId)?.name || projects.find(p => p._id === formData.projectId)?.projectName || 'Unknown' : 'None / No Project'}
                  </Text>
                  <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
               </TouchableOpacity>

               <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Description</Text>
               <View className={\`border rounded p-3 mb-4 \${bgInputAlt} \${borderColor}\`}>
                  <TextInput 
                    value={formData.description} 
                    onChangeText={v => setFormData({...formData, description: v})} 
                    placeholder="Details about the task..." 
                    placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                    multiline numberOfLines={3}
                    className={\`text-xs min-h-[60px] \${textColor}\`} 
                    textAlignVertical="top"
                  />
               </View>

               <Text className={\`text-[10px] font-bold mb-2 uppercase tracking-widest \${textMuted}\`}>Assign Employees</Text>
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
                        {users.filter(u => u.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(u => {
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
                  <Text className={\`text-xs \${textColor}\`}>Select start and end date/time</Text>
               </TouchableOpacity>

            </ScrollView>

            <View className="flex-row justify-between pt-4 mt-2 border-t border-[#333]">
               <TouchableOpacity onPress={() => setAddModalVisible(false)} className={\`flex-1 mr-2 py-3 border rounded items-center \${borderColor} \${bgInputAlt}\`}>
                  <Text className={\`font-bold text-xs uppercase tracking-widest \${textColor}\`}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={handleSave} disabled={saving} className={\`flex-1 ml-2 py-3 rounded items-center flex-row justify-center \${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}\`}>
                  {saving ? <ActivityIndicator size="small" color={isDarkMode ? "#131313" : "#ffffff"} /> : (
                     <>
                        <Check size={14} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
                        <Text className={\`font-bold text-xs uppercase tracking-widest \${isDarkMode ? 'text-[#131313]' : 'text-white'}\`}>Assign Task</Text>
                     </>
                  )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );`;
  content = content.replace(oldRenderAddModalMatch[0], newRenderAddModal);
}

// Ensure the dropdown handles the new fields addPriority and addStatus
const getDropdownOptionsMatch = content.match(/const getDropdownOptions = \(\) => \{[\s\S]*?return \[\];\n  \};/);
if (getDropdownOptionsMatch) {
  const newGetDropdownOptions = `const getDropdownOptions = () => {
    if (dropdownType === 'project') return [{_id: '', name: 'None / No Project'}, ...projects.map(p => ({_id: p._id, name: p.name || p.projectName}))];
    if (dropdownType === 'filterStatus') return [
      {_id: 'ALL', name: 'All Statuses'}, {_id: 'PENDING', name: 'Pending'}, {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'IN_REVIEW', name: 'In Review'}, {_id: 'COMPLETED', name: 'Completed'}, {_id: 'REJECTED', name: 'Rejected'}
    ];
    if (dropdownType === 'filterDept') return [{_id: 'ALL', name: 'All Depts'}, ...departments.map(d => ({_id: d._id, name: d.departmentName}))];
    if (dropdownType === 'addPriority') return [{_id: 'LOW', name: 'Low'}, {_id: 'MEDIUM', name: 'Medium'}, {_id: 'HIGH', name: 'High'}];
    if (dropdownType === 'addStatus') return [{_id: 'TODO', name: 'Todo'}, {_id: 'IN_PROGRESS', name: 'In Progress'}, {_id: 'DONE', name: 'Done'}];
    return [];
  };`;
  content = content.replace(getDropdownOptionsMatch[0], newGetDropdownOptions);
}

const selectDropdownItemMatch = content.match(/const selectDropdownItem = \(item\) => \{[\s\S]*?setDropdownVisible\(false\);\n  \};/);
if (selectDropdownItemMatch) {
  const newSelectDropdownItem = `const selectDropdownItem = (item) => {
    if (dropdownType === 'project') setFormData({...formData, projectId: item._id});
    if (dropdownType === 'filterStatus') setFilterStatus(item._id);
    if (dropdownType === 'filterDept') setFilterDept(item._id);
    if (dropdownType === 'addPriority') setFormData({...formData, priority: item._id});
    if (dropdownType === 'addStatus') setFormData({...formData, status: item._id});
    setDropdownVisible(false);
  };`;
  content = content.replace(selectDropdownItemMatch[0], newSelectDropdownItem);
}

fs.writeFileSync(file, content);
console.log('TasksScreen fixed!');
