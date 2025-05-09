import { useEffect } from "react";
import { useMedia } from "react-use";

export default function useTheme(theme, isActive = true) {
  const systemIsDark = useMedia("(prefers-color-scheme: dark)");

  /** Apply Theme */
  useEffect(() => {
    if (!isActive) return;

    const isDark = theme === "dark" || (theme === "system" && systemIsDark);

    document.documentElement.classList.toggle("dark", isDark);
    document
      .querySelector("meta[name=theme-color]")
      .setAttribute("content", isDark ? "#262626" : "#ffffff");
  }, [theme, isActive, systemIsDark]);
}
