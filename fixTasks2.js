const fs = require('fs');
const file = 'c:/Users/DELL/OneDrive/Desktop/traky/Task-Tracker-Mobile-VB/src/screens/Employee/TasksScreen.js';
let content = fs.readFileSync(file, 'utf8');

const oldFetchProjects = "const projRes = await client.get('/projects/my-projects?limit=500');";
const newFetchProjects = "const projEndpoint = (user?.role?.name === 'ADMIN' || user?.role?.name === 'DEPT_HEAD' || user?.role === 'ADMIN' || user?.role === 'DEPT_HEAD') ? '/projects?limit=500' : '/projects/my-projects?limit=500';\n        const projRes = await client.get(projEndpoint);";
content = content.replace(oldFetchProjects, newFetchProjects);

const assignText = 'Assign Employees {formData.projectId';
const startIndex = content.lastIndexOf('<Text', content.indexOf(assignText));
const endIndex = content.indexOf('<View className="flex-row justify-between mb-4">', startIndex);

if (startIndex > -1 && endIndex > -1) {
    const block = content.substring(startIndex, endIndex);
    content = content.substring(0, startIndex) + content.substring(endIndex);
    
    const descIndex = content.lastIndexOf('<Text', content.indexOf('>Description</Text>'));
    if (descIndex > -1) {
        content = content.substring(0, descIndex) + block + content.substring(descIndex);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Successfully rearranged Assign Employees and updated fetch endpoint.');
    } else {
        console.log('Could not find Description insert point.');
    }
} else {
    console.log('Could not find Assign Employees block boundaries.', {startIndex, endIndex});
}
