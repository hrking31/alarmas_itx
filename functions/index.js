// const { onValueUpdated } = require("firebase-functions/v2/database");
// const admin = require("firebase-admin");

// admin.initializeApp();

// // Alerta de Temperatura y envio telegram
// exports.alertaTemperatura = onValueUpdated(
//   "/sensores/{salaId}/temperatura",
//   async (event) => {
//     // Obtener datos del evento
//     const tempActual = event.data.after.val();
//     const salaId = event.params.salaId;

//     if (typeof tempActual !== "number") {
//       console.log("El valor de temperatura no es un número.");
//       return;
//     }

//     // Consultar estado previo de la alerta en la DB
//     const db = admin.database();
//     try {
//       // SE LEE TODO
//       const configSnapshot = await db.ref("/configuracion").get();

//       if (!configSnapshot.exists()) {
//         console.error(
//           "No se encontró el nodo /configuracion en la base de datos."
//         );
//         return;
//       }
//       const config = configSnapshot.val();

//       const UMBRAL_ALTA = config.umbrales.alto;
//       const UMBRAL_BAJA = config.umbrales.bajo;
//       const { botToken, receptores } = config.telegram;

//       // Lógica de estado
//       const estadoRef = db.ref(`/alertas/${salaId}/estado`);
//       const snapshot = await estadoRef.get();
//       const estadoAnterior = snapshot.exists() ? snapshot.val() : "baja";

//       let nuevoEstado = estadoAnterior;
//       const nombreSala = salaId.replace("Sala_", "Sala ");
//       const fechaHora = new Date().toLocaleString("es-CO", {
//         timeZone: "America/Bogota",
//         hour12: true,
//       });

//       //  Entra en alerta alta
//       if (tempActual > UMBRAL_ALTA && estadoAnterior !== "alta") {
//         const mensaje =
//           `⚠️ *ALERTA TEMPERATURA ALTA*\n\n` +
//           `📍 *${nombreSala}*\n` +
//           `🌡️ Temperatura: *${tempActual.toFixed(1)}°C*\n` +
//           `⏰ ${fechaHora}`;

//         await enviarTelegram(mensaje);
//         nuevoEstado = "alta";
//       }

//       // Regresa a la normalidad
//       else if (tempActual <= UMBRAL_BAJA && estadoAnterior === "alta") {
//         const mensajeResuelto =
//           `✅ *TEMPERATURA RESTABLECIDA*\n\n` +
//           `📍 *${nombreSala}*\n` +
//           `🌡️ Temperatura actual: *${tempActual.toFixed(1)}°C*\n` +
//           `⏰ ${fechaHora}`;

//         await enviarTelegram(mensajeResuelto);
//         nuevoEstado = "baja";
//       }

//       // Enviar telgram y actualizar estado
//       if (nuevoEstado !== estadoAnterior) {
//         // Solo enviar si hay un mensaje generado y datos de Telegram válidos
//         if (mensaje && botToken && receptores.length > 0) {
//           const envios = receptores.map(async (receptor) => {
//             try {
//               const response = await fetch(
//                 `https://api.telegram.org/bot${botToken}/sendMessage`,
//                 {
//                   method: "POST",
//                   headers: { "Content-Type": "application/json" },
//                   body: JSON.stringify({
//                     chat_id: receptor.id,
//                     text: mensaje,
//                     parse_mode: "Markdown",
//                   }),
//                 }
//               );

//               if (!response.ok) {
//                 console.error(`Error de Telegram para ID ${receptor.id}`);
//               }
//             } catch (err) {
//               console.error(`Fallo de red enviando a ${receptor.id}:`, err);
//             }
//           });

//           // Esperamos a que todos los mensajes se disparen
//           await Promise.all(envios);
//           console.log(`Alertas enviadas para ${salaId}.`);
//         }

//         // Actualizar el estado en la base de datos para no repetir el mensaje
//         await estadoRef.set(nuevoEstado);
//         console.log(
//           `Cambio de estado ${salaId}: ${estadoAnterior} -> ${nuevoEstado}`
//         );
//       }
//     } catch (error) {
//       console.error("Error crítico en la función alertaTemperatura:", error);
//     }
//   }
// );

// const { onValueUpdated } = require("firebase-functions/v2/database");
// const { onSchedule } = require("firebase-functions/v2/scheduler");
// const admin = require("firebase-admin");

// admin.initializeApp();

// // Cambiamos el path a "/{todo}" para que Firebase lo acepte como válido
// exports.controlMonitoreoSalas = onValueUpdated("/{todo}", async (event) => {
//   // Obtenemos los datos de la raíz completa
//   // Nota: event.data.after representa el cambio en el nodo específico que disparó el evento
//   // pero para mayor seguridad en la raíz, re-leemos la base de datos completa.

//   const db = admin.database();
//   const rootSnap = await db.ref("/").get();

//   if (!rootSnap.exists()) return;
//   const dataDespues = rootSnap.val();

//   // Necesitamos comparar con el estado anterior guardado en /alertas para evitar spam
//   const alertasRef = db.ref("/alertas");
//   const alertasSnap = await alertasRef.get();
//   const alertasAnteriores = alertasSnap.exists() ? alertasSnap.val() : {};

//   try {
//     // 1. OBTENER CONFIGURACIÓN
//     const config = dataDespues.configuracion || {};
//     const { botToken, receptores } = config.telegram || {};
//     if (!botToken || !receptores) return;

//     const fechaHora = new Date().toLocaleString("es-CO", {
//       timeZone: "America/Bogota",
//       hour12: true,
//     });

//     let mensajesAEnviar = [];
//     let updatesAlertas = {};

//     // --- LÓGICA 1: ENERGÍA ELÉCTRICA (Ac) ---
//     const acActual = dataDespues.Ac;
//     const acEstadoGuardado = alertasAnteriores.globales?.acEstado;

//     if (acActual !== undefined && acActual !== acEstadoGuardado) {
//       mensajesAEnviar.push(
//         acActual === 0
//           ? `✅ *ENERGÍA ELÉCTRICA RESTABLECIDA*\n🔌 Status: *AC ONLINE*`
//           : `⚠️ *CORTE DE ENERGÍA ELÉCTRICA*\n🔌 Status: *AC OFFLINE*`
//       );
//       updatesAlertas["globales/acEstado"] = acActual;
//     }

//     // --- LÓGICA 2: PLANTA ELÉCTRICA ---
//     const plantaActual = dataDespues.Planta;
//     const plantaEstadoGuardado = alertasAnteriores.globales?.plantaEstado;

//     if (plantaActual !== undefined && plantaActual !== plantaEstadoGuardado) {
//       mensajesAEnviar.push(
//         plantaActual === 0
//           ? `✅ *PLANTA ELÉCTRICA APAGADA*\n⚙️ Status: *GENERADOR EN REPOSO*`
//           : `⚠️ *PLANTA ELÉCTRICA ENCENDIDA*\n⚙️ Status: *GENERADOR ACTIVO*`
//       );
//       updatesAlertas["globales/plantaEstado"] = plantaActual;
//     }

//     // --- LÓGICA 3: TEMPERATURAS ---
//     const sensores = dataDespues.sensores || {};
//     const UMBRAL_ALTA = config.umbrales.alto;
//     const UMBRAL_BAJA = config.umbrales.bajo;

//     for (const salaId in sensores) {
//       if (salaId.startsWith("Sala_")) {
//         const tempActual = sensores[salaId].temperatura;
//         const estadoAnterior = alertasAnteriores[salaId]?.estado || "baja";

//         if (typeof tempActual === "number") {
//           if (tempActual > UMBRAL_ALTA && estadoAnterior !== "alta") {
//             mensajesAEnviar.push(
//               `⚠️ *ALERTA TEMP. ALTA*\n📍 *${salaId.replace(
//                 "_",
//                 " "
//               )}*\n🌡️ *${tempActual.toFixed(1)}°C*`
//             );
//             updatesAlertas[`${salaId}/estado`] = "alta";
//           } else if (tempActual <= UMBRAL_BAJA && estadoAnterior === "alta") {
//             mensajesAEnviar.push(
//               `✅ *TEMP. NORMALIZADA*\n📍 *${salaId.replace(
//                 "_",
//                 " "
//               )}*\n🌡️ *${tempActual.toFixed(1)}°C*`
//             );
//             updatesAlertas[`${salaId}/estado`] = "baja";
//           }
//         }
//       }
//     }

//     // --- ENVÍO Y ACTUALIZACIÓN ---
//     if (mensajesAEnviar.length > 0) {
//       for (let texto of mensajesAEnviar) {
//         const mensajeFinal = `${texto}\n⏰ ${fechaHora}`;
//         await Promise.all(
//           receptores.map((r) =>
//             fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 chat_id: r.id,
//                 text: mensajeFinal,
//                 parse_mode: "Markdown",
//               }),
//             }).catch((e) => console.error("Error Telegram:", e))
//           )
//         );
//       }
//       // Guardamos los nuevos estados para que no se repita el mensaje en el siguiente cambio
//       await alertasRef.update(updatesAlertas);
//     }
//   } catch (error) {
//     console.error("Error global:", error);
//   }
// });

// exports.verificarConexionSensores = onSchedule(
//   "every 5 minutes",
//   async (event) => {
//     const db = admin.database();
//     const ahora = Date.now();
//     const MARGEN_TIEMPO = 120000; // 120 segundos (2 min) para ser un poco más flexibles que los 90s

//     try {
//       // 1. Obtener datos y configuración
//       const rootSnap = await db.ref("/").get();
//       if (!rootSnap.exists()) return;
//       const data = rootSnap.val();

//       const sensores = data.sensores || {};
//       const alertas = data.alertas || {};
//       const { botToken, receptores } = data.configuracion?.telegram || {};

//       if (!botToken || !receptores) return;

//       let updatesAlertas = {};
//       let mensajesAEnviar = [];

//       // 2. Revisar cada sala
//       for (const salaId in sensores) {
//         if (salaId.startsWith("Sala_")) {
//           const ultimoUpdate = sensores[salaId].timestamp || 0;
//           // Usamos tu misma lógica de la App
//           const estaOnlineAhora = ahora - ultimoUpdate < MARGEN_TIEMPO;
//           const estadoPrevioOnline = alertas[salaId]?.online !== false; // por defecto true

//           // SI SE DESCONECTÓ: Estaba online y ahora no
//           if (!estaOnlineAhora && estadoPrevioOnline) {
//             mensajesAEnviar.push(
//               `🔴 *DISPOSITIVO DESCONECTADO*\n📍 *${salaId.replace(
//                 "_",
//                 " "
//               )}*\n⚠️ El sensor no ha reportado en más de 2 minutos.`
//             );
//             updatesAlertas[`${salaId}/online`] = false;
//           }
//           // SI SE RECONECTÓ: Estaba offline y ahora reportó
//           else if (estaOnlineAhora && !estadoPrevioOnline) {
//             mensajesAEnviar.push(
//               `🟢 *DISPOSITIVO RECONECTADO*\n📍 *${salaId.replace(
//                 "_",
//                 " "
//               )}*\n✅ El sensor volvió a reportar datos.`
//             );
//             updatesAlertas[`${salaId}/online`] = true;
//           }
//         }
//       }

//       // 3. Enviar notificaciones si hay cambios
//       if (mensajesAEnviar.length > 0) {
//         const fechaHora = new Date().toLocaleString("es-CO", {
//           timeZone: "America/Bogota",
//           hour12: true,
//         });

//         for (let texto of mensajesAEnviar) {
//           await Promise.all(
//             receptores.map((r) =>
//               fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                   chat_id: r.id,
//                   text: `${texto}\n⏰ ${fechaHora}`,
//                   parse_mode: "Markdown",
//                 }),
//               })
//             )
//           );
//         }
//         // Actualizar los estados de online/offline en /alertas/
//         await db.ref("/alertas").update(updatesAlertas);
//       }
//     } catch (error) {
//       console.error("Error en verificador de conexión:", error);
//     }
//   }
// );

const { onValueUpdated } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

// FUNCIÓN DE TIEMPO
function obtenerFechaHoraCO() {
  const now = new Date();

  const fecha = now.toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });

  const horaMinuto = now
    .toLocaleTimeString("sv-SE", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "-");

  const fechaHoraTexto = now.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    hour12: true,
  });

  return { fecha, horaMinuto, fechaHoraTexto };
}

// FUNCIÓN DE TELEGRAM
const enviarTelegram = async (botToken, receptores, texto) => {
  const { fechaHoraTexto } = obtenerFechaHoraCO();
  const mensajeFinal = `${texto}\n⏰ ${fechaHoraTexto}`;

  return Promise.all(
    receptores.map((r) =>
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: r.id,
          text: mensajeFinal,
          parse_mode: "Markdown",
        }),
      }).catch((e) => console.error(`Error enviando a ${r.id}:`, e))
    )
  );
};

// MONITOREO DE TEMPERATURA
exports.notificarTemperatura = onValueUpdated(
  "/sensores/{salaId}/temperatura",
  async (event) => {
    const db = admin.database();
    const salaId = event.params.salaId;

    if (!salaId.startsWith("Sala_") || !dataNueva) return;

    const configSnap = await db.ref("/configuracion").get();
    const config = configSnap.val();
    const { botToken, receptores } = config?.telegram || {};
    const { alto, bajo } = config?.umbrales || {};

    if (!botToken || !receptores) return;

    const alertasRef = db.ref(`/alertas/${salaId}`);
    const alertasSnap = await alertasRef.get();
    const estadoAnterior = alertasSnap.exists()
      ? alertasSnap.val().estado
      : "baja";

    const tempActual = event.data.after.val();
    if (typeof tempActual !== "number") return;

    if (tempActual > alto && estadoAnterior !== "alta") {
      await enviarTelegram(
        botToken,
        receptores,
        `⚠️ *ALERTA TEMP. ALTA*\n📍 *${salaId.replace(
          "_",
          " "
        )}*\n🌡️ *${tempActual.toFixed(1)}°C*`
      );
      await alertasRef.update({ estado: "alta" });
    } else if (tempActual <= bajo && estadoAnterior === "alta") {
      await enviarTelegram(
        botToken,
        receptores,
        `✅ *TEMP. NORMALIZADA*\n📍 *${salaId.replace(
          "_",
          " "
        )}*\n🌡️ *${tempActual.toFixed(1)}°C*`
      );
      await alertasRef.update({ estado: "baja" });
    }
  }
);

// MONITOREO DE ENERGÍA (AC Y GENERADOR)
exports.notificarEnergia = onValueUpdated("/{tipoEnergia}", async (event) => {
  const tipo = event.params.tipoEnergia; // Puede ser "Ac" o "Planta"
  if (tipo !== "Ac" && tipo !== "Planta") return;

  const db = admin.database();
  const estadoActual = event.data.after.val();

  const configSnap = await db.ref("/configuracion/telegram").get();
  const { botToken, receptores } = configSnap.val() || {};
  if (!botToken || !receptores) return;

  const alertasRef = db.ref(`/alertas/${tipo}Estado`);
  const alertasSnap = await alertasRef.get();
  const estadoGuardado = alertasSnap.val();

  if (estadoActual === estadoGuardado) return;

  let mensaje = "";
  if (tipo === "Ac") {
    mensaje =
      estadoActual === 0
        ? `✅ *ENERGÍA ELÉCTRICA RESTABLECIDA*\n🔌 Status: *AC ONLINE*`
        : `⚠️ *CORTE DE ENERGÍA ELÉCTRICA*\n🔌 Status: *AC OFFLINE*`;
  } else {
    mensaje =
      estadoActual === 0
        ? `✅ *PLANTA ELÉCTRICA APAGADA*\n⚙️ Status: *GENERADOR EN REPOSO*`
        : `⚠️ *PLANTA ELÉCTRICA ENCENDIDA*\n⚙️ Status: *GENERADOR ACTIVO*`;
  }

  await enviarTelegram(botToken, receptores, mensaje);
  await alertasRef.set(estadoActual);
});

// VERIFICACIÓN DE CONEXIÓN (SCHEDULER)
exports.verificarConexionSensores = onSchedule(
  "every 1 minutes",
  async (event) => {
    const db = admin.database();
    const ahora = Date.now();
    const MARGEN_TIEMPO = 90000; // 90s

    const [sensoresSnap, alertasSnap, configSnap] = await Promise.all([
      db.ref("heartbeat").get(),
      db.ref("alertas").get(),
      db.ref("configuracion/telegram").get(),
    ]);

    const config = configSnap.val() || {};
    const { botToken, receptores } = config;

    // Si no hay Telegram configurado, salimos
    if (!botToken || !receptores) return;

    const sensores = sensoresSnap.val() || {};
    const alertas = alertasSnap.val() || {};
    let updatesAlertas = {};

    for (const salaId in sensores) {
      if (salaId.startsWith("Sala_")) {
        const ultimoUpdate = sensores[salaId].timestamp || 0;
        const estaOnlineAhora = ahora - ultimoUpdate < MARGEN_TIEMPO;
        const estadoPrevioOnline = alertas[salaId]?.online !== false;

        if (!estaOnlineAhora && estadoPrevioOnline) {
          await enviarTelegram(
            botToken,
            receptores,
            `🔴 *DISPOSITIVO DESCONECTADO*\n📍 *${salaId.replace(
              "_",
              " "
            )}*\n⚠️ El sensor no reporta hace más de 2 min.`
          );
          updatesAlertas[`${salaId}/online`] = false;
        } else if (estaOnlineAhora && !estadoPrevioOnline) {
          await enviarTelegram(
            botToken,
            receptores,
            `🟢 *DISPOSITIVO RECONECTADO*\n📍 *${salaId.replace(
              "_",
              " "
            )}*\n✅ El sensor volvió a reportar datos.`
          );
          updatesAlertas[`${salaId}/online`] = true;
        }
      }
    }

    if (Object.keys(updatesAlertas).length > 0) {
      await db.ref("/alertas").update(updatesAlertas);
    }
  }
);
