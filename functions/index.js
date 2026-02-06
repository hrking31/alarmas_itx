const { onValueUpdated } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

// FUNCIONES AUXILIARES
function getFechaLocal(diasAjuste = 0) {
  const fecha = new Date();
  // Ajuste para la zona horaria de Colombia/Bogotá (UTC-5)
  fecha.setHours(fecha.getHours() - 5);
  fecha.setDate(fecha.getDate() + diasAjuste);

  return fecha.toISOString().split("T")[0]; // Retorna "2026-02-06"
}

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
  "/monitoreo_energia/{tipoEnergia}",
  async (event) => {
    const tipo = event.params.tipoEnergia; // Puede ser "Ac" o "Planta"
    if (tipo !== "Ac" && tipo !== "Planta") return;

    const db = admin.database();
    const estadoActual = event.data.after.val();
    const estadoPrevio = event.data.before.val();

    if (estadoActual === estadoPrevio) return null; //no hubo cambios

    const [configSnap, alertasSnap] = await Promise.all([
      db.ref("/configuracion/telegram").get(),
      db.ref(`/alertas/${tipo}Estado`).get(),
    ]);

    const { botToken, receptores } = configSnap.val() || {};
    const estadoGuardado = alertasSnap.val();

    // Si no hay Telegram configurado y si el estado actual es igual al de alertas, salimos
    if (!botToken || !receptores || estadoActual === estadoGuardado)
      return null;

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

    try {
      await Promise.all([
        enviarTelegram(botToken, receptores, mensaje),
        db.ref(`/alertas/${tipo}Estado`).set(estadoActual),
      ]);
    } catch (error) {
      console.error("Error en proceso final:", error);
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
    const MARGEN_TIEMPO = 360000; // 90s

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
              )}*\n⚠️ El sensor no reporta hace más de 2 min.`,
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
    region: "us-central1",
  },
  async () => {
    const db = admin.database();
    const fechaABorrar = getFechaLocal(-30); // Calcula exactamente hace 30 días
    const salas = ["Sala_1", "Sala_2", "Sala_3", "Sala_4"];
    let salasLimpiadas = 0;

    try {
      for (const sala of salas) {
        const refDiaViejo = db.ref(`grafica/${sala}/${fechaABorrar}`);
        const snap = await refDiaViejo.get();

        if (snap.exists()) {
          await refDiaViejo.remove();
          salasLimpiadas++;
        }
      }

      if (salasLimpiadas > 0) {
        const snapConfig = await db.ref("configuracion/telegram").get();
        const config = snapConfig.val();

        if (config?.botToken && config?.chatId) {
          await enviarTelegram(
            config.botToken,
            config.chatId,
            `🧹 *Limpieza de Historial*\nSe eliminó el día: *${fechaABorrar}*\nSalas procesadas: *${salasLimpiadas}*`,
          );
        }
      }
    } catch (error) {
    }
  },
);
