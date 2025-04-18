import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

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

// For server-side routes that need auth verification
// This creates a "fake" auth object that works with our route handlers
// since the client-side auth methods won't work on the server
class ServerAuth {
  currentUser: any = null;

  // This method mimics the client-side auth token verification
  // but works from server components
  async verifyIdToken(token: string) {
    try {
      // Make a request to Firebase Auth REST API to verify the token
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: token }),
        },
      );

      if (!response.ok) {
        throw new Error("Invalid token");
      }

      const data = await response.json();
      const users = data.users;

      if (!users || users.length === 0) {
        throw new Error("User not found");
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
      throw error;
    }
  }
}

// Create an instance of the ServerAuth class for use in API routes
const serverAuth = new ServerAuth();

export { app, auth, db, serverAuth };
