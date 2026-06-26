import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Search, X, Eye, FileText, Film, Globe, Users, Lock, Calendar, Download } from 'lucide-react-native';
import { getKtDocuments, getProjects } from '../../api/services';

const VISIBILITY_META = {
  team:       { label: 'Team',       Icon: Lock,  color: '#e8a847', bg: '#e8a84718' },
  department: { label: 'Department', Icon: Users, color: '#47c8ff', bg: '#47c8ff18' },
  company:    { label: 'Company',    Icon: Globe, color: '#47ff8a', bg: '#47ff8a18' },
};

function VisibilityBadge({ visibility }) {
  const m = VISIBILITY_META[visibility] || VISIBILITY_META.team;
  const Icon = m.Icon;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: m.bg, borderWidth: 1, borderColor: m.color + '40', paddingHorizontal: 8, paddingVertical: 3 }}>
      <Icon size={10} color={m.color} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: m.color }}>{m.label}</Text>
    </View>
  );
}

function DocDetailModal({ doc, onClose }) {
  const m = VISIBILITY_META[doc.visibility] || VISIBILITY_META.team;

  const allFiles = doc.files?.length
    ? doc.files
    : doc.fileUrl
      ? [{ url: doc.fileUrl, name: 'Attachment', type: doc.fileType }]
      : [];

  const videoFiles = allFiles.filter(f => ['webm', 'mp4', 'mov', 'avi'].includes(f.type?.toLowerCase()));
  const otherFiles = allFiles.filter(f => !['webm', 'mp4', 'mov', 'avi'].includes(f.type?.toLowerCase()));

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={kt.overlay}>
        <View style={kt.sheet}>
          <View style={kt.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={kt.sheetSubtitle}>KT DOCUMENT</Text>
              <Text style={kt.sheetTitle} numberOfLines={1}>{doc.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={18} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* View-only notice */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2573e610', borderWidth: 1, borderColor: '#2573e640', padding: 10, marginBottom: 14 }}>
              <Eye size={12} color="#2573e6" />
              <Text style={{ fontSize: 10, color: '#2573e6', fontWeight: '700', letterSpacing: 1 }}>VIEW-ONLY MODE</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <VisibilityBadge visibility={doc.visibility} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} color="#6b7280" />
                <Text style={{ fontSize: 10, color: '#6b7280' }}>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Text>
              </View>
            </View>

            {doc.tags?.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {doc.tags.map(t => (
                  <View key={t} style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600' }}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {doc.content && (
              <View style={{ marginBottom: 14 }}>
                <Text style={kt.infoLabel}>DESCRIPTION</Text>
                <View style={{ backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', padding: 12, marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: '#9ca3af', lineHeight: 18 }}>{doc.content}</Text>
                </View>
              </View>
            )}

            {videoFiles.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={kt.infoLabel}>VIDEO ATTACHMENTS ({videoFiles.length})</Text>
                {videoFiles.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', padding: 12, marginTop: 6 }}>
                    <Film size={16} color="#2573e6" />
                    <Text style={{ flex: 1, fontSize: 12, color: '#e5e7eb' }} numberOfLines={1}>{f.name || `Video ${i + 1}`}</Text>
                    <Text style={{ fontSize: 9, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>{f.type}</Text>
                  </View>
                ))}
              </View>
            )}

            {otherFiles.length > 0 && (
              <View>
                <Text style={kt.infoLabel}>DOCUMENT ATTACHMENTS ({otherFiles.length})</Text>
                {otherFiles.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f2937', padding: 12, marginTop: 6 }}>
                    <FileText size={16} color="#2573e6" />
                    <Text style={{ flex: 1, fontSize: 12, color: '#e5e7eb' }} numberOfLines={1}>{f.name || `File ${i + 1}`}</Text>
                    <Download size={14} color="#6b7280" />
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1f2937' }}>
            <TouchableOpacity style={kt.closeBtn} onPress={onClose}>
              <Text style={kt.closeBtnText}>CLOSE VIEWER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function KTDocumentsScreen() {
  const [docs, setDocs]           = useState([]);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [projFilter, setProjFilter] = useState('');
  const [selected, setSelected]   = useState(null);

  const load = useCallback(async () => {
    try {
      const [d, p] = await Promise.allSettled([
        getKtDocuments({ projectId: projFilter || undefined }),
        getProjects(),
      ]);
      setDocs(d.status === 'fulfilled' ? d.value : []);
      setProjects(p.status === 'fulfilled' ? p.value : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [projFilter]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = docs.filter(d =>
    !search ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.content?.toLowerCase().includes(search.toLowerCase()) ||
    d.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const hasFiles = d => (d.files?.length || 0) > 0 || !!d.fileUrl;
  const isVideo  = d => {
    const f = d.files?.[0] || { type: d.fileType };
    return ['webm', 'mp4', 'mov', 'avi'].includes(f?.type?.toLowerCase());
  };

  return (
    <SafeAreaView style={kt.safe} edges={['bottom']}>
      <View style={kt.header}>
        <View>
          <Text style={kt.headerSub}>DEPARTMENT</Text>
          <Text style={kt.headerTitle}>KT Documents</Text>
        </View>
        <View style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Eye size={11} color="#6b7280" />
          <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '600' }}>VIEW ONLY</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2573e6" />}>

        {/* Search */}
        <View style={kt.searchBox}>
          <Search size={14} color="#6b7280" />
          <TextInput style={kt.searchInput} value={search} onChangeText={setSearch} placeholder="Search by title, tag..." placeholderTextColor="#4b5563" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><X size={14} color="#6b7280" /></TouchableOpacity>}
        </View>

        {/* Project filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setProjFilter('')} style={[kt.chip, !projFilter && kt.chipActive]}>
            <Text style={[kt.chipText, !projFilter && kt.chipTextActive]}>All Projects</Text>
          </TouchableOpacity>
          {projects.map(p => (
            <TouchableOpacity key={p._id} onPress={() => setProjFilter(p._id)} style={[kt.chip, projFilter === p._id && kt.chipActive]}>
              <Text style={[kt.chipText, projFilter === p._id && kt.chipTextActive]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color="#2573e6" style={{ marginTop: 40 }} /> :
         filtered.length === 0 ? <View style={kt.empty}><BookOpen size={32} color="#374151" /><Text style={kt.emptyText}>No KT documents found</Text></View> :
         filtered.map(doc => (
           <TouchableOpacity key={doc._id} style={kt.card} onPress={() => setSelected(doc)}>
             <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
               <View style={{ width: 36, height: 36, backgroundColor: '#2573e620', borderWidth: 1, borderColor: '#2573e640', alignItems: 'center', justifyContent: 'center' }}>
                 {hasFiles(doc) && isVideo(doc) ? <Film size={16} color="#2573e6" /> : <FileText size={16} color="#2573e6" />}
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={kt.cardTitle} numberOfLines={1}>{doc.title}</Text>
                 {doc.content && <Text style={kt.cardDesc} numberOfLines={2}>{doc.content}</Text>}
                 <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                   <VisibilityBadge visibility={doc.visibility} />
                   {doc.tags?.slice(0, 3).map(t => (
                     <View key={t} style={{ backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 6, paddingVertical: 2 }}>
                       <Text style={{ fontSize: 9, color: '#9ca3af' }}>#{t}</Text>
                     </View>
                   ))}
                 </View>
               </View>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#2573e640', backgroundColor: '#2573e618' }}>
                 <Eye size={11} color="#2573e6" />
                 <Text style={{ fontSize: 10, color: '#2573e6', fontWeight: '700' }}>VIEW</Text>
               </View>
             </View>
           </TouchableOpacity>
         ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {selected && <DocDetailModal doc={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}

const kt = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#131313' },
  headerSub:    { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '600' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchInput:  { flex: 1, fontSize: 12, color: '#e5e7eb' },
  chip:         { borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive:   { borderColor: '#2573e6', backgroundColor: '#2573e620' },
  chipText:     { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  chipTextActive:{ color: '#2573e6' },
  card:         { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#1f2937', padding: 14, marginBottom: 8 },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  cardDesc:     { fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 16 },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 13, color: '#4b5563' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#1f2937', maxHeight: '92%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sheetSubtitle:{ fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  sheetTitle:   { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  infoLabel:    { fontSize: 9, color: '#6b7280', fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  closeBtn:     { paddingVertical: 12, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center' },
  closeBtnText: { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
});
