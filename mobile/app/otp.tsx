import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiPost, setToken } from "../src/api/client";
import type { VerifyOtpResponse } from "../src/api/types";
import { colors, spacing } from "../src/theme";

export default function Otp() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (!code.trim()) {
      setError("Merci d'entrer le code recu par SMS.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await apiPost<VerifyOtpResponse>("/api/mobile/auth/verify-otp", {
        phone,
        code: code.trim(),
      });
      await setToken(result.token);
      router.replace(result.isRegistered ? "/home" : "/register");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code envoye par SMS</Text>
      <Text style={styles.subtitle}>Entrez le code recu au {phone}.</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={10}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={verify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verifier</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: "center", backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "700", color: colors.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: "center",
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  error: { color: colors.danger, marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: spacing.md, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
