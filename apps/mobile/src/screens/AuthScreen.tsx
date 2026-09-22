import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { APP_NAME } from "../constants";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

type Mode = "sign-in" | "create-account";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+20");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await login({ phone, password });
      } else {
        await register({ fullName, phone, password, preferredLanguage: "en" });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>{mode === "sign-in" ? "Sign in to your account" : "Create your account"}</Text>

      {mode === "create-account" ? (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="+201234567890"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{mode === "sign-in" ? "Sign in" : "Create account"}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setMode(mode === "sign-in" ? "create-account" : "sign-in")}>
        <Text style={styles.switchText}>
          {mode === "sign-in" ? "New to RTI? Create an account" : "Already have an account? Sign in"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: theme.colors.text, textAlign: "center" },
  subtitle: { color: theme.colors.muted, textAlign: "center", marginTop: 8, marginBottom: 32 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  error: { color: theme.colors.danger, marginBottom: 12, textAlign: "center" },
  primaryButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFF", fontWeight: "800" },
  switchText: { marginTop: 20, color: theme.colors.muted, textAlign: "center" },
});
