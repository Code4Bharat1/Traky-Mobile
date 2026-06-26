import React from 'react';
import { View, Text } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
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
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';

import EmployeeDashboard from '../screens/Employee/EmployeeDashboard';
import AttendanceScreen from '../screens/Employee/AttendanceScreen';
import MyLeavesScreen from '../screens/Employee/MyLeavesScreen';
import ReportsScreen from '../screens/Employee/ReportsScreen';
import ExpensesScreen from '../screens/Employee/ExpensesScreen';
import MyProjectsScreen from '../screens/Employee/MyProjectsScreen';
import TasksScreen from '../screens/Employee/TasksScreen';
import TemplatesScreen from '../screens/Employee/TemplatesScreen';
import DailyLogsScreen from '../screens/Employee/DailyLogsScreen';
import IssuesScreen from '../screens/Employee/IssuesScreen';
import KtDocumentsScreen from '../screens/Employee/KtDocumentsScreen';
import LeaderboardScreen from '../screens/Employee/LeaderboardScreen';
import NotificationsScreen from '../screens/Employee/NotificationsScreen';

const Drawer = createDrawerNavigator();

function EmployeeDrawerContent(props) {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'E';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
    >
      {/* Header — TRAKY / EMPLOYEE PORTAL */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: '#2a2a2a',
          marginBottom: 8,
        }}
      >
        {/* Avatar circle */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#2573e6',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
            {initials}
          </Text>
        </View>
        <View>
          <Text
            style={{
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: 15,
              letterSpacing: 2,
            }}
          >
            TRAKY
          </Text>
          <Text
            style={{
              color: '#6b7280',
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            Employee Portal
          </Text>
        </View>
      </View>

      {/* Nav items */}
      <DrawerItemList {...props} />

      {/* Sign Out — pinned to bottom */}
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
          borderTopColor: '#2a2a2a',
          paddingTop: 10,
        }}
      />
    </DrawerContentScrollView>
  );
}

export default function EmployeeNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <EmployeeDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#131313',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold', letterSpacing: 2 },
        drawerStyle: { backgroundColor: '#131313', width: 280 },
        drawerActiveBackgroundColor: '#adc6ff',
        drawerActiveTintColor: '#131313',
        drawerInactiveTintColor: '#c2c6d6',
        drawerLabelStyle: {
          fontWeight: 'bold',
          fontSize: 13,
          letterSpacing: 1,
        },
      }}
    >
      <Drawer.Screen
        name="EmployeeDashboard"
        component={EmployeeDashboard}
        options={{
          title: 'DASHBOARD',
          drawerIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          title: 'ATTENDANCE',
          drawerIcon: ({ color, size }) => (
            <CalendarCheck color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="MyLeaves"
        component={MyLeavesScreen}
        options={{
          title: 'MY LEAVES',
          drawerIcon: ({ color, size }) => (
            <Umbrella color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'REPORTS',
          drawerIcon: ({ color, size }) => (
            <BarChart2 color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          title: 'EXPENSES',
          drawerIcon: ({ color, size }) => (
            <CreditCard color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="MyProjects"
        component={MyProjectsScreen}
        options={{
          title: 'MY PROJECTS',
          drawerIcon: ({ color, size }) => (
            <FolderKanban color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'TASKS',
          drawerIcon: ({ color, size }) => (
            <CheckSquare color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{
          title: 'TEMPLATES',
          drawerIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="DailyLogs"
        component={DailyLogsScreen}
        options={{
          title: 'DAILY LOGS',
          drawerIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Issues"
        component={IssuesScreen}
        options={{
          title: 'ISSUES',
          drawerIcon: ({ color, size }) => (
            <AlertCircle color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="KtDocuments"
        component={KtDocumentsScreen}
        options={{
          title: 'KT DOCUMENTS',
          drawerIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          title: 'LEADERBOARD',
          drawerIcon: ({ color, size }) => (
            <Trophy color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'NOTIFICATIONS',
          drawerIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}
