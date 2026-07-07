const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, 'src', 'components', 'AdminHeader.js');
let headerContent = fs.readFileSync(headerPath, 'utf8');

// Fix notifications array mapping
headerContent = headerContent.replace(
  /const allRead = notifications\.length === 0 \|\| notifications\.every\(n => n\.read\);/,
  `const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const allRead = safeNotifications.length === 0 || safeNotifications.every(n => n.read);
  const unreadCount = safeNotifications.filter(n => !n.read).length;`
);

headerContent = headerContent.replace(
  /const unreadCount = notifications\.filter\(n => !n\.read\)\.length;/,
  ``
);

headerContent = headerContent.replace(
  /notifications\.length > 0/g,
  `safeNotifications.length > 0`
);

headerContent = headerContent.replace(
  /\{notifications\.length\}/g,
  `{safeNotifications.length}`
);

headerContent = headerContent.replace(
  /notifications\.map/g,
  `safeNotifications.map`
);

headerContent = headerContent.replace(
  /notifications\.length === 0/g,
  `safeNotifications.length === 0`
);

fs.writeFileSync(headerPath, headerContent);
console.log('AdminHeader fixed!');
