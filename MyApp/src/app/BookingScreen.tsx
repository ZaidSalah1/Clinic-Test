// src/screens/BookingScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HOST } from './constants';
import type { RootStackParamList } from './App';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';

type BookingRoute = RouteProp<RootStackParamList, 'Booking'>;

const BRAND = '#1D90AF';
const CTA = '#3AC0D9';
const CARD_BG = '#E9F6FA';
const CALLBACK_URL =
  'https://531a3ea0e05a.ngrok-free.app/payments/lahza/callback';

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

  // NEW: للدفع + شاشة نجاح
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const webHandledRef = useRef(false); // يمنع التكرار

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

  function addMinutesToISO(isoUtc: string, mins: number) {
    const d = new Date(isoUtc);
    d.setUTCMinutes(d.getUTCMinutes() + mins);
    return d.toISOString();
  }

  async function onNext() {
    if (!picked) return;
    try {
      const res = await fetch(`${HOST}/appointments/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          dateISO: selectedDate,
          slotStartUTC: picked.utc,
          slotEndUTC: addMinutesToISO(picked.utc, 30), // 👈 أضف هذه
          patient: {
            firstName: 'Guest',
            lastName: 'User',
            phone: '0599XXXXXX',
            email: 'guest@example.com',
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Init failed');

      webHandledRef.current = false;
      setPayUrl(json.authorizationUrl);
    } catch (e: any) {
      Alert.alert('Payment Init Error', e.message);
    }
  }

  // اعتراض الرجوع من الدفع
  const handleNavChange = async (navState: any) => {
    const url: string | undefined = navState?.url;
    if (!url || webHandledRef.current) return;

    // التحقق من الـ callback أو صفحة الإغلاق
    const isCallback = url.startsWith(CALLBACK_URL);
    const isClose = url === 'https://api.lahza.io/close';

    if (isCallback || isClose) {
      webHandledRef.current = true; // امنع التكرار
      try {
        // حاول تجيب reference من الكولباك (إن وُجد)
        let ref: string | null = null;
        try {
          const q = new URL(url).searchParams;
          ref = q.get('reference');
        } catch {}

        if (ref) {
          await fetch(`${HOST}/payments/lahza/verify?reference=${ref}`);
        }
      } catch (_) {
        // تجاهل أخطاء التحقق المؤقتة
      } finally {
        setPayUrl(null); // أغلق WebView
        setShowSuccess(true); // أعرض نجاح
      }
    }
  };

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
          <Text style={styles.sectionTitle}>Choose working hours</Text>

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

      {/* WebView للدفع - طبقة فوق */}
      {payUrl && (
        <View style={styles.webviewWrap}>
          <View style={styles.webHeader}>
            <Pressable
              onPress={() => setPayUrl(null)}
              style={styles.dismissBtn}
            >
              <Ionicons name="close" size={22} color="#333" />
            </Pressable>
            <Text style={styles.webTitle}>Secure Payment</Text>
            <View style={{ width: 22 }} />
          </View>
          <WebView
            source={{ uri: payUrl }}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            setSupportMultipleWindows={false} // يمنع فتح نافذة/تبويب خارجي
            onShouldStartLoadWithRequest={req => {
              const url = req.url;

              // 1) لما نرجع من لَحْظة نغلق الويب فيو ونظهر النجاح داخل التطبيق
              if (
                url.startsWith(CALLBACK_URL) ||
                url === 'https://api.lahza.io/close'
              ) {
                (async () => {
                  try {
                    // استخرج reference لو موجود وتحقق
                    const ref = new URL(url).searchParams.get('reference');
                    if (ref)
                      await fetch(
                        `${HOST}/payments/lahza/verify?reference=${ref}`,
                      );
                  } catch {}
                  setPayUrl(null);
                  setShowSuccess(true);
                })();
                return false; // لا تفتح الرابط (لا داخل الويب فيو ولا خارجه)
              }

              // 2) لو الرابط intent/tel/mailto أو أي scheme خاص، افتحه خارجيًا بإرادتنا
              if (
                url.startsWith('intent://') ||
                url.startsWith('tel:') ||
                url.startsWith('mailto:')
              ) {
                Linking.openURL(url).catch(() => {});
                return false;
              }

              // 3) امنع about:blank (بعض مزوّدي الدفع بيفتحوها كنوافذ وسيطة)
              if (url === 'about:blank') return false;

              // 4) كل شيء آخر يظل داخل نفس WebView
              return true;
            }}
            // اختياري: لو حابب تراقب تغيّرات العناوين (مش ضروري الآن)
            // onNavigationStateChange={handleNavChange}

            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Modal نجاح بسيط بدل SuccessScreen */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
            <Text style={styles.modalTitle}>تم الحجز بنجاح</Text>
            <Text style={styles.modalText}>
              سنرسل لك تفاصيل الموعد على رقمك/إيميلك.
            </Text>
            <Pressable
              onPress={() => {
                setShowSuccess(false);
                // ارجع للشاشة السابقة أو روح لصفحة المواعيد
                // navigation.navigate('Appointments'); // لو عندك شاشة مواعيد
                navigation.goBack();
              }}
              style={styles.modalBtn}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>تمّ</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: {
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  slotPicked: { backgroundColor: '#fff', borderWidth: 2, borderColor: BRAND },
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

  // WebView overlay
  webviewWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  webHeader: {
    height: 48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  dismissBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTitle: { fontWeight: '800', color: '#333' },

  // Success modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
  },
  modalText: { color: '#333', textAlign: 'center', marginBottom: 12 },
  modalBtn: {
    backgroundColor: CTA,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
});
