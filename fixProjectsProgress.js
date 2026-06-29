const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'Admin', 'ProjectsScreen.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for tasksCountMap
content = content.replace(
  /const \[projectTimeMap, setProjectTimeMap\] = useState\(\{\}\);/,
  `const [projectTimeMap, setProjectTimeMap] = useState({});
  const [projectTasksCountMap, setProjectTasksCountMap] = useState({});`
);

// 2. Modify fetchData to calculate tasksCountMap
content = content.replace(
  /const timeMap = \{\};\n\s*allTasks\.forEach\(t => \{/,
  `const timeMap = {};
      const countMap = {};
      allTasks.forEach(t => {`
);

content = content.replace(
  /if \(\!timeMap\[pId\]\) timeMap\[pId\] = 0;/,
  `if (!timeMap[pId]) timeMap[pId] = 0;
         if (!countMap[pId]) countMap[pId] = { total: 0, completed: 0 };
         
         countMap[pId].total += 1;
         if (t.status === 'COMPLETED' || t.status === 'DONE') {
             countMap[pId].completed += 1;
         }`
);

content = content.replace(
  /setProjectTimeMap\(timeMap\);/,
  `setProjectTimeMap(timeMap);
      setProjectTasksCountMap(countMap);`
);

// 3. Use tasksCountMap in renderItem
content = content.replace(
  /const totalTasksItem = item\.modules \|\| item\.totalTasks \|\| 0;\n\s*const completedTasksItem = item\.modulesCompleted \|\| item\.completedTasks \|\| 0;/,
  `const counts = projectTasksCountMap[item._id] || { total: 0, completed: 0 };
    const totalTasksItem = counts.total || item.modules || item.totalTasks || 0;
    const completedTasksItem = counts.completed || item.modulesCompleted || item.completedTasks || 0;`
);

fs.writeFileSync(file, content);
console.log('Progress fixed!');
