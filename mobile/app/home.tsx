import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { apiGet, apiPost, clearToken } from "../src/api/client";
import type { User, Loan, LoanWindowStatus } from "../src/api/types";
import { colors, spacing } from "../src/theme";

const STATUS_LABELS: Record<string, string> = {
  requested: "En attente de financement",
  active: "Actif",
  repaid: "Rembourse",
  late: "En retard",
  cancelled: "Annule",
};

function formatXOF(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} XOF`;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [windowStatus, setWindowStatus] = useState<LoanWindowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [repayingId, setRepayingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ user: u }, { loans: l }, w] = await Promise.all([
        apiGet<{ user: User }>("/api/mobile/me"),
        apiGet<{ loans: Loan[] }>("/api/mobile/loans"),
        apiGet<LoanWindowStatus>("/api/mobile/loan-window"),
      ]);
      setUser(u);
      setLoans(l);
      setWindowStatus(w);
    } catch {
      await clearToken();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function repay(loan: Loan) {
    setRepayingId(loan.id);
    try {
      await apiPost(`/api/mobile/loans/${loan.id}/repay`);
      await load();
    } catch {
      // l'erreur eventuelle sera visible au prochain rafraichissement
    } finally {
      setRepayingId(null);
    }
  }

  async function logout() {
    await clearToken();
    router.replace("/login");
  }

  if (loading && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const repayable = loans.find((l) => l.status === "active" || l.status === "late");
  const canRequest = windowStatus?.open && !repayable;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.greeting}>Bonjour {user?.name ?? ""}</Text>

      {!windowStatus?.open ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Les demandes de pret sont fermees en ce moment. Elles rouvrent le {windowStatus?.openDay} de chaque
            mois, jusqu'au {windowStatus?.closeDay} du mois suivant.
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.primaryButton, !canRequest && styles.buttonDisabled]}
        disabled={!canRequest}
        onPress={() => router.push("/loan-request")}
      >
        <Text style={styles.primaryButtonText}>Demander un pret</Text>
      </Pressable>
      {repayable ? (
        <Text style={styles.hint}>Un remboursement est en attente — remboursez-le avant d'en redemander un.</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Vos prets</Text>
      {loans.length === 0 ? (
        <Text style={styles.emptyText}>Vous n'avez encore aucun pret.</Text>
      ) : (
        loans.map((loan) => (
          <View key={loan.id} style={styles.loanCard}>
            <View style={styles.loanCardHeader}>
              <Text style={styles.loanAmount}>{formatXOF(loan.amount)}</Text>
              <Text style={styles.loanStatus}>{STATUS_LABELS[loan.status] ?? loan.status}</Text>
            </View>
            {loan.due_at ? (
              <Text style={styles.loanMeta}>Echeance : {loan.due_at.slice(0, 10)}</Text>
            ) : null}
            {loan.amount_due !== undefined && (loan.status === "active" || loan.status === "late") ? (
              <Text style={styles.loanMeta}>A rembourser : {formatXOF(loan.amount_due)}</Text>
            ) : null}
            {(loan.status === "active" || loan.status === "late") ? (
              <Pressable
                style={styles.repayButton}
                onPress={() => repay(loan)}
                disabled={repayingId === loan.id}
              >
                {repayingId === loan.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.repayButtonText}>Rembourser</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ))
      )}

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  container: { padding: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  greeting: { fontSize: 22, fontWeight: "700", color: colors.primary, marginBottom: spacing.md },
  notice: {
    backgroundColor: "#FFF4D6",
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { color: "#7A5B00", fontSize: 13 },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 10, padding: spacing.md, alignItems: "center" },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.text },
  emptyText: { color: colors.textMuted },
  loanCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loanCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  loanAmount: { fontWeight: "700", fontSize: 16, color: colors.text },
  loanStatus: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  loanMeta: { fontSize: 13, color: colors.textMuted },
  repayButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  repayButtonText: { color: colors.primary, fontWeight: "700" },
  logoutButton: { marginTop: spacing.xl, alignItems: "center" },
  logoutText: { color: colors.textMuted, fontSize: 13 },
});
