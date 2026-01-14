import firebaseConfig from "./FirebaseConfig";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);



