import { cn } from "@/lib/utils";

export default function RektButton({ color = "primary", ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "px-4 py-2",
        "rounded-lg",
        {
          primary: "bg-white text-black",
          danger: "bg-red-500 text-white",
        }[color],
        props.disabled && "opacity-50",
        props.className
      )}
    />
  );
}
