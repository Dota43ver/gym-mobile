import { render, screen } from "@testing-library/react-native";
import App from "../App";
jest.mock(
  "react-native-safe-area-context",
  () => jest.requireActual("react-native-safe-area-context/jest/mock").default,
);

describe("App bootstrap", () => {
  it("introduces the app without offering unfinished actions", async () => {
    await render(<App />);

    expect(screen.getByRole("header", { name: "Gym Mobile" })).toBeTruthy();
    expect(screen.getByText("Your training, one week at a time.")).toBeTruthy();
    expect(screen.getByText("Routine planning is coming next.")).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
