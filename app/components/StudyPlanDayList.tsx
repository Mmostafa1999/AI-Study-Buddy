'use client'

import { useState, useEffect } from 'react'
import { useStudyPlan } from '@/app/contexts/StudyPlanContext'
import { format, parseISO, isEqual, addDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Calendar, Check, ChevronLeft, ChevronRight } from '@/app/components/Icons'
import { Button } from '@/app/components/ui/button'

export function StudyPlanDayList() {
    const { currentStudyPlan } = useStudyPlan()
    const [currentDayIndex, setCurrentDayIndex] = useState(0)

    // Create an empty today date for comparisons
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the index of today in the study plan days - safely handle when currentStudyPlan is null
    const todayIndex = currentStudyPlan?.studyPlan?.days?.findIndex(day => {
        const date = new Date(day.date)
        date.setHours(0, 0, 0, 0)
        return isEqual(date, today)
    }) ?? -1

    // If today is found, use it as the initial day index
    useEffect(() => {
        if (todayIndex !== -1) {
            setCurrentDayIndex(todayIndex)
        }
    }, [todayIndex])

    if (!currentStudyPlan) {
        return (
            <Card className="shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Study Plan Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No study plan selected</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "high":
                return "bg-red-100 text-red-800"
            case "medium":
                return "bg-yellow-100 text-yellow-800"
            case "low":
                return "bg-green-100 text-green-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const days = currentStudyPlan.studyPlan.days
    const totalDays = days.length

    if (totalDays === 0) {
        return (
            <Card className="shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Study Plan Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No days in the study plan</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const currentDay = days[currentDayIndex]
    const dayDate = parseISO(currentDay.date)
    const isPast = dayDate < today
    const isToday = (() => {
        const date = new Date(currentDay.date)
        date.setHours(0, 0, 0, 0)
        return isEqual(date, today)
    })()

    const goToPreviousDay = () => {
        setCurrentDayIndex(prev => (prev > 0 ? prev - 1 : prev))
    }

    const goToNextDay = () => {
        setCurrentDayIndex(prev => (prev < totalDays - 1 ? prev + 1 : prev))
    }

    return (
        <Card className="shadow-md">
            <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Study Plan Schedule</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span>Day {currentDayIndex + 1} of {totalDays}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className={`border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200 
                    ${isToday ? 'border-primary bg-primary/5' : ''} min-h-[320px]`}>
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="font-semibold text-xl mb-1">
                                {format(dayDate, "EEEE, MMMM d")}
                            </h3>
                            {isToday && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                                    Today
                                </Badge>
                            )}
                        </div>
                        {isPast && !isToday && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 py-1">
                                <Check className="mr-1 h-3.5 w-3.5" /> Completed
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-4">
                        {currentDay.tasks?.length > 0 ? (
                            currentDay.tasks.map((task, taskIndex) => (
                                <div
                                    key={taskIndex}
                                    className="flex items-center justify-between py-4 px-3 border-b last:border-0 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-base mb-1">{task.subject}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {task.activity}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <Badge
                                            variant="outline"
                                            className={`${getPriorityColor(task.priority)} px-2.5 py-1`}
                                        >
                                            {task.priority}
                                        </Badge>
                                        <span className="text-sm font-medium bg-gray-100 px-2.5 py-1 rounded-md">
                                            {task.duration} min
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No tasks for this day</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 pb-4 border-t">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousDay}
                    disabled={currentDayIndex === 0}
                    className="w-[100px]"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                {isToday && (
                    <Badge className="bg-primary/10 text-primary border-primary">
                        Today
                    </Badge>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextDay}
                    disabled={currentDayIndex === totalDays - 1}
                    className="w-[100px]"
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </CardFooter>
        </Card>
    )
} 