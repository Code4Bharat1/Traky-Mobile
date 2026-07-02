import React from 'react';
import { View, Text } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Bug,
  Users,
  Users2,
  Umbrella,
  CreditCard,
  BarChart3,
  BookCheck,
  BookOpen,
  FileText,
  Bell,
  LogOut,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

import DeptHeadTabNavigator from './DeptHeadTabNavigator';

const Drawer = createDrawerNavigator();

const MENU_ITEMS = [
  { label: 'DASHBOARD',       icon: LayoutDashboard, route: 'DeptHeadTabs', screen: 'DeptHeadDashboardMain' },
  { label: 'PROJECTS',        icon: FolderKanban,    route: 'DeptHeadTabs', screen: 'Projects',        featureKey: 'projects', resourceKey: 'projects' },
  { label: 'TASKS',           icon: ListTodo,        route: 'DeptHeadTabs', screen: 'Tasks',           featureKey: 'tasks', resourceKey: 'tasks' },
  { label: 'ISSUES',          icon: Bug,             route: 'DeptHeadTabs', screen: 'Issues',          featureKey: 'bugs', resourceKey: 'bugs' },
  { label: 'EMPLOYEES',       icon: Users,           route: 'DeptHeadTabs', screen: 'Employee',        featureKey: 'users', resourceKey: 'users' },
  { label: 'TEAM ATTENDANCE', icon: Users2,          route: 'DeptHeadTabs', screen: 'TeamAttendance',  featureKey: 'attendance' },
  { label: 'LEAVE APPROVALS', icon: Umbrella,        route: 'DeptHeadTabs', screen: 'LeaveApprovals',  featureKey: 'attendance' },
  { label: 'EXPENSES',        icon: CreditCard,      route: 'DeptHeadTabs', screen: 'Expenses' },
  { label: 'LEADERBOARD',     icon: BarChart3,       route: 'DeptHeadTabs', screen: 'Leaderboard',     featureKey: 'leaderboard' },
  { label: 'DAILY LOGS',      icon: BookCheck,       route: 'DeptHeadTabs', screen: 'DailyLogs',       featureKey: 'dailyLogs', resourceKey: 'dailyLogs' },
  { label: 'KT DOCUMENTS',    icon: BookOpen,        route: 'DeptHeadTabs', screen: 'KTDocuments',     featureKey: 'ktDocuments', resourceKey: 'ktDocuments' },
  { label: 'REPORTS',         icon: FileText,        route: 'DeptHeadTabs', screen: 'Reports',         featureKey: 'reports', resourceKey: 'reports' },
  { label: 'EMPLOYEE REPORT', icon: BarChart3,       route: 'DeptHeadTabs', screen: 'EmployeeReport',  featureKey: 'reports', resourceKey: 'reports' },
  { label: 'NOTIFICATIONS',   icon: Bell,            route: 'DeptHeadTabs', screen: 'Notifications' },
];

function DeptHeadDrawerContent(props) {
  const { user, logout } = useAuthStore();
  const { isDarkMode }   = useThemeStore();

  const state = props.state;
  const activeRoute = state.routes[state.index];
  const activeTabName = getFocusedRouteNameFromRoute(activeRoute) ?? 'DashboardTab'; 

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'DH';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12
        }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
          <Users color="#ffffff" size={16} />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#111827', letterSpacing: 2 }}>TRAKY</Text>
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#6b7280', letterSpacing: 1.5, marginTop: 2 }}>DEPT HEAD PORTAL</Text>
        </View>
      </View>

      {MENU_ITEMS.map((item, index) => {
        // PERMISSIONS CHECK
        if (item.featureKey && user?.enabledFeatures && user.enabledFeatures[item.featureKey] === false) {
          return null;
        }
        if (item.resourceKey && user?.permissions) {
          const hasRead = user.permissions[item.resourceKey]?.read;
          if (!hasRead) return null;
        }

        let isFocused = false;
        if (item.route === 'DeptHeadTabs') {
          const directTabs = ['Tasks', 'DailyLogs', 'Leaderboard', 'Notifications'];
          if (directTabs.includes(item.screen)) {
            isFocused = activeTabName === item.screen;
          } else if (item.screen === 'DeptHeadDashboardMain') {
            isFocused = activeTabName === 'DashboardTab';
          } else {
            isFocused = activeTabName === item.screen; 
          }
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
                props.navigation.closeDrawer();
                setTimeout(() => {
                  const directTabs = ['Tasks', 'DailyLogs', 'Leaderboard', 'Notifications'];
                  if (directTabs.includes(item.screen)) {
                    props.navigation.navigate(item.route, { screen: item.screen });
                  } else {
                    props.navigation.navigate(item.route, { 
                      screen: 'DashboardTab',
                      params: { screen: item.screen }
                    });
                  }
                }, 100);
              }
            }}
          />
        );
      })}

      <DrawerItem
        label="SIGN OUT"
        icon={({ size }) => <LogOut color="#ef4444" size={size} />}
        labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1, color: '#ef4444' }}
        onPress={() => logout()}
        style={{
          marginTop: 'auto',
          marginBottom: 20,
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
          paddingTop: 10,
        }}
      />
    </DrawerContentScrollView>
  );
}

export default function DeptHeadNavigator() {
  const { isDarkMode } = useThemeStore();

  return (
    <Drawer.Navigator
      drawerContent={DeptHeadDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: isDarkMode ? '#131313' : '#ffffff', width: 280 },
      }}
    >
      <Drawer.Screen
        name="DeptHeadTabs"
        component={DeptHeadTabNavigator}
        options={{ title: 'APP MODULES', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}
