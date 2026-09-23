import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import App from "../App";
import { emptyState } from "../src/domain";
import { store } from "../src/storage";
jest.mock(
  "react-native-safe-area-context",
  () => jest.requireActual("react-native-safe-area-context/jest/mock").default,
);
jest.mock("../src/storage", () => {
  const { Store } = require("../src/store");
  return {
    store: new Store({ read: async () => null, write: async () => {} }),
  };
});
jest.mock("../src/backups", () => ({
  exportBackup: jest.fn(),
  pickBackup: jest.fn(),
}));
beforeEach(async () => {
  await store.load();
  await store.mutate(() => emptyState());
});
test("creates routine and exercise with weight/notes, switches tabs and logs completion", async () => {
  await render(<App />);
  await waitFor(() =>
    expect(screen.getByText("Tu próximo paso empieza aquí")).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Rutinas" }));
  await fireEvent.press(screen.getByRole("button", { name: "Nueva rutina" }));
  await fireEvent.changeText(
    screen.getByLabelText("Nombre de la rutina"),
    "Strength",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Guardar rutina" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Agregar ejercicio" }),
    ).toBeTruthy(),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Agregar ejercicio" }),
  );
  await fireEvent.changeText(
    screen.getByLabelText("Nombre del ejercicio"),
    "Squat",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Peso (kg, opcional)"),
    "12,5",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Notas (opcional)"),
    "Slow descent",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Guardar ejercicio" }),
  );
  await waitFor(() => expect(screen.getByText("Squat")).toBeTruthy());
  expect(store.state.routines[0].days.flat()[0]).toMatchObject({
    weight: 12.5,
    notes: "Slow descent",
  });
  await fireEvent.press(screen.getByRole("button", { name: "Hoy" }));
  await fireEvent.press(
    screen.getByRole("checkbox", {
      name: "Todas las series de Squat completadas hoy",
    }),
  );
  await waitFor(() => expect(store.state.logs).toHaveLength(1));
  await fireEvent.press(screen.getByRole("button", { name: "Historial" }));
  expect(screen.getByText("Slow descent")).toBeTruthy();
});

test("failed startup offers retry instead of creating empty data", async () => {
  const load = jest
    .spyOn(store, "load")
    .mockRejectedValueOnce(new Error("Storage unavailable"));
  await render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Reintentar carga" }),
    ).toBeTruthy(),
  );
  expect(screen.queryByText("Tu próximo paso empieza aquí")).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Reintentar carga" }),
  );
  await waitFor(() =>
    expect(screen.getByText("Tu próximo paso empieza aquí")).toBeTruthy(),
  );
  load.mockRestore();
});

test("failed save leaves routine form and existing state intact", async () => {
  await render(<App />);
  await waitFor(() =>
    expect(screen.getByText("Tu próximo paso empieza aquí")).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Rutinas" }));
  await fireEvent.press(screen.getByRole("button", { name: "Nueva rutina" }));
  await fireEvent.changeText(
    screen.getByLabelText("Nombre de la rutina"),
    "Keep this draft",
  );
  const mutate = jest
    .spyOn(store, "mutate")
    .mockRejectedValueOnce(new Error("disk full"));
  await fireEvent.press(screen.getByRole("button", { name: "Guardar rutina" }));
  await waitFor(() =>
    expect(
      screen.getByText(
        "No se guardaron los cambios. Comprueba el espacio disponible y vuelve a intentar.",
      ),
    ).toBeTruthy(),
  );
  expect(screen.getByLabelText("Nombre de la rutina").props.value).toBe(
    "Keep this draft",
  );
  expect(store.state.routines).toHaveLength(0);
  mutate.mockRestore();
});

test("Spanish tabs use a single-line label for narrow screens", async () => {
  await render(<App />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Ajustes" })).toBeEnabled(),
  );
  for (const label of ["Hoy", "Rutinas", "Historial", "Ajustes"]) {
    expect(screen.getByText(label).props.numberOfLines).toBe(1);
    expect(screen.getByText(label).props.adjustsFontSizeToFit).toBe(true);
  }
  await fireEvent.press(screen.getByRole("button", { name: "Ajustes" }));
  expect(
    screen.getByRole("button", { name: "Exportar respaldo" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Importar respaldo" }),
  ).toBeTruthy();
});
