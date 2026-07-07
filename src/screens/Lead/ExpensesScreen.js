import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Plus, Search, X, Check, AlertCircle } from 'lucide-react-native';
import { getMyExpenses, submitExpense } from '../../api/services';
import useThemeStore from '../../store/themeStore';

const CATEGORIES = ['travel','food','accommodation','equipment','training','other'];
const PAYMENT_METHODS = ['cash','card','bank_transfer','upi'];
const STATUS_META = { pending:{label:'Pending',color:'#e8a847',bg:'bg-[#e8a8471a]',border:'border-[#e8a84740]'}, approved:{label:'Approved',color:'#10b981',bg:'bg-[#10b9811a]',border:'border-[#10b98140]'}, rejected:{label:'Rejected',color:'#ef4444',bg:'bg-[#ef44441a]',border:'border-[#ef444440]'}, paid:{label:'Paid',color:'#47c8ff',bg:'bg-[#47c8ff1a]',border:'border-[#47c8ff40]'} };
const FILTERS = ['all','pending','approved','rejected','paid'];

export default function ExpensesScreen() {
  const { isDarkMode } = useThemeStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const arr = await getMyExpenses({ limit: 100 });
      setExpenses(Array.isArray(arr) ? arr : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleSubmit(form) {
    await submitExpense(form); load();
  }

  const filtered = expenses.filter(e => (!search||e.title?.toLowerCase().includes(search.toLowerCase())) && (statusF==='all'||e.status?.toLowerCase()===statusF));
  const total = expenses.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const pendingCount = expenses.filter(e=>e.status==='pending').length;

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard   = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  return (
    <SafeAreaView className={`flex-1 ${bgScreen}`} edges={['bottom']}>
      <View className={`flex-row justify-end px-4 py-3 border-b ${borderColor}`}>
        <TouchableOpacity onPress={()=>setShowModal(true)} className={`flex-row items-center px-4 py-2 rounded-lg ${isDarkMode?'bg-[#adc6ff]':'bg-[#2573e6]'}`}>
          <Plus size={14} color={isDarkMode?'#131313':'#fff'} />
          <Text className={`text-xs font-bold ml-1.5 uppercase tracking-widest ${isDarkMode?'text-[#131313]':'text-white'}`}>SUBMIT EXPENSE</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode?'#adc6ff':'#2573e6'} />}>
        <View className="flex-row gap-2 mb-4">
          <View className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
            <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>TOTAL AMOUNT</Text>
            <Text className="text-xl font-bold text-[#47c8ff]">{loading?'—':`₹${total.toFixed(2)}`}</Text>
          </View>
          <View className={`flex-1 border rounded-lg p-3 ${bgCard} ${borderColor}`}>
            <Text className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${textMuted}`}>PENDING</Text>
            <Text className="text-xl font-bold text-[#e8a847]">{loading?'—':pendingCount}</Text>
          </View>
        </View>
        <View className={`flex-row items-center border rounded-lg px-3 h-10 mb-3 ${bgCard} ${borderColor}`}>
          <Search size={14} color={isDarkMode?'#888':'#9ca3af'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search expenses..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`flex-1 text-xs ml-2 ${textColor}`} />
          {!!search&&<TouchableOpacity onPress={()=>setSearch('')}><X size={14} color={isDarkMode?'#888':'#9ca3af'} /></TouchableOpacity>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {FILTERS.map(f=>(
            <TouchableOpacity key={f} onPress={()=>setStatusF(f)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${statusF===f?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgCard} ${borderColor}`}`}>
              <Text className={`text-[10px] font-bold tracking-widest ${statusF===f?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading?<ActivityIndicator color={isDarkMode?'#adc6ff':'#2573e6'} className="mt-10"/>:
         filtered.length===0?(
           <View className={`items-center py-16 border rounded-lg ${bgCard} ${borderColor}`}>
             <CreditCard size={32} color={isDarkMode?'#888':'#9ca3af'} />
             <Text className={`text-xs font-bold uppercase tracking-widest mt-3 ${textMuted}`}>No expenses found</Text>
           </View>
         ):filtered.map(e=>{
           const sm = STATUS_META[e.status?.toLowerCase()]||STATUS_META.pending;
           return (
             <View key={e._id} className={`border rounded-lg p-4 mb-3 ${bgCard} ${borderColor}`}>
               <View className="flex-row justify-between items-start mb-2">
                 <View className="flex-1 mr-3"><Text className={`text-sm font-bold ${textColor}`}>{e.title}</Text><Text className={`text-[10px] uppercase mt-0.5 ${textMuted}`}>{e.category}</Text></View>
                 <View className={`px-2 py-1 rounded border ${sm.bg} ${sm.border}`}><Text style={{color:sm.color}} className="text-[9px] font-bold uppercase">{sm.label}</Text></View>
               </View>
               <View className="flex-row justify-between items-center">
                 <Text className="text-base font-bold text-[#47c8ff]">₹{parseFloat(e.amount).toFixed(2)}</Text>
                 <Text className={`text-xs ${textMuted}`}>{e.expenseDate?new Date(e.expenseDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</Text>
               </View>
             </View>
           );
         })}
        <View className="h-8" />
      </ScrollView>
      {showModal&&<ExpenseSubmitModal isDarkMode={isDarkMode} onClose={()=>setShowModal(false)} onSave={handleSubmit} />}
    </SafeAreaView>
  );
}

function ExpenseSubmitModal({ isDarkMode, onClose, onSave }) {
  const [form, setForm] = useState({ title:'', category:'travel', amount:'', expenseDate: new Date().toISOString().slice(0,10), description:'', paymentMethod:'cash' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  async function handle() {
    if (!form.title.trim()||!form.amount){setErr('Title and amount are required.');return;}
    if(isNaN(parseFloat(form.amount))){setErr('Amount must be a number.');return;}
    setErr(''); setSaving(true);
    try { await onSave(form); onClose(); }
    catch(e){ setErr(e?.response?.data?.message||'Failed to submit expense.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[#000000cc]">
        <View className={`border-t rounded-t-2xl max-h-[92%] ${bgCard} ${borderColor}`}>
          <View className={`flex-row justify-between items-center p-6 pb-4 border-b ${borderColor}`}>
            <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>SUBMIT EXPENSE</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={isDarkMode?'#888':'#6b7280'} /></TouchableOpacity>
          </View>
          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            <View className="h-4" />
            {!!err&&<View className="flex-row items-center bg-[#ef44441a] border border-[#ef44444d] rounded-lg p-3 mb-4"><AlertCircle size={14} color="#ef4444"/><Text className="text-[#ef4444] text-xs ml-2">{err}</Text></View>}
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Title *</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}><TextInput value={form.title} onChangeText={v=>setForm({...form,title:v})} placeholder="e.g. Flight to Delhi" placeholderTextColor={isDarkMode?'#888':'#9ca3af'} className={`text-xs ${textColor}`}/></View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Amount (₹) *</Text>
            <View className={`border rounded-lg p-3 mb-4 ${bgInputAlt} ${borderColor}`}><TextInput value={form.amount} onChangeText={v=>setForm({...form,amount:v})} placeholder="0.00" placeholderTextColor={isDarkMode?'#888':'#9ca3af'} keyboardType="numeric" className={`text-xs ${textColor}`}/></View>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {CATEGORIES.map(c=>(
                <TouchableOpacity key={c} onPress={()=>setForm({...form,category:c})}
                  className={`mr-2 px-4 py-1.5 rounded-full border ${form.category===c?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgInputAlt} ${borderColor}`}`}>
                  <Text className={`text-[10px] font-bold uppercase ${form.category===c?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {PAYMENT_METHODS.map(m=>(
                <TouchableOpacity key={m} onPress={()=>setForm({...form,paymentMethod:m})}
                  className={`mr-2 px-4 py-1.5 rounded-full border ${form.paymentMethod===m?(isDarkMode?'bg-[#adc6ff] border-[#adc6ff]':'bg-[#2573e6] border-[#2573e6]'):`${bgInputAlt} ${borderColor}`}`}>
                  <Text className={`text-[10px] font-bold uppercase ${form.paymentMethod===m?(isDarkMode?'text-[#131313]':'text-white'):textColor}`}>{m.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${textMuted}`}>Description</Text>
            <View className={`border rounded-lg p-3 mb-6 ${bgInputAlt} ${borderColor}`}><TextInput value={form.description} onChangeText={v=>setForm({...form,description:v})} placeholder="Additional details..." placeholderTextColor={isDarkMode?'#888':'#9ca3af'} multiline className={`text-xs min-h-[60px] ${textColor}`} textAlignVertical="top"/></View>
          </ScrollView>
          <View className={`flex-row justify-end p-6 pt-4 border-t ${borderColor}`}>
            <TouchableOpacity onPress={onClose} disabled={saving} className="mr-4 py-3 px-4"><Text className={`font-bold text-sm uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handle} disabled={saving} className={`px-6 py-3 rounded-lg flex-row items-center ${isDarkMode?'bg-[#adc6ff]':'bg-[#2573e6]'} ${saving?'opacity-50':''}`}>
              {saving?<ActivityIndicator size="small" color={isDarkMode?'#131313':'#fff'}/>:<><Check size={14} color={isDarkMode?'#131313':'#fff'}/><Text className={`font-bold text-sm ml-1.5 uppercase tracking-wider ${isDarkMode?'text-[#131313]':'text-white'}`}>SUBMIT</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
