import React from 'react';
import { View, Text } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
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

// ── Drawer menu items — mirrors the DeptHead permission scope exactly ──────────
const MENU_ITEMS = [
  { label: 'DASHBOARD',       icon: LayoutDashboard, screen: 'DeptHeadDashboardMain', tab: 'DashboardTab' },
  { label: 'PROJECTS',        icon: FolderKanban,    screen: 'Projects',              tab: 'DashboardTab' },
  { label: 'TASKS',           icon: ListTodo,        screen: 'Tasks',                 tab: null           }, // direct tab
  { label: 'ISSUES',          icon: Bug,             screen: 'Issues',                tab: 'DashboardTab' },
  { label: 'EMPLOYEES',       icon: Users,           screen: 'Employee',              tab: 'DashboardTab' },
  { label: 'TEAM ATTENDANCE', icon: Users2,          screen: 'TeamAttendance',        tab: 'DashboardTab' },
  { label: 'LEAVE APPROVALS', icon: Umbrella,        screen: 'LeaveApprovals',        tab: 'DashboardTab' },
  { label: 'EXPENSES',        icon: CreditCard,      screen: 'Expenses',              tab: 'DashboardTab' },
  { label: 'LEADERBOARD',     icon: BarChart3,       screen: 'Leaderboard',           tab: null           }, // direct tab
  { label: 'DAILY LOGS',      icon: BookCheck,       screen: 'DailyLogs',             tab: null           }, // direct tab
  { label: 'KT DOCUMENTS',    icon: BookOpen,        screen: 'KTDocuments',           tab: 'DashboardTab' },
  { label: 'REPORTS',         icon: FileText,        screen: 'Reports',               tab: 'DashboardTab' },
  { label: 'EMPLOYEE REPORT', icon: BarChart3,       screen: 'EmployeeReport',        tab: 'DashboardTab' },
  { label: 'NOTIFICATIONS',   icon: Bell,            screen: 'Notifications',         tab: null           }, // direct tab
];

// Screens that are direct tab routes (not nested inside DashboardTab/MainStack)
const DIRECT_TABS = ['Tasks', 'Leaderboard', 'DailyLogs', 'Notifications'];

export default function DeptHeadNavigator() {
  const { user, logout } = useAuthStore();
  const { isDarkMode }   = useThemeStore();

  return (
    <View style={styles.drawerContainer}>
      {/* ── Header ── */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerBrand}>TRAKY</Text>
        <Text style={styles.drawerSubtitle}>DEPT HEAD PORTAL</Text>
      </View>

      {/* ── Nav Items ── */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={[styles.navItem, isActive && styles.navItemActive]}
              activeOpacity={0.7}
            >
              <item.Icon
                size={18}
                color={isActive ? '#131313' : '#c2c6d6'}
                strokeWidth={1.75}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* ── Sign Out ── */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={logout}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <LogOut size={16} color="#ef4444" strokeWidth={1.75} style={{ marginLeft: 8 }} />
        <Text style={styles.signOutLabel}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────
export default function DeptHeadNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DeptHeadDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: isDarkMode ? '#131313' : '#ffffff',
          width: 280,
        },
      }}
    >
      {/* Single hidden screen that renders the full Tab navigator */}
      <Drawer.Screen
        name="DeptHeadTabs"
        component={DeptHeadTabNavigator}
        options={{ title: 'APP MODULES', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}
