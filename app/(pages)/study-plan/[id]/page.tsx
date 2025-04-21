"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useStudyPlan } from "@/app/contexts/StudyPlanContext";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { format, parseISO, add, isEqual } from "date-fns";
import { toast } from "@/app/components/ui/use-toast";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";

// SVG Icons
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

const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="m9 18 6-6-6-6" />
    </svg>
);

const Check = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

interface StudyPlan {
    id: string;
    userId: string;
    studyPlan: {
        days: {
            date: string;
            tasks: {
                subject: string;
                duration: number;
                activity: string;
                priority: string;
            }[];
        }[];
    };
    subjects: Array<{
        name: string;
        difficulty: string;
        importance: string;
    }>;
    examDate: string;
    hoursPerDay: number;
    createdAt: string;
}

export default function StudyPlanDetailPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const { fetchStudyPlan, currentStudyPlan: studyPlan, loading: planLoading } = useStudyPlan();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const loadStudyPlan = useCallback(async () => {
        try {
            const plan = await fetchStudyPlan(params.id);

            // Set the active tab to today if possible
            if (plan?.studyPlan?.days) {
                const todayIndex = plan.studyPlan.days.findIndex(day => {
                    const dayDate = new Date(day.date);
                    dayDate.setHours(0, 0, 0, 0);
                    return isEqual(dayDate, today);
                });

                if (todayIndex >= 0) {
                    setActiveTab(`day-${todayIndex}`);
                    setCurrentDayIndex(todayIndex);
                }
            }
        } catch (error) {
            console.error("Error loading study plan:", error);
            toast({
                title: "Error",
                description: "Failed to load study plan. Please try again.",
                variant: "destructive",
            });
        }
    }, [params.id, fetchStudyPlan, today, setActiveTab, setCurrentDayIndex, toast]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (user && params.id) {
            loadStudyPlan();
        }
    }, [user, authLoading, params.id, router, loadStudyPlan]);

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "high":
                return "bg-red-100 text-red-800";
            case "medium":
                return "bg-yellow-100 text-yellow-800";
            case "low":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getDaysRemaining = () => {
        if (!studyPlan) return 0;

        const examDate = parseISO(studyPlan.examDate);
        const currentDate = new Date();
        const diffTime = examDate.getTime() - currentDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getTotalStudyHours = () => {
        if (!studyPlan) return 0;

        return studyPlan.studyPlan.days.reduce((total, day) => {
            return total + day.tasks.reduce((dayTotal, task) => dayTotal + task.duration, 0);
        }, 0);
    };

    const getCompletedDays = () => {
        if (!studyPlan) return 0;

        return studyPlan.studyPlan.days.filter(day => {
            const dayDate = parseISO(day.date);
            return dayDate < today;
        }).length;
    };

    const goToPreviousDay = () => {
        if (currentDayIndex > 0) {
            const newIndex = currentDayIndex - 1;
            setCurrentDayIndex(newIndex);
            setActiveTab(`day-${newIndex}`);
        }
    };

    const goToNextDay = () => {
        if (studyPlan && currentDayIndex < studyPlan.studyPlan.days.length - 1) {
            const newIndex = currentDayIndex + 1;
            setCurrentDayIndex(newIndex);
            setActiveTab(`day-${newIndex}`);
        }
    };

    if (authLoading || planLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!studyPlan) {
        return (
            <div className="container max-w-6xl mx-auto py-24 px-4 sm:px-6">
                <Button variant="ghost" onClick={() => router.push("/study-plans")} className="mb-8 group">
                    <ChevronLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform" /> Back to Study Plans
                </Button>
                <div className="text-center py-20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-2xl font-medium text-gray-800 mb-4">No Study Plans Yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                        The study plan you're looking for doesn't exist or you don't have permission to view it.
                    </p>
                    <Button
                        onClick={() => router.push("/study-plans")}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base shadow-md hover:shadow-lg transition-all"
                    >
                        View All Study Plans
                    </Button>
                </div>
            </div>
        );
    }

    const daysRemaining = getDaysRemaining();
    const completedDays = getCompletedDays();
    const totalDays = studyPlan.studyPlan.days.length;
    const completionPercentage = Math.round((completedDays / totalDays) * 100);

    return (
        <div className="container max-w-6xl mx-auto py-24 px-4 sm:px-6">
            <Button variant="ghost" onClick={() => router.push("/study-plans")} className="mb-8 group">
                <ChevronLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform" /> Back to Study Plans
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-3">
                    <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
                        <CardHeader className="py-6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <div>
                                    <CardTitle className="text-2xl md:text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Study Plan</CardTitle>
                                    <CardDescription className="text-base mt-1.5">
                                        Created on {format(parseISO(studyPlan.createdAt), "PPp")}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="outline" className="text-sm py-1.5 px-3 border-indigo-200 text-indigo-700 bg-indigo-50/50">
                                        {daysRemaining} days until exam
                                    </Badge>
                                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm py-1.5 px-3">
                                        {studyPlan.hoursPerDay} hours/day
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="h-full shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl">Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-7">
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
                                        {format(parseISO(studyPlan.examDate), "PPP")}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {daysRemaining} days remaining
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-base mb-2.5">Total Study Time</h4>
                                    <p className="text-xl font-semibold">{getTotalStudyHours()} hours</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-base mb-2.5">Subjects</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {studyPlan.subjects.map((subject, idx) => (
                                            <Badge key={idx} variant="outline" className="text-sm py-1 px-2.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                                                {subject.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                            <TabsTrigger value="overview" className="text-base data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Overview</TabsTrigger>
                            <TabsTrigger value="today" className="text-base data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Today</TabsTrigger>
                            <TabsTrigger value="all-days" className="text-base data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">All Days</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl">Study Plan Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-5">
                                        {studyPlan.studyPlan.days.slice(0, 3).map((day, dayIndex) => {
                                            const dayDate = parseISO(day.date);
                                            const isPast = dayDate < today;

                                            return (
                                                <div key={dayIndex} className="border rounded-lg p-5 shadow-sm hover:shadow transition-shadow">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="font-semibold text-lg">
                                                            {format(dayDate, "EEEE, MMMM d")}
                                                        </h3>
                                                        {isPast && (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 py-1">
                                                                <Check className="mr-1 h-3.5 w-3.5" /> Completed
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        {day.tasks.map((task, taskIndex) => (
                                                            <div
                                                                key={taskIndex}
                                                                className="flex items-center justify-between py-3 border-b last:border-0"
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
                                                                    <span className="text-sm font-medium bg-gray-100 px-2.5 py-1 rounded-md">{task.duration}h</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <Button
                                            variant="outline"
                                            className="w-full py-2.5 mt-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                                            onClick={() => setActiveTab("all-days")}
                                        >
                                            View All Days
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="today">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl">Today's Study Plan</CardTitle>
                                    <CardDescription className="text-base mt-1.5">
                                        {format(today, "EEEE, MMMM d, yyyy")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {studyPlan.studyPlan.days.find(day => {
                                        const dayDate = new Date(day.date);
                                        dayDate.setHours(0, 0, 0, 0);
                                        return isEqual(dayDate, today);
                                    }) ? (
                                        <div className="space-y-4">
                                            {studyPlan.studyPlan.days
                                                .filter(day => {
                                                    const dayDate = new Date(day.date);
                                                    dayDate.setHours(0, 0, 0, 0);
                                                    return isEqual(dayDate, today);
                                                })
                                                .map((day, dayIndex) => (
                                                    <div key={dayIndex}>
                                                        <div className="space-y-3">
                                                            {day.tasks.map((task, taskIndex) => (
                                                                <div
                                                                    key={taskIndex}
                                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-lg shadow-sm"
                                                                >
                                                                    <div className="mb-3 sm:mb-0">
                                                                        <p className="font-medium text-lg mb-1">{task.subject}</p>
                                                                        <p className="text-muted-foreground">
                                                                            {task.activity}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`${getPriorityColor(task.priority)} px-3 py-1`}
                                                                        >
                                                                            {task.priority}
                                                                        </Badge>
                                                                        <span className="text-lg font-semibold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md">{task.duration}h</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl border border-dashed border-indigo-200">
                                            <p className="text-muted-foreground mb-6 text-base">
                                                No study activities scheduled for today.
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setActiveTab("all-days")}
                                                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                                            >
                                                View All Days
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="all-days">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl">All Study Days</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {studyPlan.studyPlan.days.map((day, dayIndex) => {
                                            const dayDate = parseISO(day.date);
                                            const isPast = dayDate < today;
                                            const isToday = (() => {
                                                const date = new Date(day.date);
                                                date.setHours(0, 0, 0, 0);
                                                return isEqual(date, today);
                                            })();

                                            return (
                                                <div
                                                    key={dayIndex}
                                                    className={`border rounded-lg p-5 shadow-sm hover:shadow ${isToday ? 'border-primary bg-primary/5' : ''}`}
                                                >
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <h3 className="font-semibold text-lg mb-1">
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

                                                    <div className="space-y-3">
                                                        {day.tasks.map((task, taskIndex) => (
                                                            <div
                                                                key={taskIndex}
                                                                className="flex items-center justify-between py-3 border-b last:border-0"
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
                                                                    <span className="text-sm font-medium bg-gray-100 px-2.5 py-1 rounded-md">{task.duration}h</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {studyPlan.studyPlan.days.map((day, dayIndex) => (
                            <TabsContent key={dayIndex} value={`day-${dayIndex}`}>
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-xl">
                                            {format(parseISO(day.date), "EEEE, MMMM d")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {day.tasks.map((task, taskIndex) => (
                                                <div
                                                    key={taskIndex}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-lg shadow-sm"
                                                >
                                                    <div className="mb-3 sm:mb-0">
                                                        <p className="font-medium text-lg mb-1">{task.subject}</p>
                                                        <p className="text-muted-foreground">
                                                            {task.activity}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getPriorityColor(task.priority)} px-3 py-1`}
                                                        >
                                                            {task.priority}
                                                        </Badge>
                                                        <span className="text-lg font-semibold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md">{task.duration}h</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                            onClick={goToPreviousDay}
                                            disabled={dayIndex === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous Day
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                            onClick={goToNextDay}
                                            disabled={dayIndex === studyPlan.studyPlan.days.length - 1}
                                        >
                                            Next Day <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </div>
    );
} 