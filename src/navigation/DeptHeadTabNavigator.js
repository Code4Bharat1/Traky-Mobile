import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, CheckSquare, ClipboardList, Trophy, Bell } from 'lucide-react-native';
import useThemeStore from '../store/themeStore';

// ── Tab Screens ──────────────────────────────────────────────────────────────
import DeptHeadDashboard   from '../screens/DeptHead/DeptHeadDashboard';
import TasksScreen         from '../screens/DeptHead/TasksScreen';
import DailyLogsScreen     from '../screens/DeptHead/DailyLogsScreen';
import LeaderboardScreen   from '../screens/DeptHead/LeaderboardScreen';
import NotificationsScreen from '../screens/DeptHead/NotificationsScreen';

// ── Stack Screens (accessible from Dashboard) ─────────────────────────────────
import ProjectsScreen       from '../screens/DeptHead/ProjectsScreen';
import IssuesScreen         from '../screens/DeptHead/IssuesScreen';
import EmployeeScreen       from '../screens/DeptHead/EmployeeScreen';
import TeamAttendanceScreen from '../screens/DeptHead/TeamAttendanceScreen';
import LeaveApprovalsScreen from '../screens/DeptHead/LeaveApprovalsScreen';
import ExpensesScreen       from '../screens/DeptHead/ExpensesScreen';
import ReportsScreen        from '../screens/DeptHead/ReportsScreen';
import EmployeeReportScreen from '../screens/DeptHead/EmployeeReportScreen';
import KTDocumentsScreen    from '../screens/DeptHead/KTDocumentsScreen';

import AdminHeader from '../components/AdminHeader';

// ── Title map for header ───────────────────────────────────────────────────────
const titleMap = {
  DeptHeadDashboardMain: 'DASHBOARD',
  Projects:              'PROJECTS',
  Issues:                'ISSUES',
  Employee:              'EMPLOYEES',
  TeamAttendance:        'TEAM ATTENDANCE',
  LeaveApprovals:        'LEAVE APPROVALS',
  Expenses:              'EXPENSES',
  Reports:               'REPORTS',
  EmployeeReport:        'EMPLOYEE REPORT',
  KTDocuments:           'KT DOCUMENTS',
  // Direct tab screens
  Tasks:                 'TASKS',
  DailyLogs:             'DAILY LOGS',
  Leaderboard:           'LEADERBOARD',
  Notifications:         'NOTIFICATIONS',
};

const getHeaderTitle = (route) => titleMap[route.name] || route.name.toUpperCase();

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Main Stack (nested inside Dashboard tab) ───────────────────────────────────
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        header: () => (
          <AdminHeader navigation={navigation} title={getHeaderTitle(route)} />
        ),
      })}
    >
      <Stack.Screen name="DeptHeadDashboardMain" component={DeptHeadDashboard} />
      <Stack.Screen name="Projects"              component={ProjectsScreen} />
      <Stack.Screen name="Issues"                component={IssuesScreen} />
      <Stack.Screen name="Employee"              component={EmployeeScreen} />
      <Stack.Screen name="TeamAttendance"        component={TeamAttendanceScreen} />
      <Stack.Screen name="LeaveApprovals"        component={LeaveApprovalsScreen} />
      <Stack.Screen name="Expenses"              component={ExpensesScreen} />
      <Stack.Screen name="Reports"               component={ReportsScreen} />
      <Stack.Screen name="EmployeeReport"        component={EmployeeReportScreen} />
      <Stack.Screen name="KTDocuments"           component={KTDocumentsScreen} />
    </Stack.Navigator>
  );
}

// ── Tab Navigator ─────────────────────────────────────────────────────────────
export default function DeptHeadTabNavigator() {
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: route.name !== 'DashboardTab',
        header: () => (
          <AdminHeader navigation={navigation} title={getHeaderTitle(route)} />
        ),
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#131313' : '#ffffff',
          borderTopColor: isDarkMode ? '#ffffff1a' : '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   isDarkMode ? '#adc6ff' : '#2573e6',
        tabBarInactiveTintColor: isDarkMode ? '#888'    : '#6b7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      })}
    >
      {/* Dashboard tab — wraps the full MainStack so all screens keep the tab bar */}
      <Tab.Screen
        name="DashboardTab"
        component={MainStack}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />

      {/* Standalone tab screens */}
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="DailyLogs"
        component={DailyLogsScreen}
        options={{
          title: 'Daily Logs',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
