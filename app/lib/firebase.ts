import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { AppError } from "./errorUtils";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check if Firebase app has already been initialized
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// For server-side token verification
// This is a simplified auth class for server components
class ServerAuth {
  currentUser: any = null;

  // Using a JWT verification approach (recommended to use Firebase Admin SDK in production)
  async verifyIdToken(token: string) {
    try {
      if (!token) {
        throw new AppError("No token provided", 401, "MISSING_TOKEN");
      }

      // In a production environment, this should be handled by the Firebase Admin SDK
      // which would verify the token properly without exposing API keys
      // This is a simplified approach for demo purposes
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      
      if (!apiKey) {
        console.error("Missing Firebase API key in environment variables");
        throw new AppError("Configuration error", 500, "CONFIG_ERROR");
      }

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idToken: token,
          }),
        },
      );

      if (!response.ok) {
        console.error(`Token verification failed with status ${response.status}`);
        throw new AppError("Invalid token", 401, "INVALID_TOKEN");
      }

      const data = await response.json();
      const users = data.users;

      if (!users || users.length === 0) {
        console.error("No user found for the provided token");
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }

      const user = users[0];
      this.currentUser = {
        uid: user.localId,
        email: user.email,
        getIdToken: async () => token,
        getIdTokenResult: async () => ({ token }),
      };

      return {
        uid: user.localId,
        email: user.email,
      };
    } catch (error) {
      console.error("Error verifying token:", error);
      throw error instanceof AppError
        ? error
        : new AppError("Authentication failed", 401, "AUTH_FAILED");
    }
  }
}

// Create an instance of the ServerAuth class for use in API routes
const serverAuth = new ServerAuth();

export { app, auth, db, serverAuth };

// SECURITY NOTE: For production, implement proper token verification
// using Firebase Admin SDK in a server environment (e.g., a secure API route)
// This class is for demonstration purposes only
