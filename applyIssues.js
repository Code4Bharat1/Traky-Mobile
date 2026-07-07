const fs = require('fs');
const file = 'c:/Users/DELL/OneDrive/Desktop/traky/Task-Tracker-Mobile-VB/src/screens/Employee/IssuesScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!content.includes('DateTimePicker')) {
    content = content.replace("import useAuthStore from '../../store/authStore';", "import useAuthStore from '../../store/authStore';\nimport DateTimePicker from '@react-native-community/datetimepicker';");
}
if (!content.includes('CalendarDays')) {
    content = content.replace('Calendar,', 'Calendar, CalendarDays,'); // If Calendar exists
    if (!content.includes('CalendarDays')) {
        content = content.replace('Search, Bug, User }', 'Search, Bug, User, CalendarDays }');
    }
}

// 2. State
const stateFind = "const [formData, setFormData] = useState({ title: '', description: '', severity: 'MEDIUM', projectId: '' });";
const stateRepl = "const [formData, setFormData] = useState({ title: '', description: '', severity: 'MEDIUM', projectId: '', taskId: '', assignedTo: '', startDate: null, endDate: null });\n  const [tasks, setTasks] = useState([]);\n  const [showDatePicker, setShowDatePicker] = useState({ visible: false, mode: 'date', field: '' });";
content = content.replace(stateFind, stateRepl);

// 3. useEffect for tasks
const useEfFind = "useEffect(() => {\n    fetchData();\n  }, []);";
const useEfRepl = "useEffect(() => {\n    fetchData();\n  }, []);\n\n  useEffect(() => {\n    if (formData.projectId) {\n      client.get('/tasks', { params: { projectId: formData.projectId, limit: 100 } }).then(res => setTasks(res.data.data || res.data || [])).catch(() => setTasks([]));\n    } else {\n      setTasks([]);\n    }\n  }, [formData.projectId]);";
if (!content.includes('client.get(\'/tasks\', { params: { projectId')) {
    content = content.replace(useEfFind, useEfRepl);
}

// 4. Update getDropdownOptions
const getDropFind = "if (dropdownType === 'project') return projects;";
const getDropRepl = "if (dropdownType === 'project') return projects;\n    if (dropdownType === 'task') return [{_id: '', name: 'No task'}, ...tasks];\n    if (dropdownType === 'user') return [{_id: '', name: 'Select employee...'}, ...users];\n    if (dropdownType === 'severityForm') return [\n      {_id: 'LOW', name: 'Low'},\n      {_id: 'MEDIUM', name: 'Medium'},\n      {_id: 'HIGH', name: 'High'},\n      {_id: 'CRITICAL', name: 'Critical'}\n    ];";
if (!content.includes("dropdownType === 'task'")) {
    content = content.replace(getDropFind, getDropRepl);
}

// 5. Update selectDropdownItem
const selDropFind = "if (dropdownType === 'project') setFormData({...formData, projectId: item._id});";
const selDropRepl = "if (dropdownType === 'project') setFormData({...formData, projectId: item._id, taskId: ''});\n    if (dropdownType === 'task') setFormData({...formData, taskId: item._id});\n    if (dropdownType === 'user') setFormData({...formData, assignedTo: item._id});\n    if (dropdownType === 'severityForm') setFormData({...formData, severity: item._id});";
if (!content.includes("dropdownType === 'task'") || !content.includes("taskId: item._id")) {
    content = content.replace(selDropFind, selDropRepl);
}

// 6. Replace Modal Form Fields
// The existing modal has ScrollView with Title, Project, Severity, Description.
const modalSearchStart = "<ScrollView showsVerticalScrollIndicator={false}>";
const modalSearchEnd = "</ScrollView>";
const modalContentOld = content.substring(content.indexOf(modalSearchStart), content.indexOf(modalSearchEnd) + modalSearchEnd.length);

const modalContentNew = `<ScrollView showsVerticalScrollIndicator={false}>
              <Text className={\`text-[10px] font-bold mb-2 uppercase \${textMuted}\`}>Issue Title *</Text>
              <View className={\`border rounded p-3 mb-4 \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
                 <TextInput 
                   value={formData.title} 
                   onChangeText={v => setFormData({...formData, title: v})} 
                   placeholder="Brief description of the bug" 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   className={\`text-base py-1 \${textColor}\`} 
                 />
              </View>

              <Text className={\`text-[10px] font-bold mb-2 uppercase \${textMuted}\`}>Description *</Text>
              <View className={\`border rounded p-3 mb-4 \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
                 <TextInput 
                   value={formData.description} 
                   onChangeText={v => setFormData({...formData, description: v})} 
                   placeholder="Steps to reproduce, expected vs actual..." 
                   placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} 
                   multiline numberOfLines={4}
                   className={\`text-base py-1 min-h-[80px] \${textColor}\`} 
                   textAlignVertical="top"
                 />
              </View>

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className={\`text-[10px] font-bold mb-2 uppercase \${textMuted}\`}>Project *</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('project'); setDropdownVisible(true); }} className={\`border rounded p-4 flex-row justify-between items-center \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
                       <Text className={formData.projectId ? \`text-sm capitalize \${textColor}\` : \`text-sm \${textMuted}\`}>
                         {formData.projectId ? projects.find(p => p._id === formData.projectId)?.name || projects.find(p => p._id === formData.projectId)?.projectName || 'Select project...' : 'Select project...'}
                       </Text>
                       <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>

                 <View className="flex-1 ml-2">
                    <Text className={\`text-[10px] font-bold mb-2 uppercase \${textMuted}\`}>Task</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('task'); setDropdownVisible(true); }} className={\`border rounded p-4 flex-row justify-between items-center \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
                       <Text className={formData.taskId ? \`text-sm \${textColor}\` : \`text-sm \${textMuted}\`}>
                         {formData.taskId ? tasks.find(t => t._id === formData.taskId)?.title || 'No task' : 'No task'}
                       </Text>
                       <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>
              </View>

              <View className="flex-row justify-between mb-4">
                 <View className="flex-1 mr-2">
                    <Text className={\`text-[10px] font-bold mb-2 uppercase \${textMuted}\`}>Severity *</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('severityForm'); setDropdownVisible(true); }} className={\`border rounded p-4 flex-row justify-between items-center \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
                       <Text className={\`text-sm capitalize \${textColor}\`}>
                         {formData.severity ? formData.severity.toLowerCase() : 'Medium'}
                       </Text>
                       <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>

                 <View className="flex-1 ml-2">
                    <Text className={\`text-[10px] font-bold mb-2 uppercase \${textMuted}\`}>Assign To *</Text>
                    <TouchableOpacity onPress={() => { setDropdownType('user'); setDropdownVisible(true); }} className={\`border rounded p-4 flex-row justify-between items-center \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
                       <Text className={formData.assignedTo ? \`text-sm \${textColor}\` : \`text-sm \${textMuted}\`}>
                         {formData.assignedTo ? users.find(u => u._id === formData.assignedTo)?.name || 'Select employee...' : 'Select employee...'}
                       </Text>
                       <ChevronDown size={16} color={isDarkMode ? "#888" : "#9ca3af"} />
                    </TouchableOpacity>
                 </View>
              </View>

              <Text className={\`text-[10px] font-bold mb-2 uppercase \${textMuted}\`}>Issue Date Range *</Text>
              <View className={\`border rounded p-4 mb-8 flex-row justify-between items-center \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
                 <CalendarDays size={18} color={isDarkMode ? "#888" : "#9ca3af"} />
                 <TouchableOpacity onPress={() => setShowDatePicker({visible: true, mode: 'date', field: 'startDate'})} className="flex-1 mx-3 items-center">
                    <Text className={formData.startDate ? \`text-sm \${textColor}\` : \`text-sm \${textMuted}\`}>
                      {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Start Date'}
                    </Text>
                 </TouchableOpacity>
                 <Text className={textMuted}>-</Text>
                 <TouchableOpacity onPress={() => setShowDatePicker({visible: true, mode: 'date', field: 'endDate'})} className="flex-1 mx-3 items-center">
                    <Text className={formData.endDate ? \`text-sm \${textColor}\` : \`text-sm \${textMuted}\`}>
                      {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'End Date'}
                    </Text>
                 </TouchableOpacity>
              </View>
            </ScrollView>`;

content = content.replace(modalContentOld, modalContentNew);

// 7. Add DateTimePicker Component to the return statement (right before closing </View> of main return)
const pickerJSX = `
      {showDatePicker.visible && (
        <DateTimePicker
          value={formData[showDatePicker.field] ? new Date(formData[showDatePicker.field]) : new Date()}
          mode={showDatePicker.mode}
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker({ ...showDatePicker, visible: false });
            if (event.type === 'set' && selectedDate) {
              setFormData({ ...formData, [showDatePicker.field]: selectedDate.toISOString() });
            }
          }}
        />
      )}
    </View>
  );
}`;
content = content.replace(/    <\/View>\s*  \);\s*}\s*$/, pickerJSX);

// 8. Add logic in FlatList item renderer inside Shared Dropdown Modal to handle the new dropdownTypes
const renderItemFind = "if (dropdownType === 'project') isSelected = formData.projectId === item._id;";
const renderItemRepl = `if (dropdownType === 'project') isSelected = formData.projectId === item._id;
                if (dropdownType === 'task') isSelected = formData.taskId === item._id;
                if (dropdownType === 'user') isSelected = formData.assignedTo === item._id;
                if (dropdownType === 'severityForm') isSelected = formData.severity === item._id;`;
if (!content.includes("dropdownType === 'task' isSelected")) {
    content = content.replace(renderItemFind, renderItemRepl);
}

// 9. Update the flatlist item display text
const displayTextFind = "<Text className={`text-base capitalize ${textColor}`}>{item.name || item.projectName}</Text>";
const displayTextRepl = "<Text className={`text-base capitalize ${textColor}`}>{item.title || item.name || item.projectName}</Text>";
if (content.includes(displayTextFind)) {
    content = content.replace(displayTextFind, displayTextRepl);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched IssuesScreen.js');
