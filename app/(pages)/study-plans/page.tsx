"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";
import { useStudyPlan } from "@/app/contexts/StudyPlanContext";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { toast } from "@/app/components/ui/use-toast";

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

const Trash2 = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
);

// interface StudyPlan {
//     id: string;
//     userId: string;
//     studyPlan: {
//         days: {
//             date: string;
//             tasks: {
//                 subject: string;
//                 duration: number;
//                 activity: string;
//                 priority: string;
//             }[];
//         }[];
//     };
//     subjects: Array<{
//         name: string;
//         difficulty: string;
//         importance: string;
//     }>;
//     examDate: string;
//     hoursPerDay: number;
//     createdAt: string;
// }

export default function StudyPlansPage() {
    const { user, loading: authLoading } = useAuth();
    const { studyPlans, loading: plansLoading, deleteStudyPlan } = useStudyPlan();
    const router = useRouter();
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const handleDeletePlan = async (planId: string) => {
        try {
            setDeletingPlanId(planId);
            const success = await deleteStudyPlan(planId);

            if (success) {
                toast({
                    title: "Success",
                    description: "Study plan deleted successfully",
                });
            }
        } catch (error) {
            console.error("Error deleting study plan:", error);
            toast({
                title: "Error",
                description: "Failed to delete study plan. Please try again.",
                variant: "destructive",
            });
        } finally {
            setDeletingPlanId(null);
        }
    };

    const viewPlan = (planId: string) => {
        router.push(`/study-plan/${planId}`);
    };

    if (authLoading) {
        return (

            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-center">
                    <div className="h-12 w-12 mx-auto rounded-full bg-primary-200 dark:bg-primary-800 mb-4"></div>
                    <div className="h-4 w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-24 px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Your Study Plans</h1>
                    <p className="text-gray-500 mt-1">Manage and view all your study plans</p>
                </div>
                <Button
                    asChild
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
                >
                    <Link href="/study-plan">
                        <Plus className="mr-2 h-4 w-4" /> Create New Plan
                    </Link>
                </Button>
            </div>

            {plansLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : studyPlans.length === 0 ? (
                <div className="text-center py-20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl border border-slate-200 shadow-sm">
                    <CalendarIcon className="mx-auto h-16 w-16 text-indigo-500 mb-6 opacity-80" />
                    <h3 className="text-2xl font-medium text-gray-800 mb-4">No Study Plans Yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                        Create your first personalized study plan to prepare for exams efficiently
                    </p>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base shadow-md hover:shadow-lg transition-all"
                    >
                        <Link href="/study-plan">
                            <Plus className="mr-2 h-4 w-4" /> Create Study Plan
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyPlans.map((plan) => (
                        <Card key={plan.id} className="overflow-hidden border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xl">
                                    Exam Date: {format(parseISO(plan.examDate), "PP")}
                                </CardTitle>
                                <CardDescription>
                                    Created: {format(parseISO(plan.createdAt), "PPp")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="mb-3">
                                    <h4 className="font-medium mb-1">Subjects:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {plan.subjects.map((subject, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md"
                                            >
                                                {subject.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Study Time:</h4>
                                    <p className="text-muted-foreground text-sm">
                                        {plan.hoursPerDay} hours per day
                                    </p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="font-medium mb-1">Days Planned:</h4>
                                    <p className="text-muted-foreground text-sm">
                                        {plan.studyPlan.days.length} days
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-3">
                                <Button
                                    variant="outline"
                                    asChild
                                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                                >
                                    <Link href={`/study-plan/${plan.id}`}>
                                        View Plan
                                    </Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            {deletingPlanId === plan.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Study Plan</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this study plan? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                    e.preventDefault();
                                                    handleDeletePlan(plan.id);
                                                }}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 