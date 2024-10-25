import { cn } from "@/lib/utils";

export default function Toggle({ className, ...props }) {
  return (
    <>
      <input {...props} type="checkbox" className="sr-only peer" />
      <div
        className={cn(
          "shrink-0",
          "relative rounded-full",
          "inline-flex h-6 w-11 items-center",
          "peer-checked:bg-blue-500 bg-neutral-200",

          // Before
          "peer-checked:before:translate-x-6 before:translate-x-1",
          "before:inline-block before:h-4 before:w-4",
          "before:transform before:transition",
          "before:rounded-full",
          "before:bg-neutral-400 peer-checked:before:bg-white"
        )}
      />
    </>
  );
}
