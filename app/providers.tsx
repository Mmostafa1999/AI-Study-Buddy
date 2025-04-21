'use client'

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { QuizProvider } from './contexts/QuizContext'
import { StudyPlanProvider } from './contexts/StudyPlanContext'
import { AuthProvider } from './hooks/useAuth'

type ThemeType = 'light' | 'dark' | 'system'

interface ThemeContextType {
    theme: ThemeType
    setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => null,
})

export const useTheme = () => useContext(ThemeContext)

export function Providers({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeType>('system')
    const [mounted, setMounted] = useState(false)

    // Handle theme
    useEffect(() => {
        setMounted(true)
        const storedTheme = localStorage.getItem('theme') as ThemeType | null
        if (storedTheme) {
            setTheme(storedTheme)
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark')
        }
    }, [])

    useEffect(() => {
        if (!mounted) return

        localStorage.setItem('theme', theme)

        const root = window.document.documentElement
        root.classList.remove('light', 'dark')

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }
    }, [theme, mounted])

    return (
        <AuthProvider>
            <ThemeContext.Provider value={{ theme, setTheme }}>
                <StudyPlanProvider>
                    <QuizProvider>
                        {children}
                    </QuizProvider>
                </StudyPlanProvider>
            </ThemeContext.Provider>
        </AuthProvider>
    )
} 