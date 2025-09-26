import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  I18nManager,
  Pressable,
} from "react-native";
// ✅ لو مشروعك CLI (مش Expo)، استعمل السطر التالي:
import Ionicons from "react-native-vector-icons/Ionicons";
// ❌ واحذف: import { Ionicons } from "@expo/vector-icons";

interface Doctor {
  _id: string;
  name: string;
  photoUrl?: string;
  price?: number;
  rating?: number;
  specialtyId?: { name?: string; iconUrl?: string };
}

type Props = {
  doctor: Doctor;
  onPress?: () => void;
  host?: string;
};

export default function DrCard({ doctor, host = "" }: Props) {
  const { name, photoUrl, specialtyId } = doctor || {};

  // ✅ تأكد من تركيب الـ URL صح
  const imgUri =
    photoUrl
      ? (photoUrl.startsWith("http") ? photoUrl : `${host}${photoUrl}`)
      : undefined;

  return (
    <View style={styles.card}>
      {/* Image + texts */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {/* ✅ لا تمرّر uri لو غير متوفر */}
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.avatar} resizeMode="cover" />
        ) : (
          // Placeholder بسيط يمنع الكراش
          <View style={[styles.avatar, { alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="person-outline" size={36} color="#4b5563" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name ?? "Doctor"}</Text>
          {/* ✅ Optional chaining */}
          <Text style={styles.sub}>{specialtyId?.name ?? "Specialty"} - GMSC</Text>
        </View>
      </View>

      {/* أسعار/أوصاف */}
      <View style={styles.priceCard}>
        {/* Virtual */}
        <View style={styles.priceRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="laptop-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceTitle}>Virtual – 75₪</Text>
            <Text style={styles.priceDesc}>Your doctor, just one call away</Text>
          </View>
        </View>

        {/* In-Person */}
        <View style={styles.priceRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="people-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceTitle}>In-Person – 150₪</Text>
            <Text style={styles.priceDesc}>Clinic visit with full care</Text>
          </View>
        </View>
      </View>

      {/* زر الحجز */}
      <Pressable style={styles.bookBtn} onPress={() => { /* TODO: navigate */ }}>
        <Text style={styles.bookBtnText}>Book An Appointment</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#13809D",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
    marginTop: 40,
    minHeight: 200,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    position: "relative",
    top: -35,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Android
    elevation: 6,
    marginLeft: 10,
    marginBottom: -10,
  },
  name: { fontSize: 20, fontWeight: "700", color: "#fff" },
  sub: { color: "#fff", marginTop: 2 },
  priceCard: {
    gap: 10,
    writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
    marginLeft: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  priceTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  priceDesc: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: "#f6f7f9",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  bookBtnText: {
    color: "#0A718C",
    fontSize: 16,
    fontWeight: "700",
  },
});
