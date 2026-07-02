const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'screens', 'Admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  const replacePatterns = [
    { regex: /keyExtractor=\{\(item\) => item\._id \|\| 'none'\}/g, repl: "keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}" },
    { regex: /keyExtractor=\{\(item\) => item\._id \|\| item\.id\}/g, repl: "keyExtractor={(item, index) => (item._id || item.id) ? (item._id || item.id) + '_' + index : index.toString()}" }
  ];

  replacePatterns.forEach(({regex, repl}) => {
    if (regex.test(content)) {
      content = content.replace(regex, repl);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated advanced in ${file}`);
  }
});
