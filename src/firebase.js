import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBH9IUVDLZ46W0XlscO3fm-aobYn8uHd7Q",
  authDomain: "daily-planner-pro-94d58.firebaseapp.com",
  projectId: "daily-planner-pro-94d58",
  storageBucket: "daily-planner-pro-94d58.appspot.com",  // fixed here
  messagingSenderId: "1081105558489",
  appId: "1:1081105558489:web:9fd28b864f2d46cfdf07c8",
  measurementId: "G-DJPNFV45VR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
