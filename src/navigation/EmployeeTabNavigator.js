import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, CheckSquare, ClipboardList, Trophy } from 'lucide-react-native';
import useThemeStore from '../store/themeStore';

import EmployeeDashboard from '../screens/Employee/EmployeeDashboard';
import TasksScreen from '../screens/Employee/TasksScreen';
import DailyLogsScreen from '../screens/Employee/DailyLogsScreen';
import LeaderboardScreen from '../screens/Employee/LeaderboardScreen';

// Screens moved from Drawer to Stack
import AttendanceScreen from '../screens/Employee/AttendanceScreen';
import MyLeavesScreen from '../screens/Employee/MyLeavesScreen';
import ReportsScreen from '../screens/Employee/ReportsScreen';
import ExpensesScreen from '../screens/Employee/ExpensesScreen';
import MyProjectsScreen from '../screens/Employee/MyProjectsScreen';
import IssuesScreen from '../screens/Employee/IssuesScreen';
import KtDocumentsScreen from '../screens/Employee/KtDocumentsScreen';
import NotificationsScreen from '../screens/Employee/NotificationsScreen';
import TemplatesScreen from '../screens/Employee/TemplatesScreen';

import EmployeeHeader from '../components/EmployeeHeader';

const titleMap = {
  'EmployeeDashboardMain': 'DASHBOARD',
  'Attendance': 'ATTENDANCE',
  'MyLeaves': 'MY LEAVES',
  'Reports': 'REPORTS',
  'Expenses': 'EXPENSES',
  'MyProjects': 'MY PROJECTS',
  'Issues': 'ISSUES',
  'KtDocuments': 'KT DOCUMENTS',
  'Notifications': 'NOTIFICATIONS',
  'Templates': 'TEMPLATES',
  'Tasks': 'TASKS',
  'DailyLogs': 'DAILY LOGS',
  'Leaderboard': 'LEADERBOARD',
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
        header: () => <EmployeeHeader navigation={navigation} title={getHeaderTitle(route)} />
      })}
    >
      <Stack.Screen name="EmployeeDashboardMain" component={EmployeeDashboard} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="MyLeaves" component={MyLeavesScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="MyProjects" component={MyProjectsScreen} />
      <Stack.Screen name="Issues" component={IssuesScreen} />
      <Stack.Screen name="KtDocuments" component={KtDocumentsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Templates" component={TemplatesScreen} />
    </Stack.Navigator>
  );
}

export default function EmployeeTabNavigator() {
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: route.name !== 'DashboardTab',
        header: () => <EmployeeHeader navigation={navigation} title={getHeaderTitle(route)} />,
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
    </Tab.Navigator>
  );
}
