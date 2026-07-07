const fs = require('fs');
const file = 'c:/Users/DELL/OneDrive/Desktop/traky/Task-Tracker-Mobile-VB/src/screens/Employee/TasksScreen.js';
let content = fs.readFileSync(file, 'utf8');

const oldText1 = "        const isLead = ['lead', 'department_head', 'admin', 'project_manager', 'super_admin'].includes(user?.globalRole || user?.role?.name || user?.role || '');";
const oldText2 = "        const projEndpoint = isLead ? '/projects?limit=500' : '/projects/my-projects?limit=500';";

content = content.replace(oldText1 + '\n' + oldText2, "        const projEndpoint = '/projects?limit=500';");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed project endpoint for employees');
