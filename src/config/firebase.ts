import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Safely get environment variables
const firebaseConfig = {
  apiKey: (process.env as any).EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: (process.env as any).EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: (process.env as any).EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: (process.env as any).EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (process.env as any)
    .EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: (process.env as any).EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required environment variables are present
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key, _]) => key);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (missingVars.length > 0) {
  console.warn(
    `⚠️ Missing Firebase environment variables: ${missingVars.join(", ")}`,
  );
  console.info(
    "Using Firebase in offline mode. Create a .env file with your Firebase config to enable online features.",
  );

  // Create fallback objects for offline development
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error);
    // Create fallback objects
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
  }
}

export { auth, db, storage };
export default app;
