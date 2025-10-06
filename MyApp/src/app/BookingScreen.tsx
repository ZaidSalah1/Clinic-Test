// src/screens/BookingScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HOST } from './constants';
import type { RootStackParamList } from './App';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

type BookingRoute = RouteProp<RootStackParamList, 'Booking'>;

const BRAND = '#1D90AF';
const CTA = '#3AC0D9';
const CARD_BG = '#E9F6FA';

type Slot = { label: string; utc: string };

export default function BookingScreen() {
  const insets = useSafeAreaInsets();

  const { params } = useRoute<BookingRoute>();
  const navigation = useNavigation();
  const doctorId = params?.doctorId as string;

  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Slot | null>(null);

  const markedDates = useMemo(
    () => ({ [selectedDate]: { selected: true, selectedColor: CTA } }),
    [selectedDate],
  );

  async function loadSlots(date: string) {
    try {
      setLoading(true);
      setPicked(null);
      const res = await fetch(
        `${HOST}/doctors/${doctorId}/availability?date=${date}`,
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.error || 'Failed to fetch availability');
      setSlots(json?.slots ?? []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load availability');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (doctorId) loadSlots(selectedDate);
  }, [doctorId]);

  function onNext() {
    if (!picked) return;
    // هنا لاحقًا اعمل POST /appointments أو روح لصفحة تأكيد
    Alert.alert('Selected slot', `${selectedDate} • ${picked.label}`);
  }

  return (
    <SafeAreaProvider>
      <View style={{ height: insets.top, backgroundColor: BRAND }} />

      <View style={styles.wrap}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND} />
          </Pressable>
          <Text style={styles.headerTitle}>Book an Appointment</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Calendar card */}
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={d => {
              setSelectedDate(d.dateString);
              loadSlots(d.dateString);
            }}
            markedDates={markedDates}
            theme={{
              todayTextColor: BRAND,
              selectedDayBackgroundColor: CTA,
              arrowColor: BRAND,
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
            }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        >
          {/* Title */}
          <Text style={styles.sectionTitle}>Choose working hours</Text>

          {/* Slots */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={BRAND} />
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={18} color={BRAND} />
              <Text style={styles.emptyText}>No availability on this day</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {slots.map(s => {
                const isPicked = picked?.utc === s.utc;
                return (
                  <Pressable
                    key={s.utc}
                    onPress={() => setPicked(s)}
                    style={[styles.slotBtn, isPicked && styles.slotPicked]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        isPicked && styles.slotTextPicked,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Next button */}
        <Pressable
          onPress={onNext}
          disabled={!picked}
          style={[styles.nextBtn, !picked && { opacity: 0.5 }]}
        >
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND },
  calendarCard: {
    backgroundColor: CARD_BG,
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#D3E8EF',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND,
    marginTop: 14,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, // React Native 0.71+ يدعم gap
  },
  slotBtn: {
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  slotPicked: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: BRAND,
  },
  slotText: { color: '#fff', fontWeight: '800' },
  slotTextPicked: { color: BRAND },
  nextBtn: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: CTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { color: '#fff', fontWeight: '800' },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  emptyText: { color: '#082A35' },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
