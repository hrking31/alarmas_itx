const { onValueUpdated } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

// FUNCION FECHA LOCAL
function getFechaLocal(diasAjuste = 0) {
  const fecha = new Date();
  fecha.setHours(fecha.getHours() - 5);
  fecha.setDate(fecha.getDate() + diasAjuste);

  return fecha.toISOString().split("T")[0]; // Retorna "2026-02-06"
}

// CONSTANTE DE TIEMPO
const DURACION_DECIMA_HORA = 6 * 60 * 1000; // 6 minutos = 0.1h

// FUNCIÓN PARA CONVERTIR TIEMPO
const msAHorometroSBL = (ms) => {
  const totalDecimas = Math.floor(ms / DURACION_DECIMA_HORA);
  return totalDecimas.toString().padStart(6, "0");
};

// FUNCIÓN DE TELEGRAM
const enviarTelegram = async (botToken, receptores, texto) => {
  const fechaHoraTexto = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    hour12: true,
  });
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
      }).catch((e) => console.error(`Error enviando a ${r.id}:`, e)),
    ),
  );
};

// MONITOREO DE TEMPERATURA
exports.notificarTemperatura = onValueUpdated(
  "/sensores/{salaId}/temperatura",
  async (event) => {
    const db = admin.database();
    const salaId = event.params.salaId;
    const salasPermitidas = ["Sala_1", "Sala_2", "Sala_3", "Sala_4"];

    if (!salasPermitidas.includes(salaId)) return;

    // OBTENCIÓN DE DATOS Y FILTRO DE CAMBIO
    const tempActual = event.data.after.val();
    const tempPrevia = event.data.before.val();

    // Si no es una sala, no hay datos o la temperatura no cambió, salimos
    if (tempActual === null || tempActual === tempPrevia) {
      return null;
    }

    // CARGA EN PARALELO (Configuración y Estado de Alerta)
    const [configSnap, umbralSnap, alertasSnap] = await Promise.all([
      db.ref("/configuracion/telegram").get(),
      db.ref("/configuracion/umbral/alto").get(),
      db.ref(`/alertas/${salaId}`).get(),
    ]);

    const configTelegram = configSnap.val() || {};
    const { botToken, receptores } = configTelegram;
    const alto = umbralSnap.val() || {};

    if (!botToken || !receptores || alto === undefined) return null; // Si no hay Telegram, umbral configurado, salimos

    const estadoAnterior = alertasSnap.exists()
      ? alertasSnap.val().estado
      : "baja";
    const nombreSala = salaId.replace("_", " ");

    // LÓGICA TEMPERATURA
    // Entra en Alerta
    if (tempActual > alto && estadoAnterior !== "alta") {
      const mensaje = `⚠️ *ALERTA TEMP. ALTA*\n📍 *${nombreSala}*\n🌡️ *${tempActual.toFixed(
        1,
      )}°C*`;

      await Promise.all([
        enviarTelegram(botToken, receptores, mensaje),
        db.ref(`/alertas/${salaId}`).update({
          estado: "alta",
        }),
      ]);
    }
    // Normalización (Al bajar del umbral)
    else if (tempActual <= alto && estadoAnterior === "alta") {
      const mensaje = `✅ *TEMP. NORMALIZADA*\n📍 *${nombreSala}*\n🌡️ *${tempActual.toFixed(
        1,
      )}°C*`;

      await Promise.all([
        enviarTelegram(botToken, receptores, mensaje),
        db.ref(`/alertas/${salaId}`).update({
          estado: "baja",
        }),
      ]);
    }

    return null;
  },
);

// MONITOREO DE ENERGÍA (AC Y GENERADOR)
exports.notificarEnergia = onValueUpdated(
  "/monitoreo_energia",
  async (event) => {
    const antes = event.data.before.val();
    const despues = event.data.after.val();
    const db = admin.database();

    // FILTRO DE CAMBIOS REALES
    const cambioAc = antes?.Ac !== despues?.Ac;
    const cambioPlanta = antes?.Planta !== despues?.Planta;

    if (!cambioAc && !cambioPlanta) return null;

    // LECTURA DE CONFIG TELEGRAMA
    const snap = await db.ref("/configuracion/telegram").get();
    const { botToken, receptores } = snap.val() || {};
    if (!botToken || !receptores) return null;

    // MENSAJES
    let mensajes = [];
    let necesitaActualizarHorometro = false;

    if (cambioAc) {
      mensajes.push(
        despues.Ac === 0
          ? `✅ *ENERGÍA ELÉCTRICA RESTABLECIDA*\n🔌 Status: *AC ONLINE*`
          : `⚠️ *CORTE DE ENERGÍA ELÉCTRICA*\n🔌 Status: *AC OFFLINE*`,
      );
    }

    if (cambioPlanta) {
      if (despues.Planta === 0) {
        necesitaActualizarHorometro = true;

        const duracion =
          (despues.engineStopTimestamp || 0) -
          (despues.engineStartTimestamp || 0);

        mensajes.push(
          `✅ *PLANTA ELÉCTRICA APAGADA*\n⏱️ Ciclo: *${msAHorometroSBL(
            duracion,
          )}*\n⚙️ Status: *REPOSO*`,
        );
      } else {
        mensajes.push(
          `⚠️ *PLANTA ELÉCTRICA ENCENDIDA*\n⚙️ Status: *GENERADOR ACTIVO*`,
        );
      }
    }

    const mensajeFinalTexto = mensajes.join("\n\n");

    try {
      const tareas = [];

      // ENVIÓ A TELEGRAM
      tareas.push(enviarTelegram(botToken, receptores, mensajeFinalTexto));

      if (necesitaActualizarHorometro) {
        const ref = db.ref("/monitoreo_energia");

        await ref.transaction((current) => {
          if (!current) return current;

          const start = current.engineStartTimestamp || 0;
          const stop = current.engineStopTimestamp || 0;

          // Evitar duplicación
          if (current.lastEngineStopProcessed === stop) {
            return current;
          }

          const diff = stop - start;

          if (diff > 0) {
            current.totalMsAcumulados = (current.totalMsAcumulados || 0) + diff;

            current.lastEngineStopProcessed = stop;
          }

          return current;
        });
      }

      await Promise.all(tareas);
    } catch (error) {
      console.error("❌ Error general:", error);
    }

    return null;
  },
);

// VERIFICACIÓN DE CONEXIÓN (SCHEDULER)
exports.verificarConexionSensores = onSchedule(
  "every 5 minutes",
  async (event) => {
    const db = admin.database();
    const ahora = Date.now();
    const MARGEN_TIEMPO = 120 * 1000; // 2 minutos para mayor tolerancia

    const [heartbeatSnap, configSnap] = await Promise.all([
      db.ref("heartbeat").get(),
      db.ref("configuracion/telegram").get(),
    ]);

    const config = configSnap.val() || {};
    const { botToken, receptores } = config;
    if (!botToken || !receptores) return; // Si no hay Telegram configurado, salimos

    const sensores = heartbeatSnap.val() || {};
    let updates = {};
    let promesasTelegram = []; // Para almacenar las promesas de envío de Telegram

    for (const salaId in sensores) {
      if (salaId.startsWith("Sala_")) {
        const ultimoUpdate = sensores[salaId].timestamp || 0;
        const estaOnlineAhora = ahora - ultimoUpdate < MARGEN_TIEMPO;
        const estadoPrevioOnline = sensores[salaId]?.online !== false;

        if (!estaOnlineAhora && estadoPrevioOnline) {
          // Se desconectó
          promesasTelegram.push(
            enviarTelegram(
              botToken,
              receptores,
              `🔴 *DISPOSITIVO DESCONECTADO*\n📍 *${salaId.replace(
                "_",
                " ",
              )}*\n⚠️ El sensor no ha reportado datos durante aproximadamente 5 minutos.`,
            ),
          );
          updates[`${salaId}/online`] = false;
        } else if (estaOnlineAhora && !estadoPrevioOnline) {
          // Se reconectó
          promesasTelegram.push(
            enviarTelegram(
              botToken,
              receptores,
              `🟢 *DISPOSITIVO RECONECTADO*\n📍 *${salaId.replace(
                "_",
                " ",
              )}*\n✅ El sensor volvió a reportar datos.`,
            ),
          );
          updates[`${salaId}/online`] = true;
        }
      }
    }

    if (Object.keys(updates).length > 0 || promesasTelegram.length > 0) {
      await Promise.all([
        ...promesasTelegram,
        db.ref("heartbeat").update(updates),
      ]);
    }
  },
);

// LIMPIEZA DE GRÁFICA HISTÓRICA
exports.limpiarGraficaHistorica = onSchedule(
  {
    schedule: "0 3 * * *", // 3:00 AM todos los días
    timeZone: "America/Bogota",
    region: "us-central1",
  },
  async () => {
    const db = admin.database();
    const store = admin.firestore();
    const fechaAyer = getFechaLocal(-1); //Día anterior en RTDB
    const fechaABorrar = getFechaLocal(-61); // Calcula exactamente hace 60 días
    const salas = ["Sala_1", "Sala_2", "Sala_3", "Sala_4"];
    let salasLimpiadas = 0;

    try {
      for (const sala of salas) {
        // Si existe la copia en Firestore?
        const docSnap = await store
          .collection("historicos")
          .doc(`${sala}_${fechaAyer}`)
          .get();

        // Existe en Firestore, es seguro borrar de RTDB
        if (docSnap.exists) {
          await db.ref(`grafica/${sala}/${fechaAyer}`).remove();
        }

        // Limpieza de Firestore (61 días)
        const docRefViejo = store
          .collection("historicos")
          .doc(`${sala}_${fechaABorrar}`);
        const docSnapViejo = await docRefViejo.get();

        if (docSnapViejo.exists) {
          await docRefViejo.delete();
          salasLimpiadas++;
        }
      }

      if (salasLimpiadas > 0) {
        const configSnap = await db.ref("configuracion/telegram").get();
        const configTelegram = configSnap.val() || {};
        const { botToken, receptores } = configTelegram;

        if (botToken && receptores) {
          await enviarTelegram(
            botToken,
            receptores,
            `🧹 *Limpieza de Historial*\nSe eliminó el día: *${fechaABorrar}*\nSalas procesadas: *${salasLimpiadas}*`,
          );
        }
      }
    } catch (error) {
      console.error("Error en la función de limpieza:", error);
    }
    return null;
  },
);

// HISTÓRICO DIARIO EN FIRESTORE
exports.respaldarHistorialDiario = onSchedule(
  {
    schedule: "1 0 * * *", // Se ejecuta a las 00:05 AM todos los días
    timeZone: "America/Bogota",
    region: "us-central1",
  },
  async () => {
    const db = admin.database();
    const store = admin.firestore();
    const fechaAyer = getFechaLocal(-1); // Obtener la fecha del dia que termino (ayer)
    const salas = ["Sala_1", "Sala_2", "Sala_3", "Sala_4"];

    for (const salaId of salas) {
      try {
        // Se lee el nodo del día anterior en RTDB
        const snapshot = await db
          .ref(`grafica/${salaId}/${fechaAyer}`)
          .once("value");
        const dataDia = snapshot.val();

        if (dataDia) {
          const arrayAplanado = [];

          // Entrar en cada hora y saca los registros
          Object.values(dataDia).forEach((horaNode) => {
            if (horaNode) {
              Object.values(horaNode).forEach((registro) => {
                arrayAplanado.push({
                  t: registro.t,
                  ts: registro.ts,
                });
              });
            }
          });

          // Ordenar por timestamp
          arrayAplanado.sort((a, b) => a.ts - b.ts);

          // Guarda en Firestore como un solo documento
          await store
            .collection("historicos")
            .doc(`${salaId}_${fechaAyer}`)
            .set({
              sensorId: salaId,
              fecha: fechaAyer,
              lecturas: arrayAplanado, // array listo
              creadoEn: admin.firestore.FieldValue.serverTimestamp(),
            });

          console.log(`Respaldo exitoso: ${salaId} - ${fechaAyer}`);
        }
      } catch (error) {
        console.error(`Error procesando ${salaId}:`, error);
      }
    }
    return null;
  },
);

