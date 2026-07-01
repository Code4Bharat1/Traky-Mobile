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
    <Drawer.Navigator
      drawerContent={(props) => {
        // Determine active screen to highlight the correct drawer item
        const activeRoute = props.state.routes[props.state.index];
        let activeScreen = null;

        if (activeRoute.name === 'DeptHeadTabs' && activeRoute.state) {
          const currentTab = activeRoute.state.routes[activeRoute.state.index || 0];
          if (currentTab.name === 'DashboardTab' && currentTab.state) {
            activeScreen = currentTab.state.routes[currentTab.state.index || 0].name;
          } else {
            activeScreen = currentTab.name;
          }
        } else {
          activeScreen = 'DeptHeadDashboardMain';
        }

        return (
          <DrawerContentScrollView
            {...props}
            contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
          >
            {/* ── Header ── */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 56,
                paddingBottom: 24,
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#7c3aed',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={16} color="#ffffff" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: isDarkMode ? '#ffffff' : '#111827',
                    letterSpacing: 2,
                  }}
                >
                  TRAKY
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: '#6b7280',
                    letterSpacing: 1.5,
                    marginTop: 2,
                  }}
                >
                  DEPT HEAD PORTAL
                </Text>
              </View>
            </View>

            {/* ── Menu Items ── */}
            {MENU_ITEMS.map((item, index) => {
              const isFocused = activeScreen === item.screen;
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
                    if (DIRECT_TABS.includes(item.screen)) {
                      // Navigate directly to the tab
                      props.navigation.navigate('DeptHeadTabs', {
                        screen: item.screen,
                      });
                    } else {
                      // Navigate into the DashboardTab's MainStack
                      props.navigation.navigate('DeptHeadTabs', {
                        screen: 'DashboardTab',
                        params: { screen: item.screen },
                      });
                    }
                  }}
                />
              );
            })}

            {/* ── Sign Out ── */}
            <DrawerItem
              label="SIGN OUT"
              icon={({ size }) => <LogOut color="#ef4444" size={size} />}
              labelStyle={{
                fontWeight: 'bold',
                fontSize: 13,
                letterSpacing: 1,
                color: '#ef4444',
              }}
              onPress={() => logout()}
              style={{
                marginTop: 'auto',
                marginBottom: 20,
                borderTopWidth: 1,
                borderTopColor: isDarkMode ? '#333' : '#e5e7eb',
                paddingTop: 10,
              }}
            />
          </DrawerContentScrollView>
        );
      }}
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
