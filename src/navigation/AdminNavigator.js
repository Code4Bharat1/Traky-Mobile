import React from 'react';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { 
  LayoutDashboard, Users, Activity, GitBranch, Network, 
  Tags, FolderKanban, AlertCircle, CheckSquare, FileText, 
  ClipboardList, DollarSign, CalendarCheck, CreditCard, 
  BarChart2, FileBarChart, Trophy, Settings, Shield, Bell, LogOut 
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';

import AdminHeader from '../components/AdminHeader';
import AdminTabNavigator from './AdminTabNavigator';

import AdminDashboard from '../screens/Admin/AdminDashboard';
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

const Drawer = createDrawerNavigator();

export default function AdminNavigator() {
  const logout = useAuthStore(state => state.logout);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1, paddingTop: 40 }}>
          <DrawerItemList {...props} />
          
          {/* Manual Drawer Items to route to Tabs */}
          <DrawerItem 
            label="DASHBOARD" 
            icon={({ color, size }) => <LayoutDashboard color={color} size={size} />}
            labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}
            inactiveTintColor="#c2c6d6"
            onPress={() => props.navigation.navigate('AdminTabs', { screen: 'DashboardTab' })}
          />
          <DrawerItem 
            label="TASKS" 
            icon={({ color, size }) => <CheckSquare color={color} size={size} />}
            labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}
            inactiveTintColor="#c2c6d6"
            onPress={() => props.navigation.navigate('AdminTabs', { screen: 'Tasks' })}
          />
          <DrawerItem 
            label="DAILY LOGS" 
            icon={({ color, size }) => <ClipboardList color={color} size={size} />}
            labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}
            inactiveTintColor="#c2c6d6"
            onPress={() => props.navigation.navigate('AdminTabs', { screen: 'DailyLogs' })}
          />
          <DrawerItem 
            label="LEADERBOARD" 
            icon={({ color, size }) => <Trophy color={color} size={size} />}
            labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}
            inactiveTintColor="#c2c6d6"
            onPress={() => props.navigation.navigate('AdminTabs', { screen: 'Leaderboard' })}
          />
          <DrawerItem 
            label="SETTINGS" 
            icon={({ color, size }) => <Settings color={color} size={size} />}
            labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}
            inactiveTintColor="#c2c6d6"
            onPress={() => props.navigation.navigate('AdminTabs', { screen: 'Settings' })}
          />

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
        header: ({ navigation, route, options }) => {
          let title = options.title || route.name;
          if (route.name === 'AdminTabs') {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'DashboardTab';
            switch (routeName) {
              case 'DashboardTab': title = 'DASHBOARD'; break;
              case 'Tasks': title = 'TASKS'; break;
              case 'DailyLogs': title = 'DAILY LOGS'; break;
              case 'Leaderboard': title = 'LEADERBOARD'; break;
              case 'Settings': title = 'SETTINGS'; break;
              default: title = 'OVERVIEW'; break;
            }
          }
          return <AdminHeader navigation={navigation} title={title} />;
        },
        drawerStyle: { backgroundColor: '#131313', width: 280 },
        drawerActiveBackgroundColor: '#adc6ff',
        drawerActiveTintColor: '#131313',
        drawerInactiveTintColor: '#c2c6d6',
        drawerLabelStyle: { fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
      }}
    >
      {/* Hidden Tab Navigator - FIRST SO IT IS INITIAL ROUTE */}
      <Drawer.Screen 
        name="AdminTabs" 
        component={AdminTabNavigator} 
        options={{ 
          title: 'APP MODULES',
          drawerItemStyle: { display: 'none' } 
        }} 
      />

      {/* Other independent screens */}
      <Drawer.Screen name="UserManagement" component={UserManagement} options={{ title: 'USER MANAGEMENT', drawerIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      <Drawer.Screen name="Branches" component={BranchesScreen} options={{ title: 'BRANCHES', drawerIcon: ({ color, size }) => <GitBranch color={color} size={size} /> }} />
      <Drawer.Screen name="Departments" component={DepartmentsScreen} options={{ title: 'DEPARTMENTS', drawerIcon: ({ color, size }) => <Network color={color} size={size} /> }} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} options={{ title: 'CATEGORIES', drawerIcon: ({ color, size }) => <Tags color={color} size={size} /> }} />
      <Drawer.Screen name="ProjectsOverview" component={ProjectsScreen} options={{ title: 'PROJECTS OVERVIEW', drawerIcon: ({ color, size }) => <FolderKanban color={color} size={size} /> }} />
      <Drawer.Screen name="Issues" component={IssuesScreen} options={{ title: 'ISSUES', drawerIcon: ({ color, size }) => <AlertCircle color={color} size={size} /> }} />
      <Drawer.Screen name="TaskTemplates" component={TaskTemplatesScreen} options={{ title: 'TASK TEMPLATES', drawerIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
      <Drawer.Screen name="Salary" component={SalaryScreen} options={{ title: 'SALARY', drawerIcon: ({ color, size }) => <DollarSign color={color} size={size} /> }} />
      <Drawer.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} options={{ title: 'LEAVE APPROVALS', drawerIcon: ({ color, size }) => <CalendarCheck color={color} size={size} /> }} />
      <Drawer.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'EXPENSES', drawerIcon: ({ color, size }) => <CreditCard color={color} size={size} /> }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: 'REPORTS', drawerIcon: ({ color, size }) => <BarChart2 color={color} size={size} /> }} />
      <Drawer.Screen name="EmployeeReport" component={EmployeeReportScreen} options={{ title: 'EMPLOYEE REPORT', drawerIcon: ({ color, size }) => <FileBarChart color={color} size={size} /> }} />
      <Drawer.Screen name="ActivityLogs" component={ActivityLogs} options={{ title: 'AUDIT LOGS', drawerIcon: ({ color, size }) => <Activity color={color} size={size} /> }} />
      <Drawer.Screen name="Permissions" component={PermissionsScreen} options={{ title: 'PERMISSIONS', drawerIcon: ({ color, size }) => <Shield color={color} size={size} /> }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'NOTIFICATIONS', drawerIcon: ({ color, size }) => <Bell color={color} size={size} /> }} />
    </Drawer.Navigator>
  );
}
