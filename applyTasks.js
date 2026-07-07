const fs = require('fs');
const file = 'c:/Users/DELL/OneDrive/Desktop/traky/Task-Tracker-Mobile-VB/src/screens/Employee/TasksScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state variables
const stateVarSearch = "const [saving, setSaving] = useState(false);";
const stateVarInsert = `const [saving, setSaving] = useState(false);\n  const [templates, setTemplates] = useState([]);\n  const [showTemplateMenu, setShowTemplateMenu] = useState(false);`;
if (content.includes(stateVarSearch) && !content.includes('const [templates, setTemplates] = useState([]);')) {
    content = content.replace(stateVarSearch, stateVarInsert);
}

// 2. Add applyTemplate function
const applyTemplateFunc = `  const applyTemplate = (t) => {
    const now = new Date();
    const end = new Date();
    end.setHours(end.getHours() + 8);
    
    setFormData({
      ...formData,
      title: t.title || '',
      description: t.description || '',
      priority: t.priority || 'MEDIUM',
      points: String(t.points || '0'),
      proofRequired: t.proofRequired || false,
      isRecurring: t.isRecurring || false,
      recurringConfig: t.recurringConfig || { frequency: 'DAILY', interval: '1' },
      checklist: t.checklist || [],
      reminders: t.reminders || [],
      projectId: t.projectId || '',
      assigneeIds: t.contributors || [],
      startTime: now.toISOString(),
      endTime: end.toISOString()
    });
    setShowTemplateMenu(false);
  };\n`;
if (!content.includes('const applyTemplate = (t) => {')) {
    const openAddModalSearch = "const openAddModal = () => {";
    content = content.replace(openAddModalSearch, applyTemplateFunc + '\n  ' + openAddModalSearch);
}

// 3. Update fetchAux
const oldProjEndpointLogic = "const projEndpoint = (user?.role?.name === 'ADMIN' || user?.role?.name === 'DEPT_HEAD' || user?.role === 'ADMIN' || user?.role === 'DEPT_HEAD') ? '/projects?limit=500' : '/projects/my-projects?limit=500';";
const newProjEndpointLogic = `const isLead = ['lead', 'department_head', 'admin', 'project_manager', 'super_admin'].includes(user?.globalRole || user?.role?.name || user?.role || '');\n        const projEndpoint = isLead ? '/projects?limit=500' : '/projects/my-projects?limit=500';`;
if (content.includes(oldProjEndpointLogic)) {
    content = content.replace(oldProjEndpointLogic, newProjEndpointLogic);
}
const userResLogic = "const userRes = await client.get('/users/colleagues');";
const templatesFetch = `const userRes = await client.get('/users/colleagues');\n        const tRes = await client.get('/task-templates').catch(()=>({data:[]}));\n        setTemplates(tRes.data?.data || tRes.data || []);`;
if (content.includes(userResLogic) && !content.includes('client.get(\'/task-templates\')')) {
    content = content.replace(userResLogic, templatesFetch);
}

// 4. Fix User Role Display
const oldRoleDisplay = "u.role?.name || u.role || 'EMPLOYEE'";
const newRoleDisplay = "u.globalRole || u.role?.name || u.role || 'EMPLOYEE'";
if (content.includes(oldRoleDisplay)) {
    content = content.replace(oldRoleDisplay, newRoleDisplay);
}

// 5. Add "Use Template" button to modal header
const oldModalHeader = `<View className="flex-row justify-between items-center mb-6 border-b pb-4 border-[#333]">
               <Text className={\`text-sm font-bold tracking-widest uppercase \${textColor}\`}>Assign New Task</Text>
               <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>`;
            
const newModalHeader = `<View className="flex-row justify-between items-center mb-6 border-b pb-4 border-[#333] z-50">
               <View className="flex-row items-center relative">
                 <Text className={\`text-sm font-bold tracking-widest uppercase \${textColor} mr-3\`}>Assign New Task</Text>
                 <TouchableOpacity 
                   onPress={() => setShowTemplateMenu(!showTemplateMenu)} 
                   className={\`flex-row items-center px-2 py-1 rounded border \${isDarkMode ? 'border-[#333] bg-[#222]' : 'border-gray-200 bg-gray-100'}\`}
                 >
                    <FileText size={12} color={isDarkMode ? "#888" : "#6b7280"} className="mr-1" />
                    <Text className={\`text-[9px] font-bold tracking-widest uppercase \${isDarkMode ? 'text-[#888]' : 'text-gray-500'}\`}>Use Template</Text>
                    <ChevronDown size={12} color={isDarkMode ? "#888" : "#6b7280"} className="ml-1" />
                 </TouchableOpacity>
                 
                 {showTemplateMenu && (
                   <View className={\`absolute top-full left-0 mt-2 w-48 rounded border shadow-lg z-50 \${isDarkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'}\`}>
                     <ScrollView className="max-h-40">
                       {templates.length === 0 ? (
                         <Text className={\`text-[10px] p-3 italic \${textMuted}\`}>No templates found</Text>
                       ) : (
                         templates.map(t => (
                           <TouchableOpacity 
                             key={t._id} 
                             onPress={() => applyTemplate(t)} 
                             className={\`p-3 border-b \${borderColor}\`}
                           >
                             <Text className={\`text-xs font-bold \${textColor}\`}>{t.title}</Text>
                           </TouchableOpacity>
                         ))
                       )}
                     </ScrollView>
                   </View>
                 )}
               </View>
               <TouchableOpacity onPress={() => { setAddModalVisible(false); setShowTemplateMenu(false); }}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>`;

if (content.includes(oldModalHeader)) {
    content = content.replace(oldModalHeader, newModalHeader);
}

// Make sure zIndex allows dropdown to overflow visually. In React Native Android, absolute positioning needs zIndex on parents. 
// It's covered by the `z-50` class, but might be clipped by ScrollView if not careful.
// The header is BEFORE the ScrollView, so as long as it has zIndex, it should overlay the ScrollView.

// To add FileText icon if missing
if (!content.includes('FileText,')) {
    content = content.replace('X,', 'X, FileText,');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully applied all changes to TasksScreen.js');
