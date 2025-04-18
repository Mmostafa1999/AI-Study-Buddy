'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { toast } from '@/app/components/ui/use-toast'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'

export interface Task {
    subject: string
    duration: number
    activity: string
    priority: string
}

export interface Day {
    date: string
    tasks: Task[]
}

export interface Subject {
    name: string
    difficulty: string
    importance: string
}

export interface StudyPlan {
    id: string
    userId: string
    studyPlan: {
        days: Day[]
    }
    subjects: Subject[]
    examDate: string
    hoursPerDay: number
    createdAt: string
}

interface StudyPlanContextType {
    studyPlans: StudyPlan[]
    currentStudyPlan: StudyPlan | null
    loading: boolean
    fetchStudyPlans: () => Promise<void>
    fetchStudyPlan: (id: string) => Promise<StudyPlan | null>
    createStudyPlan: (studyPlanData: Omit<StudyPlan, 'id' | 'userId' | 'createdAt'>) => Promise<string | null>
    updateStudyPlan: (id: string, studyPlanData: Partial<StudyPlan>) => Promise<boolean>
    deleteStudyPlan: (id: string) => Promise<boolean>
    setCurrentStudyPlan: (plan: StudyPlan | null) => void
}

const StudyPlanContext = createContext<StudyPlanContextType | null>(null)

export const useStudyPlan = () => {
    const context = useContext(StudyPlanContext)
    if (!context) {
        throw new Error('useStudyPlan must be used within a StudyPlanProvider')
    }
    return context
}

export const StudyPlanProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth()
    const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([])
    const [currentStudyPlan, setCurrentStudyPlan] = useState<StudyPlan | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchStudyPlans = useCallback(async () => {
        if (!user) return

        setLoading(true)
        try {
            const token = await user.getIdToken()
            const studyPlansRef = collection(db, 'studyPlans')
            const q = query(studyPlansRef, where('userId', '==', user.uid))
            const snapshot = await getDocs(q)

            const plansData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as StudyPlan[]

            // Sort by creation date, newest first
            plansData.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })

            setStudyPlans(plansData)

            // Set current study plan to the most recent one if not set
            if (!currentStudyPlan && plansData.length > 0) {
                setCurrentStudyPlan(plansData[0])
            }
        } catch (error) {
            console.error('Error fetching study plans:', error)
        } finally {
            setLoading(false)
        }
    }, [user, currentStudyPlan, setStudyPlans, setCurrentStudyPlan, setLoading])

    // Fetch a single study plan by ID
    const fetchStudyPlan = async (id: string): Promise<StudyPlan | null> => {
        if (!user) return null

        try {
            setLoading(true)
            const token = await user.getIdToken(true)

            const response = await fetch(`/api/study-plans/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch study plan')
            }

            const data = await response.json()
            const plan = data.plan

            // Update the local cache
            setStudyPlans(prev => {
                const exists = prev.some(p => p.id === plan.id)
                if (exists) {
                    return prev.map(p => (p.id === plan.id ? plan : p))
                } else {
                    return [...prev, plan]
                }
            })

            setCurrentStudyPlan(plan)
            return plan
        } catch (error) {
            console.error('Error fetching study plan:', error)
            toast({
                title: 'Error',
                description: 'Failed to load study plan. Please try again.',
                variant: 'destructive',
            })
            return null
        } finally {
            setLoading(false)
        }
    }

    // Create a new study plan
    const createStudyPlan = async (
        studyPlanData: Omit<StudyPlan, 'id' | 'userId' | 'createdAt'>
    ): Promise<string | null> => {
        if (!user) return null

        try {
            setLoading(true)
            const token = await user.getIdToken(true)

            const response = await fetch('/api/study-plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(studyPlanData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(`Failed to save study plan: ${response.status} ${errorData?.error || ''}`)
            }

            const data = await response.json()

            // Refresh the study plans list
            await fetchStudyPlans()

            return data.planId || null
        } catch (error) {
            console.error('Error creating study plan:', error)
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create study plan',
                variant: 'destructive',
            })
            return null
        } finally {
            setLoading(false)
        }
    }

    // Update an existing study plan
    const updateStudyPlan = async (
        id: string,
        studyPlanData: Partial<StudyPlan>
    ): Promise<boolean> => {
        if (!user) return false

        try {
            setLoading(true)
            const token = await user.getIdToken(true)

            const response = await fetch(`/api/study-plans/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(studyPlanData),
            })

            if (!response.ok) {
                throw new Error('Failed to update study plan')
            }

            // Update the local cache
            setStudyPlans(prev => {
                return prev.map(plan => {
                    if (plan.id === id) {
                        return { ...plan, ...studyPlanData }
                    }
                    return plan
                })
            })

            if (currentStudyPlan?.id === id) {
                setCurrentStudyPlan(prev => {
                    if (!prev) return null
                    return { ...prev, ...studyPlanData }
                })
            }

            return true
        } catch (error) {
            console.error('Error updating study plan:', error)
            toast({
                title: 'Error',
                description: 'Failed to update study plan',
                variant: 'destructive',
            })
            return false
        } finally {
            setLoading(false)
        }
    }

    // Delete a study plan
    const deleteStudyPlan = async (id: string): Promise<boolean> => {
        if (!user) return false

        try {
            setLoading(true)
            const token = await user.getIdToken(true)

            const response = await fetch(`/api/study-plans/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to delete study plan')
            }

            // Update the local cache
            setStudyPlans(prev => prev.filter(plan => plan.id !== id))

            if (currentStudyPlan?.id === id) {
                setCurrentStudyPlan(null)
            }

            return true
        } catch (error) {
            console.error('Error deleting study plan:', error)
            toast({
                title: 'Error',
                description: 'Failed to delete study plan',
                variant: 'destructive',
            })
            return false
        } finally {
            setLoading(false)
        }
    }

    // Auto-fetch study plans when user logs in
    useEffect(() => {
        if (user) {
            fetchStudyPlans()
        } else {
            setStudyPlans([])
            setCurrentStudyPlan(null)
        }
    }, [user, fetchStudyPlans])

    return (
        <StudyPlanContext.Provider
            value={{
                studyPlans,
                currentStudyPlan,
                loading,
                fetchStudyPlans,
                fetchStudyPlan,
                createStudyPlan,
                updateStudyPlan,
                deleteStudyPlan,
                setCurrentStudyPlan,
            }}
        >
            {children}
        </StudyPlanContext.Provider>
    )
} 