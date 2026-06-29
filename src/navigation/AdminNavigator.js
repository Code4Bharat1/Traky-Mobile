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

// Screens are now imported and handled inside AdminTabNavigator.js
// to keep the bottom tab bar visible across all screens.

const Drawer = createDrawerNavigator();

const MENU_ITEMS = [
  { label: 'DASHBOARD', icon: LayoutDashboard, route: 'AdminTabs', screen: 'AdminDashboardMain', feature: 'dashboard' },
  { label: 'USER MANAGEMENT', icon: Users, route: 'AdminTabs', screen: 'UserManagement', feature: 'users' },
  { label: 'BRANCHES', icon: GitBranch, route: 'AdminTabs', screen: 'Branches' },
  { label: 'DEPARTMENTS', icon: Network, route: 'AdminTabs', screen: 'Departments', feature: 'departments' },
  { label: 'CATEGORIES', icon: Tags, route: 'AdminTabs', screen: 'Categories', feature: 'categories' },
  { label: 'PROJECTS OVERVIEW', icon: FolderKanban, route: 'AdminTabs', screen: 'ProjectsOverview', feature: 'projects' },
  { label: 'ISSUES', icon: AlertCircle, route: 'AdminTabs', screen: 'Issues', feature: 'bugs' },
  { label: 'TASKS', icon: CheckSquare, route: 'AdminTabs', screen: 'Tasks', feature: 'tasks' },
  { label: 'TASK TEMPLATES', icon: FileText, route: 'AdminTabs', screen: 'TaskTemplates', feature: 'taskTemplates' },
  { label: 'DAILY LOGS', icon: ClipboardList, route: 'AdminTabs', screen: 'DailyLogs', feature: 'dailyLogs' },
  { label: 'SALARY', icon: DollarSign, route: 'AdminTabs', screen: 'Salary', feature: 'salary' },
  { label: 'LEAVE APPROVALS', icon: CalendarCheck, route: 'AdminTabs', screen: 'LeaveApprovals', feature: 'leave' },
  { label: 'EXPENSES', icon: CreditCard, route: 'AdminTabs', screen: 'Expenses', feature: 'expenses' },
  { label: 'REPORTS', icon: BarChart2, route: 'AdminTabs', screen: 'Reports', feature: 'reports' },
  { label: 'EMPLOYEE REPORT', icon: FileBarChart, route: 'AdminTabs', screen: 'EmployeeReport', feature: 'reports' },
  { label: 'AUDIT LOGS', icon: Activity, route: 'AdminTabs', screen: 'ActivityLogs' },
  { label: 'LEADERBOARD', icon: Trophy, route: 'AdminTabs', screen: 'Leaderboard', feature: 'leaderboard' },
  { label: 'SETTINGS', icon: Settings, route: 'AdminTabs', screen: 'Settings', feature: 'settings' },
  { label: 'PERMISSIONS', icon: Shield, route: 'AdminTabs', screen: 'Permissions', feature: 'permissions' },
  { label: 'NOTIFICATIONS', icon: Bell, route: 'AdminTabs', screen: 'Notifications' },
];

export default function AdminNavigator() {
  const { user, logout } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  return (
    <Drawer.Navigator
      drawerContent={(props) => {
        // Determine active route
        const activeRoute = props.state.routes[props.state.index];
        let activeDrawerName = activeRoute.name;
        let activeTabName = null;

        if (activeDrawerName === 'AdminTabs') {
          if (activeRoute.state && activeRoute.state.routes) {
            const currentTab = activeRoute.state.routes[activeRoute.state.index || 0];
            if (currentTab.name === 'DashboardTab' && currentTab.state) {
               // We are inside the MainStack of DashboardTab
               activeTabName = currentTab.state.routes[currentTab.state.index || 0].name;
            } else {
               activeTabName = currentTab.name;
            }
          } else {
            activeTabName = 'AdminDashboardMain';
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
            {MENU_ITEMS.filter(item => {
              if (item.feature && user?.enabledFeatures && user.enabledFeatures[item.feature] === false) {
                return false;
              }
              return true;
            }).map((item, index) => {
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
                      const directTabs = ['Tasks', 'DailyLogs', 'Leaderboard', 'Settings'];
                      if (directTabs.includes(item.screen)) {
                        props.navigation.navigate(item.route, { screen: item.screen });
                      } else {
                        props.navigation.navigate(item.route, { 
                          screen: 'DashboardTab',
                          params: { screen: item.screen }
                        });
                      }
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
        headerShown: false,
        drawerStyle: { backgroundColor: isDarkMode ? '#131313' : '#ffffff', width: 280 },
      }}
    >
      {/* Hidden Tab Navigator - ONLY ROOT ROUTE SO TABS PERSIST */}
      <Drawer.Screen 
        name="AdminTabs" 
        component={AdminTabNavigator} 
        options={{ title: 'APP MODULES', drawerItemStyle: { display: 'none' } }} 
      />
    </Drawer.Navigator>
  );
}
