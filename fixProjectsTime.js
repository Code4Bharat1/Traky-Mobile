const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'Admin', 'ProjectsScreen.js');
let content = fs.readFileSync(file, 'utf8');

const newTimeMapLogic = `let taskTotalMs = 0;
         if (t.employeeProgress && t.employeeProgress.length > 0) {
            t.employeeProgress.forEach(p => {
               if (Array.isArray(p.sessions) && p.sessions.length > 0) {
                 p.sessions.forEach(s => {
                   const st = s.start ? new Date(s.start).getTime() : null;
                   const en = s.end ? new Date(s.end).getTime() : null;
                   if (st && en && !isNaN(st) && !isNaN(en) && en > st) taskTotalMs += (en - st);
                 });
               } else if (p.startedAt || p.started_at) {
                 const st = new Date(p.startedAt || p.started_at).getTime();
                 const enDate = p.completedAt || p.completed_at;
                 if (!isNaN(st)) {
                   if (enDate) {
                     const en = new Date(enDate).getTime();
                     if (!isNaN(en) && en > st) taskTotalMs += (en - st);
                   } else {
                     taskTotalMs += (Date.now() - st);
                   }
                 }
               }
            });
         }
         timeMap[pId] += taskTotalMs;`;

// Replace the old statusHistory logic
content = content.replace(
  /const history = t\.statusHistory \|\| \[\];\n\s*history\.forEach\(h => \{[\s\S]*?\}\);/g,
  newTimeMapLogic
);

fs.writeFileSync(file, content);
console.log('ProjectsScreen time calculation fixed!');
