import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Crypto from "expo-crypto";
import { formatEGP, money } from "@rti/shared";
import { api, type QrPaymentIntent } from "../api/client";
import { theme } from "../theme";

type ScreenState =
  | { step: "scanning" }
  | { step: "loading-intent"; intentId: string }
  | { step: "confirming"; intent: QrPaymentIntent }
  | { step: "paying"; intent: QrPaymentIntent }
  | { step: "success"; amountMinor: number }
  | { step: "error"; message: string };

export function PayScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScreenState>({ step: "scanning" });

  const handleScan = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (state.step !== "scanning") return;

      const intentId = data.trim();
      setState({ step: "loading-intent", intentId });

      try {
        const intent = await api.qrIntent(intentId);
        if (intent.status !== "OPEN") {
          setState({ step: "error", message: "This QR code has already been used or has expired." });
          return;
        }
        setState({ step: "confirming", intent });
      } catch {
        setState({ step: "error", message: "Could not read this QR code. Ask the merchant to show it again." });
      }
    },
    [state.step],
  );

  async function confirmPayment(intent: QrPaymentIntent) {
    setState({ step: "paying", intent });
    try {
      const idempotencyKey = Crypto.randomUUID();
      await api.pay(
        {
          intentId: intent.id,
          merchantId: intent.merchantId,
          amountMinor: intent.amountMinor,
          reference: intent.reference,
        },
        idempotencyKey,
      );
      setState({ step: "success", amountMinor: intent.amountMinor });
    } catch (e) {
      setState({ step: "error", message: (e as Error).message });
    }
  }

  function reset() {
    setState({ step: "scanning" });
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scan & Pay</Text>
        <Text style={styles.note}>RTI needs camera access to scan merchant QR codes.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan & Pay</Text>

      {state.step === "scanning" || state.step === "loading-intent" ? (
        <View style={styles.scanFrame}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={state.step === "scanning" ? handleScan : undefined}
          />
          {state.step === "loading-intent" ? (
            <View style={styles.overlay}>
              <ActivityIndicator color="#FFF" />
            </View>
          ) : (
            <Text style={styles.hint}>Point your camera at a merchant QR code</Text>
          )}
        </View>
      ) : null}

      {state.step === "confirming" || state.step === "paying" ? (
        <View style={styles.card}>
          <Text style={styles.label}>Pay</Text>
          <Text style={styles.amount}>{formatEGP(money(state.intent.amountMinor))}</Text>
          <Text style={styles.reference}>{state.intent.reference}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => confirmPayment(state.intent)}
            disabled={state.step === "paying"}
          >
            {state.step === "paying" ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Confirm payment</Text>
            )}
          </Pressable>
          {state.step === "confirming" ? (
            <Pressable style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {state.step === "success" ? (
        <View style={styles.card}>
          <Text style={styles.label}>Payment sent</Text>
          <Text style={styles.amount}>{formatEGP(money(state.amountMinor))}</Text>
          <Pressable style={styles.primaryButton} onPress={reset}>
            <Text style={styles.primaryButtonText}>Scan another</Text>
          </Pressable>
        </View>
      ) : null}

      {state.step === "error" ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>{state.message}</Text>
          <Pressable style={styles.primaryButton} onPress={reset}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 24 },
  scanFrame: {
    marginTop: 28,
    height: 340,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { color: "#FFF", textAlign: "center", fontWeight: "600", padding: 16, backgroundColor: "rgba(0,0,0,0.35)", width: "100%" },
  note: { marginTop: 24, color: theme.colors.muted, lineHeight: 20 },
  card: { marginTop: 28, padding: 24, borderRadius: theme.radius.lg, backgroundColor: "#FFF", alignItems: "center" },
  label: { color: theme.colors.muted },
  amount: { fontSize: 32, fontWeight: "800", marginTop: 4, color: theme.colors.text },
  reference: { marginTop: 4, color: theme.colors.muted },
  errorText: { color: theme.colors.danger, textAlign: "center", fontWeight: "600" },
  primaryButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    alignSelf: "stretch",
  },
  primaryButtonText: { color: "#FFF", fontWeight: "800" },
  secondaryButton: { marginTop: 12, alignItems: "center" },
  secondaryButtonText: { color: theme.colors.muted, fontWeight: "600" },
});
