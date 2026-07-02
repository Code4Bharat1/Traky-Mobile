import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
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

// ── Screens ────────────────────────────────────────────────────────────────────
import DeptHeadDashboard      from '../screens/DeptHead/DeptHeadDashboard';
import ProjectsScreen         from '../screens/DeptHead/ProjectsScreen';
import TasksScreen            from '../screens/DeptHead/TasksScreen';
import IssuesScreen           from '../screens/DeptHead/IssuesScreen';
import EmployeeScreen         from '../screens/DeptHead/EmployeeScreen';
import TeamAttendanceScreen   from '../screens/DeptHead/TeamAttendanceScreen';
import LeaveApprovalsScreen   from '../screens/DeptHead/LeaveApprovalsScreen';
import ExpensesScreen         from '../screens/DeptHead/ExpensesScreen';
import LeaderboardScreen      from '../screens/DeptHead/LeaderboardScreen';
import DailyLogsScreen        from '../screens/DeptHead/DailyLogsScreen';
import KTDocumentsScreen      from '../screens/DeptHead/KTDocumentsScreen';
import ReportsScreen          from '../screens/DeptHead/ReportsScreen';
import EmployeeReportScreen   from '../screens/DeptHead/EmployeeReportScreen';
import NotificationsScreen    from '../screens/DeptHead/NotificationsScreen';

const Drawer = createDrawerNavigator();

// ── Sidebar config — mirrors web dept-head NAV_ITEMS exactly ──────────────────
const NAV_ITEMS = [
  { name: 'Dashboard',       label: 'DASHBOARD',        Icon: LayoutDashboard, component: DeptHeadDashboard },
  { name: 'Projects',        label: 'PROJECTS',          Icon: FolderKanban,    component: ProjectsScreen },
  { name: 'Tasks',           label: 'TASKS',             Icon: ListTodo,        component: TasksScreen },
  { name: 'Issues',          label: 'ISSUES',            Icon: Bug,             component: IssuesScreen },
  { name: 'Employee',        label: 'EMPLOYEE',          Icon: Users,           component: EmployeeScreen },
  { name: 'TeamAttendance',  label: 'TEAM ATTENDANCE',   Icon: Users2,          component: TeamAttendanceScreen },
  { name: 'LeaveApprovals',  label: 'LEAVE APPROVALS',   Icon: Umbrella,        component: LeaveApprovalsScreen },
  { name: 'Expenses',        label: 'EXPENSES',          Icon: CreditCard,      component: ExpensesScreen },
  { name: 'Leaderboard',     label: 'LEADERBOARD',       Icon: BarChart3,       component: LeaderboardScreen },
  { name: 'DailyLogs',       label: 'DAILY LOGS',        Icon: BookCheck,       component: DailyLogsScreen },
  { name: 'KTDocuments',     label: 'KT DOCUMENTS',      Icon: BookOpen,        component: KTDocumentsScreen },
  { name: 'Reports',         label: 'REPORTS',           Icon: FileText,        component: ReportsScreen },
  { name: 'EmployeeReport',  label: 'EMPLOYEE REPORT',   Icon: BarChart3,       component: EmployeeReportScreen },
  { name: 'Notifications',   label: 'NOTIFICATIONS',     Icon: Bell,            component: NotificationsScreen },
];

// ── Custom Drawer Content ─────────────────────────────────────────────────────
function DeptHeadDrawerContent(props) {
  const { navigation, state } = props;
  const { logout, user } = useAuthStore();
  const activeIndex = state.index;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'DH';

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
              onPress={() => {
                navigation.closeDrawer();
                setTimeout(() => {
                  navigation.navigate(item.name);
                }, 100);
              }}
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
      drawerContent={DeptHeadDrawerContent}
      screenOptions={{
        headerStyle: { backgroundColor: '#131313', shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700', fontSize: 16, letterSpacing: 1 },
        drawerStyle: { backgroundColor: '#131313', width: 280 },
        drawerActiveBackgroundColor: '#adc6ff',
        drawerActiveTintColor: '#131313',
        drawerInactiveTintColor: '#c2c6d6',
        swipeEdgeWidth: 60,
      }}
    >
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
    backgroundColor: '#131313',
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  drawerBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
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
    borderRadius: 4,
  },
  navItemActive: {
    backgroundColor: '#adc6ff',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#c2c6d6',
  },
  navLabelActive: {
    color: '#131313',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2573e6',
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
    color: '#ef4444',
    marginLeft: 10,
  },
});
