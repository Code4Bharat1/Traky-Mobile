const fs = require('fs');
const path = 'c:/Users/DELL/OneDrive/Desktop/traky/Task-Tracker-Mobile-VB/src/navigation/';

const files = ['EmployeeNavigator.js', 'AdminNavigator.js', 'DeptHeadNavigator.js', 'LeadNavigator.js'];

files.forEach(file => {
  let content = fs.readFileSync(path + file, 'utf8');
  
  // Find the onPress block in the DrawerItem mapping
  const searchPattern = /onPress=\{\(\) => \{\s*if \(item\.screen\) \{([\s\S]*?)props\.navigation\.closeDrawer\(\);\s*\}\s*\}\}/;
  
  const match = content.match(searchPattern);
  
  if (match) {
    const navigationLogic = match[1];
    
    // We want to replace it with closing the drawer first, then navigating in a timeout.
    // Notice that navigationLogic already contains the if/else logic for navigation.
    // It usually has comments like "// Close the drawer after navigation" which we can clean up.
    
    let cleanNavLogic = navigationLogic.replace(/\/\/ Close the drawer after navigation/g, '').trim();
    
    const replacement = `onPress={() => {
              if (item.screen) {
                props.navigation.closeDrawer();
                setTimeout(() => {
                  ${cleanNavLogic}
                }, 100);
              }
            }}`;
            
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(path + file, content, 'utf8');
    console.log('Fixed', file);
  } else {
    console.log('No match found in', file);
  }
});
