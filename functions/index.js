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

  const fechaHoraTexto = now.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    hour12: true,
  });

  return { fecha, fechaHoraTexto };
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

    // OBTENCIÓN DE DATOS Y FILTRO DE CAMBIO
    const tempActual = event.data.after.val();
    const tempPrevia = event.data.before.val();

    // Si no es una sala, no hay datos o la temperatura no cambió, salimos
    if (
      !salaId.startsWith("Sala_") ||
      tempActual === null ||
      tempActual === tempPrevia
    ) {
      return null;
    }

    // CARGA EN PARALELO (Configuración y Estado de Alerta)
    const [configSnap, alertasSnap] = await Promise.all([
      db.ref("/configuracion").get(),
      db.ref(`/alertas/${salaId}`).get(),
    ]);

    const config = configSnap.val();
    const { botToken, receptores } = config?.telegram || {};
    const alto = config?.umbrales?.alto;

    if (!botToken || !receptores || alto === undefined) return null;

    const estadoAnterior = alertasSnap.exists()
      ? alertasSnap.val().estado
      : "baja";
    const nombreSala = salaId.replace("_", " ");

    // LÓGICA TEMPERATURA
    // Entra en Alerta
    if (tempActual > alto && estadoAnterior !== "alta") {
      const mensaje = `⚠️ *ALERTA TEMP. ALTA*\n📍 *${nombreSala}*\n🌡️ *${tempActual.toFixed(
        1
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
        1
      )}°C*`;

      await Promise.all([
        enviarTelegram(botToken, receptores, mensaje),
        db.ref(`/alertas/${salaId}`).update({
          estado: "baja",
        }),
      ]);
    }

    return null;
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
          // Envia "null" al nodo grafica
          const { fecha } = obtenerFechaHoraCO();
          await db.ref(`grafica/${salaId}/${fecha}/${ahora}`).set({
            t: " null",
          });

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
