const { onValueUpdated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

// Configuración de Umbrales
const UMBRAL_ALTA = 34;
const UMBRAL_BAJA = 31;

// Configuración de Telegram
const BOT_TOKEN = "6677849878:AAGbp43HcN7SzT8hqWSijmdu2a6yMsClScw";
const CHAT_IDS = ["799003199"];

/* Función auxiliar para enviar mensajes a Telegram*/
const enviarTelegram = async (mensaje) => {
  for (const chatId of CHAT_IDS) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: mensaje,
            parse_mode: "Markdown",
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Mensaje enviado a ${chatId}`);
      } else {
        const errorData = await response.json();
        console.error(`Error de Telegram API (${chatId}):`, errorData);
      }
    } catch (error) {
      console.error(`Error de red al contactar a Telegram (${chatId}):`, error);
    }
  }
};

/* Alerta de Temperatura */
exports.alertaTemperatura = onValueUpdated(
  "/sensores/{salaId}/temperatura",
  async (event) => {
    // Obtener datos del evento (Sintaxis v2)
    const tempActual = event.data.after.val();
    const salaId = event.params.salaId;

    if (typeof tempActual !== "number") {
      console.log("El valor de temperatura no es un número.");
      return;
    }

    console.log(`Lectura: ${salaId} -> ${tempActual.toFixed(2)}°C`);

    // Consultar estado previo de la alerta en la DB
    const db = admin.database();
    const estadoRef = db.ref(`/alertas/${salaId}/estado`);
    const snapshot = await estadoRef.get();
    const estadoAnterior = snapshot.exists() ? snapshot.val() : "baja";

    let nuevoEstado = estadoAnterior;
    const nombreSala = salaId.replace("Sala_", "Sala ");
    const fechaHora = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      hour12: true,
    });

    // Lógica de Alerta

    //  Entra en alerta alta
    if (tempActual > UMBRAL_ALTA && estadoAnterior !== "alta") {
      const mensaje =
        `⚠️ *ALERTA TEMPERATURA ALTA*\n\n` +
        `📍 *${nombreSala}*\n` +
        `🌡️ Temperatura: *${tempActual.toFixed(1)}°C*\n` +
        `⏰ ${fechaHora}`;

      await enviarTelegram(mensaje);
      nuevoEstado = "alta";
    }

    // Regresa a la normalidad
    else if (tempActual <= UMBRAL_BAJA && estadoAnterior === "alta") {
      const mensajeResuelto =
        `✅ *TEMPERATURA RESTABLECIDA*\n\n` +
        `📍 *${nombreSala}*\n` +
        `🌡️ Temperatura actual: *${tempActual.toFixed(1)}°C*\n` +
        `⏰ ${fechaHora}`;

      await enviarTelegram(mensajeResuelto);
      nuevoEstado = "baja";
    }

    // Actualizar la base de datos solo si el estado cambió
    if (nuevoEstado !== estadoAnterior) {
      await estadoRef.set(nuevoEstado);
      console.log(
        `Cambio de estado para ${salaId}: ${estadoAnterior} -> ${nuevoEstado}`
      );
    }
  }
);
