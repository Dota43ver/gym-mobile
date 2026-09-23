import { Text } from "react-native";
import { DAYS, State, localDate, weekday, toggleCompletion } from "./domain";
import { Button, Card, ExerciseDetails, styles } from "./ui";
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
        {DAYS[weekday(now)].toUpperCase()} · {date}
      </Text>
      {!r ? (
        <Card>
          <Text style={styles.heading}>Your next chapter starts here</Text>
          <Text style={styles.text}>
            Choose a weekly routine and make room for progress.
          </Text>
          <Button label="Plan my week" primary onPress={onPlan} />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.heading}>{r.name}</Text>
            <Text style={styles.text}>
              {exercises.length
                ? `${completed} / ${exercises.length} exercises completed`
                : "Rest day. Recovery is part of the plan."}
            </Text>
          </Card>
          {exercises.map((e) => {
            const log = state.logs.find(
              (l) =>
                l.date === date &&
                l.routineId === r.id &&
                l.exercise.id === e.id,
            );
            return (
              <Card key={e.id}>
                <ExerciseDetails exercise={log?.exercise ?? e} />
                <Button
                  label={`${log ? "Undo" : "Complete"} ${e.name}`}
                  primary={!log}
                  disabled={busy}
                  onPress={() =>
                    void mutate((s) =>
                      localDate() === date
                        ? toggleCompletion(s, date, r, e)
                        : s,
                    )
                  }
                />
              </Card>
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
        Completed exercises, saved exactly as they were. Changing your plan
        never rewrites these records.
      </Text>
      {!dates.length && (
        <Card>
          <Text style={styles.heading}>Your progress lives here</Text>
          <Text style={styles.text}>
            Complete an exercise in Today to start your history.
          </Text>
        </Card>
      )}
      {dates.map((date) => (
        <Card key={date}>
          <Text style={styles.eyebrow}>{date}</Text>
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
