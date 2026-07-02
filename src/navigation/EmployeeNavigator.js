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
  CalendarCheck,
  Umbrella,
  BarChart2,
  CreditCard,
  FolderKanban,
  CheckSquare,
  FileText,
  ClipboardList,
  AlertCircle,
  BookOpen,
  Trophy,
  Bell,
  LogOut,
  Shield,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

import EmployeeTabNavigator from './EmployeeTabNavigator';

const Drawer = createDrawerNavigator();

const MENU_ITEMS = [
  { label: 'DASHBOARD', icon: LayoutDashboard, route: 'EmployeeTabs', screen: 'EmployeeDashboardMain' },
  { label: 'ATTENDANCE', icon: CalendarCheck, route: 'EmployeeTabs', screen: 'Attendance', featureKey: 'attendance' },
  { label: 'MY LEAVES', icon: Umbrella, route: 'EmployeeTabs', screen: 'MyLeaves', featureKey: 'attendance' },
  { label: 'REPORTS', icon: BarChart2, route: 'EmployeeTabs', screen: 'Reports', featureKey: 'reports', resourceKey: 'reports' },
  { label: 'EXPENSES', icon: CreditCard, route: 'EmployeeTabs', screen: 'Expenses' },
  { label: 'MY PROJECTS', icon: FolderKanban, route: 'EmployeeTabs', screen: 'MyProjects', featureKey: 'projects', resourceKey: 'projects' },
  { label: 'TASKS', icon: CheckSquare, route: 'EmployeeTabs', screen: 'Tasks', featureKey: 'tasks', resourceKey: 'tasks' },
  { label: 'TEMPLATES', icon: FileText, route: 'EmployeeTabs', screen: 'Templates', featureKey: 'tasks' },
  { label: 'DAILY LOGS', icon: ClipboardList, route: 'EmployeeTabs', screen: 'DailyLogs', featureKey: 'dailyLogs', resourceKey: 'dailyLogs' },
  { label: 'ISSUES', icon: AlertCircle, route: 'EmployeeTabs', screen: 'Issues', featureKey: 'bugs', resourceKey: 'bugs' },
  { label: 'KT DOCUMENTS', icon: BookOpen, route: 'EmployeeTabs', screen: 'KtDocuments', featureKey: 'ktDocuments', resourceKey: 'ktDocuments' },
  { label: 'LEADERBOARD', icon: Trophy, route: 'EmployeeTabs', screen: 'Leaderboard', featureKey: 'leaderboard' },
  { label: 'NOTIFICATIONS', icon: Bell, route: 'EmployeeTabs', screen: 'Notifications' },
];

function EmployeeDrawerContent(props) {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const { isDarkMode } = useThemeStore();

  const state = props.state;
  const activeRoute = state.routes[state.index];
  const activeDrawerName = activeRoute.name;
  const activeTabName = getFocusedRouteNameFromRoute(activeRoute) ?? 'DashboardTab'; 

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'E';

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
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2573e6', alignItems: 'center', justifyContent: 'center' }}>
          <Shield color="#ffffff" size={16} />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#111827', letterSpacing: 2 }}>TRAKY</Text>
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#6b7280', letterSpacing: 1.5, marginTop: 2 }}>EMPLOYEE PORTAL</Text>
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
        if (item.route === 'EmployeeTabs') {
          // Some screens are directly bottom tabs, some are inside DashboardTab stack
          const directTabs = ['Tasks', 'DailyLogs', 'Leaderboard'];
          if (directTabs.includes(item.screen)) {
            isFocused = activeTabName === item.screen;
          } else if (item.screen === 'EmployeeDashboardMain') {
            isFocused = activeTabName === 'DashboardTab';
          } else {
            // Wait, for nested stack screens inside DashboardTab, getFocusedRouteNameFromRoute might return 'DashboardTab'
            // To be perfectly accurate we'd need to inspect the nested state, but keeping it simple for now.
            isFocused = activeTabName === item.screen; // Might not perfectly highlight in drawer if deeply nested, but works
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
                  const directTabs = ['Tasks', 'DailyLogs', 'Leaderboard'];
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

export default function EmployeeNavigator() {
  const { isDarkMode } = useThemeStore();

  return (
    <Drawer.Navigator
      drawerContent={EmployeeDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: isDarkMode ? '#131313' : '#ffffff', width: 280 },
      }}
    >
      <Drawer.Screen 
        name="EmployeeTabs" 
        component={EmployeeTabNavigator} 
        options={{ title: 'APP MODULES', drawerItemStyle: { display: 'none' } }} 
      />
    </Drawer.Navigator>
  );
}
