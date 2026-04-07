import { cn } from "@/utils";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  [
    "p-2 rounded-lg font-bold",
    "flex justify-center items-center gap-2",
    "disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: ["bg-blue-500 text-white"],
        secondary: ["bg-neutral-200 dark:bg-neutral-900"],
        danger: ["bg-red-400 text-white"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export default function Button({
  as: Component = "button",
  variant,
  className,
  ...props
}) {
  return (
    <Component
      {...props}
      className={cn(buttonVariants({ variant, className }))}
    />
  );
}
