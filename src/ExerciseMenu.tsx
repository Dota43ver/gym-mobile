import { Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, styles } from "./ui";
import { DAYS, Exercise } from "./domain";
export function ExerciseMenu({
  exercise,
  busy,
  first,
  last,
  day,
  copying,
  onClose,
  onEdit,
  onMove,
  onCopyMode,
  onCopy,
  onDelete,
}: {
  exercise: Exercise;
  busy: boolean;
  first: boolean;
  last: boolean;
  day: number;
  copying: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMove: (delta: number) => void;
  onCopyMode: () => void;
  onCopy: (day: number) => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#0009",
          justifyContent: "flex-end",
        }}
      >
        <SafeAreaView
          edges={["bottom"]}
          style={{
            backgroundColor: "#1C2028",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            <Text accessibilityRole="header" style={styles.heading}>
              {exercise.name}
            </Text>
            {copying ? (
              <>
                <Text style={styles.text}>Copiar a otro día</Text>
                {DAYS.map((d, i) => (
                  <Button
                    key={d}
                    label={`Copiar a ${d}`}
                    disabled={busy || i === day}
                    onPress={() => onCopy(i)}
                  />
                ))}
              </>
            ) : (
              <>
                <Button
                  label="Editar ejercicio"
                  disabled={busy}
                  onPress={onEdit}
                />
                <View style={styles.row}>
                  <Button
                    label="Subir"
                    disabled={busy || first}
                    onPress={() => onMove(-1)}
                  />
                  <Button
                    label="Bajar"
                    disabled={busy || last}
                    onPress={() => onMove(1)}
                  />
                </View>
                <Button
                  label="Copiar a otro día"
                  disabled={busy}
                  onPress={onCopyMode}
                />
                <Button
                  label="Eliminar ejercicio"
                  danger
                  disabled={busy}
                  onPress={onDelete}
                />
              </>
            )}
            <Button label="Cerrar opciones" disabled={busy} onPress={onClose} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
