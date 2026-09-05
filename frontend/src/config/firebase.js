import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore} from "firebase/firestore";
const firebaseConfig = {
    apiKey: "AIzaSyA2EuKVyE2OEYwF0h_nWVjooh12OvHgEs4",
    authDomain: "moneymind-ai-96dd9.firebaseapp.com",
    projectId: "moneymind-ai-96dd9",
    storageBucket: "moneymind-ai-96dd9.firebasestorage.app",
    messagingSenderId: "255312101511",
    appId: "1:255312101511:web:764fcb1b39ed529ebff822",
    measurementId: "G-DNSHW258J1"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Explicitly connect to the Enterprise Firestore database
export const db = initializeFirestore(app, {}, "default");
export default app;