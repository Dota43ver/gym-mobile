import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { localDate, State } from "./src/domain";
import { store } from "./src/storage";
import { exportBackup, pickBackup } from "./src/backups";
import { Button, Card, styles } from "./src/ui";
import { Routines } from "./src/Routines";
import { Today, History } from "./src/Training";
type Tab = "Today" | "Routines" | "History" | "Settings";
export default function App() {
  const [state, setState] = useState<State | null>(null),
    [tab, setTab] = useState<Tab>("Today"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [now, setNow] = useState(new Date()),
    [revision, setRevision] = useState(0);
  const lock = useRef(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setState(await store.load());
    } catch (e) {
      setError(`Could not open saved data. ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      const current = new Date();
      setNow((previous) =>
        localDate(previous) === localDate(current) ? previous : current,
      );
    }, 1000);
    const listener = AppState.addEventListener("change", (s) => {
      if (s === "active") setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);
  async function mutate(change: (s: State) => State) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      setState(await store.mutate(change));
      return true;
    } catch (e) {
      setError(`Not saved. ${(e as Error).message}`);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function backup(kind: "export" | "import") {
    if (lock.current || !state) return;
    lock.current = true;
    setBusy(true);
    setError("");
    let replacement: State | null = null;
    try {
      if (kind === "export") await exportBackup(state);
      else replacement = await pickBackup();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
    if (replacement) {
      const data = replacement;
      Alert.alert(
        "Replace all local data?",
        `This backup contains ${data.routines.length} routines and ${data.logs.length} completed exercises. Your current data will be replaced, not merged. Export a backup first if you want to keep it.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace data",
            style: "destructive",
            onPress: () =>
              void mutate(() => data).then((ok) => {
                if (ok) {
                  setRevision((r) => r + 1);
                  setTab("Today");
                }
              }),
          },
        ],
      );
    }
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Text style={styles.eyebrow}>GYM MOBILE</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {tab === "Today" ? "Make room for progress" : tab}
            </Text>
            {busy && (
              <ActivityIndicator
                color="#A8E6A3"
                accessibilityLabel="Saving or loading"
              />
            )}
            {!!error && (
              <Card>
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
                {!state && (
                  <Button
                    label="Retry loading"
                    disabled={busy}
                    onPress={() => void load()}
                  />
                )}
              </Card>
            )}
            {state && (
              <>
                {tab === "Today" && (
                  <Today
                    state={state}
                    now={now}
                    mutate={mutate}
                    busy={busy}
                    onPlan={() => setTab("Routines")}
                  />
                )}
                {tab === "Routines" && (
                  <Routines
                    key={revision}
                    state={state}
                    mutate={mutate}
                    busy={busy}
                  />
                )}
                {tab === "History" && <History state={state} />}
                {tab === "Settings" && (
                  <>
                    <Card>
                      <Text style={styles.heading}>Offline. Yours.</Text>
                      <Text style={styles.text}>
                        Your routines and history stay on this device. No
                        account, cloud sync or ads. Dark mode is always on.
                      </Text>
                    </Card>
                    <Card>
                      <Text style={styles.heading}>Keep a safe copy</Text>
                      <Text style={styles.text}>
                        Uninstalling the app or clearing its data can erase your
                        training. Export backups regularly and save them
                        somewhere safe. Backups contain your exercise names,
                        weights and notes in readable JSON.
                      </Text>
                      <Button
                        label="Export backup"
                        primary
                        disabled={busy}
                        onPress={() => void backup("export")}
                      />
                      <Button
                        label="Import backup"
                        disabled={busy}
                        onPress={() => void backup("import")}
                      />
                      <Text style={styles.text}>
                        Import replaces all local data after confirmation.
                        Maximum file size: 5 MB.
                      </Text>
                    </Card>
                  </>
                )}
              </>
            )}
          </ScrollView>
          <View style={styles.tabs}>
            {(["Today", "Routines", "History", "Settings"] as Tab[]).map(
              (t) => (
                <View key={t} style={{ flex: 1 }}>
                  <Button
                    label={t}
                    primary={t === tab}
                    disabled={busy || !state}
                    onPress={() => setTab(t)}
                  />
                </View>
              ),
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
