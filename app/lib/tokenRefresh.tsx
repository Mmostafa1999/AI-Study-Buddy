'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

/**
 * TokenRefreshProvider component that ensures Firebase authentication tokens
 * are regularly refreshed to prevent expiration issues.
 */
export function TokenRefreshProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Implement token refresh mechanism globally
    useEffect(() => {
        if (!user) return;

        // Immediately refresh the token when user authenticates
        const refreshToken = async () => {
            try {
                const token = await user.getIdToken(true);
                localStorage.setItem('authToken', token);
                console.log("Global auth token refreshed");
            } catch (error) {
                console.error("Global token refresh error:", error);
            }
        };

        // Initial refresh
        refreshToken();

        // Set up interval to refresh token every 30 minutes
        // Firebase tokens typically expire after 1 hour
        const intervalId = setInterval(refreshToken, 30 * 60 * 1000);

        // Clear interval on unmount
        return () => clearInterval(intervalId);
    }, [user]);

    return <>{children}</>;
} 