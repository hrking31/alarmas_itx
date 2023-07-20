import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCqnl8fCSDKd0h94_i3pZCTFWUtcZOkKXY",
  authDomain: "alarmaremota-sbl01.firebaseapp.com",
  databaseURL: "https://alarmaremota-sbl01.firebaseio.com",
  projectId: "alarmaremota-sbl01",
  storageBucket: "alarmaremota-sbl01.appspot.com",
  messagingSenderId: "189320443485",
  appId: "1:189320443485:web:fb2d8b625e49c5ac393fb4",
  measurementId: "G-828CWW2VX4",
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
