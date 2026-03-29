import { ref, update, get } from "firebase/database";
import { database } from "../../Firebase/Firebase.js";

const SimuladorPlanta = () => {
  const encenderPlanta = async () => {
    const energiaRef = ref(database, "energia");
    const snap = await get(energiaRef);

    // Si no existe el nodo, lo crea
    if (!snap.exists()) {
      await update(energiaRef, {
        Planta: 1,
        engineStartTimestamp: Date.now(),
        totalMsAcumulados: 0,
      });

      console.log("🟢 Planta ENCENDIDA (nuevo registro)");
      return;
    }

    const data = snap.val();

    // Si ya está encendida (tiene timestamp activo)
    if (data.engineStartTimestamp) {
      console.log("⚠️ Ya está encendida");
      return;
    }
    await update(energiaRef, {
      Planta: 1,
      engineStartTimestamp: Date.now(),
    });

    console.log("🟢 Planta ENCENDIDA");
  };

  const apagarPlanta = async () => {
    console.log("🔥 CLICK APAGAR");
    const energiaRef = ref(database, "energia");
    const snap = await get(energiaRef);

    if (!snap.exists()) {
      console.log("⚠️ No existe registro");
      return;
    }

    const data = snap.val();

    console.log("DATA COMPLETA:", data);
    console.log("engineStartTimestamp:", data.engineStartTimestamp);
    console.log("tipo:", typeof data.engineStartTimestamp);

    // Si no hay timestamp activo, ya está apagada
    if (!data.engineStartTimestamp) {
      console.log("⚠️ Ya está apagada");
      return;
    }

    const tiempoTrabajado = Date.now() - data.engineStartTimestamp;

    await update(energiaRef, {
      Planta: 0,
      engineStartTimestamp: null,
      totalMsAcumulados: (data.totalMsAcumulados || 0) + tiempoTrabajado,
    });

    console.log("🔴 Planta APAGADA y tiempo acumulado");
  };

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={encenderPlanta}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Encender Planta
      </button>

      <button
        onClick={() => {
          console.log("BOTON FUNCIONA");
          apagarPlanta();
        }}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Apagar Planta
      </button>
    </div>
  );
};

export default SimuladorPlanta;
