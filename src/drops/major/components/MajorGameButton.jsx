import { cn } from "@/lib/utils";
import StarIcon from "../assets/images/star-amount.svg";

export default function MajorGameButton({ icon, title, reward, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-neutral-50",
        "text-left",
        props.className
      )}
    >
      <img src={icon} className="w-10 h-10 shrink-0" />
      <div>
        <h1 className="font-bold">{title}</h1>
        <p className="text-orange-500">
          +{Intl.NumberFormat().format(reward)}{" "}
          <img src={StarIcon} className="inline h-4" />
        </p>
      </div>
    </button>
  );
}
