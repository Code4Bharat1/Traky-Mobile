const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'screens', 'Admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('keyExtractor={(item) => item._id}')) {
    content = content.replace(/keyExtractor=\{\(item\) => item._id\}/g, "keyExtractor={(item, index) => item._id ? item._id + '_' + index : index.toString()}");
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
