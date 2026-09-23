import { useState } from "react";
import { Text } from "react-native";
import { userMessage, Exercise, exerciseFromForm } from "./domain";
import { Button, Card, Field, styles } from "./ui";
export function ExerciseEditor({
  exercise,
  onSave,
  onCancel,
  busy,
}: {
  exercise?: Exercise;
  onSave: (e: Exercise) => Promise<boolean>;
  onCancel: () => void;
  busy: boolean;
}) {
  const [form, setForm] = useState({
    name: exercise?.name ?? "",
    sets: String(exercise?.sets ?? 3),
    reps: String(exercise?.reps ?? 10),
    weight: exercise?.weight == null ? "" : String(exercise.weight),
    notes: exercise?.notes ?? "",
  });
  const [error, setError] = useState("");
  async function save() {
    try {
      setError("");
      const e = exerciseFromForm(form, exercise?.id);
      await onSave(e);
    } catch (e) {
      setError(
        userMessage(
          e,
          "No se pudo completar la operación. Intenta nuevamente.",
        ),
      );
    }
  }
  return (
    <Card>
      <Text style={styles.heading}>
        {exercise ? "Editar ejercicio" : "Nuevo ejercicio"}
      </Text>
      <Field
        label="Nombre del ejercicio"
        value={form.name}
        maxLength={100}
        onChangeText={(name) => setForm({ ...form, name })}
      />
      <Field
        label="Series"
        value={form.sets}
        keyboardType="number-pad"
        maxLength={3}
        onChangeText={(sets) => setForm({ ...form, sets })}
      />
      <Field
        label="Repeticiones"
        value={form.reps}
        keyboardType="number-pad"
        maxLength={3}
        onChangeText={(reps) => setForm({ ...form, reps })}
      />
      <Field
        label="Peso (kg, opcional)"
        value={form.weight}
        keyboardType="decimal-pad"
        maxLength={12}
        onChangeText={(weight) => setForm({ ...form, weight })}
      />
      <Field
        label="Notas (opcional)"
        value={form.notes}
        multiline
        maxLength={2000}
        onChangeText={(notes) => setForm({ ...form, notes })}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <Button
        label="Guardar ejercicio"
        primary
        disabled={busy}
        onPress={() => void save()}
      />
      <Button label="Cancelar" disabled={busy} onPress={onCancel} />
    </Card>
  );
}
