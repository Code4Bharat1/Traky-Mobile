import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { calculateAllSalaries, generatePayslip, getConversionSetting, getDepartments, getSalaryList, getSalaryStats, updateConversionSetting, updatePaymentStatus } from '../../api/services';
import { User, Filter, Search, ChevronDown, Calculator, Settings, Eye, CreditCard, Receipt, Calendar, Clock, X, FileText } from 'lucide-react-native';
import useThemeStore from '../../store/themeStore';

import client from '../../api/client';

const SalaryCard = React.memo(({ item, isDarkMode, openModal, bgCard, bgInputAlt, borderColor, textColor, textMuted }) => {
  const periodMonthName = item.periodMonth ? new Date(2000, item.periodMonth - 1).toLocaleString('default', { month: 'short' }) : 'N/A';
  const pYear = item.periodYear || 'N/A';
  const isPaid = item.paymentStatus?.toLowerCase() === 'paid';
  const payslipGenerated = !!item.payslipId;

  return (
    <View className={`border rounded-xl mb-3 p-4 ${bgCard} ${borderColor}`}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full border items-center justify-center mr-3 ${bgInputAlt} ${borderColor}`}>
            <Text className={`text-sm font-bold ${textColor}`}>{item.user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-sm font-bold ${textColor}`} numberOfLines={1}>{item.user?.name || 'Unknown'}</Text>
            <Text className={`text-[10px] ${textMuted}`} numberOfLines={1}>{item.user?.email || 'N/A'}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`text-xs font-bold ${textColor}`}>{periodMonthName} {pYear}</Text>
          <Text className={`text-[10px] ${textMuted}`}>{item.user?.departmentId?.name || item.department || 'N/A'}</Text>
        </View>
      </View>

      <View className={`flex-row items-center py-3 border-y mb-3 ${borderColor}`}>
        <View className={`flex-1 items-center border-r ${borderColor}`}>
          <Text className={`text-[9px] uppercase tracking-widest ${textMuted}`}>Points</Text>
          <Text className={`text-xs font-bold ${textColor}`}>{item.totalPointsForSalary || item.totalPoints || item.points || 0}</Text>
        </View>
        <View className={`flex-1 items-center border-r ${borderColor}`}>
          <Text className={`text-[9px] uppercase tracking-widest ${textMuted}`}>Rate</Text>
          <Text className={`text-xs font-bold ${textColor}`}>₹{item.pointToRupeeConversion || item.rate || 0}</Text>
        </View>
        <View className={`flex-1 items-center border-r ${borderColor}`}>
          <Text className={`text-[9px] uppercase tracking-widest ${textMuted}`}>Base</Text>
          <Text className={`text-xs font-bold ${textColor}`}>₹{item.baseSalary || 0}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className={`text-[9px] uppercase tracking-widest ${textMuted}`}>Final</Text>
          <Text className={`text-sm font-bold ${isDarkMode ? 'text-[#10b981]' : 'text-green-600'}`}>₹{item.finalSalary || item.finalAmount || item.amount || 0}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-1">
          <Text className={`text-[10px] uppercase tracking-widest mb-1 ${textMuted}`}>Payment</Text>
          <View className={`border px-2 py-1 rounded self-start flex-row items-center ${isPaid ? (isDarkMode ? 'border-[#10b9814a] bg-[#10b9811a]' : 'border-green-200 bg-green-50') : (isDarkMode ? 'border-[#f59e0b4a] bg-[#f59e0b1a]' : 'border-yellow-200 bg-yellow-50')}`}>
             {!isPaid && <Clock size={10} color={isDarkMode ? "#f59e0b" : "#d97706"} className="mr-1" />}
             <Text className={`text-[10px] font-bold ${isPaid ? (isDarkMode ? 'text-[#10b981]' : 'text-green-600') : (isDarkMode ? 'text-[#f59e0b]' : 'text-yellow-600')}`}>
               {item.paymentStatus ? item.paymentStatus.toUpperCase() : 'PENDING'}
             </Text>
          </View>
        </View>
        <View className="flex-1 items-end">
          <Text className={`text-[10px] uppercase tracking-widest mb-1 ${textMuted}`}>Payslip</Text>
           <TouchableOpacity 
              onPress={() => payslipGenerated ? openModal('details', item) : openModal('payslip', item)}
              className={`px-2 py-1 rounded flex-row items-center border ${payslipGenerated ? (isDarkMode ? 'bg-[#10b9811a] border-[#10b9814a]' : 'bg-green-50 border-green-200') : (isDarkMode ? 'bg-[#333] border-[#333]' : 'bg-gray-200 border-gray-200')}`}
           >
              <Receipt size={10} color={payslipGenerated ? (isDarkMode ? '#10b981' : '#16a34a') : (isDarkMode ? '#aaa' : '#666')} className="mr-1" />
              <Text className={`text-[10px] font-bold uppercase ${payslipGenerated ? (isDarkMode ? 'text-[#10b981]' : 'text-green-600') : (isDarkMode ? 'text-[#aaa]' : 'text-gray-600')}`}>
                {payslipGenerated ? 'VIEW PAYSLIP' : 'NOT GENERATED'}
              </Text>
           </TouchableOpacity>
        </View>
      </View>

      <View className={`flex-row justify-around pt-3 border-t ${borderColor}`}>
         <TouchableOpacity onPress={() => openModal('details', item)} className={`px-4 py-1.5 rounded border flex-row items-center ${isDarkMode ? 'border-[#333] bg-[#222]' : 'border-gray-200 bg-gray-50'}`}>
            <Eye size={12} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-1"/>
            <Text className={`text-[10px] font-bold ${textColor}`}>VIEW</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => openModal('payment', item)} className={`px-4 py-1.5 rounded border flex-row items-center ${isDarkMode ? 'border-[#f59e0b4a] bg-[#f59e0b1a]' : 'border-yellow-200 bg-yellow-50'}`}>
            <CreditCard size={12} color={isDarkMode ? "#f59e0b" : "#d97706"} className="mr-1"/>
            <Text className={`text-[10px] font-bold ${isDarkMode ? 'text-[#f59e0b]' : 'text-yellow-600'}`}>PAY</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => openModal('payslip', item)} className={`px-4 py-1.5 rounded border flex-row items-center ${isDarkMode ? 'border-[#38bdf84a] bg-[#38bdf81a]' : 'border-sky-200 bg-sky-50'}`}>
            <Calculator size={12} color={isDarkMode ? "#38bdf8" : "#0284c7"} className="mr-1"/>
            <Text className={`text-[10px] font-bold ${isDarkMode ? 'text-[#38bdf8]' : 'text-sky-600'}`}>CALC</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
});

export default function SalaryScreen() {
  const { isDarkMode } = useThemeStore();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEmployees: 0, totalSalary: 0, avgSalary: 0, paidCount: 0, pendingCount: 0 });
  const [departments, setDepartments] = useState([]);

  // Filters
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();
  const [periodMonth, setPeriodMonth] = useState(currentMonth);
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [departmentId, setDepartmentId] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown States
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState('');

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'settings', 'details', 'payment', 'payslip'
  const [selectedSalary, setSelectedSalary] = useState(null);

  // Forms
  const [conversionRate, setConversionRate] = useState('10');
  const [paymentForm, setPaymentForm] = useState({ status: 'PENDING', amount: '', method: 'Bank Transfer', transactionId: '', notes: '' });
  const [payslipForm, setPayslipForm] = useState({ bonus: '0', allowances: '0', otherDeductions: '0', tax: '0', notes: '' });

  const fetchDepartments = async () => {
    try {
      const res = await client.get('/departments');
      setDepartments(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const monthMap = { 'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6, 'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12 };
      
      const params = {
        periodMonth: periodMonth === 'All Months' ? '' : monthMap[periodMonth],
        periodYear: periodYear === 'All Years' ? '' : periodYear,
        departmentId: departmentId === 'All Departments' ? '' : departmentId,
        paymentStatus: paymentStatusFilter === 'All Status' ? '' : paymentStatusFilter,
        search: searchQuery,
        limit: 100
      };

      const [statsRes, listRes] = await Promise.all([
        client.get('/salary/stats', { params }),
        client.get('/salary', { params })
      ]);

      let st = statsRes.data?.data || statsRes.data;
      if (Array.isArray(st) && st.length > 0) {
        setStats(st[0]);
      } else if (st && typeof st === 'object' && !Array.isArray(st)) {
        setStats({
          totalEmployees: st.totalEmployees || 0,
          totalSalary: st.totalSalary || 0,
          avgSalary: st.avgSalary || 0,
          paidCount: st.paidCount || 0,
          pendingCount: st.pendingCount || 0
        });
      } else {
        setStats({ totalEmployees: 0, totalSalary: 0, avgSalary: 0, paidCount: 0, pendingCount: 0 });
      }

      setSalaries(listRes.data.data || listRes.data.records || listRes.data || []);
    } catch (error) {
      console.error("Failed to load salaries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSalaries();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [periodMonth, periodYear, departmentId, paymentStatusFilter, searchQuery]);

  const handleReset = () => {
    setPeriodMonth(currentMonth);
    setPeriodYear(currentYear);
    setDepartmentId('');
    setPaymentStatusFilter('');
    setSearchQuery('');
  };

  const openModal = useCallback(async (type, item = null) => {
    if (type === 'settings') {
      try {
        const res = await client.get('/salary/settings/conversion');
        if (res.data.data) setConversionRate(res.data.data.pointToRupeeConversion?.toString() || '10');
      } catch (e) {}
    } else if (type === 'payment' && item) {
      setPaymentForm({
        status: item.paymentStatus ? item.paymentStatus.toUpperCase() : 'PENDING',
        amount: item.finalAmount ? item.finalAmount.toString() : (item.finalSalary ? item.finalSalary.toString() : '0'),
        method: item.paymentMethod || 'Bank Transfer',
        transactionId: item.transactionId || '',
        notes: item.notes || ''
      });
    } else if (type === 'payslip' && item) {
      setPayslipForm({ bonus: '0', allowances: '0', otherDeductions: '0', tax: '0', notes: '' });
    }
    
    setSelectedSalary(item);
    setActiveModal(type);
  }, []);

  const saveSettings = async () => {
    try {
      await client.patch('/salary/settings/conversion', { pointToRupeeConversion: Number(conversionRate) });
      setActiveModal(null);
      fetchSalaries();
      Alert.alert('Success', 'Conversion settings updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const updatePayment = async () => {
    if (!selectedSalary) return;
    try {
      await client.patch(`/salary/${selectedSalary._id}/payment`, {
        paymentStatus: paymentForm.status.toLowerCase(),
        paidAmount: Number(paymentForm.amount),
        paymentMethod: paymentForm.method,
        transactionId: paymentForm.transactionId,
        notes: paymentForm.notes
      });
      setActiveModal(null);
      fetchSalaries();
      Alert.alert('Success', 'Payment status updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to update payment');
    }
  };

  const generatePayslip = async () => {
    if (!selectedSalary) return;
    try {
      await client.post(`/salary/${selectedSalary._id}/payslip`, {
        bonus: Number(payslipForm.bonus),
        allowances: Number(payslipForm.allowances),
        deductions: Number(payslipForm.otherDeductions),
        tax: Number(payslipForm.tax),
        notes: payslipForm.notes
      });
      setActiveModal(null);
      fetchSalaries();
      Alert.alert('Success', 'Payslip generated');
    } catch (e) {
      Alert.alert('Error', 'Failed to generate payslip');
    }
  };

  const calculateAll = async () => {
    try {
      const monthMap = { 'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6, 'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12 };
      await client.post('/salary/calculate/all', {
        periodYear: Number(periodYear),
        periodMonth: monthMap[periodMonth]
      });
      fetchSalaries();
      Alert.alert('Success', 'Calculated salaries for all employees');
    } catch (e) {
      Alert.alert('Error', 'Failed to calculate salaries');
    }
  };

  const getDropdownOptions = () => {
    if (dropdownType === 'month') return ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (dropdownType === 'year') return ['All Years', '2023', '2024', '2025', '2026', '2027'];
    if (dropdownType === 'department') return [{_id: '', name: 'All Departments'}, ...departments];
    if (dropdownType === 'status') return ['All Status', 'Pending', 'Approved', 'Processing', 'Paid', 'Failed', 'On Hold'];
    if (dropdownType === 'paymentMethod') return ['Bank Transfer', 'Cash', 'Cheque', 'UPI', 'Other'];
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'month') setPeriodMonth(item);
    if (dropdownType === 'year') setPeriodYear(item);
    if (dropdownType === 'department') setDepartmentId(item._id || '');
    if (dropdownType === 'status') setPaymentStatusFilter(item);
    if (dropdownType === 'paymentMethod') setPaymentForm({...paymentForm, method: item});
    setDropdownVisible(false);
  };

  const bgScreen = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const bgCard = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInput = isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white';
  const bgInputAlt = isDarkMode ? 'bg-[#131313]' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#888]' : 'text-gray-500';

  const renderItem = useCallback(({ item }) => {
    return (
      <SalaryCard 
        item={item} 
        isDarkMode={isDarkMode} 
        openModal={openModal} 
        bgCard={bgCard}
        bgInputAlt={bgInputAlt}
        borderColor={borderColor}
        textColor={textColor}
        textMuted={textMuted}
      />
    );
  }, [isDarkMode, openModal, bgCard, bgInputAlt, borderColor, textColor, textMuted]);

  return (
    <View className={`flex-1 p-4 ${bgScreen}`}>
      {/* Header */}
      <View className="flex-row justify-between items-start mb-6 mt-4">
        <View className="flex-1 mr-4">
          <Text className={`text-2xl font-bold tracking-wider ${textColor}`}>Salary</Text>
          <Text className={`text-2xl font-bold tracking-wider mb-1 ${textColor}`}>Management</Text>
          <Text className={`text-[10px] leading-tight ${textMuted}`}>Manage employee salaries, generate payslips, and track payments</Text>
        </View>
        <View className="flex-col space-y-2 mt-1">
          <TouchableOpacity onPress={() => openModal('settings')} className={`border rounded px-3 py-1.5 flex-row items-center justify-center ${borderColor} ${isDarkMode ? 'bg-transparent' : 'bg-white'}`}>
            <Settings size={12} color={isDarkMode ? "#fff" : "#111827"} className="mr-1" />
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={calculateAll} className={`rounded px-3 py-1.5 flex-row items-center justify-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
            <Calculator size={12} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-1" />
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Calculate All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards (2x2 Grid) */}
      <View className="flex-row flex-wrap justify-between mb-4">
        <View className={`border p-4 rounded-lg w-[48%] mb-3 flex-row justify-between items-center ${bgCard} ${borderColor}`}>
          <View>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${textMuted}`}>Employees</Text>
            <Text className={`text-xl font-bold ${textColor}`}>{stats.totalEmployees || 0}</Text>
          </View>
          <View className={`p-2 rounded ${bgInputAlt}`}><User size={14} color={isDarkMode ? "#888" : "#9ca3af"} /></View>
        </View>
        <View className={`border p-4 rounded-lg w-[48%] mb-3 flex-row justify-between items-center ${bgCard} ${borderColor}`}>
          <View>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${textMuted}`}>Total Salary</Text>
            <Text className={`text-lg font-bold ${textColor}`}>₹{stats.totalSalary?.toLocaleString() || 0}</Text>
          </View>
          <View className={`p-2 rounded ${isDarkMode ? 'bg-[#10b9811a]' : 'bg-green-50'}`}><Text className={isDarkMode ? 'text-[#10b981] font-bold text-xs' : 'text-green-600 font-bold text-xs'}>₹</Text></View>
        </View>
        <View className={`border p-4 rounded-lg w-[48%] flex-row justify-between items-center ${bgCard} ${borderColor}`}>
          <View>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${textMuted}`}>Avg Salary</Text>
            <Text className={`text-lg font-bold ${textColor}`}>₹{Math.round(stats.avgSalary || 0).toLocaleString()}</Text>
          </View>
          <View className={`p-2 rounded ${isDarkMode ? 'bg-[#38bdf81a]' : 'bg-sky-50'}`}><Text className={isDarkMode ? 'text-[#38bdf8] font-bold text-xs' : 'text-sky-600 font-bold text-xs'}>~</Text></View>
        </View>
        <View className={`border p-4 rounded-lg w-[48%] flex-row justify-between items-center ${bgCard} ${borderColor}`}>
          <View>
            <Text className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${textMuted}`}>Paid/Pending</Text>
            <Text className={`text-lg font-bold ${textColor}`}><Text className={isDarkMode ? 'text-[#10b981]' : 'text-green-600'}>{stats.paidCount || 0}</Text> <Text className={`text-[10px] ${textMuted}`}>/</Text> <Text className={isDarkMode ? 'text-[#f59e0b]' : 'text-yellow-600'}>{stats.pendingCount || 0}</Text></Text>
          </View>
          <View className={`p-2 rounded ${isDarkMode ? 'bg-[#a855f71a]' : 'bg-purple-50'}`}><CreditCard size={14} color={isDarkMode ? '#a855f7' : '#9333ea'} /></View>
        </View>
      </View>

      {/* Filters & Search Area */}
      <View className={`border rounded-lg p-3 mb-4 ${bgCard} ${borderColor}`}>
        {/* Full width Search Bar */}
        <View className="flex-row items-center mb-3">
           <View className={`flex-row items-center px-3 py-2 rounded flex-1 mr-2 ${bgInputAlt}`}>
              <Search size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
              <TextInput
                placeholder="Search employee..."
                placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"}
                className={`text-xs ml-2 flex-1 py-0 ${textColor}`}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
           </View>
           <TouchableOpacity onPress={handleReset} className={`border px-4 py-2.5 rounded ${borderColor} ${isDarkMode ? 'bg-transparent' : 'bg-white'}`}>
              <Text className={`text-[10px] font-bold uppercase ${textColor}`}>Reset</Text>
           </TouchableOpacity>
        </View>

        {/* Filters Row */}
        <View className="flex-row flex-wrap items-center">
           <Calendar size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
           <TouchableOpacity onPress={() => { setDropdownType('month'); setDropdownVisible(true); }} className={`flex-row items-center px-2 py-1.5 rounded mr-2 min-w-[80px] justify-between ${bgInputAlt}`}>
              <Text className={`text-xs ${textColor}`}>{periodMonth}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('year'); setDropdownVisible(true); }} className={`flex-row items-center px-2 py-1.5 rounded mr-3 min-w-[70px] justify-between ${bgInputAlt}`}>
              <Text className={`text-xs ${textColor}`}>{periodYear}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
           </TouchableOpacity>

           <Filter size={14} color={isDarkMode ? "#888" : "#9ca3af"} className="mr-2" />
           <TouchableOpacity onPress={() => { setDropdownType('department'); setDropdownVisible(true); }} className={`flex-row items-center px-2 py-1.5 rounded mr-2 flex-1 justify-between ${bgInputAlt}`}>
              <Text className={`text-xs ${textColor}`} numberOfLines={1}>{departmentId ? departments.find(d => d._id === departmentId)?.name || 'All Departments' : 'All Departments'}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('status'); setDropdownVisible(true); }} className={`flex-row items-center px-2 py-1.5 rounded min-w-[90px] justify-between ${bgInputAlt}`}>
              <Text className={`text-xs ${textColor}`}>{paymentStatusFilter || 'All Status'}</Text>
              <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
           </TouchableOpacity>
        </View>
      </View>

      {/* Cards List */}
      <View className="flex-1">
        {loading ? (
          <ActivityIndicator size="large" color={isDarkMode ? "#adc6ff" : "#2573e6"} className="mt-10" />
        ) : (
          <FlatList 
            data={salaries}
            keyExtractor={(item, index) => (item._id ? `${item._id}_${index}` : index.toString())}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <Text className={`text-center py-6 text-xs ${textMuted}`}>No salary records found.</Text>
            }
          />
        )}
      </View>

      {/* Filter Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className={`border rounded-lg w-3/4 max-h-[50%] p-4 ${bgCard} ${borderColor}`}>
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(i, index) => (dropdownType === 'department' ? (i._id || 'all') : i) + index.toString()}
              renderItem={({item}) => (
                <TouchableOpacity className={`py-3 border-b ${borderColor}`} onPress={() => selectDropdownItem(item)}>
                  <Text className={`text-base text-center ${textColor}`}>{dropdownType === 'department' ? item.name : item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={activeModal === 'settings'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={`border rounded-lg w-11/12 p-6 ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-6">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Salary Settings</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>
            <Text className={`text-xs font-bold mb-2 uppercase ${textMuted}`}>Point to Rupee Conversion</Text>
            <View className={`flex-row items-center border rounded p-2 mb-2 ${bgInputAlt} ${borderColor}`}>
               <Text className={`mr-2 ${textMuted}`}>₹</Text>
               <TextInput 
                 value={conversionRate} 
                 onChangeText={setConversionRate} 
                 keyboardType="numeric"
                 className={`flex-1 text-sm py-1 ${textColor}`}
               />
               <Text className={`ml-2 text-xs ${textMuted}`}>per point</Text>
            </View>
            <Text className={`text-[10px] mb-6 ${textMuted}`}>Set how much 1 point is worth in Rupees. Example: If set to 10, then 100 points = ₹1,000</Text>
            
            <View className="flex-row justify-end mt-4">
               <TouchableOpacity onPress={() => setActiveModal(null)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={saveSettings} className={`px-4 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Save Settings</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Salary Details Modal */}
      <Modal visible={activeModal === 'details'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={`border rounded-lg w-11/12 p-6 items-center ${bgCard} ${borderColor}`}>
            <View className="w-full flex-row justify-between items-center mb-10">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Salary Details</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>
            <FileText size={40} color={isDarkMode ? "#888" : "#9ca3af"} className="mb-4" strokeWidth={1} />
            <Text className={`font-bold text-lg mb-2 ${textColor}`}>No payslip generated yet</Text>
            <Text className={`text-xs mb-8 text-center ${textMuted}`}>Generate a payslip to view detailed breakdown</Text>
            <TouchableOpacity onPress={() => setActiveModal('payslip')} className={`px-6 py-3 rounded flex-row items-center mb-6 ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
               <Receipt size={14} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-2" />
               <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Generate Payslip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Update Payment Modal */}
      <Modal visible={activeModal === 'payment'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={`border rounded-lg w-11/12 p-4 max-h-[80%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-4">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Update Payment Status</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className={`flex-row justify-between items-center p-3 rounded border mb-4 ${bgInputAlt} ${borderColor}`}>
                <View>
                  <Text className={`font-bold text-sm ${textColor}`}>{selectedSalary?.user?.name}</Text>
                  <Text className={`text-[10px] ${textMuted}`}>{selectedSalary?.user?.email}</Text>
                </View>
                <View className="items-end">
                  <Text className={`font-bold text-sm ${textColor}`}>₹{selectedSalary?.finalSalary || 0}</Text>
                  <Text className={`text-[10px] ${textMuted}`}>June 2026</Text>
                </View>
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Payment Status</Text>
              <View className="flex-row flex-wrap justify-between mb-4">
                {['PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'ON HOLD'].map(s => (
                  <TouchableOpacity key={s} onPress={() => setPaymentForm({...paymentForm, status: s})} className={`w-[31%] mb-2 py-2 rounded items-center border ${paymentForm.status === s ? (isDarkMode ? 'bg-[#adc6ff] border-[#adc6ff]' : 'bg-blue-100 border-[#2573e6]') : (isDarkMode ? 'border-[#ffffff1a]' : 'border-gray-200')}`}>
                    <Text className={`text-[10px] font-bold ${paymentForm.status === s ? (isDarkMode ? 'text-[#131313]' : 'text-[#2573e6]') : textColor}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Paid Amount</Text>
              <View className={`border rounded p-2 mb-4 ${bgInputAlt} ${borderColor}`}>
                 <TextInput value={paymentForm.amount} onChangeText={v => setPaymentForm({...paymentForm, amount: v})} keyboardType="numeric" className={`text-sm py-1 ${textColor}`} />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Payment Method</Text>
              <TouchableOpacity onPress={() => { setDropdownType('paymentMethod'); setDropdownVisible(true); }} className={`flex-row justify-between items-center border rounded p-3 mb-4 ${bgInputAlt} ${borderColor}`}>
                 <Text className={`text-sm ${textColor}`}>{paymentForm.method || 'Select Method'}</Text>
                 <ChevronDown size={14} color={isDarkMode ? "#888" : "#9ca3af"} />
              </TouchableOpacity>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Transaction ID / Reference</Text>
              <View className={`border rounded p-2 mb-4 ${bgInputAlt} ${borderColor}`}>
                 <TextInput value={paymentForm.transactionId} onChangeText={v => setPaymentForm({...paymentForm, transactionId: v})} placeholder="Enter transaction reference" placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} className={`text-sm py-1 ${textColor}`} />
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Notes</Text>
              <View className={`border rounded p-2 mb-4 ${bgInputAlt} ${borderColor}`}>
                 <TextInput value={paymentForm.notes} onChangeText={v => setPaymentForm({...paymentForm, notes: v})} multiline numberOfLines={3} placeholder="Add any additional notes..." placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} className={`text-sm py-1 ${textColor}`} />
              </View>
            </ScrollView>

            <View className={`flex-row justify-end mt-2 pt-2 border-t ${borderColor}`}>
               <TouchableOpacity onPress={() => setActiveModal(null)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={updatePayment} className={`px-4 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Update Payment</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Payslip Modal */}
      <Modal visible={activeModal === 'payslip'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className={`border rounded-lg w-11/12 p-4 max-h-[90%] ${bgCard} ${borderColor}`}>
            <View className="flex-row justify-between items-center mb-4">
               <Text className={`text-sm font-bold tracking-widest uppercase ${textColor}`}>Generate Payslip</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color={isDarkMode ? "#888" : "#6b7280"} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className={`flex-row justify-between items-center mb-4 pb-4 border-b ${borderColor}`}>
                <View className="flex-row items-center">
                   <View className={`w-8 h-8 rounded-full border items-center justify-center mr-3 ${bgInputAlt} ${borderColor}`}>
                     <Text className={`font-bold text-xs ${textColor}`}>{selectedSalary?.user?.name?.charAt(0) || 'U'}</Text>
                   </View>
                   <View>
                     <Text className={`font-bold text-sm ${textColor}`}>{selectedSalary?.user?.name}</Text>
                     <Text className={`text-[10px] ${textMuted}`}>{selectedSalary?.user?.email}</Text>
                   </View>
                </View>
                <View className="items-end">
                   <Text className={`text-[10px] ${textMuted}`}>Points</Text>
                   <Text className={`font-bold text-base ${textColor}`}>{selectedSalary?.totalPointsForSalary || selectedSalary?.points || 0}</Text>
                </View>
              </View>

              <Text className={`font-bold text-xs mb-3 uppercase tracking-wider ${textColor}`}>Earnings</Text>
              <View className={`p-3 rounded border mb-4 ${bgInputAlt} ${borderColor}`}>
                 <View className="flex-row justify-between mb-4">
                    <Text className={`text-xs ${textMuted}`}>Base Salary</Text>
                    <Text className={`font-bold text-xs ${textColor}`}>₹{selectedSalary?.baseSalary || 0}</Text>
                 </View>
                 <View className="flex-row justify-between items-center mb-3">
                    <Text className={`text-xs ${textMuted}`}>Bonus</Text>
                    <View className={`border rounded px-2 w-24 ${borderColor}`}>
                       <TextInput value={payslipForm.bonus} onChangeText={v => setPayslipForm({...payslipForm, bonus: v})} keyboardType="numeric" className={`text-right text-xs py-1 ${textColor}`} />
                    </View>
                 </View>
                 <View className="flex-row justify-between items-center">
                    <Text className={`text-xs ${textMuted}`}>Allowances</Text>
                    <View className={`border rounded px-2 w-24 ${borderColor}`}>
                       <TextInput value={payslipForm.allowances} onChangeText={v => setPayslipForm({...payslipForm, allowances: v})} keyboardType="numeric" className={`text-right text-xs py-1 ${textColor}`} />
                    </View>
                 </View>
              </View>

              <Text className={`font-bold text-xs mb-3 uppercase tracking-wider ${textColor}`}>Deductions</Text>
              <View className={`p-3 rounded border mb-4 ${bgInputAlt} ${borderColor}`}>
                 <View className="flex-row justify-between items-center mb-3">
                    <Text className={`text-xs ${textMuted}`}>Other Deductions</Text>
                    <View className={`border rounded px-2 w-24 ${borderColor}`}>
                       <TextInput value={payslipForm.otherDeductions} onChangeText={v => setPayslipForm({...payslipForm, otherDeductions: v})} keyboardType="numeric" className={`text-right text-xs py-1 ${textColor}`} />
                    </View>
                 </View>
                 <View className="flex-row justify-between items-center">
                    <Text className={`text-xs ${textMuted}`}>Tax</Text>
                    <View className={`border rounded px-2 w-24 ${borderColor}`}>
                       <TextInput value={payslipForm.tax} onChangeText={v => setPayslipForm({...payslipForm, tax: v})} keyboardType="numeric" className={`text-right text-xs py-1 ${textColor}`} />
                    </View>
                 </View>
              </View>

              <View className={`flex-row justify-between p-3 rounded border mb-4 items-center ${bgInputAlt} ${borderColor}`}>
                 <View>
                    <Text className={`text-xs mb-1 ${textMuted}`}>Gross Salary:</Text>
                    <Text className={`font-bold text-sm ${textColor}`}>₹{(selectedSalary?.baseSalary || 0) + Number(payslipForm.bonus || 0) + Number(payslipForm.allowances || 0)}</Text>
                 </View>
                 <View className="items-end">
                    <Text className={`text-xs mb-1 ${textMuted}`}>Total Deductions:</Text>
                    <Text className="text-[#ef4444] font-bold text-sm">-₹{Number(payslipForm.otherDeductions || 0) + Number(payslipForm.tax || 0)}</Text>
                 </View>
              </View>

              <View className={`flex-row justify-between items-center p-3 rounded border mb-4 ${isDarkMode ? 'border-[#adc6ff4a] bg-[#adc6ff1a]' : 'border-blue-200 bg-blue-50'}`}>
                 <Text className={`font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600'}`}>Net Salary:</Text>
                 <Text className={`font-bold text-lg ${isDarkMode ? 'text-[#adc6ff]' : 'text-blue-600'}`}>₹{(selectedSalary?.baseSalary || 0) + Number(payslipForm.bonus || 0) + Number(payslipForm.allowances || 0) - (Number(payslipForm.otherDeductions || 0) + Number(payslipForm.tax || 0))}</Text>
              </View>

              <Text className={`text-[10px] font-bold mb-2 uppercase ${textMuted}`}>Notes</Text>
              <View className={`border rounded p-2 mb-4 ${bgInputAlt} ${borderColor}`}>
                 <TextInput value={payslipForm.notes} onChangeText={v => setPayslipForm({...payslipForm, notes: v})} multiline numberOfLines={2} placeholder="Add any notes to appear on the payslip..." placeholderTextColor={isDarkMode ? "#888" : "#9ca3af"} className={`text-sm py-1 ${textColor}`} />
              </View>
            </ScrollView>

            <View className={`flex-row justify-end mt-2 pt-2 border-t ${borderColor}`}>
               <TouchableOpacity onPress={() => setActiveModal(null)} className="mr-4 py-2"><Text className={`font-bold text-xs uppercase ${textColor}`}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={generatePayslip} className={`px-4 py-2 rounded flex-row items-center ${isDarkMode ? 'bg-[#adc6ff]' : 'bg-[#2573e6]'}`}>
                  <Receipt size={12} color={isDarkMode ? "#131313" : "#ffffff"} className="mr-2" />
                  <Text className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#131313]' : 'text-white'}`}>Generate Payslip</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
