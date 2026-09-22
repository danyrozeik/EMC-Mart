import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../theme";

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good afternoon</Text>
      <Text style={styles.label}>Available</Text>
      <Text style={styles.balance}>EGP 12,450</Text>

      <Pressable style={styles.scan}>
        <Text style={styles.scanText}>SCAN & PAY</Text>
      </Pressable>

      <View style={styles.row}>
        {["Send", "Request", "Bills", "Shop"].map(x => (
          <Pressable key={x} style={styles.action}>
            <Text>{x}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.points}>
        <Text style={styles.pointsTitle}>RTI Points</Text>
        <Text style={styles.pointsValue}>2,450</Text>
      </View>

      <Text style={styles.section}>Recent transactions</Text>
      <Text>EMC Mart                         - EGP 1,250</Text>
      <Text>Pharmacy                         - EGP 450</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  greeting: { fontSize: 20, fontWeight: "600", color: theme.colors.text, marginTop: 24 },
  label: { marginTop: 32, color: theme.colors.muted },
  balance: { fontSize: 36, fontWeight: "800", marginTop: 4 },
  scan: { marginTop: 28, padding: 20, borderRadius: theme.radius.lg, backgroundColor: theme.colors.primary, alignItems: "center" },
  scanText: { color: "#FFF", fontWeight: "800" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  action: { backgroundColor: "#FFF", padding: 14, borderRadius: theme.radius.md },
  points: { marginTop: 28, padding: 20, borderRadius: theme.radius.lg, backgroundColor: "#FFF" },
  pointsTitle: { fontWeight: "700" },
  pointsValue: { fontSize: 28, fontWeight: "800", marginTop: 6 },
  section: { marginTop: 30, marginBottom: 14, fontSize: 18, fontWeight: "700" }
});
