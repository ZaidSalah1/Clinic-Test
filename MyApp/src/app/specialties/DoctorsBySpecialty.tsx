// src/screens/specialties/DoctorsBySpecialty.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DrCard from '../components/DrCard';
import { HOST } from '../constants';
// لو ملف الأنواع عندك مختلف، عدّل الاسم
import type { RootStackParamList } from '../App';

type DoctorsBySpecRoute = RouteProp<RootStackParamList, 'DoctorsBySpecialty'>;

type Doctor = {
  _id: string;
  name: string;
  photoUrl?: string;
  rating?: number;
  specialtyId?: { name?: string; iconUrl?: string };
  // دعم مرن للتصفية:
  vPrice?: number | null;   // سعر افتراضي (virtual)
  inpPrice?: number | null; // سعر وجاهي (in-person)
  hasVirtual?: boolean;     // إن وُجدت حقول Boolean
  hasInPerson?: boolean;
};

const BRAND = '#128FAF';
const PILL_BG = '#F2F5F7';

export default function DoctorsBySpecialty() {
  const { params } = useRoute<DoctorsBySpecRoute>();
  const specName = params?.name ?? 'Doctors';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Doctor[]>([]);
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'all' | 'virtual' | 'inperson'>('all');

  useEffect(() => {
    (async () => {
      try {
        const url = `${HOST}/doctors?spec=${encodeURIComponent(specName)}`;
        const res = await fetch(url);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.items ?? [];
        setItems(arr);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [specName]);

  // فلترة ذكية: تبحث بالاسم + تُراعي التبويب (All/Virtual/In-Person)
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return items.filter(d => {
      const byText = !text || d.name?.toLowerCase().includes(text);

      // استنتاج دعم الافتراضي/الوجاهي من وجود السعر أو الفلاجز
      const supportsVirtual  = d.hasVirtual ?? (d.vPrice != null);
      const supportsInPerson = d.hasInPerson ?? (d.inpPrice != null);

      const byMode =
        mode === 'all'
          ? true
          : mode === 'virtual'
          ? supportsVirtual
          : supportsInPerson;

      return byText && byMode;
    });
  }, [items, q, mode]);

  return (
    
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      {/* Header */}
      
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              borderWidth: 1,
              borderColor: '#EEF2F5',
            }}
          >
            <Ionicons name="chevron-back" size={22} color={BRAND} />
          </Pressable>

          <Text style={{ fontSize: 20, fontWeight: '700', color: BRAND }}>Doctors</Text>

          <View style={{ width: 36 }} />{/* spacer ليظل العنوان بالمنتصف */}
        </View>

        {/* Search + Filter */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 22,
              paddingHorizontal: 12,
              height: 42,
              borderWidth: 1,
              borderColor: '#E7EDF1',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }}
          >
            <Ionicons name="search" size={18} color={BRAND} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search For a Doctor"
              placeholderTextColor="#9AA8B1"
              style={{ flex: 1, marginLeft: 8 }}
              returnKeyType="search"
            />
          </View>

          <Pressable
            onPress={() => {}}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E7EDF1',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }}
          >
            <MaterialCommunityIcons name="tune" size={20} color={BRAND} />
          </Pressable>
        </View>

        {/* Segmented Pills */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Pill label="All" active={mode === 'all'} onPress={() => setMode('all')} />
          <Pill label="Virtual" active={mode === 'virtual'} onPress={() => setMode('virtual')} />
          <Pill label="In-Person" active={mode === 'inperson'} onPress={() => setMode('inperson')} />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={BRAND} />
        </View>
      ) : filtered.length === 0 ? (
        <Text style={{ padding: 16, color: '#666' }}>لا يوجد أطباء مطابقون.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <DrCard
              doctor={item}
              host={HOST}
              onPress={() => {
                // navigation.navigate('DoctorDetails', { id: item._id });
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

/** زر الحبة (Pill) */
function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 18,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? BRAND : PILL_BG,
        borderWidth: active ? 0 : 1,
        borderColor: '#E6EBEF',
      }}
    >
      <Text style={{ color: active ? '#fff' : '#2F3A43', fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
