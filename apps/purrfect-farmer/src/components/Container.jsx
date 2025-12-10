import { cn } from "@/lib/utils";

export default function Container(props) {
  return (
    <div
      {...props}
      className={cn("w-full max-w-sm mx-auto p-4", props.className)}
    />
  );
}
