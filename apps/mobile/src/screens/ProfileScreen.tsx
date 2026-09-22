import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APP_NAME, SUPPORT_EMAIL } from "../constants";
import { theme } from "../theme";

const MENU = ["Security", "Language / اللغة", "Payment methods", "Notifications", "Support", "Sign out"];

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>{APP_NAME} account</Text>

      <View style={styles.menu}>
        {MENU.map((item) => (
          <Pressable key={item} style={styles.menuItem}>
            <Text style={styles.menuText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.support}>Need help? {SUPPORT_EMAIL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 24 },
  subtitle: { color: theme.colors.muted, marginTop: 4 },
  menu: { marginTop: 24 },
  menuItem: { backgroundColor: "#FFF", padding: 16, borderRadius: theme.radius.md, marginBottom: 10 },
  menuText: { color: theme.colors.text, fontWeight: "600" },
  support: { marginTop: 16, color: theme.colors.muted },
});
