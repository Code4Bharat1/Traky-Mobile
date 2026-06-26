import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react-native';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../api/services';

function fmt(d) {
  if (!d) return '';
  const now = new Date();
  const date = new Date(d);
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_COLOR = {
  task:        '#47c8ff',
  project:     '#2573e6',
  leave:       '#e8a847',
  attendance:  '#47ff8a',
  expense:     '#f87343',
  bug:         '#ff4747',
  daily_log:   '#9c47ff',
  system:      '#9ca3af',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [filter, setFilter]               = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await getNotifications({ filter });
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleMarkRead(id) {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  async function handleMarkAll() {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function handleDelete(id) {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  }

  const FILTERS = [
    { key: 'all',    label: 'All' },
    { key: 'unread', label: 'Unread' },
  ];

  return (
    <SafeAreaView style={ns.safe} edges={['bottom']}>
      <View style={ns.header}>
        <View>
          <Text style={ns.headerSub}>DEPARTMENT</Text>
          <Text style={ns.headerTitle}>Notifications</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {unreadCount > 0 && (
            <View style={ns.unreadBadge}>
              <Text style={ns.unreadCount}>{unreadCount}</Text>
            </View>
          )}
          {unreadCount > 0 && (
            <TouchableOpacity style={ns.markAllBtn} onPress={handleMarkAll}>
              <CheckCheck size={12} color="#2573e6" />
              <Text style={ns.markAllText}>MARK ALL</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[ns.chip, filter === f.key && ns.chipActive]}>
              <Text style={[ns.chipText, filter === f.key && ns.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         notifications.length === 0 ? (
           <View style={ns.empty}>
             <Bell size={32} color="#374151" />
             <Text style={ns.emptyText}>No notifications</Text>
           </View>
         ) : (
           notifications.map(n => {
             const color = TYPE_COLOR[n.type] || TYPE_COLOR.system;
             return (
               <View key={n._id} style={[ns.card, !n.isRead && ns.cardUnread]}>
                 <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                   {/* Type dot */}
                   <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginTop: 5 }} />
                   <View style={{ flex: 1 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                       <Text style={[ns.notifTitle, !n.isRead && ns.notifTitleUnread]} numberOfLines={2}>{n.title || n.message}</Text>
                       <Text style={ns.timeText}>{fmt(n.createdAt)}</Text>
                     </View>
                     {n.message && n.title && (
                       <Text style={ns.notifBody} numberOfLines={3}>{n.message}</Text>
                     )}
                   </View>
                 </View>
                 <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                   {!n.isRead && (
                     <TouchableOpacity onPress={() => handleMarkRead(n._id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                       <Check size={11} color="#2573e6" />
                       <Text style={{ fontSize: 10, color: '#2573e6', fontWeight: '700' }}>MARK READ</Text>
                     </TouchableOpacity>
                   )}
                   <TouchableOpacity onPress={() => handleDelete(n._id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                     <Trash2 size={11} color="#ff4747" />
                     <Text style={{ fontSize: 10, color: '#ff4747', fontWeight: '700' }}>DELETE</Text>
                   </TouchableOpacity>
                 </View>
               </View>
             );
           })
         )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ns = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d0d' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:       { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  unreadBadge:     { backgroundColor: '#ff4747', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  unreadCount:     { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  markAllBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2573e640', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#2573e618' },
  markAllText:     { fontSize: 10, color: '#2573e6', fontWeight: '700', letterSpacing: 0.5 },
  chip:            { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipActive:      { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:        { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  chipTextActive:  { color: '#2573e6' },
  card:            { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  cardUnread:      { borderLeftWidth: 3, borderLeftColor: '#2573e6' },
  notifTitle:      { fontSize: 12, fontWeight: '600', color: '#9ca3af', flex: 1, marginRight: 8 },
  notifTitleUnread:{ color: '#ffffff', fontWeight: '700' },
  notifBody:       { fontSize: 11, color: '#6b7280', lineHeight: 16 },
  timeText:        { fontSize: 10, color: '#4b5563', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 },
  empty:           { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:       { fontSize: 13, color: '#4b5563' },
});
