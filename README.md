# Gym Mobile

Aplicación Android para organizar tus rutinas de gimnasio y registrar lo que
completaste, con interfaz oscura y datos locales. Puedes guardar varios planes
semanales, cambiar el activo y volver al anterior sin perder ejercicios ni historial.

## Qué puedes hacer

- Crear, renombrar, duplicar y eliminar rutinas de lunes a domingo.
- Elegir una rutina activa que se repite cada semana; un día vacío es descanso.
- Agregar, editar, eliminar, ordenar y copiar ejercicios entre días.
- Guardar nombre, series, repeticiones, **peso opcional en kg y notas**. El peso
  acepta punto o coma decimal; dejarlo vacío es distinto de indicar cero.
- Marcar y desmarcar ejercicios completados en **Today**. El historial conserva
  una copia del nombre de la rutina y de cada ejercicio, peso y notas por fecha
  local, aunque después edites o elimines el plan.
- Exportar respaldos JSON e importarlos desde **Settings**, con validación y
  confirmación antes de reemplazar todos los datos.

La interfaz está en inglés. El modo oscuro es permanente en esta versión.
No hay cuentas, anuncios, sincronización, videos ni servicios pagos integrados.
Cada persona que instale la aplicación tendrá sus propios datos.

## Probar en Android

Necesitas [mise](https://mise.jdx.dev/getting-started.html) y
[Expo Go compatible con SDK 57](https://expo.dev/go) en el teléfono.

```sh
mise install
mise exec -- npm ci
mise exec -- npm start
```

Conecta teléfono y computadora a la misma red Wi-Fi y escanea el QR desde Expo Go.
Mantén la terminal abierta. Si la red impide la conexión directa:

```sh
mise exec -- npm start -- --tunnel
```

Acepta la instalación de `@expo/ngrok` si Expo la solicita y escanea el nuevo QR.
El túnel requiere internet: eso no cambia el funcionamiento offline del APK final.
No hace falta instalar Android Studio para este flujo.

## Generar un APK independiente

Está preparado el perfil `preview` de EAS Build. **Todavía no se generó un APK ni
se verificaron estas funciones nuevas en un dispositivo real.** Expo Go se usa
solo durante el desarrollo; quienes reciban el APK no lo necesitan.

Con una cuenta Expo propia:

```sh
mise exec -- npx eas-cli login
mise exec -- npx eas-cli build --platform android --profile preview
```

En la primera ejecución, vincula o crea el proyecto EAS cuando lo solicite y
permite gestionar las credenciales Android. No hay identificadores de cuenta ni
credenciales inventados en el repositorio. EAS puede modificar la configuración
para asociar tu proyecto: conserva ese cambio para compilaciones futuras.

Descarga el APK desde el enlace del build e instálalo en un Android compatible,
autorizando la instalación desde esa fuente si Android lo solicita. Comparte ese
APK, no el QR de desarrollo. Conserva la misma firma y el identificador
`com.dota43ver.gymmobile` para actualizaciones; aumenta `android.versionCode`.
Las compilaciones en la nube están sujetas a los límites vigentes de tu cuenta;
no se inició ninguna compilación ni contratación de servicios automáticamente.

Referencia: [distribución de APK con Expo](https://docs.expo.dev/build-reference/apk/).

## Datos y respaldos

Los datos se guardan en SQLite en el teléfono. Las escrituras se serializan y la
pantalla solo publica el cambio tras guardarlo correctamente. Si falla la carga,
se muestra un error y se permite reintentar, sin sobrescribir datos con un estado
vacío.

El respaldo es JSON versión 1, máximo **5 MB**. La importación valida estructura,
identificadores únicos, fechas, números y referencia de rutina activa; solo
reemplaza los datos en una transacción después de confirmar. Los registros
históricos pueden referenciar rutinas eliminadas porque contienen sus propias
copias completas. Importar no mezcla datos.

**Exporta con regularidad:** desinstalar la aplicación, borrar sus datos o perder
el teléfono puede eliminar la información local. El archivo de respaldo no está
cifrado y contiene pesos y notas; compártelo únicamente con quien corresponda.

Para mantener acotada esta primera versión: hasta 100 rutinas, 200 ejercicios por
día y 20.000 registros completados, además del límite de tamaño. Si se alcanza un
límite, la escritura se rechaza sin descartar los datos existentes.

## Desarrollo y comprobaciones

```sh
mise exec -- npm run format
mise exec -- npm test
mise exec -- npm run typecheck
mise exec -- npm run format:check
mise exec -- npx expo install --check
mise exec -- npx expo-doctor
mise exec -- npx expo export --platform android --output-dir /tmp/gym-mobile-export
```

Las pruebas cubren validación de peso/notas, copias y orden, historial por fecha,
escrituras fallidas, recarga, importaciones y el flujo de creación/completado en
la interfaz. Los módulos nativos se simulan en Jest: estos controles **no prueban
SQLite ni el selector/compartidor de archivos en un teléfono real**.

Antes de distribuir, comprobar en un Android:

- Crear dos rutinas, alternarlas y editar/copiar/reordenar ejercicios.
- Cerrar y reabrir la app en modo avión y verificar pesos y notas.
- Completar ejercicios, cambiar de fecha y revisar el historial.
- Exportar, modificar datos, importar el respaldo y comprobar la restauración.
- Cancelar importaciones, rechazar archivos inválidos y verificar que nada cambia.
- Instalar el APK y abrirlo sin Expo Go ni servidor de desarrollo.

## Organización

| Archivo                                      | Responsabilidad                                          |
| -------------------------------------------- | -------------------------------------------------------- |
| `App.tsx`                                    | Navegación, carga, errores y coordinación de escrituras. |
| `src/domain.ts`                              | Rutinas, ejercicios, fechas, historial y validación.     |
| `src/store.ts`, `src/storage.ts`             | Escrituras serializadas y persistencia SQLite.           |
| `src/Routines.tsx`, `src/ExerciseEditor.tsx` | Edición de la semana y ejercicios.                       |
| `src/Training.tsx`, `src/ui.tsx`             | Entrenamiento, historial y componentes oscuros.          |
| `src/backups.ts`                             | Selección y exportación de archivos.                     |
| `__tests__/`                                 | Pruebas de comportamiento y límites de datos.            |
| `eas.json`, `app.json`                       | Configuración Expo y perfil de APK.                      |

Para este MVP personal se guarda un documento versionado en una fila SQLite:
facilita una restauración atómica, a cambio de reescribir el documento en cada
cambio. Si crece hacia grandes historiales o sincronización, convendrá migrar a
tablas normalizadas. No es una app web ni una distribución para iPhone.
