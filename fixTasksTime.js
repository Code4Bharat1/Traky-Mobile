const fs = require('fs');
const path = require('path');

const tasksFile = path.join(__dirname, 'src', 'screens', 'Admin', 'TasksScreen.js');
let tasksContent = fs.readFileSync(tasksFile, 'utf8');

const newGetTimeSpent = `const getTimeSpent = (item) => {
    let totalMs = 0;
    if (item.employeeProgress && item.employeeProgress.length > 0) {
      item.employeeProgress.forEach(p => {
        if (Array.isArray(p.sessions) && p.sessions.length > 0) {
          p.sessions.forEach(s => {
            const st = s.start ? new Date(s.start).getTime() : null;
            const en = s.end ? new Date(s.end).getTime() : null;
            if (st && en && !isNaN(st) && !isNaN(en) && en > st) totalMs += (en - st);
          });
        } else if (p.startedAt || p.started_at) {
          const st = new Date(p.startedAt || p.started_at).getTime();
          const enDate = p.completedAt || p.completed_at;
          if (!isNaN(st)) {
            if (enDate) {
              const en = new Date(enDate).getTime();
              if (!isNaN(en) && en > st) totalMs += (en - st);
            } else {
              totalMs += (Date.now() - st);
            }
          }
        }
      });
    }
    if (totalMs > 0) return (totalMs / (1000 * 60 * 60)).toFixed(2) + 'hr';
    if (item.totalTimeSpent) return \`\${item.totalTimeSpent}hr\`;
    if (item.timeSpent) return \`\${item.timeSpent}hr\`;
    return '—';
  };`;

tasksContent = tasksContent.replace(/const getTimeSpent = \(item\) => \{[\s\S]*?return '—';\n  \};/, newGetTimeSpent);
fs.writeFileSync(tasksFile, tasksContent);
console.log('TasksScreen time calculation fixed!');
