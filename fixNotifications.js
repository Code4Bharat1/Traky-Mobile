const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, 'src', 'components', 'AdminHeader.js');
let headerContent = fs.readFileSync(headerPath, 'utf8');

headerContent = headerContent.replace(
  /setNotifications\(res\.data\.data \|\| res\.data \|\| \[\]\);/,
  `setNotifications(res.data.notifications || res.data.data || (Array.isArray(res.data) ? res.data : []));`
);

fs.writeFileSync(headerPath, headerContent);
console.log('AdminHeader notifications extraction fixed!');
