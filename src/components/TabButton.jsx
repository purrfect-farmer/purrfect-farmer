import useAppContext from "@/hooks/useAppContext";
import { HiOutlineArrowPath, HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";
import { useEffect } from "react";

export default function TabButton({ tab, connected }) {
  const { dispatchAndCloseTab, dispatchAndSetActiveTab, reloadTab } =
    useAppContext();
  const buttonRef = useRef();

  /** Button Click Handler */
  const handleTabButtonClick = useCallback(() => {
    dispatchAndSetActiveTab(tab.id);
  }, [tab.id, dispatchAndSetActiveTab]);

  /** Reload Tab */
  const handleReloadButtonClick = useCallback(
    (ev) => {
      /** Stop Propagation */
      ev.stopPropagation();

      /** Reload Tab */
      reloadTab(tab.id);
    },
    [tab.id, reloadTab]
  );

  /** Close Button Click Handler */
  const handleCloseButtonClick = useCallback(
    (ev) => {
      /** Stop Propagation */
      ev.stopPropagation();

      /** Close Tab */
      dispatchAndCloseTab(tab.id);
    },
    [tab.id, dispatchAndCloseTab]
  );

  /** Scroll into View */
  useEffect(() => {
    if (tab.active) {
      buttonRef.current.scrollIntoView({
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [tab.active, buttonRef]);

  return (
    <div
      ref={buttonRef}
      onClick={handleTabButtonClick}
      title={tab.title}
      className={cn(
        "cursor-pointer",
        "flex gap-1 items-center",
        "p-1.5 rounded-full shrink-0",
        tab.active ? "bg-neutral-100 dark:bg-neutral-700" : null
      )}
    >
      {/* Icon */}
      <div className="relative shrink-0">
        <img src={tab.icon} className="rounded-full w-7 h-7" />
        {typeof connected !== "undefined" ? (
          <span
            className={cn(
              "absolute inset-0",
              "rotate-[120deg]",

              // After
              "after:absolute",
              "after:top-0 after:left-1/2",
              "after:-translate-x-1/2 after:-translate-y-1/2",
              "after:border-2 after:border-white",
              "after:p-1",
              "after:rounded-full",
              connected ? "after:bg-green-500" : "after:bg-red-500"
            )}
          ></span>
        ) : null}
      </div>

      {/* Title */}
      <span
        className={cn(
          "font-bold",
          "max-w-10 truncate",
          !tab.active ? "hidden" : null
        )}
      >
        {tab.title}
      </span>

      {tab.active && tab.id !== "app" ? (
        <>
          {/* Reload Button */}
          <button
            className={cn(
              "inline-flex items-center justify-center",
              "rounded-full w-7 h-7 shrink-0",
              "hover:bg-neutral-200 dark:hover:bg-neutral-600"
            )}
            onClick={handleReloadButtonClick}
          >
            <HiOutlineArrowPath className="w-5 h-5" />
          </button>

          {/* Close Button */}
          <button
            className={cn(
              "inline-flex items-center justify-center",
              "rounded-full w-7 h-7 shrink-0",
              "hover:bg-neutral-200 dark:hover:bg-neutral-600"
            )}
            onClick={handleCloseButtonClick}
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
