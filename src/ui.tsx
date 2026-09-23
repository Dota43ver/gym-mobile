import { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Exercise } from "./domain";
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#101216" },
  content: {
    padding: 20,
    gap: 16,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingBottom: 36,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#F5F7FA" },
  heading: { fontSize: 21, fontWeight: "700", color: "#F5F7FA" },
  text: { fontSize: 16, lineHeight: 24, color: "#BEC5CF" },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#A8E6A3",
  },
  card: { backgroundColor: "#1C2028", borderRadius: 20, padding: 18, gap: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#303744",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "700", color: "#F5F7FA" },
  primary: { backgroundColor: "#A8E6A3" },
  primaryText: { color: "#112211" },
  danger: { color: "#FFADAD" },
  input: {
    backgroundColor: "#101216",
    borderColor: "#525B6A",
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    padding: 12,
    color: "#F5F7FA",
    fontSize: 16,
  },
  tabs: {
    flexDirection: "row",
    padding: 8,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#303744",
  },
  error: { color: "#FFADAD", fontSize: 16, lineHeight: 24 },
  muted: { opacity: 0.4 },
});
export function Button({
  label,
  onPress,
  disabled = false,
  primary = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        primary && styles.primary,
        disabled && styles.muted,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          primary && styles.primaryText,
          danger && styles.danger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.text}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#88929F"
        style={styles.input}
        {...props}
      />
    </View>
  );
}
export const Card = ({ children }: { children: ReactNode }) => (
  <View style={styles.card}>{children}</View>
);
export function ExerciseDetails({ exercise: e }: { exercise: Exercise }) {
  return (
    <>
      <Text style={styles.heading}>{e.name}</Text>
      <Text style={styles.text}>
        {e.sets} sets × {e.reps} reps
        {e.weight === null ? "" : ` · ${e.weight} kg`}
      </Text>
      {e.notes !== "" && <Text style={styles.text}>{e.notes}</Text>}
    </>
  );
}
