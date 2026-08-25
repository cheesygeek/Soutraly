import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { apiUpload } from "../src/api/client";
import type { User } from "../src/api/types";
import { colors, spacing } from "../src/theme";

type PickedDoc = ImagePicker.ImagePickerAsset;

async function pickDocument(): Promise<PickedDoc | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0];
}

function DocPicker({
  label,
  doc,
  onPick,
}: {
  label: string;
  doc: PickedDoc | null;
  onPick: () => void;
}) {
  return (
    <Pressable style={styles.docPicker} onPress={onPick}>
      {doc ? (
        <Image source={{ uri: doc.uri }} style={styles.docThumb} />
      ) : (
        <Text style={styles.docPickerText}>📎 {label}</Text>
      )}
      {doc ? <Text style={styles.docPickerCaption}>{label} — changer</Text> : null}
    </Pressable>
  );
}

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [idDoc, setIdDoc] = useState<PickedDoc | null>(null);
  const [contractDoc, setContractDoc] = useState<PickedDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Merci d'indiquer votre nom complet.");
      return;
    }
    if (!idDoc) {
      setError("Merci d'ajouter une photo de votre piece d'identite.");
      return;
    }
    if (!contractDoc) {
      setError("Merci d'ajouter une photo de votre contrat de travail.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("idDocument", new File(idDoc.uri));
      formData.append("contractDocument", new File(contractDoc.uri));

      await apiUpload<{ user: User }>("/api/mobile/register", formData);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echec de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Finalisez votre inscription</Text>
      <Text style={styles.subtitle}>
        Ces documents servent a verifier votre identite (KYC) — photo ou PDF de votre piece
        d'identite, puis de votre contrat de travail.
      </Text>

      <Text style={styles.label}>Nom complet</Text>
      <TextInput style={styles.input} placeholder="Votre nom" value={name} onChangeText={setName} />

      <Text style={styles.label}>Piece d'identite</Text>
      <DocPicker label="Piece d'identite" doc={idDoc} onPick={async () => setIdDoc(await pickDocument())} />

      <Text style={styles.label}>Contrat de travail</Text>
      <DocPicker
        label="Contrat de travail"
        doc={contractDoc}
        onPick={async () => setContractDoc(await pickDocument())}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Terminer l'inscription</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: "700", color: colors.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  docPicker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: spacing.md,
    alignItems: "center",
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  docPickerText: { color: colors.textMuted, fontSize: 14 },
  docThumb: { width: 120, height: 90, borderRadius: 8, marginBottom: spacing.xs },
  docPickerCaption: { fontSize: 12, color: colors.primary },
  error: { color: colors.danger, marginTop: spacing.sm, marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
