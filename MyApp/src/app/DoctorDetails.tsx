// src/screens/DoctorDetails.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { HOST } from './constants';
import type { RootStackParamList } from './App';

type DetailsRoute = RouteProp<RootStackParamList, 'DoctorDetails'>;

type Doctor = {
  _id: string;
  name: string;
  photoUrl?: string;
  rating?: number;
  bio?: string;
  vPrice?: number | null;
  inpPrice?: number | null;
  specialtyId?: { name?: string; iconUrl?: string };
};

const BRAND = '#1D90AF';
const CTA = '#3AC0D9';
const CARD_BG = '#FFFFFF';

export default function DoctorDetails() {
  const insets = useSafeAreaInsets();
  const { params } = useRoute<DetailsRoute>();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${HOST}/doctor/${params.id}`);
        const json = await res.json();
        if (!res.ok || !json?.ok)
          throw new Error(json?.error || 'Failed to fetch');
        if (alive) setDoctor(json.doctor);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  const imgUri = useMemo(() => {
    if (!doctor?.photoUrl) return undefined;
    return doctor.photoUrl.startsWith('http')
      ? doctor.photoUrl
      : `${HOST}${doctor.photoUrl.startsWith('/') ? '' : '/'}${
          doctor.photoUrl
        }`;
  }, [doctor?.photoUrl]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BRAND} />
      </View>
    );
  if (!doctor)
    return (
      <View style={styles.center}>
        <Text>تعذر جلب بيانات الطبيب.</Text>
      </View>
    );

  const vPrice = doctor.vPrice ?? 75;
  const iPrice = doctor.inpPrice ?? 150;

  return (
    <SafeAreaProvider>
        <View style={{ height: insets.top, backgroundColor: BRAND }} />
      <View style={styles.wrap}>
        <StatusBar backgroundColor={BRAND} barStyle="light-content" />

        {/* ===== Hero ===== */}
        <View style={styles.heroShadow}>
          {imgUri ? (
            <Image
              source={{ uri: imgUri }}
              style={styles.heroImg}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImg, styles.heroPlaceholder]}>
              <Ionicons name="person-outline" size={56} color="#6b7280" />
            </View>
          )}

          {/* Back & Heart */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.fab, { left: 14, top: insets.top + 10 }]}
          >
            <Ionicons name="chevron-back" size={22} color={BRAND} />
          </Pressable>

          <Pressable
            onPress={() => setLiked(v => !v)}
            style={[
              styles.fab,
              {
                right: 14,
                bottom: -25,
                width: 55,
                height: 55,
                borderRadius: 100,
              },
            ]}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={28}
              color={liked ? BRAND : BRAND}
            />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
          {/* ===== محتوى النص ===== */}
          <View style={styles.content}>
            <Text style={styles.drName}>{doctor.name}</Text>

            <View style={styles.badgesRow}>
              <Badge icon="leaf-outline" text="GMSC" />
              <Badge
                icon="medkit-outline"
                text={doctor.specialtyId?.name ?? 'Specialty'}
              />
            </View>

            <Text style={styles.bio}>
              {doctor.bio ??
                'Cardiology specialist at GMSC, experienced in diagnosing and treating heart conditions. Known for patient-focused care and a compassionate approach.'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Working Time & Prices</Text>

          {/* ===== الكاردين ===== */}
          <View style={styles.cardsRow}>
            <PriceCard
              icon="laptop-outline"
              title="Virtual"
              price={`${vPrice}₪`}
              onBook={() => {}}
            />
            <PriceCard
              icon="people-outline"
              title="In-Person"
              price={`${iPrice}₪`}
              onBook={() => {}}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}

/* ---------- sub components ---------- */

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon as any} size={14} color={BRAND} />
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

function PriceCard({
  icon,
  title,
  price,
  onBook,
}: {
  icon: string;
  title: string;
  price: string;
  onBook: () => void;
}) {
  return (
    <View style={styles.priceCard}>
      {/* زخارف دائرية */}
      <View style={[styles.circle, { top: -18, right: -18, opacity: 0.15 }]} />
      <View
        style={[styles.circle, { bottom: -22, left: -26, opacity: 0.15 }]}
      />

      <View style={styles.cardTopRow}>
        <View style={{ marginLeft: 10 }}>
          <Ionicons
            name={icon as any}
            size={28}
            color={BRAND}
            style={{
              alignItems: 'center',
              alignSelf: 'center',
            }}
          />
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardPrice}>{price}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={BRAND} />
          <Text style={styles.infoText}>Sun – Mon – Thu</Text>
        </View>
        <View style={[styles.infoRow, { marginTop: 8 }]}>
          <Ionicons name="time-outline" size={18} color={BRAND} />
          <Text style={styles.infoText}>10:00AM – 4:00PM</Text>
        </View>
      </View>

      <Pressable style={styles.bookBtn} onPress={onBook}>
        <Text style={styles.bookText}>Book Now</Text>
      </Pressable>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  heroShadow: {
    width: '100%',
    height: 360,
    // ظل ناعم تحت
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroImg: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  fab: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  content: { paddingHorizontal: 16, paddingTop: 14 },
  drName: { fontSize: 24, color: BRAND, fontWeight: '800' },

  badgesRow: { flexDirection: 'row', marginTop: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 16,
    backgroundColor: '#F2FAFC',
    borderWidth: 1,
    borderColor: '#CFE6EE',
    marginRight: 8,
  },
  badgeText: { color: BRAND, fontWeight: '700', marginLeft: 6, fontSize: 12 },

  bio: { color: '#2B6E80', fontSize: 15, lineHeight: 22, marginTop: 10 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND,
    paddingHorizontal: 16,
    marginTop: 14,
  },

  cardsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12 },

  priceCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEF2',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8ED6E5',
  },

  cardTopRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#082A35',
    textAlign: 'center',
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND,
    marginTop: 2,
    textAlign: 'center',
  },

  infoBox: {
    backgroundColor: '#F3F7F9',
    borderWidth: 1,
    borderColor: '#E6EEF2',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 8, color: '#082A35' },

  bookBtn: {
    backgroundColor: CTA,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  bookText: { color: '#fff', fontWeight: '800' },
});
