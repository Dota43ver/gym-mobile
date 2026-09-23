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
import { userMessage, localDate, State } from "./src/domain";
import { store } from "./src/storage";
import { exportBackup, pickBackup } from "./src/backups";
import { TabButton, Button, Card, styles } from "./src/ui";
import { Routines } from "./src/Routines";
import { Today, History } from "./src/Training";
const tabLabels = {
  Today: "Hoy",
  Routines: "Rutinas",
  History: "Historial",
  Settings: "Ajustes",
};
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
      setError(
        "No se pudieron abrir los datos guardados. Reintenta la carga; tus datos no fueron reemplazados.",
      );
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
      setError(
        userMessage(
          e,
          "No se guardaron los cambios. Comprueba el espacio disponible y vuelve a intentar.",
        ),
      );
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
      setError(
        userMessage(
          e,
          "No se pudo completar el respaldo. Comprueba el archivo o intenta nuevamente.",
        ),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
    if (replacement) {
      const data = replacement;
      Alert.alert(
        "¿Reemplazar todos los datos locales?",
        `Este respaldo contiene ${data.routines.length} rutinas y ${data.logs.length} ejercicios completados. Los datos actuales serán reemplazados, no combinados. Exporta primero un respaldo si quieres conservarlos.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Reemplazar datos",
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
              {tab === "Today" ? "Haz espacio para progresar" : tabLabels[tab]}
            </Text>
            {busy && (
              <ActivityIndicator
                color="#A8E6A3"
                accessibilityLabel="Guardando o cargando"
              />
            )}
            {!!error && (
              <Card>
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
                {!state && (
                  <Button
                    label="Reintentar carga"
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
                      <Text style={styles.heading}>
                        Sin conexión. Tus datos.
                      </Text>
                      <Text style={styles.text}>
                        Tus rutinas e historial se guardan en este dispositivo.
                        Sin cuenta, sincronización ni anuncios. El modo oscuro
                        está siempre activo.
                      </Text>
                    </Card>
                    <Card>
                      <Text style={styles.heading}>
                        Conserva una copia segura
                      </Text>
                      <Text style={styles.text}>
                        Desinstalar la app o borrar sus datos puede eliminar tus
                        entrenamientos. Exporta respaldos y guárdalos en un
                        lugar seguro. Contienen nombres de ejercicios, pesos y
                        notas en JSON legible.
                      </Text>
                      <Button
                        label="Exportar respaldo"
                        primary
                        disabled={busy}
                        onPress={() => void backup("export")}
                      />
                      <Button
                        label="Importar respaldo"
                        disabled={busy}
                        onPress={() => void backup("import")}
                      />
                      <Text style={styles.text}>
                        La importación reemplaza todos los datos locales después
                        de confirmar. Tamaño máximo: 5 MB.
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
                  <TabButton
                    label={tabLabels[t]}
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
