import { File, Paths } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import {
  UserError,
  id,
  localDate,
  MAX_BACKUP_BYTES,
  parseBackup,
  State,
} from "./domain";
export async function exportBackup(state: State) {
  if (!(await Sharing.isAvailableAsync()))
    throw new UserError("No se pueden compartir archivos en este dispositivo.");
  const file = new File(Paths.cache, `gym-mobile-${localDate()}-${id()}.json`);
  file.write(JSON.stringify(state));
  // Android resolves the chooser before the recipient necessarily reads the file.
  // Keep each unique export in cache; the OS may reclaim it later.
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Guardar respaldo de Gym Mobile",
  });
}
export async function pickBackup(): Promise<State | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "application/octet-stream"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0],
    file = new File(asset.uri);
  try {
    if ((asset.size ?? file.size) > MAX_BACKUP_BYTES)
      throw new UserError("El respaldo es demasiado grande (máximo 5 MB).");
    return parseBackup(await file.text());
  } finally {
    if (file.exists) file.delete();
  }
}
