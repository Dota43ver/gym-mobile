# Gym Mobile

Aplicación Android en desarrollo para organizar rutinas de gimnasio por día de la
semana, con una interfaz sencilla y modo oscuro. El objetivo es guardar varias
rutinas y elegir cuál seguir, sin perder las anteriores.

## Estado actual

La base está creada con **Expo SDK 57, React Native y TypeScript**. Incluye una
pantalla de bienvenida oscura, manejo de áreas seguras y comprobaciones
automatizadas. La pantalla ya se visualizó en un teléfono Android real mediante
Expo Go.

**Todavía no están implementadas la gestión de rutinas ni la persistencia de
datos. No hay un APK disponible ni una configuración de EAS Build.**

## Funcionalidades previstas

- Crear varias rutinas semanales con nombre, organizadas de lunes a domingo y con
  días de descanso.
- Elegir una rutina activa que se repita cada semana; cambiar a otra y volver a
  una anterior sin eliminarla.
- Agregar, editar, eliminar, ordenar y copiar ejercicios entre días. Cada ejercicio
  tendrá **nombre, series, repeticiones, peso opcional y notas**.
- Guardar las rutinas localmente para consultarlas sin conexión, sin cuentas ni
  sincronización entre personas.
- Incorporar registros de entrenamiento por fecha y respaldos exportables e
  importables. Completar un entrenamiento no deberá modificar la rutina semanal.

La entrega prevista es un **APK independiente y compartible** para teléfonos
Android compatibles. Quienes lo instalen no necesitarán Expo Go ni la computadora
de desarrollo. La versión mínima de Android se definirá al preparar esa entrega;
no se distribuye como aplicación para iPhone.

## Probar la base en Android

### Requisitos

- [mise](https://mise.jdx.dev/getting-started.html), para usar la versión de
  **Node.js 24.21.0** fijada en `mise.toml` sin cambiar la configuración global.
- Un teléfono Android con [Expo Go compatible con SDK 57](https://expo.dev/go).
  Si la versión de la tienda no es compatible, seleccionar Android y SDK 57 en
  ese enlace oficial.

Desde la carpeta del proyecto:

```sh
mise install
mise exec -- npm ci
mise exec -- npm start
```

Conectar el teléfono y la computadora a la misma red Wi-Fi. Abrir **Scan QR** en
Expo Go y escanear el código que aparece en la terminal. Mantener el servidor de
desarrollo abierto durante la prueba.

Este flujo no requiere instalar el SDK de Android. El comando `npm run android`
está destinado a un entorno con emulador o dispositivo conectado y las
herramientas de desarrollo Android correspondientes.

### Si el teléfono no puede conectarse

Si Expo Go muestra `Failed to download remote update`, puede existir un problema
de conectividad con el servidor; el mensaje por sí solo no identifica la causa.
Cuando la conexión directa está bloqueada, detener el servidor con `Ctrl+C` y
probar un túnel:

```sh
mise exec -- npm start -- --tunnel
```

Si Expo solicita instalar `@expo/ngrok`, aceptar la instalación. Escanear el
**nuevo QR** desde Expo Go. El túnel requiere internet y puede hacer más lentas
las cargas y recargas; no cambia el objetivo de funcionamiento offline de la
aplicación final.

## Comprobaciones de desarrollo

```sh
mise exec -- npm test
mise exec -- npm run typecheck
mise exec -- npm run format:check
mise exec -- npx expo install --check
mise exec -- npx expo-doctor
```

Para aplicar el formato antes de comprobar los cambios:

```sh
mise exec -- npm run format
```

Las pruebas utilizan Jest, el preset de Expo y React Native Testing Library. La
implementación de nuevas funciones sigue el ciclo de escribir primero una prueba
que falle, implementar el comportamiento y refactorizar.

## Archivos principales

| Archivo                  | Función                                             |
| ------------------------ | --------------------------------------------------- |
| `App.tsx`                | Pantalla inicial oscura.                            |
| `__tests__/App.test.tsx` | Prueba del comportamiento de la pantalla inicial.   |
| `app.json`               | Configuración de la aplicación Expo.                |
| `mise.toml`              | Versión de Node.js específica del proyecto.         |
| `package-lock.json`      | Versiones de dependencias para instalar con npm ci. |

**Próximo paso:** implementar las rutinas semanales guardadas, sus ejercicios y
la selección de la rutina activa, incluyendo peso y notas desde la primera
versión funcional.
