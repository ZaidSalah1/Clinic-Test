// HeaderCard.jsx — React Native CLI
import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons     from 'react-native-vector-icons/Ionicons';


export default function HeaderCard({
  name = "Zaid Salah",
  avatar = "https://i.pravatar.cc/120",
  onPressLang,
  onPressBell,
  hasNotification = true,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {/* صورة البروفايل */}
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.welcome}>Welcome!</Text>
          <Text style={styles.username}>{name}</Text>
        </View>
      </View>

      {/* الأزرار يمين */}
      <View style={styles.right}>
        <Pressable onPress={onPressLang} style={styles.iconBtn}>
          <MaterialIcons name="language" size={26} color="#fff" />
        </Pressable>

        <Pressable onPress={onPressBell} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={26} color="#fff" />
          {hasNotification && <View style={styles.dot} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#13809D",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#e5e7eb",
  },
  welcome: {
    color: "#fff",
    fontSize: 14,
  },
  username: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  right: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    position: "absolute",
    top: 6,
    right: 6,
  },
});
