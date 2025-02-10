import AppIcon from "@/assets/images/icon.png?format=webp&w=56";
import CloudUserDisplay from "./CloudUserDisplay";
import CloudAccounts from "./CloudAccounts";
export default function CloudPanel() {
  return (
    <div className="flex flex-col h-dvh">
      {/* Heading */}
      <div className="p-2 border-b shrink-0 dark:border-neutral-700">
        <h1 className="flex items-center justify-center gap-2 font-bold">
          <img src={AppIcon} className="w-7 h-7" /> Purrfect Cloud
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 min-h-0 gap-4 p-4 overflow-auto grow scrollbar-thin">
        {/* User Display */}
        <CloudUserDisplay />

        {/* Accounts */}
        <CloudAccounts />
      </div>
    </div>
  );
}
