import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Connexion" }} />
        <Stack.Screen name="otp" options={{ title: "Code de verification" }} />
        <Stack.Screen name="register" options={{ title: "Inscription" }} />
        <Stack.Screen name="home" options={{ title: "Soutraly", headerBackVisible: false }} />
        <Stack.Screen name="loan-request" options={{ title: "Demander un pret" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
