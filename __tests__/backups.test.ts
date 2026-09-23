import { pickBackup, exportBackup } from "../src/backups";
import { emptyState } from "../src/domain";
import { File } from "expo-file-system";
import * as Picker from "expo-document-picker";
import * as Sharing from "expo-sharing";
const mockFile = {
  size: 10,
  exists: true,
  uri: "file:///cache/backup.json",
  text: jest.fn(),
  write: jest.fn(),
  delete: jest.fn(),
};
jest.mock("expo-file-system", () => ({
  File: jest.fn(() => mockFile),
  Paths: { cache: "file:///cache/" },
}));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockFile.size = 10;
  mockFile.text.mockResolvedValue(JSON.stringify(emptyState()));
  (Picker.getDocumentAsync as jest.Mock).mockResolvedValue({
    canceled: false,
    assets: [{ uri: mockFile.uri, size: 10 }],
  });
});
test("cancel import is a no-op and valid file is parsed then cache removed", async () => {
  (Picker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
    canceled: true,
  });
  expect(await pickBackup()).toBeNull();
  expect(await pickBackup()).toEqual(emptyState());
  expect(mockFile.delete).toHaveBeenCalledTimes(1);
});
test("rejects oversized file before reading and rejects malformed JSON", async () => {
  (Picker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri: mockFile.uri, size: 5_000_001 }],
  });
  await expect(pickBackup()).rejects.toThrow("too large");
  expect(mockFile.text).not.toHaveBeenCalled();
  mockFile.text.mockResolvedValueOnce("{}");
  await expect(pickBackup()).rejects.toThrow("unsupported");
});
test("exports readable data and retains it for asynchronous recipient reads", async () => {
  await exportBackup(emptyState());
  expect(JSON.parse(mockFile.write.mock.calls[0][0])).toEqual(emptyState());
  expect(Sharing.shareAsync).toHaveBeenCalled();
  expect(mockFile.delete).not.toHaveBeenCalled();
});

test("uses a unique cache filename for every export on the same date", async () => {
  await exportBackup(emptyState());
  await exportBackup(emptyState());
  const calls = (File as unknown as jest.Mock).mock.calls;
  expect(calls[0][1]).not.toBe(calls[1][1]);
  expect(calls[0][1]).toMatch(/^gym-mobile-.*\.json$/);
  expect(mockFile.delete).not.toHaveBeenCalled();
});
