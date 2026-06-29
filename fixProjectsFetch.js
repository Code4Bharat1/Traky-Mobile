const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'Admin', 'ProjectsScreen.js');
let content = fs.readFileSync(file, 'utf8');

// Replace single tasks fetch with loop
content = content.replace(
  /client\.get\('\/tasks\?limit=1000'\)\.catch\(\(\) => \(\{ data: \{ data: \[\] \} \}\)\)/,
  `null /* replaced by loop below */`
);

content = content.replace(
  /const allTasks = taskRes\?\.data\?\.data \|\| taskRes\?\.data \|\| \[\];/,
  `let allTasks = [];
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
      }`
);

fs.writeFileSync(file, content);
console.log('ProjectsScreen fixed!');
