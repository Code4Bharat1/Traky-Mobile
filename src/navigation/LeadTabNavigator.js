import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, CheckSquare, ClipboardList, Trophy, Bell } from 'lucide-react-native';
import useThemeStore from '../store/themeStore';
import AdminHeader from '../components/AdminHeader';

// ── Tab screens ───────────────────────────────────────────────────────────────
import LeadDashboard      from '../screens/Lead/LeadDashboard';
import TasksScreen        from '../screens/Lead/TasksScreen';
import DailyLogsScreen    from '../screens/Lead/DailyLogsScreen';
import LeaderboardScreen  from '../screens/Lead/LeaderboardScreen';
import NotificationsScreen from '../screens/Lead/NotificationsScreen';

// ── Stack screens (pushed from Dashboard) ─────────────────────────────────────
import ProjectsScreen       from '../screens/Lead/ProjectsScreen';
import IssuesScreen         from '../screens/Lead/IssuesScreen';
import EmployeeScreen       from '../screens/Lead/EmployeeScreen';
import TeamAttendanceScreen from '../screens/Lead/TeamAttendanceScreen';
import LeaveApprovalsScreen from '../screens/Lead/LeaveApprovalsScreen';
import ExpensesScreen       from '../screens/Lead/ExpensesScreen';
import ReportsScreen        from '../screens/Lead/ReportsScreen';
import EmployeeReportScreen from '../screens/Lead/EmployeeReportScreen';
import KTDocumentsScreen    from '../screens/Lead/KTDocumentsScreen';

const titleMap = {
  LeadDashboardMain: 'DASHBOARD',
  Projects:          'PROJECTS',
  Issues:            'ISSUES',
  Employees:         'EMPLOYEES',
  TeamAttendance:    'TEAM ATTENDANCE',
  LeaveApprovals:    'LEAVE APPROVALS',
  Expenses:          'EXPENSES',
  Reports:           'REPORTS',
  EmployeeReport:    'EMPLOYEE REPORT',
  KTDocuments:       'KT DOCUMENTS',
  Tasks:             'TASKS',
  DailyLogs:         'DAILY LOGS',
  Leaderboard:       'LEADERBOARD',
  Notifications:     'NOTIFICATIONS',
};

const getTitle = route => titleMap[route.name] || route.name.toUpperCase();

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        header: () => <AdminHeader navigation={navigation} title={getTitle(route)} />,
      })}>
      <Stack.Screen name="LeadDashboardMain"  component={LeadDashboard} />
      <Stack.Screen name="Projects"           component={ProjectsScreen} />
      <Stack.Screen name="Issues"             component={IssuesScreen} />
      <Stack.Screen name="Employees"          component={EmployeeScreen} />
      <Stack.Screen name="TeamAttendance"     component={TeamAttendanceScreen} />
      <Stack.Screen name="LeaveApprovals"     component={LeaveApprovalsScreen} />
      <Stack.Screen name="Expenses"           component={ExpensesScreen} />
      <Stack.Screen name="Reports"            component={ReportsScreen} />
      <Stack.Screen name="EmployeeReport"     component={EmployeeReportScreen} />
      <Stack.Screen name="KTDocuments"        component={KTDocumentsScreen} />
    </Stack.Navigator>
  );
}

export default function LeadTabNavigator() {
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: route.name !== 'DashboardTab',
        header: () => <AdminHeader navigation={navigation} title={getTitle(route)} />,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#131313' : '#ffffff',
          borderTopColor: isDarkMode ? '#ffffff1a' : '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   isDarkMode ? '#adc6ff' : '#2573e6',
        tabBarInactiveTintColor: isDarkMode ? '#888'    : '#6b7280',
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
      })}>
      <Tab.Screen name="DashboardTab"  component={MainStack}         options={{ title: 'Dashboard',  tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tab.Screen name="Tasks"         component={TasksScreen}       options={{ tabBarIcon: ({ color, size }) => <CheckSquare   color={color} size={size} /> }} />
      <Tab.Screen name="DailyLogs"     component={DailyLogsScreen}   options={{ title: 'Daily Logs', tabBarIcon: ({ color, size }) => <ClipboardList  color={color} size={size} /> }} />
      <Tab.Screen name="Leaderboard"   component={LeaderboardScreen} options={{ tabBarIcon: ({ color, size }) => <Trophy        color={color} size={size} /> }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarIcon: ({ color, size }) => <Bell        color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}
