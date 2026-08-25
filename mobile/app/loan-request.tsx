import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../src/api/client";
import type { Loan } from "../src/api/types";
import { colors, spacing } from "../src/theme";

// Correspond a src/config/interestModel.ts / loanRules.ts cote serveur.
// Le serveur reste la source de verite - ceci n'est qu'un apercu instantane.
const BORROWER_MONTHLY_RATE = 0.019;
const LOAN_MIN_AMOUNT = 10_000;
const LOAN_MAX_AMOUNT = 100_000;

function formatXOF(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} XOF`;
}

export default function LoanRequest() {
  const router = useRouter();
  const [amountText, setAmountText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseInt(amountText.replace(/[^\d]/g, ""), 10) || 0;
  const interest = useMemo(() => Math.round(amount * BORROWER_MONTHLY_RATE), [amount]);
  const isValidAmount = amount >= LOAN_MIN_AMOUNT && amount <= LOAN_MAX_AMOUNT;

  async function submit() {
    if (!isValidAmount) {
      setError(`Le montant doit etre entre ${formatXOF(LOAN_MIN_AMOUNT)} et ${formatXOF(LOAN_MAX_AMOUNT)}.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost<{ loan: Loan }>("/api/mobile/loans", { amount });
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echec de la demande.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Montant souhaite</Text>
      <TextInput
        style={styles.input}
        placeholder={`Entre ${formatXOF(LOAN_MIN_AMOUNT)} et ${formatXOF(LOAN_MAX_AMOUNT)}`}
        keyboardType="number-pad"
        value={amountText}
        onChangeText={setAmountText}
      />

      {amount > 0 ? (
        <View style={styles.preview}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Montant emprunte</Text>
            <Text style={styles.previewValue}>{formatXOF(amount)}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Interet (1,9 %)</Text>
            <Text style={styles.previewValue}>{formatXOF(interest)}</Text>
          </View>
          <View style={[styles.previewRow, styles.previewTotalRow]}>
            <Text style={styles.previewTotalLabel}>Total a rembourser (30 jours)</Text>
            <Text style={styles.previewTotalValue}>{formatXOF(amount + interest)}</Text>
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmer la demande</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 18,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  preview: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  previewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  previewLabel: { color: colors.textMuted, fontSize: 14 },
  previewValue: { color: colors.text, fontSize: 14, fontWeight: "600" },
  previewTotalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs, marginTop: spacing.xs },
  previewTotalLabel: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  previewTotalValue: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  error: { color: colors.danger, marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: spacing.md, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
