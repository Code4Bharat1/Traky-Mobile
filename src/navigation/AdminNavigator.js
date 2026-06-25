import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { 
  LayoutDashboard, Users, Activity, GitBranch, Network, 
  Tags, FolderKanban, AlertCircle, CheckSquare, FileText, 
  ClipboardList, DollarSign, CalendarCheck, CreditCard, 
  BarChart2, FileBarChart, Trophy, Settings, Shield, Bell, LogOut 
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';

import AdminDashboard from '../screens/Admin/AdminDashboard';
import UserManagement from '../screens/Admin/UserManagement';
import ActivityLogs from '../screens/Admin/ActivityLogs';
import BranchesScreen from '../screens/Admin/BranchesScreen';
import DepartmentsScreen from '../screens/Admin/DepartmentsScreen';
import CategoriesScreen from '../screens/Admin/CategoriesScreen';
import ProjectsScreen from '../screens/Admin/ProjectsScreen';
import TasksScreen from '../screens/Admin/TasksScreen';
import IssuesScreen from '../screens/Admin/IssuesScreen';
import DailyLogsScreen from '../screens/Admin/DailyLogsScreen';
import SalaryScreen from '../screens/Admin/SalaryScreen';
import LeaveApprovalsScreen from '../screens/Admin/LeaveApprovalsScreen';
import ExpensesScreen from '../screens/Admin/ExpensesScreen';
import ReportsScreen from '../screens/Admin/ReportsScreen';
import EmployeeReportScreen from '../screens/Admin/EmployeeReportScreen';
import LeaderboardScreen from '../screens/Admin/LeaderboardScreen';
import NotificationsScreen from '../screens/Admin/NotificationsScreen';
import TaskTemplatesScreen from '../screens/Admin/TaskTemplatesScreen';
import SettingsScreen from '../screens/Admin/SettingsScreen';
import PermissionsScreen from '../screens/Admin/PermissionsScreen';

const Drawer = createDrawerNavigator();

export default function AdminNavigator() {
  const logout = useAuthStore(state => state.logout);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1, paddingTop: 40 }}>
          <DrawerItemList {...props} />
          <DrawerItem 
            label="SIGN OUT" 
            icon={({ size }) => <LogOut color="#ef4444" size={size} />}
            labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1, color: '#ef4444' }}
            onPress={() => logout()}
            style={{ marginTop: 'auto', marginBottom: 20, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10 }}
          />
        </DrawerContentScrollView>
      )}
      screenOptions={{
        headerStyle: { backgroundColor: '#131313', shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold', tracking: 2 },
        drawerStyle: { backgroundColor: '#131313', width: 280 },
        drawerActiveBackgroundColor: '#adc6ff',
        drawerActiveTintColor: '#131313',
        drawerInactiveTintColor: '#c2c6d6',
        drawerLabelStyle: { fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
      }}
    >
      <Drawer.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'DASHBOARD', drawerIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Drawer.Screen name="UserManagement" component={UserManagement} options={{ title: 'USER MANAGEMENT', drawerIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      <Drawer.Screen name="Branches" component={BranchesScreen} options={{ title: 'BRANCHES', drawerIcon: ({ color, size }) => <GitBranch color={color} size={size} /> }} />
      <Drawer.Screen name="Departments" component={DepartmentsScreen} options={{ title: 'DEPARTMENTS', drawerIcon: ({ color, size }) => <Network color={color} size={size} /> }} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} options={{ title: 'CATEGORIES', drawerIcon: ({ color, size }) => <Tags color={color} size={size} /> }} />
      <Drawer.Screen name="ProjectsOverview" component={ProjectsScreen} options={{ title: 'PROJECTS OVERVIEW', drawerIcon: ({ color, size }) => <FolderKanban color={color} size={size} /> }} />
      <Drawer.Screen name="Issues" component={IssuesScreen} options={{ title: 'ISSUES', drawerIcon: ({ color, size }) => <AlertCircle color={color} size={size} /> }} />
      <Drawer.Screen name="Tasks" component={TasksScreen} options={{ title: 'TASKS', drawerIcon: ({ color, size }) => <CheckSquare color={color} size={size} /> }} />
      <Drawer.Screen name="TaskTemplates" component={TaskTemplatesScreen} options={{ title: 'TASK TEMPLATES', drawerIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
      <Drawer.Screen name="DailyLogs" component={DailyLogsScreen} options={{ title: 'DAILY LOGS', drawerIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Drawer.Screen name="Salary" component={SalaryScreen} options={{ title: 'SALARY', drawerIcon: ({ color, size }) => <DollarSign color={color} size={size} /> }} />
      <Drawer.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} options={{ title: 'LEAVE APPROVALS', drawerIcon: ({ color, size }) => <CalendarCheck color={color} size={size} /> }} />
      <Drawer.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'EXPENSES', drawerIcon: ({ color, size }) => <CreditCard color={color} size={size} /> }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: 'REPORTS', drawerIcon: ({ color, size }) => <BarChart2 color={color} size={size} /> }} />
      <Drawer.Screen name="EmployeeReport" component={EmployeeReportScreen} options={{ title: 'EMPLOYEE REPORT', drawerIcon: ({ color, size }) => <FileBarChart color={color} size={size} /> }} />
      <Drawer.Screen name="ActivityLogs" component={ActivityLogs} options={{ title: 'AUDIT LOGS', drawerIcon: ({ color, size }) => <Activity color={color} size={size} /> }} />
      <Drawer.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'LEADERBOARD', drawerIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'SETTINGS', drawerIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
      <Drawer.Screen name="Permissions" component={PermissionsScreen} options={{ title: 'PERMISSIONS', drawerIcon: ({ color, size }) => <Shield color={color} size={size} /> }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'NOTIFICATIONS', drawerIcon: ({ color, size }) => <Bell color={color} size={size} /> }} />
    </Drawer.Navigator>
  );
}
