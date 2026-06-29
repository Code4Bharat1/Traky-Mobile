const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, 'src', 'components', 'AdminHeader.js');
let headerContent = fs.readFileSync(headerPath, 'utf8');

// Replace map over notifications
headerContent = headerContent.replace(
  /\{notifications\.map\(\(n\) => \([\s\S]*?key=\{n\.id\}[\s\S]*?n\.title[\s\S]*?n\.desc[\s\S]*?n\.time[\s\S]*?\}\)/,
  `{notifications.map((n) => (
                    <TouchableOpacity key={n._id || n.id} className={\`flex-row px-4 py-3 border-b \${isDarkMode ? 'border-[#333]' : 'border-gray-100'}\`}>
                      <View className={\`w-8 h-8 rounded-full items-center justify-center mr-3 \${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-blue-50'}\`}>
                         <ListFilter color={isDarkMode ? (n.read ? '#555' : '#adc6ff') : (n.read ? '#aaa' : '#2573e6')} size={14} />
                      </View>
                      <View className="flex-1">
                        <Text className={\`text-sm font-semibold mb-1 \${isDarkMode ? (n.read ? 'text-[#888]' : 'text-white') : (n.read ? 'text-gray-500' : 'text-gray-800')}\`}>{n.title}</Text>
                        <Text className={\`text-xs mb-1 \${isDarkMode ? (n.read ? 'text-[#555]' : 'text-gray-400') : (n.read ? 'text-gray-400' : 'text-gray-500')}\`}>{n.message || n.desc}</Text>
                        <Text className={\`text-[10px] \${isDarkMode ? 'text-gray-500' : 'text-gray-400'}\`}>{n.created_at ? new Date(n.created_at).toLocaleString() : (n.createdAt ? new Date(n.createdAt).toLocaleString() : n.time)}</Text>
                      </View>
                      {!n.read && <View className="w-2 h-2 rounded-full bg-[#2573e6] mt-1.5" />}
                    </TouchableOpacity>
                  ))`
);

fs.writeFileSync(headerPath, headerContent);

console.log('Update script completed successfully!');
