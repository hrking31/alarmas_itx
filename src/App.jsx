import { useEffect, useState } from "react";
import { app } from "./Firebase/Firebase.config";
import { getDatabase, ref, onValue, onDisconnect } from "firebase/database";
import generadorActivo from "./assets/generadorActivo.svg";
import generadorInactivo from "./assets/generadorInactivo.svg";
import redActiva from "./assets/redActiva.svg";
import redInactiva from "./assets/redInactiva.svg";
import Logo from "./assets/Logo.png";
import { FaWifi, FaLightbulb, FaRegLightbulb } from "react-icons/fa";
import { IoMdThermometer } from "react-icons/io";
import { WiHumidity } from "react-icons/wi";
import style from "./App.module.css";
import { enviarMensajeTelegram } from "./Telegram/Telegram";

export default function App() {
  const [data, setData] = useState({});
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    return savedDarkMode === "true" ? true : false;
  });

  useEffect(() => {
    const database = getDatabase(app);
    const dataRef = ref(database);

    localStorage.setItem("darkMode", darkMode);

    const handleDataChange = (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    };

    const unsubscribe = onValue(dataRef, handleDataChange);
    const disconnectRef = onDisconnect(dataRef);
    disconnectRef.cancel();

    return () => {
      unsubscribe();
    };
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  document.body.className = darkMode ? style.dark : style.light;

  const generadorColor =
    data.PLANTA === 0 ? generadorInactivo : generadorActivo;

  const planta = data.PLANTA === 0 ? "APAGADA" : "ENCENDIDA";

  const acColor = data.AC === 0 ? redActiva : redInactiva;

  const ac = data.PLANTA === 0 ? "NORMAL" : "CORTE";

  const wifiColor =
    data.ESTADO === 1 ? "rgb(66, 244, 97)" : darkMode ? "#282c34" : "white";

  //------NOTIFICACIONES A TELEGRAM______//

  const numerosTelegramDestino = ["799003199"]; // ["799003199", "745821120"];
  const mensajes = [];

  // if (sala1 === 1) {
  //   mensajes.push("¡alta temperatura en sala 1.");
  // }
  // if (sala2 === 1) {
  //   mensajes.push("¡alta temperatura en sala 2.");
  // }
  // if (sala3 === 1) {
  //   mensajes.push("¡alta temperatura en sala 3.");
  // }
  // if (sala4 === 1) {
  //   mensajes.push("¡alta temperatura en sala 4.");
  // }

  const [plantaAnterior, setPlantaAnterior] = useState(data.PLANTA);
  const [acAnterior, setAcAnterior] = useState(data.AC);

  useEffect(() => {
    if (data.PLANTA !== plantaAnterior) {
      mensajes.length = 0;

      data.PLANTA === 1
        ? mensajes.push("¡Planta On.")
        : mensajes.push("¡Planta Off.");

      data.AC === 1
        ? mensajes.push("¡Corte Ac.")
        : mensajes.push("¡Se restablece Ac.");

      if (mensajes.length > 0) {
        const promesasEnvio = numerosTelegramDestino.map((numeroTelegram) => {
          return Promise.all(
            mensajes.map((mensaje) =>
              enviarMensajeTelegram(numeroTelegram, mensaje)
            )
          );
        });

        Promise.all(promesasEnvio)
          .then(() => {
            console.log("Mensajes enviados exitosamente.");
          })
          .catch((error) => {
            console.error("Error al enviar los mensajes:", error);
          });
      }

      setPlantaAnterior(data.PLANTA);
      setPlantaAnterior(data.AC);
    }
  }, [data.PLANTA, data.AC, plantaAnterior, acAnterior, mensajes]);

  return (
    <div className={darkMode ? style.dark : style.light}>
      <div className={style.container}>
        <div className={style.logoTitulo}>
          <div className={style.iconosLightDark}>
            <span onClick={toggleDarkMode}>
              {darkMode ? (
                <FaRegLightbulb className={style.iconosLightbulb} />
              ) : (
                <FaLightbulb className={style.iconosLightbulbDark} />
              )}
            </span>
          </div>
          <h1>ALARMAS ITX</h1>
          <img src={Logo} alt="internexa" className={style.iconoInternexa} />
        </div>

        <div className={style.titulo}>
          <h2>PLANTA ENERGIA RCA SBL</h2>
          <FaWifi color={wifiColor} className={style.iconoWifi1} />
        </div>

        <div className={style.AcPlanta}>
          <img src={acColor} alt="AC" className={style.iconosPlantaAc} />
          <div>
            <p>AC {ac}</p>
          </div>
          <img
            src={generadorColor}
            alt="Planta eléctrica"
            className={style.iconosPlantaAc}
          />
          <div>
            <p>PLANTA {planta}</p>
          </div>
        </div>
        <div className={style.titulo}>
          <h2>TEMPERATURA NODO NOGALES</h2>
        </div>
        <div className={style.salas}>
          {Object.entries(data).map(([key, value]) => {
            if (
              key.startsWith("SALA_") &&
              value &&
              value.ESTADO !== undefined
            ) {
              return (
                <div key={key}>
                  <div className={style.sala}>
                    <h2
                      style={{
                        color:
                          value.Temperatura >= 30
                            ? "red"
                            : value.Temperatura < 25
                            ? "#4b6cb7"
                            : "#FFA500",
                      }}
                    >
                      {key}
                    </h2>
                    <FaWifi
                      color={
                        value.ESTADO === 1
                          ? "rgb(66, 244, 97)"
                          : darkMode
                          ? "#282c34"
                          : "white"
                      }
                      className={style.iconoWifi}
                    />
                  </div>
                  <div>
                    {value.Temperatura !== undefined && (
                      <div className={style.temp}>
                        <IoMdThermometer
                          color={
                            value.Temperatura >= 30
                              ? "red"
                              : value.Temperatura < 25
                              ? "rgb(66, 244, 97)"
                              : "#FFA500"
                          }
                          className={style.iconos}
                        />
                        <p>Temperatura: {value.Temperatura.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    {value.Humedad !== undefined && (
                      <div className={style.humedad}>
                        <WiHumidity color="blue" className={style.iconos} />
                        <p>Humedad: {value.Humedad.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
