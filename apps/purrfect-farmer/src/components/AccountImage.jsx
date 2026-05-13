import { cn } from "@/utils";

export default function AccountImage({ active, src, ...props }) {
  return (
    <div {...props} className={cn("relative shrink-0", props.className)}>
      <img src={src} className={cn("rounded-full shrink-0", "w-full h-full")} />

      {active ? (
        <span
          className={cn(
            "absolute inset-0",
            "-rotate-45",

            // After
            "after:absolute",
            "after:top-0 after:left-1/2",
            "after:-translate-x-1/2 after:-translate-y-1/2",
            "after:border-2 after:border-white",
            "after:w-2 after:h-2",
            "after:rounded-full",
            "after:bg-green-500",
          )}
        ></span>
      ) : null}
    </div>
  );
}
