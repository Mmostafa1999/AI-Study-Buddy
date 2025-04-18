'use client'

import { useStudyPlan } from '@/app/contexts/StudyPlanContext'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'
import { Badge } from '@/app/components/ui/badge'

export function StudyPlanProgress() {
    const { currentStudyPlan } = useStudyPlan()

    if (!currentStudyPlan) {
        return null
    }

    // Calculate progress
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate days remaining until exam
    const examDate = parseISO(currentStudyPlan.examDate)
    const daysRemaining = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate completed days
    const totalDays = currentStudyPlan.studyPlan.days.length
    const completedDays = currentStudyPlan.studyPlan.days.filter(day => {
        const dayDate = parseISO(day.date)
        dayDate.setHours(0, 0, 0, 0)
        return dayDate < today
    }).length

    const completionPercentage = Math.round((completedDays / totalDays) * 100)

    // Calculate total study hours
    const totalStudyHours = currentStudyPlan.studyPlan.days.reduce((total, day) => {
        return total + day.tasks.reduce((dayTotal, task) => dayTotal + task.duration, 0)
    }, 0) / 60 // Convert minutes to hours

    return (
        <Card className="shadow-md border-t-4 border-t-indigo-500">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl flex justify-between">
                    <span>Study Plan Progress</span>
                    <Badge variant="outline" className="text-sm py-1.5 px-3 border-indigo-200 text-indigo-700 bg-indigo-50/50">
                        {daysRemaining} days until exam
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Completion</span>
                            <span className="text-sm font-semibold">{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted rounded-lg p-4 text-center">
                            <span className="text-3xl font-bold block mb-1">{completedDays}</span>
                            <span className="text-xs text-muted-foreground">Days Completed</span>
                        </div>
                        <div className="bg-muted rounded-lg p-4 text-center">
                            <span className="text-3xl font-bold block mb-1">{totalDays - completedDays}</span>
                            <span className="text-xs text-muted-foreground">Days Remaining</span>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-medium text-base mb-2.5">Exam Date</h4>
                        <p className="text-xl font-semibold text-indigo-700">
                            {format(parseISO(currentStudyPlan.examDate), "PPP")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {daysRemaining} days remaining
                        </p>
                    </div>

                    <div>
                        <h4 className="font-medium text-base mb-2.5">Total Study Time</h4>
                        <p className="text-xl font-semibold">{totalStudyHours.toFixed(1)} hours</p>
                    </div>

                    <div>
                        <h4 className="font-medium text-base mb-2.5">Subjects</h4>
                        <div className="flex flex-wrap gap-2">
                            {currentStudyPlan.subjects.map((subject, idx) => (
                                <Badge key={idx} variant="outline" className="text-sm py-1 px-2.5 bg-white">
                                    {subject.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 