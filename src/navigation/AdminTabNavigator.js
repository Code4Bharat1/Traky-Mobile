import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, CheckSquare, ClipboardList, Trophy, Settings } from 'lucide-react-native';
import useThemeStore from '../store/themeStore';

import AdminDashboard from '../screens/Admin/AdminDashboard';
import TasksScreen from '../screens/Admin/TasksScreen';
import DailyLogsScreen from '../screens/Admin/DailyLogsScreen';
import LeaderboardScreen from '../screens/Admin/LeaderboardScreen';
import SettingsScreen from '../screens/Admin/SettingsScreen';

// Screens moved from Drawer to Stack
import UserManagement from '../screens/Admin/UserManagement';
import ActivityLogs from '../screens/Admin/ActivityLogs';
import BranchesScreen from '../screens/Admin/BranchesScreen';
import DepartmentsScreen from '../screens/Admin/DepartmentsScreen';
import CategoriesScreen from '../screens/Admin/CategoriesScreen';
import ProjectsScreen from '../screens/Admin/ProjectsScreen';
import IssuesScreen from '../screens/Admin/IssuesScreen';
import SalaryScreen from '../screens/Admin/SalaryScreen';
import LeaveApprovalsScreen from '../screens/Admin/LeaveApprovalsScreen';
import ExpensesScreen from '../screens/Admin/ExpensesScreen';
import ReportsScreen from '../screens/Admin/ReportsScreen';
import EmployeeReportScreen from '../screens/Admin/EmployeeReportScreen';
import NotificationsScreen from '../screens/Admin/NotificationsScreen';
import TaskTemplatesScreen from '../screens/Admin/TaskTemplatesScreen';
import PermissionsScreen from '../screens/Admin/PermissionsScreen';

import AdminHeader from '../components/AdminHeader';

const titleMap = {
  'AdminDashboardMain': 'DASHBOARD',
  'UserManagement': 'USER MANAGEMENT',
  'Branches': 'BRANCHES',
  'Departments': 'DEPARTMENTS',
  'Categories': 'CATEGORIES',
  'ProjectsOverview': 'PROJECTS OVERVIEW',
  'Issues': 'ISSUES',
  'Tasks': 'TASKS',
  'TaskTemplates': 'TASK TEMPLATES',
  'DailyLogs': 'DAILY LOGS',
  'Salary': 'SALARY',
  'LeaveApprovals': 'LEAVE APPROVALS',
  'Expenses': 'EXPENSES',
  'Reports': 'REPORTS',
  'EmployeeReport': 'EMPLOYEE REPORT',
  'ActivityLogs': 'AUDIT LOGS',
  'Leaderboard': 'LEADERBOARD',
  'Settings': 'SETTINGS',
  'Permissions': 'PERMISSIONS',
  'Notifications': 'NOTIFICATIONS',
};

const getHeaderTitle = (route) => {
  return titleMap[route.name] || route.name.toUpperCase();
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator 
      screenOptions={({ route, navigation }) => ({ 
        headerShown: true,
        header: () => <AdminHeader navigation={navigation} title={getHeaderTitle(route)} />
      })}
    >
      <Stack.Screen name="AdminDashboardMain" component={AdminDashboard} />
      <Stack.Screen name="UserManagement" component={UserManagement} />
      <Stack.Screen name="Branches" component={BranchesScreen} />
      <Stack.Screen name="Departments" component={DepartmentsScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="ProjectsOverview" component={ProjectsScreen} />
      <Stack.Screen name="Issues" component={IssuesScreen} />
      <Stack.Screen name="TaskTemplates" component={TaskTemplatesScreen} />
      <Stack.Screen name="Salary" component={SalaryScreen} />
      <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="EmployeeReport" component={EmployeeReportScreen} />
      <Stack.Screen name="ActivityLogs" component={ActivityLogs} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export default function AdminTabNavigator() {
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: route.name !== 'DashboardTab',
        header: () => <AdminHeader navigation={navigation} title={getHeaderTitle(route)} />,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#131313' : '#ffffff',
          borderTopColor: isDarkMode ? '#ffffff1a' : '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isDarkMode ? '#adc6ff' : '#2573e6',
        tabBarInactiveTintColor: isDarkMode ? '#888' : '#6b7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={MainStack} 
        options={{ 
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="DailyLogs" 
        component={DailyLogsScreen} 
        options={{ 
          title: 'Daily Logs',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> 
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> 
        }} 
      />
    </Tab.Navigator>
  );
}
