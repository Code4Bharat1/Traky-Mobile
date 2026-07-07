import React from 'react';
import { View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import {
  LayoutDashboard, FolderKanban, ListTodo, Bug, Users, Users2,
  Umbrella, CreditCard, BarChart3, BookCheck, BookOpen, FileText,
  Bell, LogOut, ClipboardList, Trophy,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import LeadTabNavigator from './LeadTabNavigator';

const Drawer = createDrawerNavigator();

const MENU_ITEMS = [
  { label: 'DASHBOARD',       icon: LayoutDashboard, screen: 'LeadDashboardMain', direct: false },
  { label: 'PROJECTS',        icon: FolderKanban,    screen: 'Projects',          direct: false },
  { label: 'TASKS',           icon: ListTodo,        screen: 'Tasks',             direct: true  },
  { label: 'ISSUES',          icon: Bug,             screen: 'Issues',            direct: false },
  { label: 'EMPLOYEES',       icon: Users,           screen: 'Employees',         direct: false },
  { label: 'TEAM ATTENDANCE', icon: Users2,          screen: 'TeamAttendance',    direct: false },
  { label: 'LEAVE APPROVALS', icon: Umbrella,        screen: 'LeaveApprovals',    direct: false },
  { label: 'EXPENSES',        icon: CreditCard,      screen: 'Expenses',          direct: false },
  { label: 'LEADERBOARD',     icon: BarChart3,       screen: 'Leaderboard',       direct: true  },
  { label: 'DAILY LOGS',      icon: BookCheck,       screen: 'DailyLogs',         direct: true  },
  { label: 'KT DOCUMENTS',    icon: BookOpen,        screen: 'KTDocuments',       direct: false },
  { label: 'REPORTS',         icon: FileText,        screen: 'Reports',           direct: false },
  { label: 'EMPLOYEE REPORT', icon: BarChart3,       screen: 'EmployeeReport',    direct: false },
  { label: 'NOTIFICATIONS',   icon: Bell,            screen: 'Notifications',     direct: true  },
];

const DIRECT_TABS = ['Tasks', 'Leaderboard', 'DailyLogs', 'Notifications'];

export default function LeadNavigator() {
  const { logout } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  return (
    <Drawer.Navigator
      drawerContent={(props) => {
        const activeRoute = props.state.routes[props.state.index];
        let activeScreen = 'LeadDashboardMain';
        if (activeRoute.name === 'LeadTabs' && activeRoute.state) {
          const currentTab = activeRoute.state.routes[activeRoute.state.index || 0];
          if (currentTab.name === 'DashboardTab' && currentTab.state) {
            activeScreen = currentTab.state.routes[currentTab.state.index || 0].name;
          } else {
            activeScreen = currentTab.name;
          }
        }

        return (
          <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}>
            {/* Header */}
            <View style={{
              paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24,
              borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
              marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12,
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2573e6', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color="#ffffff" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#111827', letterSpacing: 2 }}>TRAKY</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#6b7280', letterSpacing: 1.5, marginTop: 2 }}>LEAD PORTAL</Text>
              </View>
            </View>

            {/* Menu Items */}
            {MENU_ITEMS.map((item, index) => (
              <DrawerItem
                key={index}
                label={item.label}
                icon={({ color, size }) => <item.icon color={color} size={size} />}
                labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}
                focused={activeScreen === item.screen}
                activeTintColor={isDarkMode ? '#131313' : '#2573e6'}
                activeBackgroundColor={isDarkMode ? '#adc6ff' : '#ebf3fc'}
                inactiveTintColor={isDarkMode ? '#c2c6d6' : '#6b7280'}
                onPress={() => {
                  if (DIRECT_TABS.includes(item.screen)) {
                    props.navigation.navigate('LeadTabs', { screen: item.screen });
                  } else {
                    props.navigation.navigate('LeadTabs', { screen: 'DashboardTab', params: { screen: item.screen } });
                  }
                }}
              />
            ))}

            {/* Sign Out */}
            <DrawerItem
              label="SIGN OUT"
              icon={({ size }) => <LogOut color="#ef4444" size={size} />}
              labelStyle={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1, color: '#ef4444' }}
              onPress={logout}
              style={{ marginTop: 'auto', marginBottom: 20, borderTopWidth: 1, borderTopColor: isDarkMode ? '#333' : '#e5e7eb', paddingTop: 10 }}
            />
          </DrawerContentScrollView>
        );
      }}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: isDarkMode ? '#131313' : '#ffffff', width: 280 },
      }}>
      <Drawer.Screen
        name="LeadTabs"
        component={LeadTabNavigator}
        options={{ title: 'APP MODULES', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}
