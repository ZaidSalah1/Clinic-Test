import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "home" | "calendar" | "inbox" | "settings";

// لو بدك أمان أكثر للأسماء، خليه string literal union:
type IconName = keyof typeof Ionicons.glyphMap; // يشتغل مع vector-icons

export default function BottomPillNav({
  active = "home",
  onChange,
}: {
  active?: TabKey;
  onChange?: (key: TabKey) => void;
}) {
  const insets = useSafeAreaInsets();

  const Item = ({
    label,
    icon,
    iconSolid,
    keyName,
  }: {
    label: string;
    icon: IconName;
    iconSolid?: IconName;
    keyName: TabKey;
  }) => {
    const isActive = active === keyName;
    return (
      <Pressable
        onPress={() => onChange?.(keyName)}
        style={[styles.item, isActive && styles.itemActive]}
      >
        <Ionicons
          name={isActive && iconSolid ? iconSolid : icon}
          size={20}
          color="#fff"
          style={{ marginRight: isActive ? 8 : 0 }}
        />
        {isActive && <Text style={styles.itemText}>{label}</Text>}
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          // ارفع الناف فوق الحافة السفلية
          bottom: (insets.bottom || 0) + 12,
        },
      ]}
    >
      <Item label="Home"     icon="home-outline"     iconSolid="home"      keyName="home" />
      <Item label="Calendar" icon="calendar-outline" iconSolid="calendar"  keyName="calendar" />
      <Item label="Inbox"    icon="mail-outline"     iconSolid="mail"      keyName="inbox" />
      <Item label="Settings" icon="settings-outline" iconSolid="settings"  keyName="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    // bottom يتحدد ديناميكياً فوق
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 999,
    // نفس الشفافية
    backgroundColor: "#25252552", // #RRGGBBAA
    shadowColor: "#00000038",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  item: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  itemActive: {
    backgroundColor: "#13809D",
  },
  itemText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
