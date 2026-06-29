const fs = require('fs');
const path = require('path');

const projPath = path.join(__dirname, 'src', 'screens', 'Admin', 'ProjectsScreen.js');
let projContent = fs.readFileSync(projPath, 'utf8');

// Add state for Total Time Modal
projContent = projContent.replace(
  /const \[dropdownType, setDropdownType\] = useState\(''\);/,
  `const [dropdownType, setDropdownType] = useState('');
  const [timeModalVisible, setTimeModalVisible] = useState(false);`
);

// Add the Total Time Modal UI just before the main return statement's closing view, or alongside other modals
const modalUI = `
      {/* Total Time Spent Modal */}
      <Modal visible={timeModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={\`border rounded-lg w-11/12 p-6 max-h-[80%] \${bgCard} \${borderColor}\`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={\`text-sm font-bold tracking-widest uppercase \${textColor}\`}>Total Time Spent</Text>
               <TouchableOpacity onPress={() => setTimeModalVisible(false)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>
            <ScrollView className="mb-4">
               {projects.map(p => {
                  const ms = projectTimeMap[p._id] || 0;
                  const hrs = (ms / (1000 * 60 * 60)).toFixed(2);
                  return (
                     <View key={p._id} className={\`p-3 border-b flex-row justify-between items-center \${borderColor}\`}>
                        <Text className={\`text-xs font-bold \${textColor} flex-1 mr-2\`} numberOfLines={1}>{p.name || p.projectName}</Text>
                        <Text className={\`text-xs font-bold \${isDarkMode ? 'text-[#adc6ff]' : 'text-[#2573e6]'}\`}>{hrs} hr</Text>
                     </View>
                  );
               })}
               {projects.length === 0 && <Text className={\`text-center text-xs mt-4 \${textMuted}\`}>No projects found.</Text>}
            </ScrollView>
            <View className={\`flex-row justify-end border-t mt-2 pt-4 \${borderColor}\`}>
               <TouchableOpacity onPress={() => setTimeModalVisible(false)} className="mr-4 py-2"><Text className={\`font-bold text-xs uppercase tracking-widest \${textMuted}\`}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
`;

projContent = projContent.replace(
  /\{renderDetailsModal\(\)\}/,
  `{renderDetailsModal()}
  ${modalUI}`
);

// Add the button to open it in the Filters section
const buttonUI = `
         <View className="flex-row justify-between items-center mt-2">
            <TouchableOpacity onPress={() => setTimeModalVisible(true)} className={\`flex-row items-center border rounded px-3 py-2 flex-1 \${bgInput} \${borderColor}\`}>
               <Clock size={14} color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mr-2" />
               <Text className={\`text-[10px] font-bold uppercase tracking-widest \${textColor}\`}>Total Time Spent on Each Project</Text>
            </TouchableOpacity>
         </View>
`;

projContent = projContent.replace(
  /<View className="flex-row justify-between items-center">\s*<View className="flex-row flex-1 mr-2">/,
  `${buttonUI}\n         <View className="flex-row justify-between items-center mt-2">\n            <View className="flex-row flex-1 mr-2">`
);

fs.writeFileSync(projPath, projContent);

console.log('Update script 3 completed successfully!');
