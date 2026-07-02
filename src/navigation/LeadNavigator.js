import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import {
  LayoutDashboard,
  Clock,
  Umbrella,
  Users,
  CheckSquare,
  ClipboardList,
  FileText,
  BarChart2,
  BookOpen,
  Bug,
  Trophy,
  Bell,
  LogOut,
  FolderOpen,
  FileStack,
  UserCheck,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';

// ── Screens ────────────────────────────────────────────────────────────────────
import LeadDashboard from '../screens/Lead/LeadDashboard';

// Placeholder screen factory for screens not yet built
function PlaceholderScreen({ route }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{route.name}</Text>
      <Text style={styles.placeholderSub}>Coming soon</Text>
    </View>
  );
}

const Drawer = createDrawerNavigator();

// ── Sidebar menu items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { name: 'Dashboard',       label: 'DASHBOARD',        Icon: LayoutDashboard, component: LeadDashboard },
  { name: 'Attendance',      label: 'ATTENDANCE',        Icon: Clock,           component: PlaceholderScreen },
  { name: 'MyLeaves',        label: 'MY LEAVES',         Icon: Umbrella,        component: PlaceholderScreen },
  { name: 'TeamAttendance',  label: 'TEAM ATTENDANCE',   Icon: Users,           component: PlaceholderScreen },
  { name: 'LeaveApprovals',  label: 'LEAVE APPROVALS',   Icon: UserCheck,       component: PlaceholderScreen },
  { name: 'Expenses',        label: 'EXPENSES',          Icon: CheckSquare,     component: PlaceholderScreen },
  { name: 'Projects',        label: 'PROJECTS',          Icon: FolderOpen,      component: PlaceholderScreen },
  { name: 'Tasks',           label: 'TASKS',             Icon: ClipboardList,   component: PlaceholderScreen },
  { name: 'Templates',       label: 'TEMPLATES',         Icon: FileStack,       component: PlaceholderScreen },
  { name: 'Reports',         label: 'REPORTS',           Icon: FileText,        component: PlaceholderScreen },
  { name: 'EmployeeReport',  label: 'EMPLOYEE REPORT',   Icon: BarChart2,       component: PlaceholderScreen },
  { name: 'DailyLogs',       label: 'DAILY LOGS',        Icon: BookOpen,        component: PlaceholderScreen },
  { name: 'Issues',          label: 'ISSUES',            Icon: Bug,             component: PlaceholderScreen },
  { name: 'KTDocuments',     label: 'KT DOCUMENTS',      Icon: FileText,        component: PlaceholderScreen },
  { name: 'Leaderboard',     label: 'LEADERBOARD',       Icon: Trophy,          component: PlaceholderScreen },
  { name: 'Notifications',   label: 'NOTIFICATIONS',     Icon: Bell,            component: PlaceholderScreen },
];

// ── Custom Drawer Content ──────────────────────────────────────────────────────
function LeadDrawerContent(props) {
  const { navigation, state } = props;
  const { logout, user } = useAuthStore();
  const activeIndex = state.index;

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <View style={styles.drawerContainer}>
      {/* ── Header ── */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerBrand}>TRAKY</Text>
        <Text style={styles.drawerSubtitle}>EMPLOYEE PORTAL</Text>
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
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0f172a',
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        drawerStyle: { width: 260, backgroundColor: '#ffffff' },
        swipeEdgeWidth: 60,
      }}>
      {NAV_ITEMS.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={item.component}
          options={{ title: item.label }}
        />
      ))}
    </Drawer.Navigator>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.1)',
  },
  drawerBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 2,
  },
  drawerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginHorizontal: 8,
    borderRadius: 6,
  },
  navItemActive: {
    backgroundColor: '#2573e6',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#1f2937',
  },
  navLabelActive: {
    color: '#ffffff',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,42,0.1)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  signOutLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#1f2937',
    marginLeft: 10,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  placeholderSub: {
    fontSize: 13,
    color: '#6b7280',
  },
});
