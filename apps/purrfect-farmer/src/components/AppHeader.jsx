import AppIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=224";
import { cn } from "@/utils";
import { memo } from "react";

export default memo(function AppHeader({ className, imageClassName, children }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className,
      )}
    >
      {/* Logo */}
      <img src={AppIcon} className={cn("h-28", imageClassName)} />

      {/* Title */}
      <h1
        className={cn(
          "leading-none font-turret-road",
          "text-2xl text-center text-orange-500",
        )}
      >
        {import.meta.env.VITE_APP_NAME}
      </h1>

      {children}
    </div>
  );
});
