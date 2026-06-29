const fs = require('fs');
const path = require('path');

// 1. Update AdminHeader.js
const headerPath = path.join(__dirname, 'src', 'components', 'AdminHeader.js');
let headerContent = fs.readFileSync(headerPath, 'utf8');

// Replace static notifications with API call
headerContent = headerContent.replace(
  /const \[notifications, setNotifications\] = useState\(\[[\s\S]*?\]\);/,
  `const [notifications, setNotifications] = useState([]);
  
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const client = require('../api/client').default;
        const res = await client.get('/notifications?limit=20');
        setNotifications(res.data.data || res.data || []);
      } catch (err) {
        console.log('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, []);`
);

fs.writeFileSync(headerPath, headerContent);

// 2. Update ProjectsScreen.js
const projPath = path.join(__dirname, 'src', 'screens', 'Admin', 'ProjectsScreen.js');
let projContent = fs.readFileSync(projPath, 'utf8');

// Add task fetch logic to fetchData
projContent = projContent.replace(
  /const \[projRes, depRes, catRes, userRes\] = await Promise.all\(\[[\s\S]*?\]\);/,
  `const [projRes, depRes, catRes, userRes, taskRes] = await Promise.all([
        client.get('/projects?limit=500'),
        client.get('/departments?limit=100'),
        client.get('/categories'),
        client.get('/users?limit=500'),
        client.get('/tasks?limit=1000').catch(() => ({ data: { data: [] } }))
      ]);`
);

projContent = projContent.replace(
  /setUsers\(userRes\.data\.data \|\| userRes\.data\.users \|\| \[\]\);/,
  `setUsers(userRes.data.data || userRes.data.users || []);
      const allTasks = taskRes?.data?.data || taskRes?.data || [];
      const timeMap = {};
      allTasks.forEach(t => {
         const pId = t.projectId?._id || t.projectId;
         if (!pId) return;
         if (!timeMap[pId]) timeMap[pId] = 0;
         const history = t.statusHistory || [];
         history.forEach(h => {
             if (h.status === 'IN_PROGRESS' && h.startTime && h.endTime) {
                 const s = new Date(h.startTime);
                 const e = new Date(h.endTime);
                 if (!isNaN(s) && !isNaN(e)) timeMap[pId] += (e - s);
             }
         });
      });
      setProjectTimeMap(timeMap);`
);

// Add projectTimeMap state
projContent = projContent.replace(
  /const \[users, setUsers\] = useState\(\[\]\);/,
  `const [users, setUsers] = useState([]);\n  const [projectTimeMap, setProjectTimeMap] = useState({});`
);

// We need to rewrite renderItem to ALWAYS return a detailed card.
// Let's replace the entire renderItem block.
const renderItemMatch = projContent.match(/const renderItem = \(\{ item \}\) => \{[\s\S]*?^  \};/m);
if (renderItemMatch) {
  const newRenderItem = `const renderItem = ({ item }) => {
    const isCompleted = item.status === 'COMPLETED';
    const statusColor = isCompleted ? '#10b981' : (isDarkMode ? '#47c8ff' : '#0284c7');
    const statusBg = isCompleted ? (isDarkMode ? '#10b9811a' : '#ecfdf5') : (isDarkMode ? '#47c8ff1a' : '#f0f9ff');
    const dName = item.departmentId?.departmentName || 'No Dept';
    const pName = item.name || item.projectName || 'Unnamed Project';
    
    const isOverdue = item.endDate && new Date(item.endDate) < new Date() && !isCompleted;

    const getUserId = (idOrObj) => (typeof idOrObj === 'object' && idOrObj !== null) ? (idOrObj._id || idOrObj.id) : idOrObj;

    let leadName = 'No manager';
    if (item.managerIds && item.managerIds.length > 0) {
      const mId = getUserId(item.managerIds[0]);
      const manager = users.find(u => u._id === mId) || (typeof item.managerIds[0] === 'object' ? item.managerIds[0] : null);
      if (manager && manager.name) leadName = manager.name;
    }
    
    const deadlineStr = item.endDate ? new Date(item.endDate).toLocaleDateString() : '—';
    const totalTasksItem = item.modules || item.totalTasks || 0;
    const completedTasksItem = item.modulesCompleted || item.completedTasks || 0;
    const progressPercent = totalTasksItem > 0 ? Math.round((completedTasksItem / totalTasksItem) * 100) : (item.progress || 0);

    const totalMs = projectTimeMap[item._id] || 0;
    const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(2);
    
    const reviewersCount = (item.testerIds || []).length;
    const contributorsCount = (item.developerIds || []).length;
    const totalMembers = reviewersCount + contributorsCount;

    return (
      <TouchableOpacity onPress={() => { setSelectedProject(item); setDetailsModalVisible(true); }} className={\`rounded-lg p-5 mb-4 border \${isDarkMode ? 'bg-[#131313]' : 'bg-gray-50'} \${borderColor}\`}>
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-2">
            <Text className={\`text-base font-bold mb-1 \${textColor}\`} numberOfLines={1}>{pName}</Text>
            <Text className={\`text-[10px] uppercase tracking-wider font-bold \${textMuted}\`}>{dName}</Text>
          </View>
          <View className="items-end">
            <View className={\`px-2 py-1 rounded\`} style={{ backgroundColor: statusBg, borderColor: \`\${statusColor}4a\`, borderWidth: 1 }}>
              <Text className={\`text-[9px] font-bold uppercase tracking-wider\`} style={{ color: statusColor }}>
                • {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
              </Text>
            </View>
            {isOverdue && (
               <View className={\`px-2 py-0.5 rounded mt-1 border \${isDarkMode ? 'bg-[#ef44441a] border-[#ef44444a]' : 'bg-red-50 border-red-200'}\`}>
                  <Text className="text-[#ef4444] text-[8px] font-bold uppercase tracking-widest">OVERDUE</Text>
               </View>
            )}
          </View>
        </View>
        
        <View className="mb-2 flex-row justify-between">
           <Text className={\`text-[10px] font-bold uppercase tracking-widest \${textMuted}\`}>Lead</Text>
           <Text className={\`text-xs \${textColor}\`}>{leadName}</Text>
        </View>

        <View className="mb-2 flex-row justify-between">
           <Text className={\`text-[10px] font-bold uppercase tracking-widest \${textMuted}\`}>Members</Text>
           <Text className={\`text-xs \${textColor}\`}>{totalMembers} Users</Text>
        </View>

        <View className="mb-2 flex-row justify-between">
           <Text className={\`text-[10px] font-bold uppercase tracking-widest \${textMuted}\`}>Total Time</Text>
           <Text className={\`text-xs \${textColor}\`}>{totalHours}hr</Text>
        </View>

        <View className="mb-4 flex-row justify-between">
           <Text className={\`text-[10px] font-bold uppercase tracking-widest \${textMuted}\`}>Deadline</Text>
           <Text className={\`text-xs \${textColor}\`}>{deadlineStr}</Text>
        </View>

        <View className="mt-2">
           <View className="flex-row justify-between mb-1">
              <Text className={\`text-[10px] font-bold uppercase tracking-widest \${textMuted}\`}>Progress</Text>
              <Text className={\`text-[10px] \${textColor}\`}>{completedTasksItem}/{totalTasksItem} ({progressPercent}%)</Text>
           </View>
           <View className={\`h-1 rounded overflow-hidden \${isDarkMode ? 'bg-[#1c1b1b]' : 'bg-gray-200'}\`}>
              <View className={\`h-full rounded \${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}\`} style={{ width: \`\${progressPercent}%\` }} />
           </View>
        </View>
      </TouchableOpacity>
    );
  };`;
  projContent = projContent.replace(renderItemMatch[0], newRenderItem);
}

fs.writeFileSync(projPath, projContent);

console.log('Update script completed successfully!');
