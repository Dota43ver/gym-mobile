import { emptyState, parseBackup, State } from "./domain";
export interface StorageAdapter {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}
export class Store {
  state: State = emptyState();
  private loaded = false;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private adapter: StorageAdapter) {}
  async load() {
    const raw = await this.adapter.read();
    this.state = raw === null ? emptyState() : parseBackup(raw);
    this.loaded = true;
    return this.state;
  }
  mutate(change: (s: State) => State): Promise<State> {
    const task = this.queue.then(async () => {
      if (!this.loaded)
        throw new Error("Storage is not ready. Retry loading first.");
      const next = change(this.state);
      const raw = JSON.stringify(next);
      parseBackup(raw);
      await this.adapter.write(raw);
      this.state = next;
      return next;
    });
    this.queue = task.catch(() => {});
    return task;
  }
}
