"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useStudyPlan } from "@/app/contexts/StudyPlanContext";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Calendar } from "@/app/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/app/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover";
import { cn } from "@/app/lib/utils";
import { format, differenceInDays } from "date-fns";
import { toast } from "@/app/components/ui/use-toast";
import { Badge } from "@/app/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/app/components/ui/select";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

// SVG Icons
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
);

const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
);

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        className={cn("animate-spin", props.className)}
        {...props}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

interface Subject {
    name: string;
    difficulty: "easy" | "medium" | "hard";
    importance: "low" | "medium" | "high";
}

interface StudyTask {
    subject: string;
    duration: number; // in minutes
    activity: string;
    priority: "low" | "medium" | "high";
}

interface DayPlan {
    date: string;
    tasks: StudyTask[];
}

interface StudyPlan {
    days: DayPlan[];
}

const difficultyColors = {
    easy: "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white border-emerald-600",
    medium: "bg-gradient-to-r from-amber-500 to-amber-400 text-white border-amber-600",
    hard: "bg-gradient-to-r from-red-500 to-rose-400 text-white border-rose-600",
};

const importanceColors = {
    low: "bg-gradient-to-r from-blue-500 to-blue-400 text-white border-blue-600",
    medium: "bg-gradient-to-r from-violet-500 to-violet-400 text-white border-violet-600",
    high: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 text-white border-fuchsia-600",
};

const priorityVariants = {
    low: "bg-gradient-to-r from-blue-500 to-blue-400 text-white border-blue-600",
    medium: "bg-gradient-to-r from-violet-500 to-violet-400 text-white border-violet-600",
    high: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 text-white border-fuchsia-600",
};

export default function StudyPlanPage() {
    const { user, loading: authLoading } = useAuth();
    const { studyPlans, loading: plansLoading, createStudyPlan } = useStudyPlan();
    const router = useRouter();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [newSubject, setNewSubject] = useState("");
    const [newSubjectDifficulty, setNewSubjectDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [newSubjectImportance, setNewSubjectImportance] = useState<"low" | "medium" | "high">("medium");
    const [examDate, setExamDate] = useState<Date | undefined>(undefined);
    const [hoursPerDay, setHoursPerDay] = useState(4);
    const [loading, setLoading] = useState(false);
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [activeTab, setActiveTab] = useState("form");

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        // Force refresh the token to ensure it's always valid
        if (user) {
            const refreshToken = async () => {
                try {
                    await user.getIdToken(true); // Force token refresh
                    console.log("Auth token refreshed");
                } catch (error) {
                    console.error("Error refreshing token:", error);
                }
            };

            refreshToken();
        }
    }, [user, authLoading, router]);

    const addSubject = () => {
        if (newSubject.trim() === "") return;

        setSubjects([...subjects, {
            name: newSubject,
            difficulty: newSubjectDifficulty,
            importance: newSubjectImportance
        }]);
        setNewSubject("");
        setNewSubjectDifficulty("medium");
        setNewSubjectImportance("medium");
        setShowAddDialog(false);
    };

    const removeSubject = (index: number) => {
        const updatedSubjects = [...subjects];
        updatedSubjects.splice(index, 1);
        setSubjects(updatedSubjects);
    };

    const generateStudyPlan = async (e: FormEvent) => {
        e.preventDefault();

        // Validation
        if (subjects.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one subject",
                variant: "destructive",
            });
            return;
        }

        if (!examDate) {
            toast({
                title: "Error",
                description: "Please select an exam date",
                variant: "destructive",
            });
            return;
        }

        if (examDate < new Date()) {
            toast({
                title: "Error",
                description: "Exam date must be in the future",
                variant: "destructive",
            });
            return;
        }

        if (hoursPerDay <= 0) {
            toast({
                title: "Error",
                description: "Please enter a valid number of hours per day",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            console.log("Generating study plan...");

            // Generate token for API call
            if (!user) {
                throw new Error("User not authenticated");
            }

            const token = await user.getIdToken(true); // Force token refresh
            console.log("Token generated, length:", token.length);

            // Call the AI API to generate a study plan
            console.log("Calling AI API...");
            const response = await fetch("/api/ai/plan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    subjects: subjects,
                    examDate: examDate.toISOString(),
                    hoursPerDay: hoursPerDay,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error("AI API error:", response.status, errorData);
                throw new Error(`Failed to generate study plan: ${response.status} ${errorData?.error || ''}`);
            }

            const data = await response.json();
            console.log("Study plan generated:", data.studyPlan ? "Success" : "Failed");

            if (!data.studyPlan || !data.studyPlan.days) {
                throw new Error("Invalid study plan data received from API");
            }

            setStudyPlan(data.studyPlan);
            setActiveTab("plan");

            // Save the study plan to the database using our context
            console.log("Saving study plan to database...");
            const planId = await createStudyPlan({
                studyPlan: data.studyPlan,
                subjects: subjects,
                examDate: examDate.toISOString(),
                hoursPerDay: hoursPerDay,
            });

            if (planId) {
                console.log("Study plan saved with ID:", planId);
                toast({
                    title: "Success",
                    description: "Study plan has been generated and saved",
                });
            } else {
                throw new Error("Failed to save study plan");
            }
        } catch (error) {
            console.error("Error generating study plan:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate study plan. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const getCountdownText = () => {
        if (!examDate) return null;
        const daysLeft = differenceInDays(examDate, new Date());
        return (
            <div className="text-center mb-4">
                <Badge variant="outline" className="px-3 py-1 text-base">
                    {daysLeft} days until exam
                </Badge>
            </div>
        );
    };

    return (
        <div className="container max-w-6xl mx-auto pt-20 px-4 sm:px-6 pb-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative p-10"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl -z-10" />

                <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Your Study Plan
                        </h1>
                        <p className="text-gray-600 mt-3 text-lg">
                            Create a personalized study schedule based on your needs
                        </p>
                    </div>
                    {examDate && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 md:mt-0"
                        >
                            {getCountdownText()}
                        </motion.div>
                    )}
                </div>

                <Tabs
                    defaultValue="form"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 mb-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl">
                        <TabsTrigger value="form" className="text-base  data-[state=active]:bg-gradient-to-br data-[state=active]:from-white data-[state=active]:to-white/80 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <BookOpenIcon className="mr-2 h-4 w-4" /> Plan Parameters
                        </TabsTrigger>
                        <TabsTrigger value="plan" className="text-base  data-[state=active]:bg-gradient-to-br data-[state=active]:from-white data-[state=active]:to-white/80 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
                            <GraduationCapIcon className="mr-2 h-4 w-4" /> Your Study Plan
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="form">
                        <Card className="border-t-4 border-t-indigo-500 shadow-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/10 to-pink-500/5 -z-10" />
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b ">
                                <CardTitle className="text-2xl text-gray-800">Study Plan Parameters</CardTitle>
                                <CardDescription className="text-base mt-2 text-gray-600">
                                    Enter your subjects, exam date, and study hours to generate a personalized study plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <form onSubmit={generateStudyPlan} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                                        <div>
                                            <Label htmlFor="hours" className="text-lg text-gray-700 flex items-center mb-3">
                                                <ClockIcon className="h-5 w-5 mr-2" />
                                                Hours per day
                                            </Label>
                                            <Input
                                                id="hours"
                                                type="number"
                                                min={1}
                                                max={12}
                                                value={hoursPerDay}
                                                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                                                className="w-full h-12 text-base"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-lg text-gray-700 flex items-center mb-3">
                                                <CalendarIcon className="h-5 w-5 mr-2" />
                                                Exam Date
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal h-12 text-base",
                                                            !examDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-5 w-5" />
                                                        {examDate ? format(examDate, "PPP") : "Select your exam date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white shadow-xl border z-50" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={examDate}
                                                        onSelect={setExamDate}
                                                        weekStartsOn={0}
                                                        disabled={(date) => date < new Date()}
                                                        className="bg-white rounded-md"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <div className="flex justify-between items-center mb-6">
                                            <Label className="text-lg text-gray-700 flex items-center">
                                                <BookOpenIcon className="h-5 w-5 mr-2" />
                                                Subjects
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setShowAddDialog(true)}
                                                className="transition-all hover:scale-105 px-4 py-2 text-base"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-2" /> Add Subject
                                            </Button>
                                        </div>

                                        <Card className="border border-dashed bg-muted/30">
                                            <CardContent className="p-6 min-h-[180px]">
                                                {subjects.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center py-10">
                                                        <BookOpenIcon className="h-16 w-16 text-muted-foreground mb-4" />
                                                        <p className="text-muted-foreground text-center text-lg">
                                                            No subjects added yet. Click "Add Subject" to begin.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-4">
                                                        {subjects.map((subject, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="flex items-center"
                                                            >
                                                                <div className={`flex items-center space-x-2 rounded-lg border px-3 py-2 ${difficultyColors[subject.difficulty]}`}>
                                                                    <span className="font-medium text-base">
                                                                        {subject.name}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${importanceColors[subject.importance]}`}>
                                                                            {subject.importance}
                                                                        </span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 rounded-full bg-white/30 hover:bg-white/50"
                                                                            onClick={() => removeSubject(index)}
                                                                        >
                                                                            <XIcon className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="pt-6"
                                    >
                                        <Button
                                            type="submit"
                                            className="w-full py-6 text-lg font-semibold"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                                                    Generating Plan...
                                                </>
                                            ) : (
                                                <>
                                                    Generate Study Plan
                                                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="plan">
                        {studyPlan ? (
                            <div className="space-y-10">
                                {studyPlan.days.map((day, dayIndex) => (
                                    <motion.div
                                        key={day.date}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: dayIndex * 0.05 }}
                                    >
                                        <Card className="overflow-hidden border border-slate-200 shadow-md">
                                            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5">
                                                <CardTitle className="text-xl">{format(new Date(day.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y">
                                                    {day.tasks.map((task, taskIndex) => (
                                                        <motion.div
                                                            key={`${day.date}-${taskIndex}`}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.3, delay: taskIndex * 0.03 }}
                                                            className="p-5 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                                                <Badge
                                                                    className={`self-start mb-2 sm:mb-0 px-3 py-1.5 text-sm ${priorityVariants[task.priority]} shadow-sm`}
                                                                >
                                                                    {task.priority}
                                                                </Badge>
                                                                <div className="flex-1">
                                                                    <h3 className="font-semibold text-lg text-slate-900 mb-1">{task.subject}</h3>
                                                                    <p className="text-slate-700">{task.activity}</p>
                                                                </div>
                                                                <div className="flex items-center mt-2 sm:mt-0 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-medium whitespace-nowrap">
                                                                    <ClockIcon className="h-4 w-4 mr-1.5" />
                                                                    {task.duration} min
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl border border-slate-200">
                                <GraduationCapIcon className="h-20 w-20 mx-auto mb-6 text-indigo-400" />
                                <h3 className="text-2xl font-medium text-gray-800 mb-4">No Study Plan Yet</h3>

                                {studyPlans.length > 0 ? (
                                    <>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                                            You have existing study plans. Go to the dashboard to view and manage them, or create a new one here.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <Button
                                                onClick={() => router.push('/dashboard')}
                                                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 text-base"
                                            >
                                                Go to Dashboard
                                            </Button>
                                            <Button
                                                onClick={() => setActiveTab("form")}
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base"
                                            >
                                                Create New Plan <ArrowRightIcon className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                                            Fill out the form parameters to generate your personalized study plan
                                        </p>
                                        <Button
                                            onClick={() => setActiveTab("form")}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base"
                                        >
                                            Create Study Plan <ArrowRightIcon className="ml-2 h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </motion.div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-md bg-white shadow-xl">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="flex items-center text-xl text-gray-800">
                            <BookOpenIcon className="mr-2 h-5 w-5 text-primary" />
                            Add Subject
                        </DialogTitle>
                        <DialogDescription className="text-base mt-2 text-gray-600">
                            Add a new subject with its difficulty and importance
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label htmlFor="subject-name" className="text-lg text-gray-700">Subject Name</Label>
                            <Input
                                id="subject-name"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                placeholder="e.g., Mathematics"
                                className="w-full border-primary/20 focus:border-primary h-12 text-base"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="difficulty" className="text-lg text-gray-700">Difficulty</Label>
                                <Select
                                    value={newSubjectDifficulty}
                                    onValueChange={(value: any) => setNewSubjectDifficulty(value)}
                                >
                                    <SelectTrigger className="border-primary/20 h-12 text-base">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-50">
                                        <SelectItem value="easy" className="text-emerald-600">Easy</SelectItem>
                                        <SelectItem value="medium" className="text-amber-600">Medium</SelectItem>
                                        <SelectItem value="hard" className="text-rose-600">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="importance" className="text-lg text-gray-700">Importance</Label>
                                <Select
                                    value={newSubjectImportance}
                                    onValueChange={(value: any) => setNewSubjectImportance(value)}
                                >
                                    <SelectTrigger className="border-primary/20 h-12 text-base">
                                        <SelectValue placeholder="Select importance" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-50">
                                        <SelectItem value="low" className="text-blue-600">Low</SelectItem>
                                        <SelectItem value="medium" className="text-violet-600">Medium</SelectItem>
                                        <SelectItem value="high" className="text-fuchsia-600">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)} className="hover:bg-slate-100">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={addSubject}
                            disabled={!newSubject.trim()}
                            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        >
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Subject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 