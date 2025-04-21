'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { toast } from '@/app/components/ui/use-toast'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { studyPlanService } from '@/app/lib/studyPlanService'
import { StudyPlan, Day, Task, Subject } from '@/app/types'

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
            toast({
                title: 'Error',
                description: 'Failed to load study plans. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [user, currentStudyPlan])

    // Fetch a single study plan by ID
    const fetchStudyPlan = async (id: string): Promise<StudyPlan | null> => {
        if (!user) return null

        try {
            setLoading(true)
            const token = await user.getIdToken(true)
            studyPlanService.setAuthToken(token)
            const result = await studyPlanService.fetchById(id)

            if (!result.success) {
                throw new Error(result.error.message || 'Failed to fetch study plan')
            }

            const plan = result.data

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
        if (!user) return null;

        try {
            setLoading(true);

            // Get token from localStorage if available, or request a fresh one
            let token;
            const cachedToken = localStorage.getItem('authToken');

            if (cachedToken) {
                token = cachedToken;
            } else {
                token = await user.getIdToken(true);
                localStorage.setItem('authToken', token);
            }

            studyPlanService.setAuthToken(token);

            // Add userId and createdAt which are required by our API service
            const dataWithMetadata = {
                ...studyPlanData,
                userId: user.uid,
                createdAt: new Date().toISOString()
            };

            const result = await studyPlanService.create(dataWithMetadata);

            if (!result.success) {
                throw new Error(result.error.message || 'Failed to create study plan');
            }

            if (!result.data) {
                throw new Error('API returned success but no ID was provided');
            }

            // Refresh the study plans list
            await fetchStudyPlans();

            return result.data;
        } catch (error) {
            console.error('Error creating study plan:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create study plan',
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
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
            studyPlanService.setAuthToken(token)
            const result = await studyPlanService.update(id, studyPlanData)

            if (!result.success) {
                throw new Error(result.error.message || 'Failed to update study plan')
            }

            // Update the local cache
            setStudyPlans(prev =>
                prev.map(plan => (plan.id === id ? { ...plan, ...studyPlanData } : plan))
            )

            // Update current study plan if needed
            if (currentStudyPlan?.id === id) {
                setCurrentStudyPlan(prev => prev ? { ...prev, ...studyPlanData } : null)
            }

            return true
        } catch (error) {
            console.error('Error updating study plan:', error)
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update study plan',
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
            studyPlanService.setAuthToken(token)
            const result = await studyPlanService.delete(id)

            if (!result.success) {
                throw new Error(result.error.message || 'Failed to delete study plan')
            }

            // Update local cache
            setStudyPlans(prev => prev.filter(plan => plan.id !== id))

            // Clear current study plan if it was deleted
            if (currentStudyPlan?.id === id) {
                const remaining = studyPlans.filter(plan => plan.id !== id)
                setCurrentStudyPlan(remaining.length > 0 ? remaining[0] : null)
            }

            return true
        } catch (error) {
            console.error('Error deleting study plan:', error)
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete study plan',
                variant: 'destructive',
            })
            return false
        } finally {
            setLoading(false)
        }
    }

    // Load study plans on mount or when user changes
    useEffect(() => {
        if (user) {
            fetchStudyPlans()
        } else {
            // Clear data when user logs out
            setStudyPlans([])
            setCurrentStudyPlan(null)
        }
    }, [user, fetchStudyPlans])

    const value = {
        studyPlans,
        currentStudyPlan,
        loading,
        fetchStudyPlans,
        fetchStudyPlan,
        createStudyPlan,
        updateStudyPlan,
        deleteStudyPlan,
        setCurrentStudyPlan,
    }

    return <StudyPlanContext.Provider value={value}>{children}</StudyPlanContext.Provider>
} 