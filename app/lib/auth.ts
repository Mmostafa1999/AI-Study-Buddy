import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

interface AuthError {
  code: string;
  message: string;
}

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { user: userCredential.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return {
      user: null,
      error:
        authError.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : authError.message,
    };
  }
};

export const signUp = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      createdAt: serverTimestamp(),
    });

    return { user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return {
      user: null,
      error:
        authError.code === "auth/email-already-in-use"
          ? "Email already in use"
          : authError.message,
    };
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists, if not create it
    await setDoc(
      doc(db, "users", user.uid),
      {
        name: user.displayName,
        email: user.email,
        lastLogin: serverTimestamp(),
      },
      { merge: true },
    );

    return { user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { user: null, error: authError.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { error: authError.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { error: authError.message };
  }
};
