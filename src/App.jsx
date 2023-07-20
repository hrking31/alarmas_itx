import { useEffect, useState } from "react";
import { app } from "./Firebase/Firebase.config";
import { getDatabase, ref, onValue, onDisconnect } from "firebase/database";
import generadorActivo from "./assets/generadorActivo.svg";
import generadorInactivo from "./assets/generadorInactivo.svg";
import redActiva from "./assets/redActiva.svg";
import redInactiva from "./assets/redInactiva.svg";
import Logo from "./assets/Logo.png";
import { FaWifi } from "react-icons/fa";
import style from "./App.module.css";

export default function App() {
  const [data, setData] = useState({});

  useEffect(() => {
    const database = getDatabase(app);
    const dataRef = ref(database);

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
  }, []);

  const generadorColor =
    data.PLANTA === 0 ? generadorInactivo : generadorActivo;

  const planta = data.PLANTA === 0 ? "APAGADA" : "ENCENDIDA";

  const acColor = data.AC === 0 ? redActiva : redInactiva;

  const ac = data.PLANTA === 0 ? "NORMAL" : "CORTE";

  const wifiColor = data.ESTADO === 0 ? "rgb(244, 66, 66)" : "rgb(66, 244, 97)";

  return (
    <div className={style.container}>
      <div className={style.titulo}>
        <div className={style.titleLeft}>
          <div className={style.titulo1}>
            <h2>PLANTA ENERGIA RCA SBL</h2>
            <FaWifi color={wifiColor} size={48} />
          </div>
        </div>
        <div className={style.titleRight}>
          <h1>ALARMAS ITX</h1>
          <img
            src={Logo}
            alt="internexa"
            style={{ width: "150px", height: "100px" }}
          />
        </div>
      </div>

      <div className={style.AcPlanta}>
        <div className={style.ac}>
          <img
            src={acColor}
            alt="AC"
            style={{ width: "200px", height: "200px" }}
          />
        </div>
        <div>
          <h2>AC {ac}</h2>
        </div>
        <div className={style.planta}>
          <img
            src={generadorColor}
            alt="Planta eléctrica"
            style={{ width: "200px", height: "200px" }}
          />
        </div>
        <div>
          <h2>PLANTA {planta}</h2>
        </div>
      </div>
      <div className={style.titulo1}>
        <h2>TEMPERATURA NODO NOGALES</h2>
      </div>
      <div className={style.salas}>
        {Object.entries(data).map(([key, value]) => {
          if (key.startsWith("SALA_") && value && value.ESTADO !== undefined) {
            return (
              <div key={key}>
                <div className={style.sala}>
                  <h2>{key}</h2>
                  <FaWifi
                    color={
                      value.ESTADO === 0
                        ? "rgb(244, 66, 66)"
                        : "rgb(66, 244, 97)"
                    }
                    size={20}
                  />
                </div>
                <div>
                  {value.Temperatura !== undefined && (
                    <div>
                      <p>Temperatura: {value.Temperatura}</p>
                    </div>
                  )}
                </div>
                <div>
                  {value.Humedad !== undefined && (
                    <div>
                      <p>Humedad: {value.Humedad}</p>
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
  );
}
