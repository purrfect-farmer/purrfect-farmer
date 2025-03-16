import { cn } from "@/lib/utils";
import { memo } from "react";

const ConnectLink = ({ title, ...props }) => (
  <a
    {...props}
    target="_blank"
    className={cn(
      "px-4 py-2 hover:bg-blue-500 hover:text-white",
      props.className
    )}
  >
    {title}
  </a>
);

export default memo(function Connect(props) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      <div
        className={cn(
          "grid grid-cols-3 rounded-full overflow-hidden",
          "text-center",
          "bg-neutral-100 dark:bg-neutral-700",
          "divide-x dark:divide-neutral-600",
          "font-turret-road font-bold"
        )}
      >
        <ConnectLink
          {...props}
          href={import.meta.env.VITE_APP_TELEGRAM_CHANNEL}
          title={"Channel"}
        />
        <ConnectLink
          {...props}
          href={import.meta.env.VITE_APP_DEV_CONTACT}
          title={"Dev"}
        />
        <ConnectLink
          {...props}
          href={import.meta.env.VITE_APP_TELEGRAM_GROUP}
          title={"Group"}
        />
      </div>
    </div>
  );
});
