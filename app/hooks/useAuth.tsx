"use client";

import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential, sendPasswordResetEmail } from "firebase/auth";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "../lib/firebase";

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<UserCredential>;
    signUp: (email: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
    user: null,
    loading: true,
    error: null,
    signIn: async () => { throw new Error("Auth context not initialized"); },
    signUp: async () => { throw new Error("Auth context not initialized"); },
    logout: async () => { throw new Error("Auth context not initialized"); },
    resetPassword: async () => { throw new Error("Auth context not initialized"); },
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
                setUser(authUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Cleanup subscription
        return unsubscribe;
    }, []);

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        setError(null);
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            throw error;
        }
    };

    // Sign up with email and password
    const signUp = async (email: string, password: string) => {
        setError(null);
        try {
            return await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            throw error;
        }
    };

    // Sign out
    const logout = async () => {
        setError(null);
        try {
            await signOut(auth);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            throw error;
        }
    };

    // Reset password
    const resetPassword = async (email: string) => {
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            throw error;
        }
    };

    const authContextValue = {
        user,
        loading,
        error,
        signIn,
        signUp,
        logout,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
} 