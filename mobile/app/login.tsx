import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../src/api/client";
import { colors, spacing } from "../src/theme";

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Merci d'entrer votre numero de telephone.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost("/api/mobile/auth/request-otp", { phone: trimmed });
      router.push({ pathname: "/otp", params: { phone: trimmed } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echec de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur Soutraly</Text>
      <Text style={styles.subtitle}>Entrez votre numero de telephone pour recevoir un code de verification.</Text>
      <TextInput
        style={styles.input}
        placeholder="+225 07 00 00 00 01"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={sendCode} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Recevoir le code</Text>}
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
    fontSize: 16,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  error: { color: colors.danger, marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: spacing.md, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
