import { cn } from "@/lib/utils";

export default function FarmerDetect({ status, title, icon, className }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-0 min-h-0 gap-2 p-4 grow">
      <img src={icon} alt={title} className="w-16 h-16 my-2 rounded-full" />
      <h3 className="font-bold text-center">
        {status === "pending-webapp" ? "Getting App" : "Detecting Auth"}
      </h3>
      <p className={cn("text-center text-neutral-500", className)}>
        {status === "pending-webapp" ? (
          <>Please open/reload the bot</>
        ) : (
          <>If stuck for too long, you should reload the bot</>
        )}
      </p>
    </div>
  );
}
