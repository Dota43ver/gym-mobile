export class UserError extends Error {}
export function userMessage(error: unknown, fallback: string) {
  return error instanceof UserError ? error.message : fallback;
}
export function displayDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string;
};
export type Routine = { id: string; name: string; days: Exercise[][] };
export type Log = {
  date: string;
  routineId: string;
  routineName: string;
  exercise: Exercise;
};
export type State = {
  version: 1;
  routines: Routine[];
  activeId: string | null;
  logs: Log[];
};
export type ExerciseForm = {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};
export const MAX_BACKUP_BYTES = 5_000_000;
let sequence = 0;
export const id = () =>
  `${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2)}`;
export const emptyState = (): State => ({
  version: 1,
  routines: [],
  activeId: null,
  logs: [],
});
export function routineName(name: string) {
  const n = name.trim();
  if (!n || n.length > 80)
    throw new UserError(
      "El nombre de la rutina debe tener entre 1 y 80 caracteres.",
    );
  return n;
}
export const newRoutine = (name: string): Routine => ({
  id: id(),
  name: routineName(name),
  days: Array.from({ length: 7 }, () => []),
});
export function exerciseFromForm(
  form: ExerciseForm,
  existingId = id(),
): Exercise {
  const name = form.name.trim(),
    weightText = form.weight.trim().replace(",", ".");
  if (!name || name.length > 100)
    throw new UserError(
      "El nombre del ejercicio debe tener entre 1 y 100 caracteres.",
    );
  if (
    !/^\d+$/.test(form.sets) ||
    !/^\d+$/.test(form.reps) ||
    Number(form.sets) < 1 ||
    Number(form.reps) < 1 ||
    Number(form.sets) > 999 ||
    Number(form.reps) > 999
  )
    throw new UserError(
      "Las series y repeticiones deben ser números enteros entre 1 y 999.",
    );
  if (
    weightText !== "" &&
    (!/^\d+(\.\d+)?$/.test(weightText) ||
      !Number.isFinite(Number(weightText)) ||
      Number(weightText) > 10000)
  )
    throw new UserError(
      "El peso debe estar entre 0 y 10000 kg, o quedar vacío.",
    );
  if (form.notes.length > 2000)
    throw new UserError("Las notas no pueden superar los 2000 caracteres.");
  return {
    id: existingId,
    name,
    sets: Number(form.sets),
    reps: Number(form.reps),
    weight: weightText === "" ? null : Number(weightText),
    notes: form.notes,
  };
}
export const updateRoutine = (s: State, r: Routine): State => ({
  ...s,
  routines: s.routines.map((x) => (x.id === r.id ? r : x)),
});
export const deleteRoutine = (s: State, rid: string): State => ({
  ...s,
  routines: s.routines.filter((r) => r.id !== rid),
  activeId: s.activeId === rid ? null : s.activeId,
});
export function duplicateRoutine(r: Routine): Routine {
  return {
    id: id(),
    name: routineName(`${r.name.slice(0, 72)} (copia)`),
    days: r.days.map((d) => d.map((e) => ({ ...e, id: id() }))),
  };
}
export function copyExercise(
  r: Routine,
  day: number,
  eid: string,
  target: number,
): Routine {
  const e = r.days[day].find((x) => x.id === eid);
  if (!e) throw new UserError("No se encontró el ejercicio.");
  return {
    ...r,
    days: r.days.map((d, i) => (i === target ? [...d, { ...e, id: id() }] : d)),
  };
}
export function moveExercise(
  r: Routine,
  day: number,
  eid: string,
  delta: number,
): Routine {
  const list = [...r.days[day]],
    i = list.findIndex((e) => e.id === eid),
    target = i + delta;
  if (i < 0 || target < 0 || target >= list.length) return r;
  [list[i], list[target]] = [list[target], list[i]];
  return { ...r, days: r.days.map((d, j) => (j === day ? list : d)) };
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const weekday = (date = new Date()) => (date.getDay() + 6) % 7;
export function toggleCompletion(
  s: State,
  date: string,
  r: Routine,
  e: Exercise,
): State {
  const match = (l: Log) =>
    l.date === date && l.routineId === r.id && l.exercise.id === e.id;
  return {
    ...s,
    logs: s.logs.some(match)
      ? s.logs.filter((l) => !match(l))
      : [
          ...s.logs,
          { date, routineId: r.id, routineName: r.name, exercise: { ...e } },
        ],
  };
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max: number) =>
  typeof v === "string" && v.length > 0 && v.length <= max;
function validExercise(v: unknown): v is Exercise {
  return (
    record(v) &&
    text(v.id, 100) &&
    text(v.name, 100) &&
    typeof v.name === "string" &&
    !!v.name.trim() &&
    Number.isInteger(v.sets) &&
    Number(v.sets) > 0 &&
    Number(v.sets) <= 999 &&
    Number.isInteger(v.reps) &&
    Number(v.reps) > 0 &&
    Number(v.reps) <= 999 &&
    (v.weight === null ||
      (typeof v.weight === "number" &&
        Number.isFinite(v.weight) &&
        v.weight >= 0 &&
        v.weight <= 10000)) &&
    typeof v.notes === "string" &&
    v.notes.length <= 2000
  );
}
function validDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
function utf8Size(value: string) {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}
export function parseBackup(raw: string): State {
  if (raw.length > MAX_BACKUP_BYTES || utf8Size(raw) > MAX_BACKUP_BYTES)
    throw new UserError("El respaldo es demasiado grande (máximo 5 MB).");
  let s: unknown;
  try {
    s = JSON.parse(raw);
  } catch {
    throw new UserError("El archivo no es un respaldo JSON válido.");
  }
  const fail = () => {
    throw new UserError(
      "El respaldo de Gym Mobile no es válido o no es compatible. No se reemplazó ningún dato.",
    );
  };
  if (
    !record(s) ||
    s.version !== 1 ||
    !Array.isArray(s.routines) ||
    s.routines.length > 100 ||
    !Array.isArray(s.logs) ||
    s.logs.length > 20000
  )
    return fail();
  const ids = new Set<string>(),
    exercises = new Set<string>();
  for (const r of s.routines) {
    if (
      !record(r) ||
      !text(r.id, 100) ||
      !text(r.name, 80) ||
      !(r.name as string).trim() ||
      !Array.isArray(r.days) ||
      r.days.length !== 7 ||
      ids.has(r.id as string)
    )
      return fail();
    ids.add(r.id as string);
    for (const day of r.days) {
      if (!Array.isArray(day) || day.length > 200) return fail();
      for (const e of day) {
        if (!validExercise(e) || exercises.has(e.id)) return fail();
        exercises.add(e.id);
      }
    }
  }
  if (
    s.activeId !== null &&
    (typeof s.activeId !== "string" || !ids.has(s.activeId))
  )
    return fail();
  const logKeys = new Set<string>();
  for (const l of s.logs) {
    if (
      !record(l) ||
      !validDate(l.date) ||
      !text(l.routineId, 100) ||
      !text(l.routineName, 80) ||
      !validExercise(l.exercise)
    )
      return fail();
    const key = JSON.stringify([l.date, l.routineId, l.exercise.id]);
    if (logKeys.has(key)) return fail();
    logKeys.add(key);
  }
  // Logs intentionally retain references to deleted templates; their snapshots are self-contained.
  return s as State;
}
