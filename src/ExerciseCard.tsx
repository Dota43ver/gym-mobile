import { Pressable, StyleSheet, Text, View } from "react-native";
import { Exercise } from "./domain";
export function ExerciseCard({
  exercise,
  checked,
  busy,
  onToggle,
  onOptions,
}: {
  exercise: Exercise;
  checked: boolean;
  busy: boolean;
  onToggle: () => void;
  onOptions?: () => void;
}) {
  return (
    <View style={card.container}>
      <View style={card.details}>
        <Text numberOfLines={2} style={card.name}>
          {exercise.name}
        </Text>
        <Text style={card.meta}>
          {exercise.sets} series × {exercise.reps} reps
          {exercise.weight === null
            ? ""
            : ` · ${String(exercise.weight).replace(".", ",")} kg`}
        </Text>
        {!!exercise.notes && (
          <Text numberOfLines={2} style={card.notes}>
            {exercise.notes}
          </Text>
        )}
      </View>
      <View style={card.controls}>
        {onOptions && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Opciones de ${exercise.name}`}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={onOptions}
            style={[card.touch, busy && card.disabled]}
          >
            <Text style={card.pencil}>✎</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Todas las series de ${exercise.name} completadas hoy`}
          accessibilityState={{ checked, disabled: busy }}
          disabled={busy}
          onPress={onToggle}
          style={[card.touch, busy && card.disabled]}
        >
          <View style={[card.box, checked && card.checked]}>
            {checked && <Text style={card.check}>✓</Text>}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
const card = StyleSheet.create({
  container: {
    backgroundColor: "#1C2028",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  details: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: "#F5F7FA", fontWeight: "700", fontSize: 17, lineHeight: 22 },
  meta: { color: "#BEC5CF", fontSize: 14, lineHeight: 20 },
  notes: { color: "#9EA8B6", fontSize: 13, lineHeight: 18 },
  controls: { flexDirection: "row", flexShrink: 0 },
  touch: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pencil: { fontSize: 28, color: "#BEC5CF" },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#A8E6A3",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: "#A8E6A3" },
  check: { color: "#112211", fontSize: 17, fontWeight: "800" },
  disabled: { opacity: 0.4 },
});
