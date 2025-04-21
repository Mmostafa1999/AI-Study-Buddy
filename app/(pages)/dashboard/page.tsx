'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { useStudyPlan } from '@/app/contexts/StudyPlanContext'
import { StudyPlanProgress } from '@/app/components/StudyPlanProgress'
import { StudyPlanDayList } from '@/app/components/StudyPlanDayList'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import { Card, CardContent } from '@/app/components/ui/card'

// SVG Icons instead of Lucide React components to fix type errors
const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin"
        {...props}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const Plus = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
);

const BookOpen = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

const Calendar = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
);

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const {
        studyPlans,
        currentStudyPlan,
        setCurrentStudyPlan,
        loading: plansLoading,
        fetchStudyPlans
    } = useStudyPlan()
    const router = useRouter()

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        // Load study plans when user is authenticated
        if (user && !studyPlans.length) {
            fetchStudyPlans()
        }
    }, [user, authLoading, studyPlans.length, fetchStudyPlans, router])

    // Set the first study plan as current if none is selected
    useEffect(() => {
        if (!currentStudyPlan && studyPlans.length > 0) {
            setCurrentStudyPlan(studyPlans[0])
        }
    }, [currentStudyPlan, studyPlans, setCurrentStudyPlan])

    if (authLoading || plansLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return null // Redirecting in useEffect
    }

    if (studyPlans.length === 0) {
        return (
            <div className="container max-w-6xl mx-auto py-24 px-4 sm:px-6">
                <div className="text-center py-20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl border border-slate-200 shadow-sm">
                    <BookOpen className="h-16 w-16 mx-auto text-indigo-500 mb-6 opacity-80" />
                    <h3 className="text-2xl font-medium text-gray-800 mb-4">No Study Plans Yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                        Create your first study plan to get started
                    </p>
                    <Button
                        onClick={() => router.push('/study-plan')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base shadow-md hover:shadow-lg transition-all"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Study Plan
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-24 px-4 sm:px-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Your Study Dashboard</h1>
                    <p className="text-gray-500 mt-1">Track your progress and daily study tasks</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="outline"
                        className="shadow-sm"
                        onClick={() => router.push('/study-plans')}
                    >
                        <Calendar className="mr-2 h-4 w-4" /> All Plans
                    </Button>
                    <Button
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
                        onClick={() => router.push('/study-plan')}
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Plan
                    </Button>
                </div>
            </div>

            {/* Plan selector */}
            {studyPlans.length > 1 && (
                <Card className="mb-6 border-t-4 border-t-purple-500 shadow-md">
                    <CardContent className="pt-6">
                        <h2 className="text-lg font-medium mb-4">Your Study Plans</h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {studyPlans.map((plan) => (
                                <Button
                                    key={plan.id}
                                    variant={currentStudyPlan?.id === plan.id ? "default" : "outline"}
                                    onClick={() => setCurrentStudyPlan(plan)}
                                    className={`whitespace-nowrap px-4 ${currentStudyPlan?.id === plan.id
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                        : "border-2"
                                        }`}
                                >
                                    {plan.subjects.map(s => s.name).join(', ')}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Study Plan Progress */}
                <div className="lg:col-span-1">
                    <StudyPlanProgress />
                </div>

                {/* Right column - Schedule */}
                <div className="lg:col-span-2">
                    <StudyPlanDayList />
                </div>
            </div>
        </div>
    )
} 