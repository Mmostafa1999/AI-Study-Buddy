import { Montserrat, Rubik } from 'next/font/google'

import './globals.css'
import { Providers } from './providers'
import Navbar from './components/Navbar'

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    display: 'swap',
    weight: ['300', '400', '500', '600', '700'],
})

const rubik = Rubik({
    subsets: ['latin'],
    variable: '--font-rubik',
    display: 'swap',
    weight: ['300', '400', '500', '600', '700'],
})

export const metadata = {
    title: 'AI Study Buddy',
    description: 'Your AI-powered study assistant',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${montserrat.variable} ${rubik.variable}`}>
            <body className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-black font-sans">
                <Providers>
                    <div className="flex flex-col min-h-screen">
                        <Navbar />
                        <main className="flex-grow">{children}</main>
                        <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
                            © {new Date().getFullYear()} AI Study Buddy
                        </footer>
                    </div>
                </Providers>
            </body>
        </html>
    )
} 