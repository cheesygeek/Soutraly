import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getToken, clearToken, apiGet, ApiError } from "../src/api/client";
import type { User } from "../src/api/types";
import { colors } from "../src/theme";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        await apiGet<{ user: User }>("/api/mobile/me");
        router.replace("/home");
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/register");
          return;
        }
        await clearToken();
        router.replace("/login");
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
