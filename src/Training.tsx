import { Text } from "react-native";
import {
  DAYS,
  State,
  localDate,
  weekday,
  toggleCompletion,
  displayDate,
} from "./domain";
import { Button, Card, ExerciseDetails, styles } from "./ui";
import { ExerciseCard } from "./ExerciseCard";
import { Mutate } from "./Routines";
export function Today({
  state,
  now,
  mutate,
  busy,
  onPlan,
}: {
  state: State;
  now: Date;
  mutate: Mutate;
  busy: boolean;
  onPlan: () => void;
}) {
  const r = state.routines.find((x) => x.id === state.activeId),
    date = localDate(now),
    exercises = r?.days[weekday(now)] ?? [],
    completed = exercises.filter((e) =>
      state.logs.some(
        (l) =>
          l.date === date && l.routineId === r?.id && l.exercise.id === e.id,
      ),
    ).length;
  return (
    <>
      <Text style={styles.eyebrow}>
        {DAYS[weekday(now)].toUpperCase()} · {displayDate(date)}
      </Text>
      {!r ? (
        <Card>
          <Text style={styles.heading}>Tu próximo paso empieza aquí</Text>
          <Text style={styles.text}>
            Elige una rutina semanal y comienza a progresar.
          </Text>
          <Button label="Planificar mi semana" primary onPress={onPlan} />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.heading}>{r.name}</Text>
            <Text style={styles.text}>
              {exercises.length
                ? `${completed} / ${exercises.length} ejercicios completados`
                : "Día de descanso. Recuperarse también es parte del plan."}
            </Text>
          </Card>
          {!!exercises.length && (
            <Text style={styles.text}>
              El check registra todas las series como completadas hoy.
            </Text>
          )}
          {exercises.map((e) => {
            const log = state.logs.find(
              (l) =>
                l.date === date &&
                l.routineId === r.id &&
                l.exercise.id === e.id,
            );
            return (
              <ExerciseCard
                key={e.id}
                exercise={log?.exercise ?? e}
                checked={!!log}
                busy={busy}
                onToggle={() =>
                  void mutate((s) =>
                    localDate() === date ? toggleCompletion(s, date, r, e) : s,
                  )
                }
              />
            );
          })}
        </>
      )}
    </>
  );
}
export function History({ state }: { state: State }) {
  const dates = [...new Set(state.logs.map((l) => l.date))].sort().reverse();
  return (
    <>
      <Text style={styles.text}>
        Ejercicios completados, guardados tal como estaban. Cambiar el plan no
        modifica estos registros.
      </Text>
      {!dates.length && (
        <Card>
          <Text style={styles.heading}>Tu progreso está aquí</Text>
          <Text style={styles.text}>
            Completa un ejercicio en Hoy para iniciar tu historial.
          </Text>
        </Card>
      )}
      {dates.map((date) => (
        <Card key={date}>
          <Text style={styles.eyebrow}>{displayDate(date)}</Text>
          {state.logs
            .filter((l) => l.date === date)
            .map((l) => (
              <Card key={`${l.routineId}/${l.exercise.id}`}>
                <Text style={styles.text}>{l.routineName}</Text>
                <ExerciseDetails exercise={l.exercise} />
              </Card>
            ))}
        </Card>
      ))}
    </>
  );
}
