import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export function PayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan & Pay</Text>
      <View style={styles.scanFrame}>
        <Text style={styles.hint}>Point your camera at a merchant QR code</Text>
      </View>
      <Text style={styles.note}>
        Camera-based QR scanning integrates with expo-camera / expo-barcode-scanner. Once a QR payload
        resolving to a payment intent is decoded, confirm the amount here and submit via POST /v1/payments
        with the Idempotency-Key header so a retried scan never double-charges.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 24 },
  scanFrame: {
    marginTop: 28,
    height: 280,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  hint: { color: "#FFF", textAlign: "center", fontWeight: "600" },
  note: { marginTop: 24, color: theme.colors.muted, lineHeight: 20 },
});
