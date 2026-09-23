import { Store } from "../src/store";
import { emptyState, newRoutine } from "../src/domain";
test("does not publish failed writes and reloads persisted state", async () => {
  let disk = JSON.stringify(emptyState());
  let fail = false;
  const adapter = {
    read: async () => disk,
    write: async (value: string) => {
      if (fail) throw Error("disk full");
      disk = value;
    },
  };
  const store = new Store(adapter);
  await store.load();
  const original = store.state;
  fail = true;
  await expect(
    store.mutate((s) => ({ ...s, routines: [newRoutine("A")] })),
  ).rejects.toThrow("disk full");
  expect(store.state).toBe(original);
  fail = false;
  await store.mutate((s) => ({ ...s, routines: [newRoutine("B")] }));
  const reopened = new Store(adapter);
  await reopened.load();
  expect(reopened.state.routines[0].name).toBe("B");
});
test("serializes changes and refuses mutation before successful load", async () => {
  const adapter = { read: async () => null, write: jest.fn(async () => {}) };
  const store = new Store(adapter);
  await expect(store.mutate((s) => s)).rejects.toThrow();
  await store.load();
  await Promise.all([
    store.mutate((s) => ({ ...s, routines: [...s.routines, newRoutine("A")] })),
    store.mutate((s) => ({ ...s, routines: [...s.routines, newRoutine("B")] })),
  ]);
  expect(store.state.routines).toHaveLength(2);
  expect(adapter.write).toHaveBeenCalledTimes(2);
});
test("corrupt load and malformed restore never overwrite data", async () => {
  const adapter = { read: async () => "{bad", write: jest.fn(async () => {}) };
  const store = new Store(adapter);
  await expect(store.load()).rejects.toThrow();
  await expect(store.mutate((s) => s)).rejects.toThrow();
  expect(adapter.write).not.toHaveBeenCalled();
});
