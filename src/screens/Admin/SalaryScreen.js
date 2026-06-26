import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import client from '../../api/client';
import { User, Filter, Search, ChevronDown, Calculator, Settings, Eye, CreditCard, Receipt, Calendar, Clock, X, FileText } from 'lucide-react-native';

export default function SalaryScreen() {
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

      if (statsRes.data.data && statsRes.data.data.length > 0) {
        setStats(statsRes.data.data[0]);
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

  const openModal = async (type, item = null) => {
    if (type === 'settings') {
      try {
        const res = await client.get('/salary/settings/conversion');
        if (res.data.data) setConversionRate(res.data.data.pointToRupeeConversion?.toString() || '10');
      } catch (e) {}
    } else if (type === 'payment' && item) {
      setPaymentForm({
        status: item.paymentStatus ? item.paymentStatus.toUpperCase() : 'PENDING',
        amount: item.finalAmount ? item.finalAmount.toString() : '0',
        method: item.paymentMethod || 'Bank Transfer',
        transactionId: item.transactionId || '',
        notes: item.notes || ''
      });
    } else if (type === 'payslip' && item) {
      setPayslipForm({ bonus: '0', allowances: '0', otherDeductions: '0', tax: '0', notes: '' });
    }
    
    setSelectedSalary(item);
    setActiveModal(type);
  };

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
    return [];
  };

  const selectDropdownItem = (item) => {
    if (dropdownType === 'month') setPeriodMonth(item);
    if (dropdownType === 'year') setPeriodYear(item);
    if (dropdownType === 'department') setDepartmentId(item._id);
    if (dropdownType === 'status') setPaymentStatusFilter(item);
    setDropdownVisible(false);
  };

  const renderItem = ({ item }) => {
    const periodMonthName = item.periodMonth ? new Date(2000, item.periodMonth - 1).toLocaleString('default', { month: 'short' }) : 'N/A';
    const pYear = item.periodYear || 'N/A';
    const isPaid = item.paymentStatus?.toLowerCase() === 'paid';
    const payslipGenerated = !!item.payslipId;
    
    return (
      <View className="flex-row border-b border-[#ffffff1a] py-4 px-4 bg-[#131313] items-center">
        <View className="w-56 flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-[#1c1b1b] border border-[#ffffff1a] items-center justify-center mr-3">
            <Text className="text-white text-xs font-bold">{item.user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View>
            <Text className="text-white text-xs font-bold" numberOfLines={1}>{item.user?.name || 'Unknown'}</Text>
            <Text className="text-[#888] text-[10px]" numberOfLines={1}>{item.user?.email || 'N/A'}</Text>
          </View>
        </View>

        <Text className="w-24 text-[#888] text-xs" numberOfLines={1}>{item.user?.departmentId?.name || item.department || 'N/A'}</Text>
        
        <View className="w-24">
           <Text className="text-white text-xs">{periodMonthName}</Text>
           <Text className="text-[#888] text-[10px]">{pYear}</Text>
        </View>

        <Text className="w-20 text-white text-xs text-center">{item.totalPointsForSalary || item.totalPoints || item.points || 0}</Text>
        <Text className="w-20 text-white text-xs text-center">₹{item.pointToRupeeConversion || item.rate || 0}</Text>
        <Text className="w-24 text-white text-xs text-center">₹{item.baseSalary || 0}</Text>
        <Text className="w-24 text-white text-xs font-bold text-center">₹{item.finalSalary || item.finalAmount || item.amount || 0}</Text>

        <View className="w-28 items-center justify-center">
          <View className={`border px-2 py-1 rounded flex-row items-center ${isPaid ? 'border-[#10b9814a] bg-[#10b9811a]' : 'border-[#f59e0b4a] bg-[#f59e0b1a]'}`}>
             {!isPaid && <Clock size={10} color="#f59e0b" className="mr-1" />}
             <Text className={`text-[10px] font-bold ${isPaid ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
               {item.paymentStatus ? item.paymentStatus.toUpperCase() : 'PENDING'}
             </Text>
          </View>
        </View>

        <View className="w-32 items-center justify-center">
           <TouchableOpacity 
              onPress={() => payslipGenerated ? openModal('details', item) : openModal('payslip', item)}
              className={`px-2 py-1.5 rounded flex-row items-center border ${payslipGenerated ? 'bg-[#10b9811a] border-[#10b9814a]' : 'bg-white border-white'}`}
           >
              <Receipt size={10} color={payslipGenerated ? '#10b981' : '#131313'} className="mr-1" />
              <Text className={`text-[10px] font-bold uppercase ${payslipGenerated ? 'text-[#10b981]' : 'text-[#131313]'}`}>
                {payslipGenerated ? 'VIEW PAYSLIP' : 'NOT GENERATED'}
              </Text>
           </TouchableOpacity>
        </View>

        <View className="w-24 flex-row justify-center space-x-3">
           <TouchableOpacity onPress={() => openModal('details', item)}><Eye size={14} color="#888" /></TouchableOpacity>
           <TouchableOpacity onPress={() => openModal('payment', item)}><CreditCard size={14} color="#888" /></TouchableOpacity>
           <TouchableOpacity onPress={() => openModal('payslip', item)}><Calculator size={14} color="#888" /></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#131313] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-6 mt-4">
        <View className="flex-1 mr-4">
          <Text className="text-white text-2xl font-bold tracking-wider">Salary</Text>
          <Text className="text-white text-2xl font-bold tracking-wider mb-1">Management</Text>
          <Text className="text-[#888] text-[10px] leading-tight">Manage employee salaries, generate payslips, and track payments</Text>
        </View>
        <View className="flex-col space-y-2 mt-1">
          <TouchableOpacity onPress={() => openModal('settings')} className="border border-[#ffffff1a] rounded px-3 py-1.5 flex-row items-center justify-center">
            <Settings size={12} color="#fff" className="mr-1" />
            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={calculateAll} className="bg-[#adc6ff] rounded px-3 py-1.5 flex-row items-center justify-center">
            <Calculator size={12} color="#131313" className="mr-1" />
            <Text className="text-[#131313] text-[10px] font-bold uppercase tracking-wider">Calculate All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg mr-3 min-w-[150px] flex-row justify-between items-center">
            <View>
              <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-2">Total Employees</Text>
              <Text className="text-white text-2xl font-bold">{stats.totalEmployees || 0}</Text>
            </View>
            <View className="bg-[#131313] p-2 rounded"><User size={16} color="#888" /></View>
          </View>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg mr-3 min-w-[150px] flex-row justify-between items-center">
            <View>
              <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-2">Total Salary</Text>
              <Text className="text-white text-xl font-bold">₹{stats.totalSalary?.toLocaleString() || 0}</Text>
            </View>
            <View className="bg-[#10b9811a] p-2 rounded"><Text className="text-[#10b981] font-bold">₹</Text></View>
          </View>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg mr-3 min-w-[150px] flex-row justify-between items-center">
            <View>
              <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-2">Avg Salary</Text>
              <Text className="text-white text-xl font-bold">₹{Math.round(stats.avgSalary || 0).toLocaleString()}</Text>
            </View>
            <View className="bg-[#38bdf81a] p-2 rounded"><Text className="text-[#38bdf8] font-bold">~</Text></View>
          </View>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] p-4 rounded-lg min-w-[150px] flex-row justify-between items-center">
            <View>
              <Text className="text-[#888] text-[10px] uppercase font-bold tracking-widest mb-2">Paid / Pending</Text>
              <Text className="text-white text-xl font-bold"><Text className="text-[#10b981]">{stats.paidCount || 0}</Text> <Text className="text-[#888] text-sm">/</Text> <Text className="text-[#f59e0b]">{stats.pendingCount || 0}</Text></Text>
            </View>
            <View className="bg-[#a855f71a] p-2 rounded"><CreditCard size={16} color="#a855f7" /></View>
          </View>
        </ScrollView>
      </View>

      {/* Filters Area */}
      <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded p-2 mb-4 flex-row items-center flex-wrap">
        <View className="flex-row items-center mr-2 mb-2">
           <Calendar size={14} color="#888" className="mr-2 ml-2" />
           <TouchableOpacity onPress={() => { setDropdownType('month'); setDropdownVisible(true); }} className="flex-row items-center bg-[#131313] px-2 py-1.5 rounded mr-2 min-w-[80px] justify-between">
              <Text className="text-white text-xs">{periodMonth}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('year'); setDropdownVisible(true); }} className="flex-row items-center bg-[#131313] px-2 py-1.5 rounded min-w-[70px] justify-between">
              <Text className="text-white text-xs">{periodYear}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
        </View>

        <View className="flex-row items-center mr-2 mb-2 border-l border-[#ffffff1a] pl-2">
           <Filter size={14} color="#888" className="mr-2" />
           <TouchableOpacity onPress={() => { setDropdownType('department'); setDropdownVisible(true); }} className="flex-row items-center bg-[#131313] px-2 py-1.5 rounded mr-2 min-w-[120px] justify-between">
              <Text className="text-white text-xs" numberOfLines={1}>{departmentId ? departments.find(d => d._id === departmentId)?.name : 'All Departments'}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setDropdownType('status'); setDropdownVisible(true); }} className="flex-row items-center bg-[#131313] px-2 py-1.5 rounded min-w-[100px] justify-between">
              <Text className="text-white text-xs">{paymentStatusFilter || 'All Status'}</Text>
              <ChevronDown size={14} color="#888" />
           </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-2 border-l border-[#ffffff1a] pl-2 flex-1">
           <View className="flex-row items-center bg-[#131313] px-2 py-1 rounded flex-1 mr-2 h-8">
              <Search size={14} color="#888" />
              <TextInput
                placeholder="Search employee..."
                placeholderTextColor="#888"
                className="text-white text-xs ml-2 flex-1 py-0"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
           </View>
           <TouchableOpacity onPress={handleReset} className="border border-[#ffffff1a] px-3 py-1.5 rounded">
              <Text className="text-white text-[10px] font-bold uppercase">Reset</Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      <View className="flex-1 bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg overflow-hidden">
        {loading ? (
          <ActivityIndicator size="large" color="#adc6ff" className="mt-10" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ minWidth: 1000 }}>
              <View className="flex-row border-b border-[#ffffff1a] bg-[#161616] py-3 px-4">
                <Text className="w-56 text-[#888] text-[10px] font-bold tracking-widest uppercase">Employee</Text>
                <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase">Department</Text>
                <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase">Period</Text>
                <Text className="w-20 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Points</Text>
                <Text className="w-20 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Rate (₹)</Text>
                <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Base Salary</Text>
                <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Final Salary</Text>
                <Text className="w-28 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Payment</Text>
                <Text className="w-32 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Payslip</Text>
                <Text className="w-24 text-[#888] text-[10px] font-bold tracking-widest uppercase text-center">Actions</Text>
              </View>
              <FlatList 
                data={salaries}
                keyExtractor={(item, index) => item._id || index.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <Text className="text-[#888] text-center py-6 text-xs">No salary records found.</Text>
                }
              />
            </View>
          </ScrollView>
        )}
      </View>

      {/* Filter Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}} onPress={() => setDropdownVisible(false)}>
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-3/4 max-h-[50%] p-4">
            <FlatList
              data={getDropdownOptions()}
              keyExtractor={(i, index) => dropdownType === 'department' ? (i._id || index.toString()) : i}
              renderItem={({item}) => (
                <TouchableOpacity className="py-3 border-b border-[#ffffff1a]" onPress={() => selectDropdownItem(item)}>
                  <Text className="text-white text-base text-center">{dropdownType === 'department' ? item.name : item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={activeModal === 'settings'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-6">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">Salary Settings</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color="#888" /></TouchableOpacity>
            </View>
            <Text className="text-[#888] text-xs font-bold mb-2 uppercase">Point to Rupee Conversion</Text>
            <View className="flex-row items-center border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-2">
               <Text className="text-[#888] mr-2">₹</Text>
               <TextInput 
                 value={conversionRate} 
                 onChangeText={setConversionRate} 
                 keyboardType="numeric"
                 className="flex-1 text-white text-sm py-1"
               />
               <Text className="text-[#888] ml-2 text-xs">per point</Text>
            </View>
            <Text className="text-[#888] text-[10px] mb-6">Set how much 1 point is worth in Rupees. Example: If set to 10, then 100 points = ₹1,000</Text>
            
            <View className="flex-row justify-end mt-4">
               <TouchableOpacity onPress={() => setActiveModal(null)} className="mr-4 py-2"><Text className="text-white font-bold text-xs uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={saveSettings} className="bg-[#adc6ff] px-4 py-2 rounded flex-row items-center">
                  <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Save Settings</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Salary Details Modal (Empty state as per screenshot) */}
      <Modal visible={activeModal === 'details'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-6 items-center">
            <View className="w-full flex-row justify-between items-center mb-10">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">Salary Details</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color="#888" /></TouchableOpacity>
            </View>
            <FileText size={40} color="#888" className="mb-4" strokeWidth={1} />
            <Text className="text-white font-bold text-lg mb-2">No payslip generated yet</Text>
            <Text className="text-[#888] text-xs mb-8 text-center">Generate a payslip to view detailed breakdown</Text>
            <TouchableOpacity onPress={() => setActiveModal('payslip')} className="bg-[#adc6ff] px-6 py-3 rounded flex-row items-center mb-6">
               <Receipt size={14} color="#131313" className="mr-2" />
               <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Generate Payslip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Update Payment Modal */}
      <Modal visible={activeModal === 'payment'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-4 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">Update Payment Status</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center bg-[#131313] p-3 rounded border border-[#ffffff1a] mb-4">
                <View>
                  <Text className="text-white font-bold text-sm">{selectedSalary?.user?.name}</Text>
                  <Text className="text-[#888] text-[10px]">{selectedSalary?.user?.email}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white font-bold text-sm">₹{selectedSalary?.finalSalary || 0}</Text>
                  <Text className="text-[#888] text-[10px]">June 2026</Text>
                </View>
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Payment Status</Text>
              <View className="flex-row flex-wrap justify-between mb-4">
                {['PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'ON HOLD'].map(s => (
                  <TouchableOpacity key={s} onPress={() => setPaymentForm({...paymentForm, status: s})} className={`w-[31%] mb-2 py-2 rounded items-center border ${paymentForm.status === s ? 'bg-[#adc6ff] border-[#adc6ff]' : 'border-[#ffffff1a]'}`}>
                    <Text className={`text-[10px] font-bold ${paymentForm.status === s ? 'text-[#131313]' : 'text-white'}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Paid Amount</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                 <TextInput value={paymentForm.amount} onChangeText={v => setPaymentForm({...paymentForm, amount: v})} keyboardType="numeric" className="text-white text-sm py-1" />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Transaction ID / Reference</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                 <TextInput value={paymentForm.transactionId} onChangeText={v => setPaymentForm({...paymentForm, transactionId: v})} placeholder="Enter transaction reference" placeholderTextColor="#888" className="text-white text-sm py-1" />
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Notes</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                 <TextInput value={paymentForm.notes} onChangeText={v => setPaymentForm({...paymentForm, notes: v})} multiline numberOfLines={3} placeholder="Add any additional notes..." placeholderTextColor="#888" className="text-white text-sm py-1" />
              </View>
            </ScrollView>

            <View className="flex-row justify-end mt-2 pt-2 border-t border-[#ffffff1a]">
               <TouchableOpacity onPress={() => setActiveModal(null)} className="mr-4 py-2"><Text className="text-white font-bold text-xs uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={updatePayment} className="bg-[#adc6ff] px-4 py-2 rounded flex-row items-center">
                  <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Update Payment</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Payslip Modal */}
      <Modal visible={activeModal === 'payslip'} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-[#000000cc]">
          <View className="bg-[#1c1b1b] border border-[#ffffff1a] rounded-lg w-11/12 p-4 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4">
               <Text className="text-white text-sm font-bold tracking-widest uppercase">Generate Payslip</Text>
               <TouchableOpacity onPress={() => setActiveModal(null)}><X size={20} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-[#ffffff1a]">
                <View className="flex-row items-center">
                   <View className="w-8 h-8 rounded-full bg-[#131313] border border-[#ffffff1a] items-center justify-center mr-3">
                     <Text className="text-white font-bold text-xs">{selectedSalary?.user?.name?.charAt(0) || 'U'}</Text>
                   </View>
                   <View>
                     <Text className="text-white font-bold text-sm">{selectedSalary?.user?.name}</Text>
                     <Text className="text-[#888] text-[10px]">{selectedSalary?.user?.email}</Text>
                   </View>
                </View>
                <View className="items-end">
                   <Text className="text-[#888] text-[10px]">Points</Text>
                   <Text className="text-white font-bold text-base">{selectedSalary?.totalPointsForSalary || selectedSalary?.points || 0}</Text>
                </View>
              </View>

              <Text className="text-white font-bold text-xs mb-3 uppercase tracking-wider">Earnings</Text>
              <View className="bg-[#131313] p-3 rounded border border-[#ffffff1a] mb-4">
                 <View className="flex-row justify-between mb-4">
                    <Text className="text-[#888] text-xs">Base Salary</Text>
                    <Text className="text-white font-bold text-xs">₹{selectedSalary?.baseSalary || 0}</Text>
                 </View>
                 <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-[#888] text-xs">Bonus</Text>
                    <View className="border border-[#ffffff1a] rounded px-2 w-24">
                       <TextInput value={payslipForm.bonus} onChangeText={v => setPayslipForm({...payslipForm, bonus: v})} keyboardType="numeric" className="text-white text-right text-xs py-1" />
                    </View>
                 </View>
                 <View className="flex-row justify-between items-center">
                    <Text className="text-[#888] text-xs">Allowances</Text>
                    <View className="border border-[#ffffff1a] rounded px-2 w-24">
                       <TextInput value={payslipForm.allowances} onChangeText={v => setPayslipForm({...payslipForm, allowances: v})} keyboardType="numeric" className="text-white text-right text-xs py-1" />
                    </View>
                 </View>
              </View>

              <Text className="text-white font-bold text-xs mb-3 uppercase tracking-wider">Deductions</Text>
              <View className="bg-[#131313] p-3 rounded border border-[#ffffff1a] mb-4">
                 <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-[#888] text-xs">Other Deductions</Text>
                    <View className="border border-[#ffffff1a] rounded px-2 w-24">
                       <TextInput value={payslipForm.otherDeductions} onChangeText={v => setPayslipForm({...payslipForm, otherDeductions: v})} keyboardType="numeric" className="text-white text-right text-xs py-1" />
                    </View>
                 </View>
                 <View className="flex-row justify-between items-center">
                    <Text className="text-[#888] text-xs">Tax</Text>
                    <View className="border border-[#ffffff1a] rounded px-2 w-24">
                       <TextInput value={payslipForm.tax} onChangeText={v => setPayslipForm({...payslipForm, tax: v})} keyboardType="numeric" className="text-white text-right text-xs py-1" />
                    </View>
                 </View>
              </View>

              <View className="flex-row justify-between bg-[#131313] p-3 rounded border border-[#ffffff1a] mb-4 items-center">
                 <View>
                    <Text className="text-[#888] text-xs mb-1">Gross Salary:</Text>
                    <Text className="text-white font-bold text-sm">₹{(selectedSalary?.baseSalary || 0) + Number(payslipForm.bonus || 0) + Number(payslipForm.allowances || 0)}</Text>
                 </View>
                 <View className="items-end">
                    <Text className="text-[#888] text-xs mb-1">Total Deductions:</Text>
                    <Text className="text-[#ef4444] font-bold text-sm">-₹{Number(payslipForm.otherDeductions || 0) + Number(payslipForm.tax || 0)}</Text>
                 </View>
              </View>

              <View className="flex-row justify-between items-center p-3 rounded border border-[#adc6ff4a] bg-[#adc6ff1a] mb-4">
                 <Text className="text-[#adc6ff] font-bold uppercase tracking-wider">Net Salary:</Text>
                 <Text className="text-[#adc6ff] font-bold text-lg">₹{(selectedSalary?.baseSalary || 0) + Number(payslipForm.bonus || 0) + Number(payslipForm.allowances || 0) - (Number(payslipForm.otherDeductions || 0) + Number(payslipForm.tax || 0))}</Text>
              </View>

              <Text className="text-[#888] text-[10px] font-bold mb-2 uppercase">Notes</Text>
              <View className="border border-[#ffffff1a] bg-[#131313] rounded p-2 mb-4">
                 <TextInput value={payslipForm.notes} onChangeText={v => setPayslipForm({...payslipForm, notes: v})} multiline numberOfLines={2} placeholder="Add any notes to appear on the payslip..." placeholderTextColor="#888" className="text-white text-sm py-1" />
              </View>
            </ScrollView>

            <View className="flex-row justify-end mt-2 pt-2 border-t border-[#ffffff1a]">
               <TouchableOpacity onPress={() => setActiveModal(null)} className="mr-4 py-2"><Text className="text-white font-bold text-xs uppercase">Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={generatePayslip} className="bg-[#adc6ff] px-4 py-2 rounded flex-row items-center">
                  <Receipt size={12} color="#131313" className="mr-2" />
                  <Text className="text-[#131313] font-bold text-xs uppercase tracking-wider">Generate Payslip</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
