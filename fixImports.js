const fs = require('fs');
const path = require('path');

const tasksFile = path.join(__dirname, 'src', 'screens', 'Admin', 'TasksScreen.js');
let tasksContent = fs.readFileSync(tasksFile, 'utf8');

tasksContent = tasksContent.replace(
  /import \{ CheckSquare, Plus, Clock, Tag, X, ChevronDown, CheckCircle, Search, MessageSquare, Send, FileText, Calendar \} from 'lucide-react-native';/,
  `import { CheckSquare, Plus, Clock, Tag, X, ChevronDown, CheckCircle, Search, MessageSquare, Send, FileText, Calendar, Check } from 'lucide-react-native';`
);

fs.writeFileSync(tasksFile, tasksContent);
console.log('TasksScreen imports fixed!');
