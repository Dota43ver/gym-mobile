import {
  State,
  emptyState,
  exerciseFromForm,
  newRoutine,
  updateRoutine,
  copyExercise,
  moveExercise,
  toggleCompletion,
  localDate,
  parseBackup,
  deleteRoutine,
} from "../src/domain";
const exercise = () =>
  exerciseFromForm({
    name: "Squat",
    sets: "3",
    reps: "10",
    weight: "12,5",
    notes: "Slow descent",
  });
function fixture(): State {
  const routine = newRoutine("Strength");
  routine.days[0] = [exercise(), exercise()];
  return {
    version: 1 as const,
    routines: [routine],
    activeId: routine.id,
    logs: [],
  };
}
test("validates optional weight and preserves notes", () => {
  expect(exercise()).toMatchObject({
    weight: 12.5,
    notes: "Slow descent",
    sets: 3,
  });
  expect(
    exerciseFromForm({
      name: "Run",
      sets: "1",
      reps: "1",
      weight: "",
      notes: "",
    }).weight,
  ).toBeNull();
  for (const weight of ["-1", "NaN", "1.2.3", "Infinity"])
    expect(() =>
      exerciseFromForm({ name: "X", sets: "1", reps: "1", weight, notes: "" }),
    ).toThrow();
  expect(() =>
    exerciseFromForm({
      name: "X",
      sets: "1.5",
      reps: "1",
      weight: "",
      notes: "",
    }),
  ).toThrow();
});
test("copies with independent identity and reorders without losing data", () => {
  const s = fixture();
  const r = copyExercise(s.routines[0], 0, s.routines[0].days[0][0].id, 1);
  expect(r.days[1][0].id).not.toBe(r.days[0][0].id);
  expect(r.days[1][0].weight).toBe(12.5);
  const moved = moveExercise(r, 0, r.days[0][0].id, 1);
  expect(moved.days[0][1].id).toBe(r.days[0][0].id);
});
test("switching, editing and deletion preserve dated immutable snapshots", () => {
  let s = fixture();
  const first = s.routines[0];
  s = toggleCompletion(s, "2026-09-21", first, first.days[0][0]);
  const next = newRoutine("Other");
  s = { ...s, routines: [...s.routines, next], activeId: next.id };
  s = updateRoutine(s, {
    ...first,
    name: "Changed",
    days: Array.from({ length: 7 }, () => []),
  });
  s = deleteRoutine(s, first.id);
  expect(s.logs[0]).toMatchObject({
    date: "2026-09-21",
    routineName: "Strength",
    exercise: { weight: 12.5, notes: "Slow descent" },
  });
  expect(s.activeId).toBe(next.id);
});
test("completion toggles by date, not recurring weekday", () => {
  let s = fixture();
  const r = s.routines[0],
    e = r.days[0][0];
  s = toggleCompletion(s, "2026-09-21", r, e);
  s = toggleCompletion(s, "2026-09-28", r, e);
  expect(s.logs).toHaveLength(2);
  s = toggleCompletion(s, "2026-09-21", r, e);
  expect(s.logs).toHaveLength(1);
  expect(localDate(new Date(2026, 8, 21, 23, 30))).toBe("2026-09-21");
});
test("backup roundtrip and hostile input validation", () => {
  const s = fixture();
  expect(parseBackup(JSON.stringify(s))).toEqual(s);
  for (const bad of [
    { ...s, version: 2 },
    { ...s, activeId: "missing" },
    { ...s, routines: [s.routines[0], s.routines[0]] },
    { ...s, logs: [{ date: "2026-02-31" }] },
    { ...s, routines: [{ ...s.routines[0], days: [] }] },
  ])
    expect(() => parseBackup(JSON.stringify(bad))).toThrow();
  expect(() => parseBackup("x".repeat(5_000_001))).toThrow();
  expect(emptyState().activeId).toBeNull();
});
test("enforces byte size for non-ASCII backups", () => {
  expect(() =>
    parseBackup(
      JSON.stringify({ ...emptyState(), padding: "🏋".repeat(1_300_000) }),
    ),
  ).toThrow("demasiado grande");
});
