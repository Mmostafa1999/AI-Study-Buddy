import { cva, type VariantProps } from 'class-variance-authority';

// Card style variants
export const cardVariants = cva(
  "rounded-lg shadow-md overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-800",
        primary: "bg-primary-50 dark:bg-primary-900/20",
        secondary: "bg-secondary-50 dark:bg-secondary-900/20",
        outline: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
      hover: {
        true: "transition-shadow duration-200 hover:shadow-lg",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hover: true,
    }
  }
);

export type CardVariants = VariantProps<typeof cardVariants>;

// Button style variants
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
        link: "bg-transparent underline-offset-4 hover:underline text-primary-600 dark:text-primary-400 hover:bg-transparent",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

// Get primary color for subjects based on difficulty
export function getSubjectColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
    case 'medium':
      return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
    case 'hard':
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  }
}

// Get color for priority
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
    case 'low':
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  }
} 