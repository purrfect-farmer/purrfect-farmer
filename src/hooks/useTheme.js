import { useEffect } from "react";
import { useMedia } from "react-use";

export default function useTheme(theme) {
  const systemIsDark = useMedia("(prefers-color-scheme: dark)");

  /** Apply Theme */
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark" || (theme === "system" && systemIsDark)
    );
  }, [theme, systemIsDark]);
}
