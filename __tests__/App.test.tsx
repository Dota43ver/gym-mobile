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
    expect(screen.getByText("Your next chapter starts here")).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Routines" }));
  await fireEvent.press(screen.getByRole("button", { name: "New routine" }));
  await fireEvent.changeText(screen.getByLabelText("Routine name"), "Strength");
  await fireEvent.press(screen.getByRole("button", { name: "Save routine" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Add exercise" })).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Add exercise" }));
  await fireEvent.changeText(screen.getByLabelText("Exercise name"), "Squat");
  await fireEvent.changeText(
    screen.getByLabelText("Weight (kg, optional)"),
    "12,5",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Notes (optional)"),
    "Slow descent",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save exercise" }));
  await waitFor(() => expect(screen.getByText("Squat")).toBeTruthy());
  expect(store.state.routines[0].days.flat()[0]).toMatchObject({
    weight: 12.5,
    notes: "Slow descent",
  });
  await fireEvent.press(screen.getByRole("button", { name: "Today" }));
  await fireEvent.press(screen.getByRole("button", { name: "Complete Squat" }));
  await waitFor(() => expect(store.state.logs).toHaveLength(1));
  await fireEvent.press(screen.getByRole("button", { name: "History" }));
  expect(screen.getByText("Slow descent")).toBeTruthy();
});

test("failed startup offers retry instead of creating empty data", async () => {
  const load = jest
    .spyOn(store, "load")
    .mockRejectedValueOnce(new Error("Storage unavailable"));
  await render(<App />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Retry loading" })).toBeTruthy(),
  );
  expect(screen.queryByText("Your next chapter starts here")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Retry loading" }));
  await waitFor(() =>
    expect(screen.getByText("Your next chapter starts here")).toBeTruthy(),
  );
  load.mockRestore();
});

test("failed save leaves routine form and existing state intact", async () => {
  await render(<App />);
  await waitFor(() =>
    expect(screen.getByText("Your next chapter starts here")).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Routines" }));
  await fireEvent.press(screen.getByRole("button", { name: "New routine" }));
  await fireEvent.changeText(
    screen.getByLabelText("Routine name"),
    "Keep this draft",
  );
  const mutate = jest
    .spyOn(store, "mutate")
    .mockRejectedValueOnce(new Error("disk full"));
  await fireEvent.press(screen.getByRole("button", { name: "Save routine" }));
  await waitFor(() =>
    expect(screen.getByText("Not saved. disk full")).toBeTruthy(),
  );
  expect(screen.getByLabelText("Routine name").props.value).toBe(
    "Keep this draft",
  );
  expect(store.state.routines).toHaveLength(0);
  mutate.mockRestore();
});
