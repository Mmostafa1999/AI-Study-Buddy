'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

/**
 * Component to refresh auth token on page load
 * Can be added to any page where a fresh token is critical
 */
export default function AuthTokenRefresher() {
    const { user } = useAuth();

    useEffect(() => {
        // Only attempt token refresh if user is logged in
        if (!user) return;

        // Refresh token immediately
        const refreshToken = async () => {
            try {
                const token = await user.getIdToken(true);
                localStorage.setItem('authToken', token);
            } catch (error) {
                console.error("Page-level token refresh failed:", error);
            }
        };

        refreshToken();
    }, [user]);

    // This component renders nothing - it only has side effects
    return null;
} 