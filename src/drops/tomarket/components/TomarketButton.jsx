import { cn } from "@/lib/utils";

export default function TomarketButton({ color = "primary", ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2",
        "rounded-lg font-bold",
        {
          primary: "bg-lime-500 text-black",
          danger: "bg-red-700 text-white",
        }[color],
        props.disabled && "opacity-50",
        props.className
      )}
      {...props}
    />
  );
}
