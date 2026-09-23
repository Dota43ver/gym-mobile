import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>MAKE ROOM FOR PROGRESS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Gym Mobile
          </Text>
          <Text style={styles.subtitle}>
            Your training, one week at a time.
          </Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>A fresh start</Text>
            <Text style={styles.body}>Routine planning is coming next.</Text>
            <Text style={styles.body}>
              This is the first step toward your personal training companion.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#101216" },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  eyebrow: {
    color: "#A8E6A3",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { color: "#F5F7FA", fontSize: 40, fontWeight: "700" },
  subtitle: { color: "#BEC5CF", fontSize: 20, lineHeight: 30 },
  card: {
    backgroundColor: "#1C2028",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    marginTop: 16,
  },
  cardTitle: { color: "#F5F7FA", fontSize: 22, fontWeight: "600" },
  body: { color: "#BEC5CF", fontSize: 16, lineHeight: 24 },
});
