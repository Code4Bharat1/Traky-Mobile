import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import {
  LayoutDashboard, FolderKanban, ListTodo, Bug, Users, Users2,
  Umbrella, CreditCard, BarChart3, BookCheck, BookOpen, FileText,
  Bell, LogOut,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import LeadTabNavigator from './LeadTabNavigator';

const Drawer = createDrawerNavigator();

const NAV_ITEMS = [
  { name: 'LeadDashboardMain', label: 'DASHBOARD',       Icon: LayoutDashboard },
  { name: 'Projects',          label: 'PROJECTS',        Icon: FolderKanban    },
  { name: 'Tasks',             label: 'TASKS',           Icon: ListTodo        },
  { name: 'Issues',            label: 'ISSUES',          Icon: Bug             },
  { name: 'Employees',         label: 'EMPLOYEES',       Icon: Users           },
  { name: 'TeamAttendance',    label: 'TEAM ATTENDANCE', Icon: Users2          },
  { name: 'LeaveApprovals',    label: 'LEAVE APPROVALS', Icon: Umbrella        },
  { name: 'Expenses',          label: 'EXPENSES',        Icon: CreditCard      },
  { name: 'Leaderboard',       label: 'LEADERBOARD',     Icon: BarChart3       },
  { name: 'DailyLogs',         label: 'DAILY LOGS',      Icon: BookCheck       },
  { name: 'KTDocuments',       label: 'KT DOCUMENTS',    Icon: BookOpen        },
  { name: 'Reports',           label: 'REPORTS',         Icon: FileText        },
  { name: 'EmployeeReport',    label: 'EMPLOYEE REPORT', Icon: BarChart3       },
  { name: 'Notifications',     label: 'NOTIFICATIONS',   Icon: Bell            },
];

// ── Drawer Content Component ──────────────────────────────────────────────────
function LeadDrawerContent(props) {
  const { navigation, state } = props;
  const { logout, user } = useAuthStore();

  const activeIndex = state?.index ?? 0;

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <View style={styles.drawerContainer}>
      {/* ── Header ── */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerBrand}>TRAKY</Text>
        <Text style={styles.drawerSubtitle}>LEAD PORTAL</Text>
      </View>

      {/* ── Nav Items ── */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => {
                navigation.closeDrawer();
                setTimeout(() => {
                  navigation.navigate(item.name);
                }, 100);
              }}
              style={[styles.navItem, isActive && styles.navItemActive]}
              activeOpacity={0.7}>
              <item.Icon
                size={18}
                color={isActive ? '#ffffff' : '#1f2937'}
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
        activeOpacity={0.8}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <LogOut size={16} color="#1f2937" strokeWidth={1.75} style={{ marginLeft: 8 }} />
        <Text style={styles.signOutLabel}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────
export default function LeadNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={LeadDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#ffffff', width: 280 },
      }}>
      <Drawer.Screen
        name="LeadTabs"
        component={LeadTabNavigator}
        options={{ title: 'APP MODULES', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#ffffff' },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  drawerBrand: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 2,
  },
  drawerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  scrollContent: { paddingVertical: 12 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  navItemActive: { backgroundColor: '#ebf3fc' },
  navLabel: {
    marginLeft: 16,
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 1,
  },
  navLabelActive: { color: '#2573e6' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  signOutLabel: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 1,
  },
});
