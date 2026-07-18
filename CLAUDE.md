# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend (run from repo root):
- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint over the frontend
- `npm run preview` — preview the production build

Cloud Functions (run from `functions/`):
- `npm run lint` — ESLint (Google style config, separate from the root ESLint config)
- `npm run serve` — Firebase emulator for functions only
- `npm run shell` — interactive functions shell
- `npm run deploy` — `firebase deploy --only functions`
- `npm run logs` — tail deployed function logs

There is no automated test suite in either package.

Local dev requires a `.env` with `VITE_FIREBASE_*` keys (API key, auth domain, project id, storage bucket, messaging sender id, app id, database URL) since `src/Firebase/FirebaseConfig.js` reads them via `import.meta.env`.

## Architecture

React 19 SPA (Vite + Tailwind v4) backed entirely by Firebase — Realtime Database (RTDB) for live sensor state, Firestore for compacted daily history, Firebase Auth for the admin login, and Cloud Functions (`functions/index.js`, Node 24) as the only backend logic, deployed to project `alarmas-itx`. The system monitors temperature/humidity/power across 4 rooms fed by ESP32 sensors and notifies via Telegram.

### RTDB shape (the source of truth the whole app reads/writes against)
- `/sensores/{Sala_1..4}/{temperatura,humedad,bateria,estado}` — live sensor readings
- `/heartbeat/{Sala_1..4}/{timestamp,online}` — last-seen liveness per device
- `/monitoreo_energia` — `{Ac, Planta, engineStartTimestamp, engineStopTimestamp, totalMsAcumulados, lastEngineStopProcessed}` for grid/generator state and the hour-meter accumulator
- `/configuracion/telegram` — `{botToken, receptores[]}`
- `/configuracion/umbral/alto` — high-temperature alert threshold
- `/configuracion/horas` — visible hour range for charts
- `/alertas/{salaId}` — last alert state per room, used to avoid duplicate Telegram sends
- `/grafica/{salaId}/{YYYY-MM-DD}/{hora}/{registro}` — today's raw time-series (chart source for the current day)

Firestore mirrors yesterday's `/grafica` node into one compacted doc per room per day: collection `historicos`, doc id `{salaId}_{fecha}`, field `lecturas` (flattened, sorted `{t, ts}` array). Charts read RTDB for the selected date if it's today, Firestore otherwise (`GraficasTiempoReal.jsx`).

### Firmware de los sensores (ESPHome, fuera de este repo)
Los ESP32/ESP8266 que alimentan `/sensores`, `/heartbeat` y `/monitoreo_energia` no viven en este repositorio — sus configuraciones YAML están en `C:\Users\hrkin\Documents\ESPHOME-REY\ESPHOME\AlarmasItx\`:
- `Temperatura1.yaml` — ESP8266 (D1 Mini) con sensor DHT11, por WiFi. Sala 1 (mismo patrón presumiblemente reusado para Sala 2 y 3).
- `AcPlantaSBL.yaml` — ESP8266 (NodeMCU) que lee el estado de la red comercial (AC) y el generador, por WiFi. Escribe en `heartbeat/Sala_sb` y en `/monitoreo_energia` (incluye `engineStartTimestamp`/`engineStopTimestamp`, que se generan en el propio firmware, no en la app ni en las Cloud Functions).
- `ProxyWifiBluetooth.yaml` — ESP32, proxy Bluetooth para Sala 4, por WiFi (no por cable).

**Dato clave para cualquier cambio a los umbrales de "online/offline":** los 4 dispositivos (Sala 1-3, panel eléctrico, y Sala 4) envían su heartbeat a `/heartbeat/{salaId}` cada **60 segundos** (`update_interval`/`interval: 60s` en el YAML), y **todos dependen de WiFi** — ninguno está en cable Ethernet. Las desconexiones por mala señal de WiFi pueden venir de cualquiera de las 4 salas o del panel eléctrico por igual.

### Cloud Functions (`functions/index.js`) — all 5 are the only backend logic, no REST API
- `notificarTemperatura` — RTDB trigger on `/sensores/{salaId}/temperatura`; alerts on crossing `umbral/alto`, tracks state in `/alertas/{salaId}` to only notify on transitions
- `notificarEnergia` — RTDB trigger on `/monitoreo_energia`; alerts on AC/generator transitions and, on generator-off, folds the completed run into `totalMsAcumulados` via a transaction keyed on `lastEngineStopProcessed` (idempotency guard against duplicate writes)
- `verificarConexionSensores` — every 5 min; flags a room offline if its heartbeat is >2 min stale
- `respaldarHistorialDiario` — 00:01 America/Bogota; flattens yesterday's `/grafica` into the Firestore `historicos` doc
- `limpiarGraficaHistorica` — 03:00 America/Bogota; deletes yesterday's RTDB `/grafica` node (only once the Firestore backup exists) and purges `historicos` docs older than 60 days

The hour-meter ("horómetro") is dual-tracked: the Cloud Function accumulates `totalMsAcumulados` only when the generator stops, while the client (`ContadorPlanta.jsx`) extrapolates the live-running value in the UI as `totalMsAcumulados + (Date.now() - engineStartTimestamp)` when the generator is currently on. A manual calibration path exists (`ModalUpdateHorometro` → `handleUpdateMs` in `Dashboard.jsx`) that overwrites `totalMsAcumulados` directly and resets `engineStartTimestamp` to 0.

### Frontend gotchas
- `src/Views/index.js` aliases `ViewDashboard` straight to `Components/Dashboard/Dashboard.jsx` — `src/Views/ViewDashboard/ViewDashboard.jsx` is dead code, not part of the routing.
- `src/pruebas.jsx` is an unused scratch file, not imported anywhere.
- `ProtectedRoute` (`Components/ProtectedRoutes/ProtectedRoutes.jsx`) redirects unauthenticated users to `/` (the public dashboard), not to `/ViewLogin` — there's no dedicated "please log in" route.
- `Sala_4` is the only room wired to a Bluetooth sensor in addition to its ESP32 proxy; connectivity for it requires both `espOnline` (heartbeat) and `estado === "online"` (BT), whereas `Sala_1..3` only need the heartbeat. This asymmetry is hardcoded in `Dashboard.jsx`, not derived from data.
- Cloud Functions use CommonJS (`require`/`exports`) with double-quote/Google-style ESLint rules; the frontend uses ESM with the default `eslint:recommended` + React config. Don't mix conventions across the two packages.

### Conventions
- UI copy, in-code comments, and commit messages are in Spanish; commits follow Conventional Commits (`feat:`, `fix:`, `refactor:`).
- Design language is a dark-mode-first "cyberpunk/neon" aesthetic (`DarkModeContext` persists to `localStorage`, defaults to dark); keep new UI consistent with the existing glassmorphism/neon-border Tailwind patterns rather than introducing a different visual style.
