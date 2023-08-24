import React from "react";

const TELEGRAM_API_BASE_URL =
  "https://api.telegram.org/bot6677849878:AAFwGKgQB5UVYs7-oGPEDV6jKbqN-_SLXMI";

const enviarMensajeTelegram = async (numeroTelegram, mensaje) => {
  const url = `${TELEGRAM_API_BASE_URL}/sendMessage?chat_id=${encodeURIComponent(
    numeroTelegram
  )}&text=${encodeURIComponent(mensaje)}&parse_mode=HTML`;

  try {
    const response = await fetch(url);

    const data = await response.json();
    console.log("Respuesta de la API de Telegram:", data);

    if (response.ok) {
      console.log("Mensaje enviado exitosamente.");
    } else {
      console.error("Error al enviar el mensaje:", response.statusText);
    }
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
  }
};

// const Telegram = () => {
//   const enviarMensaje = () => {
//     const numerosTelegramDestino = ["799003199"];
//     const mensaje =
//       "¡Hola! Este es un mensaje de prueba enviado desde mi app React.";

//     numerosTelegramDestino.forEach((numeroTelegram) => {
//       enviarMensajeTelegram(numeroTelegram, mensaje);
//     });
//   };

//   return (
//     <div>
//       <button onClick={enviarMensaje}>Enviar Mensaje</button>
//     </div>
//   );
// };

// export default Telegram;
export { enviarMensajeTelegram };
