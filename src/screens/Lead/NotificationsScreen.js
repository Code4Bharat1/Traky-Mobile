import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react-native';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const fmt = d => { if (!d) return ''; const now=new Date(), date=new Date(d), diff=(now-date)/1000; if(diff<60)return'Just now'; if(diff<3600)return`${Math.floor(diff/60)}m ago`; if(diff<86400)return`${Math.floor(diff/3600)}h ago`; return date.toLocaleDateString('en-US',{month:'short',day:'numeric'}); };
const TYPE_COLOR = { task:'#47c8ff', project:'#2573e6', leave:'#e8a847', attendance:'#10b981', expense:'#f87343', bug:'#ef4444', daily_log:'#9c47ff', system:'#9ca3af' };

export default function NotificationsScreen() {
  const { isDarkMode } = useThemeStore();
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

  React.useEffect(()=>{load();},[load]);
  const onRefresh = ()=>{setRefreshing(true);load();};

  async function handleMarkRead(id) {
    try { await markAsRead(id); setNotifications(prev=>prev.map(n=>n._id===id?{...n,read:true}:n)); setUnreadCount(prev=>Math.max(0,prev-1)); } catch {}
  }
  async function handleMarkAll() {
    try { await markAllAsRead(); setNotifications(prev=>prev.map(n=>({...n,read:true}))); setUnreadCount(0); } catch {}
  }
  async function handleDelete(id) {
    try { await deleteNotification(id); setNotifications(prev=>prev.filter(n=>n._id!==id)); } catch {}
  }

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-end items-center px-4 py-3 border-b gap-2 ${borderColor}`}>
        {unreadCount > 0 && (
          <View className="bg-[#ef4444] rounded-full px-2 py-0.5"><Text className="text-white text-[10px] font-bold">{unreadCount}</Text></View>
        )}
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} className="flex-row items-center gap-1.5 border border-[#2573e640] bg-[#2573e618] px-3 py-1.5 rounded-lg">
            <CheckCheck size={12} color="#2573e6"/><Text className="text-[10px] font-bold text-[#2573e6] uppercase tracking-widest">MARK ALL READ</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'}/>}>
        {/* Filter chips */}
        <View className="flex-row mb-4">
          {['all','unread'].map(f=>(
            <TouchableOpacity key={f} onPress={()=>setFilter(f)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${filter===f?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest capitalize ${filter===f?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{f==='all'?'All':'Unread'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/> :
         notifications.length === 0 ? (
           <View className="items-center py-20">
             <Bell size={48} color={isDarkMode?'#333':'#d1d5db'}/>
             <Text className={`text-sm mt-4 ${textMuted}`}>No notifications</Text>
           </View>
         ) : notifications.map(n => {
           const color = TYPE_COLOR[n.type] || TYPE_COLOR.system;
           const isUnread = !n.read;
           return (
             <TouchableOpacity key={n._id} activeOpacity={0.8} onPress={()=>isUnread&&handleMarkRead(n._id)}
               className={`border rounded-lg p-4 mb-3 ${isUnread?(isDarkMode?'bg-[#1c1b1b] border-[#2573e640]':'bg-white border-blue-200'):`${bgCard} ${borderColor}`}`}
               style={isUnread?{borderLeftWidth:3,borderLeftColor:'#2573e6'}:{}}>
               <View className="flex-row items-start gap-3">
                 <View className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor:isUnread?color:'transparent'}}/>
                 <View className="flex-1">
                   <View className="flex-row justify-between items-start mb-1">
                     <Text className={`text-sm font-bold flex-1 mr-2 ${isUnread?textColor:textMuted}`} numberOfLines={2}>{n.title||'System Notification'}</Text>
                     <Text className={`text-[10px] flex-shrink-0 ${textMuted}`}>{fmt(n.createdAt)}</Text>
                   </View>
                   <Text className={`text-xs leading-5 mb-2 ${textMuted}`} numberOfLines={3}>{n.message||n.body||'No details.'}</Text>
                   <View className="flex-row justify-end gap-4">
                     {isUnread&&<TouchableOpacity onPress={()=>handleMarkRead(n._id)} className="flex-row items-center gap-1">
                       <Check size={11} color={isDarkMode?'#adc6ff':'#2573e6'}/><Text className={`text-[10px] font-bold ${isDarkMode?'text-[#adc6ff]':'text-[#2573e6]'}`}>MARK READ</Text>
                     </TouchableOpacity>}
                     <TouchableOpacity onPress={()=>handleDelete(n._id)} className="flex-row items-center gap-1">
                       <Trash2 size={11} color="#ef4444"/><Text className="text-[10px] font-bold text-[#ef4444]">DELETE</Text>
                     </TouchableOpacity>
                   </View>
                 </View>
               </View>
             </TouchableOpacity>
           );
         })}
        <View className="h-8"/>
      </ScrollView>
    </SafeAreaView>
  );
}

