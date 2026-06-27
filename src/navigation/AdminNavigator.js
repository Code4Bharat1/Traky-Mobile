import React from 'react';
import { View, Text } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { 
  LayoutDashboard, Users, Activity, GitBranch, Network, 
  Tags, FolderKanban, AlertCircle, CheckSquare, FileText, 
  ClipboardList, DollarSign, CalendarCheck, CreditCard, 
  BarChart2, FileBarChart, Trophy, Settings, Shield, Bell, LogOut 
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

import AdminHeader from '../components/AdminHeader';
import AdminTabNavigator from './AdminTabNavigator';

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

const MENU_ITEMS = [
  { label: 'DASHBOARD', icon: LayoutDashboard, route: 'AdminTabs', screen: 'DashboardTab' },
  { label: 'USER MANAGEMENT', icon: Users, route: 'UserManagement' },
  { label: 'BRANCHES', icon: GitBranch, route: 'Branches' },
  { label: 'DEPARTMENTS', icon: Network, route: 'Departments' },
  { label: 'CATEGORIES', icon: Tags, route: 'Categories' },
  { label: 'PROJECTS OVERVIEW', icon: FolderKanban, route: 'ProjectsOverview' },
  { label: 'ISSUES', icon: AlertCircle, route: 'Issues' },
  { label: 'TASKS', icon: CheckSquare, route: 'AdminTabs', screen: 'Tasks' },
  { label: 'TASK TEMPLATES', icon: FileText, route: 'TaskTemplates' },
  { label: 'DAILY LOGS', icon: ClipboardList, route: 'AdminTabs', screen: 'DailyLogs' },
  { label: 'SALARY', icon: DollarSign, route: 'Salary' },
  { label: 'LEAVE APPROVALS', icon: CalendarCheck, route: 'LeaveApprovals' },
  { label: 'EXPENSES', icon: CreditCard, route: 'Expenses' },
  { label: 'REPORTS', icon: BarChart2, route: 'Reports' },
  { label: 'EMPLOYEE REPORT', icon: FileBarChart, route: 'EmployeeReport' },
  { label: 'AUDIT LOGS', icon: Activity, route: 'ActivityLogs' },
  { label: 'LEADERBOARD', icon: Trophy, route: 'AdminTabs', screen: 'Leaderboard' },
  { label: 'SETTINGS', icon: Settings, route: 'AdminTabs', screen: 'Settings' },
  { label: 'PERMISSIONS', icon: Shield, route: 'Permissions' },
  { label: 'NOTIFICATIONS', icon: Bell, route: 'Notifications' },
];

export default function AdminNavigator() {
  const logout = useAuthStore(state => state.logout);
  const { isDarkMode } = useThemeStore();

  return (
    <Drawer.Navigator
      drawerContent={(props) => {
        // Determine active route
        const activeRoute = props.state.routes[props.state.index];
        let activeDrawerName = activeRoute.name;
        let activeTabName = null;

        if (activeDrawerName === 'AdminTabs') {
          if (activeRoute.state && typeof activeRoute.state.index === 'number') {
            activeTabName = activeRoute.state.routes[activeRoute.state.index].name;
          } else {
            // Default to DashboardTab if AdminTabs is focused but state not initialized yet
            activeTabName = 'DashboardTab';
          }
        }

        return (
          <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}>
            {/* Header */}
            <View style={{
              paddingHorizontal: 20,
              paddingTop: 56,
              paddingBottom: 24,
              borderBottomWidth: 1,
              borderBottomColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2573e6', alignItems: 'center', justifyContent: 'center' }}>
                <Shield color="#ffffff" size={16} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#111827', letterSpacing: 2 }}>TRAKY</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#6b7280', letterSpacing: 1.5, marginTop: 2 }}>ADMIN PORTAL</Text>
              </View>
            </View>

            {/* Menu Items in Sequence */}
            {MENU_ITEMS.map((item, index) => {
              let isFocused = false;
              if (item.route === 'AdminTabs') {
                isFocused = activeDrawerName === 'AdminTabs' && activeTabName === item.screen;
              } else {
                isFocused = activeDrawerName === item.route;
              }

              const Icon = item.icon;
              return (
                <DrawerItem
                  key={index}
                  label={item.label}
                  icon={({ color, size }) => <Icon color={color} size={size} />}
                  labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}
                  focused={isFocused}
                  activeTintColor={isDarkMode ? '#131313' : '#2573e6'}
                  activeBackgroundColor={isDarkMode ? '#adc6ff' : '#ebf3fc'}
                  inactiveTintColor={isDarkMode ? '#c2c6d6' : '#6b7280'}
                  onPress={() => {
                    if (item.screen) {
                      props.navigation.navigate(item.route, { screen: item.screen });
                    } else {
                      props.navigation.navigate(item.route);
                    }
                  }}
                />
              );
            })}

            {/* Sign Out at the bottom */}
            <DrawerItem 
              label="SIGN OUT" 
              icon={({ size }) => <LogOut color="#ef4444" size={size} />}
              labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1, color: '#ef4444' }}
              onPress={() => logout()}
              style={{ marginTop: 'auto', marginBottom: 20, borderTopWidth: 1, borderTopColor: isDarkMode ? '#333' : '#e5e7eb', paddingTop: 10 }}
            />
          </DrawerContentScrollView>
        );
      }}
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
        drawerStyle: { backgroundColor: isDarkMode ? '#131313' : '#ffffff', width: 280 },
      }}
    >
      {/* Hidden Tab Navigator - FIRST SO IT IS INITIAL ROUTE */}
      <Drawer.Screen 
        name="AdminTabs" 
        component={AdminTabNavigator} 
        options={{ title: 'APP MODULES', drawerItemStyle: { display: 'none' } }} 
      />

      {/* Other independent screens */}
      <Drawer.Screen name="UserManagement" component={UserManagement} options={{ title: 'USER MANAGEMENT' }} />
      <Drawer.Screen name="Branches" component={BranchesScreen} options={{ title: 'BRANCHES' }} />
      <Drawer.Screen name="Departments" component={DepartmentsScreen} options={{ title: 'DEPARTMENTS' }} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} options={{ title: 'CATEGORIES' }} />
      <Drawer.Screen name="ProjectsOverview" component={ProjectsScreen} options={{ title: 'PROJECTS OVERVIEW' }} />
      <Drawer.Screen name="Issues" component={IssuesScreen} options={{ title: 'ISSUES' }} />
      <Drawer.Screen name="TaskTemplates" component={TaskTemplatesScreen} options={{ title: 'TASK TEMPLATES' }} />
      <Drawer.Screen name="Salary" component={SalaryScreen} options={{ title: 'SALARY' }} />
      <Drawer.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} options={{ title: 'LEAVE APPROVALS' }} />
      <Drawer.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'EXPENSES' }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: 'REPORTS' }} />
      <Drawer.Screen name="EmployeeReport" component={EmployeeReportScreen} options={{ title: 'EMPLOYEE REPORT' }} />
      <Drawer.Screen name="ActivityLogs" component={ActivityLogs} options={{ title: 'AUDIT LOGS' }} />
      <Drawer.Screen name="Permissions" component={PermissionsScreen} options={{ title: 'PERMISSIONS' }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'NOTIFICATIONS' }} />
    </Drawer.Navigator>
  );
}
