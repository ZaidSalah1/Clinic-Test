import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";

interface Appointment {
  _id: string;
  userId: string;
  doctorName: string;
  specialty: string;
  photoUrl?: string;
  date?: string;
  notes?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  host: string;
}

export default function AppointmentCard({ appointment, host }: AppointmentCardProps) {
  if (!appointment) return null;

  const photo = appointment.photoUrl?.startsWith("http")
    ? appointment.photoUrl
    : `${host}${appointment.photoUrl || ""}`;

  return (
    <View style={styles.card}>
      {/* Image with texts row */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Image
          source={{ uri: photo }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{appointment.doctorName}</Text>
          <Text style={styles.sub}>{appointment.specialty} - GMSC</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 7,
    backgroundColor: "#f6f7f9",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
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
    // 🟢 iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, // X, Y
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // 🟢 Android Shadow
    elevation: 6,
    marginLeft: 10,
    marginBottom: -10,
  },
  name: { fontSize: 20, fontWeight: "700", color: "#ffffffff" },

  sub: { color: "#ffffffff", marginTop: 2 },

  btn: {
    backgroundColor: "#ffffffff", // لون الزر
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10, // يخلي الزر دائري الأطراف
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#0A718C",
    fontSize: 16,
    fontWeight: "700",
  },
});
