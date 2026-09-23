import { render, screen, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import { Routines } from "../src/Routines";
import {
  State,
  newRoutine,
  exerciseFromForm,
  localDate,
  toggleCompletion,
} from "../src/domain";
import { useState } from "react";
const exercise = () =>
  exerciseFromForm({
    name: "Sentadilla",
    sets: "3",
    reps: "10",
    weight: "20",
    notes: "Bajar lento",
  });
function initial(): State {
  const r = newRoutine("Fuerza");
  r.days[0] = [exercise(), { ...exercise(), name: "Remo" }];
  return { version: 1, routines: [r], activeId: r.id, logs: [] };
}
function Harness({ value = initial() }: { value?: State }) {
  const [state, setState] = useState(value);
  return (
    <Routines
      state={state}
      busy={false}
      mutate={async (change) => {
        setState(change(state));
        return true;
      }}
    />
  );
}
test("pencil keeps actions collapsed and opens all actions with move boundaries", async () => {
  await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Lunes" }));
  expect(screen.queryByRole("button", { name: "Editar ejercicio" })).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Opciones de Sentadilla" }),
  );
  expect(screen.getByRole("button", { name: "Subir" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Bajar" })).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Copiar a otro día" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Eliminar ejercicio" }),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("button", { name: "Editar ejercicio" }),
  );
  expect(screen.getByLabelText("Nombre del ejercicio").props.value).toBe(
    "Sentadilla",
  );
});
test("checkbox records today even on a different selected weekday, and toggles independently", async () => {
  const value = initial();
  value.logs = toggleCompletion(
    value,
    "2020-01-01",
    value.routines[0],
    value.routines[0].days[0][0],
  ).logs;
  await render(<Harness value={value} />);
  await fireEvent.press(screen.getByRole("button", { name: "Lunes" }));
  const box = () =>
    screen.getByRole("checkbox", {
      name: "Todas las series de Sentadilla completadas hoy",
    });
  expect(box()).not.toBeChecked();
  await fireEvent.press(box());
  expect(box()).toBeChecked();
  await fireEvent.press(box());
  expect(box()).not.toBeChecked();
  expect(value.logs[0].date).toBe("2020-01-01");
  expect(localDate()).not.toBe("2020-01-01");
});
test("copy destinations and deletion confirmation remain accessible from menu", async () => {
  const alert = jest.spyOn(Alert, "alert");
  await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Lunes" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Opciones de Sentadilla" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Copiar a otro día" }),
  );
  expect(screen.getByRole("button", { name: "Copiar a Lunes" })).toBeDisabled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Copiar a Martes" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Martes" }));
  expect(screen.getByText("Sentadilla")).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("button", { name: "Opciones de Sentadilla" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Eliminar ejercicio" }),
  );
  expect(alert).toHaveBeenCalledWith(
    "¿Eliminar ejercicio?",
    expect.any(String),
    expect.arrayContaining([
      expect.objectContaining({ text: "Eliminar", style: "destructive" }),
    ]),
  );
  alert.mockRestore();
});

test("moving from the menu changes order and boundary controls", async () => {
  await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Lunes" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Opciones de Sentadilla" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Bajar" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Opciones de Sentadilla" }),
  );
  expect(screen.getByRole("button", { name: "Subir" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Bajar" })).toBeDisabled();
});

test("different routines and previous dates keep independent completion states", async () => {
  const value = initial();
  const other = newRoutine("Otra");
  other.days[0] = [{ ...exercise(), name: "Sentadilla" }];
  value.routines.push(other);
  value.logs = toggleCompletion(
    value,
    "2020-01-01",
    value.routines[0],
    value.routines[0].days[0][0],
  ).logs;
  await render(<Harness value={value} />);
  await fireEvent.press(screen.getByRole("button", { name: "Lunes" }));
  const box = () =>
    screen.getByRole("checkbox", {
      name: "Todas las series de Sentadilla completadas hoy",
    });
  await fireEvent.press(box());
  expect(box()).toBeChecked();
  await fireEvent.press(screen.getByRole("button", { name: "Otra" }));
  expect(box()).not.toBeChecked();
  await fireEvent.press(box());
  expect(box()).toBeChecked();
  await fireEvent.press(
    screen.getByRole("button", { name: "Fuerza · Activa" }),
  );
  expect(box()).toBeChecked();
  await fireEvent.press(box());
  await fireEvent.press(screen.getByRole("button", { name: "Otra" }));
  expect(box()).toBeChecked();
});

test("daily checkbox resets next day without deleting earlier completion", async () => {
  jest.useFakeTimers({ now: new Date(2026, 8, 21, 12) });
  try {
    const value = initial();
    const view = await render(<Harness value={value} />);
    const box = () =>
      screen.getByRole("checkbox", {
        name: "Todas las series de Sentadilla completadas hoy",
      });
    await fireEvent.press(box());
    expect(box()).toBeChecked();
    jest.setSystemTime(new Date(2026, 8, 22, 12));
    await view.rerender(<Harness value={value} />);
    expect(box()).not.toBeChecked();
    jest.setSystemTime(new Date(2026, 8, 21, 12));
    await view.rerender(<Harness value={value} />);
    expect(box()).toBeChecked();
  } finally {
    jest.useRealTimers();
  }
});

test("busy cards expose only disabled pencil and checkbox controls", async () => {
  const value = initial();
  value.routines[0].days = Array.from({ length: 7 }, () => [exercise()]);
  await render(<Routines state={value} busy mutate={jest.fn()} />);
  expect(
    screen.getByRole("button", { name: "Opciones de Sentadilla" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("checkbox", {
      name: "Todas las series de Sentadilla completadas hoy",
    }),
  ).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Editar ejercicio" })).toBeNull();
});
