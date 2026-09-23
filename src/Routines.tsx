import { useState } from "react";
import { Alert, Text, View } from "react-native";
import {
  State,
  userMessage,
  Routine,
  Exercise,
  DAYS,
  newRoutine,
  routineName,
  duplicateRoutine,
  deleteRoutine,
  updateRoutine,
  copyExercise,
  moveExercise,
  weekday,
  localDate,
  toggleCompletion,
} from "./domain";
import { Button, Card, Field, styles } from "./ui";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseMenu } from "./ExerciseMenu";
import { ExerciseEditor } from "./ExerciseEditor";
export type Mutate = (change: (s: State) => State) => Promise<boolean>;
export function Routines({
  state,
  mutate,
  busy,
}: {
  state: State;
  mutate: Mutate;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(state.activeId),
    [day, setDay] = useState(weekday()),
    [name, setName] = useState(""),
    [naming, setNaming] = useState<"new" | "rename" | null>(null),
    [editor, setEditor] = useState<Exercise | "new" | null>(null),
    [copying, setCopying] = useState<string | null>(null),
    [menu, setMenu] = useState<string | null>(null),
    [error, setError] = useState("");
  const routine = state.routines.find((r) => r.id === selected);
  async function saveName() {
    try {
      setError("");
      const n = routineName(name);
      if (naming === "new") {
        const r = newRoutine(n);
        if (
          await mutate((s) => ({
            ...s,
            routines: [...s.routines, r],
            activeId: s.activeId ?? r.id,
          }))
        ) {
          setSelected(r.id);
          setNaming(null);
        }
      } else if (
        routine &&
        (await mutate((s) => updateRoutine(s, { ...routine, name: n })))
      )
        setNaming(null);
    } catch (e) {
      setError(
        userMessage(
          e,
          "No se pudo completar la operación. Intenta nuevamente.",
        ),
      );
    }
  }
  const saveRoutine = (r: Routine) => mutate((s) => updateRoutine(s, r));
  return (
    <>
      <Text style={styles.text}>
        Organiza tu semana. Cambia de plan sin perder tu progreso.
      </Text>
      <Button
        label="Nueva rutina"
        primary
        disabled={busy || !!naming || !!editor}
        onPress={() => {
          setName("");
          setNaming("new");
          setError("");
        }}
      />
      {naming && (
        <Card>
          <Field
            label="Nombre de la rutina"
            value={name}
            maxLength={80}
            onChangeText={setName}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="Guardar rutina"
            primary
            disabled={busy}
            onPress={() => void saveName()}
          />
          <Button
            label="Cancelar"
            disabled={busy}
            onPress={() => setNaming(null)}
          />
        </Card>
      )}
      {!state.routines.length && !naming && (
        <Card>
          <Text style={styles.heading}>Un plan a tu medida</Text>
          <Text style={styles.text}>
            Crea tu primera rutina semanal. Los días sin ejercicios son días de
            descanso.
          </Text>
        </Card>
      )}
      {!naming &&
        !editor &&
        state.routines.map((r) => (
          <Button
            key={r.id}
            label={`${r.name}${r.id === state.activeId ? " · Activa" : ""}${r.id === selected ? " · Seleccionada" : ""}`}
            primary={r.id === selected}
            disabled={busy}
            onPress={() => {
              setSelected(r.id);
              setCopying(null);
            }}
          />
        ))}
      {routine && !naming && (
        <>
          <Card>
            <Text style={styles.heading}>{routine.name}</Text>
            {routine.id !== state.activeId && (
              <Button
                label="Usar esta rutina"
                primary
                disabled={busy || !!editor}
                onPress={() =>
                  void mutate((s) => ({ ...s, activeId: routine.id }))
                }
              />
            )}
            {!editor && (
              <View style={styles.row}>
                <Button
                  label="Renombrar"
                  disabled={busy}
                  onPress={() => {
                    setName(routine.name);
                    setNaming("rename");
                    setError("");
                  }}
                />
                <Button
                  label="Duplicar"
                  disabled={busy}
                  onPress={() => {
                    const r = duplicateRoutine(routine);
                    void mutate((s) => ({
                      ...s,
                      routines: [...s.routines, r],
                    })).then((ok) => {
                      if (ok) setSelected(r.id);
                    });
                  }}
                />
                <Button
                  label="Eliminar rutina"
                  danger
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      "¿Eliminar rutina?",
                      `¿Eliminar ${routine.name}? Se conservará el historial.`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Eliminar",
                          style: "destructive",
                          onPress: () =>
                            void mutate((s) => deleteRoutine(s, routine.id)),
                        },
                      ],
                    )
                  }
                />
              </View>
            )}
          </Card>
          {!editor && (
            <View style={styles.row}>
              {DAYS.map((d, i) => (
                <Button
                  key={d}
                  label={d}
                  primary={i === day}
                  disabled={busy}
                  onPress={() => {
                    setDay(i);
                    setCopying(null);
                  }}
                />
              ))}
            </View>
          )}
          <Text style={styles.heading}>{DAYS[day]}</Text>
          {editor ? (
            <ExerciseEditor
              key={editor === "new" ? "new" : editor.id}
              exercise={editor === "new" ? undefined : editor}
              busy={busy}
              onCancel={() => setEditor(null)}
              onSave={async (e) => {
                const ok = await saveRoutine({
                  ...routine,
                  days: routine.days.map((d, i) =>
                    i !== day
                      ? d
                      : editor === "new"
                        ? [...d, e]
                        : d.map((x) => (x.id === e.id ? e : x)),
                  ),
                });
                if (ok) setEditor(null);
                return ok;
              }}
            />
          ) : (
            <>
              <Button
                label="Agregar ejercicio"
                primary
                disabled={busy}
                onPress={() => setEditor("new")}
              />
              {!routine.days[day].length && (
                <Card>
                  <Text style={styles.heading}>Descanso y recuperación</Text>
                  <Text style={styles.text}>
                    No hay ejercicios para este día.
                  </Text>
                </Card>
              )}
              <Text style={styles.text}>
                El check registra todas las series como completadas hoy.
              </Text>
              {routine.days[day].map((e) => (
                <ExerciseCard
                  key={e.id}
                  exercise={e}
                  busy={busy}
                  checked={state.logs.some(
                    (l) =>
                      l.date === localDate() &&
                      l.routineId === routine.id &&
                      l.exercise.id === e.id,
                  )}
                  onToggle={() =>
                    void mutate((s) =>
                      toggleCompletion(s, localDate(), routine, e),
                    )
                  }
                  onOptions={() => {
                    setMenu(e.id);
                    setCopying(null);
                  }}
                />
              ))}
              {routine.days[day]
                .filter((e) => e.id === menu)
                .map((e) => (
                  <ExerciseMenu
                    key={e.id}
                    exercise={e}
                    busy={busy}
                    first={routine.days[day][0].id === e.id}
                    last={
                      routine.days[day][routine.days[day].length - 1].id ===
                      e.id
                    }
                    day={day}
                    copying={copying === e.id}
                    onClose={() => {
                      setMenu(null);
                      setCopying(null);
                    }}
                    onEdit={() => {
                      setMenu(null);
                      setEditor(e);
                    }}
                    onMove={(delta) =>
                      void saveRoutine(
                        moveExercise(routine, day, e.id, delta),
                      ).then((ok) => {
                        if (ok) setMenu(null);
                      })
                    }
                    onCopyMode={() => setCopying(e.id)}
                    onCopy={(target) =>
                      void saveRoutine(
                        copyExercise(routine, day, e.id, target),
                      ).then((ok) => {
                        if (ok) {
                          setMenu(null);
                          setCopying(null);
                        }
                      })
                    }
                    onDelete={() =>
                      Alert.alert(
                        "¿Eliminar ejercicio?",
                        "Se conservarán los registros anteriores.",
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: () =>
                              void saveRoutine({
                                ...routine,
                                days: routine.days.map((d, j) =>
                                  j === day
                                    ? d.filter((x) => x.id !== e.id)
                                    : d,
                                ),
                              }).then((ok) => {
                                if (ok) setMenu(null);
                              }),
                          },
                        ],
                      )
                    }
                  />
                ))}
            </>
          )}
        </>
      )}
    </>
  );
}
