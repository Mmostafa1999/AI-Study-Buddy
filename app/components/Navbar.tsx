'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/auth'
import { useRouter } from 'next/navigation'
import router from 'next/router'

const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Ask AI', href: '/ask' },
    { name: 'Flashcards', href: '/flashcards' },
    { name: 'Quiz', href: '/quiz' },
    { name: 'Study Plan', href: '/study-plan' },
]

export default function Navbar() {
    const { user, loading } = useAuth()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const navbarClasses = `
    fixed top-0 left-0 right-0 z-50 transition-all duration-300
    ${isScrolled
            ? 'bg-white/90 backdrop-blur-md shadow-md dark:bg-gray-900/90'
            : 'bg-white/50 backdrop-blur-sm shadow-sm dark:bg-gray-900/50'}
  `

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
        setIsMenuOpen(false)
    }

    return (
        <nav className={navbarClasses}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link
                            href="/"
                            className="flex items-center space-x-2 text-gradient"
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 rounded-lg text-white"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                                    />
                                </svg>
                            </motion.div>
                            <span className="text-xl font-bold">AI Study Buddy</span>
                        </Link>
                    </div>

                    {/* Desktop menu */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`
                  px-3 py-2 text-sm font-medium transition-colors rounded-md relative
                  ${pathname === link.href
                                        ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600'
                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800'}
                `}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {!loading && (
                            <>
                                {user ? (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSignOut}
                                        className="ml-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-md hover:opacity-90"
                                    >
                                        Sign Out
                                    </motion.button>
                                ) : (
                                    <Link href="/login">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="ml-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:opacity-90"
                                        >
                                            Sign In
                                        </motion.button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg"
                >
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`
                  block px-3 py-2 rounded-md text-base font-medium
                  ${pathname === link.href
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400'}
                `}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {!loading && (
                            <>
                                {user ? (
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left block px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                    >
                                        Sign Out
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </nav>
    )
} 