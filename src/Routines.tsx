import { useState } from "react";
import { Alert, Text, View } from "react-native";
import {
  State,
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
} from "./domain";
import { Button, Card, Field, ExerciseDetails, styles } from "./ui";
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
      setError((e as Error).message);
    }
  }
  const saveRoutine = (r: Routine) => mutate((s) => updateRoutine(s, r));
  return (
    <>
      <Text style={styles.text}>
        Build your week. Switch plans without losing your progress.
      </Text>
      <Button
        label="New routine"
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
            label="Routine name"
            value={name}
            maxLength={80}
            onChangeText={setName}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="Save routine"
            primary
            disabled={busy}
            onPress={() => void saveName()}
          />
          <Button
            label="Cancel"
            disabled={busy}
            onPress={() => setNaming(null)}
          />
        </Card>
      )}
      {!state.routines.length && !naming && (
        <Card>
          <Text style={styles.heading}>A plan that fits you</Text>
          <Text style={styles.text}>
            Create your first weekly routine. Days without exercises are rest
            days.
          </Text>
        </Card>
      )}
      {!naming &&
        !editor &&
        state.routines.map((r) => (
          <Button
            key={r.id}
            label={`${r.name}${r.id === state.activeId ? " · Active" : ""}${r.id === selected ? " · Selected" : ""}`}
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
                label="Use this routine"
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
                  label="Rename"
                  disabled={busy}
                  onPress={() => {
                    setName(routine.name);
                    setNaming("rename");
                    setError("");
                  }}
                />
                <Button
                  label="Duplicate"
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
                  label="Delete routine"
                  danger
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      "Delete routine?",
                      `Delete ${routine.name}? Workout history will be kept.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
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
                label="Add exercise"
                primary
                disabled={busy}
                onPress={() => setEditor("new")}
              />
              {!routine.days[day].length && (
                <Card>
                  <Text style={styles.heading}>Rest & recover</Text>
                  <Text style={styles.text}>
                    No exercises planned for this day.
                  </Text>
                </Card>
              )}
              {routine.days[day].map((e, i) => (
                <Card key={e.id}>
                  <ExerciseDetails exercise={e} />
                  <View style={styles.row}>
                    <Button
                      label={`Edit ${e.name}`}
                      disabled={busy}
                      onPress={() => setEditor(e)}
                    />
                    <Button
                      label={`Move ${e.name} up`}
                      disabled={busy || i === 0}
                      onPress={() =>
                        void saveRoutine(moveExercise(routine, day, e.id, -1))
                      }
                    />
                    <Button
                      label={`Move ${e.name} down`}
                      disabled={busy || i === routine.days[day].length - 1}
                      onPress={() =>
                        void saveRoutine(moveExercise(routine, day, e.id, 1))
                      }
                    />
                    <Button
                      label={`Copy ${e.name}`}
                      disabled={busy}
                      onPress={() => setCopying(e.id)}
                    />
                    <Button
                      label={`Delete ${e.name}`}
                      danger
                      disabled={busy}
                      onPress={() =>
                        Alert.alert(
                          "Delete exercise?",
                          "Past workout records will be kept.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () =>
                                void saveRoutine({
                                  ...routine,
                                  days: routine.days.map((d, j) =>
                                    j === day
                                      ? d.filter((x) => x.id !== e.id)
                                      : d,
                                  ),
                                }),
                            },
                          ],
                        )
                      }
                    />
                  </View>
                  {copying === e.id && (
                    <>
                      <Text style={styles.text}>Copy to day</Text>
                      <View style={styles.row}>
                        {DAYS.map((d, j) => (
                          <Button
                            key={d}
                            label={`Copy to ${d}`}
                            disabled={busy || day === j}
                            onPress={() =>
                              void saveRoutine(
                                copyExercise(routine, day, e.id, j),
                              ).then((ok) => {
                                if (ok) setCopying(null);
                              })
                            }
                          />
                        ))}
                      </View>
                      <Button
                        label="Cancel copy"
                        onPress={() => setCopying(null)}
                      />
                    </>
                  )}
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
