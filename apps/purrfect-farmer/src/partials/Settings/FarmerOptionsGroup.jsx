import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import {
  HiBolt,
  HiOutlineGlobeAlt,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { memo } from "react";
import {
  SettingsGridButton,
  SettingsGroup,
  SettingsLabel,
} from "./SettingsComponents";

export default memo(function FarmerOptionsGroup({
  account,
  settings,
  sharedSettings,
  farmerMode,
  telegramClient,
  updateActiveAccount,
  dispatchAndConfigureSettings,
  dispatchAndConfigureSharedSettings,
}) {
  return (
    <SettingsGroup
      id={"farmer"}
      title={"Farmer Options"}
      icon={<HiOutlineSquares2X2 className="size-5" />}
    >
      {/* Farmer Title */}
      <SettingsLabel>Farmer Title</SettingsLabel>
      <Input
        disabled={Boolean(import.meta.env.VITE_WHISKER)}
        value={account.title}
        onChange={(ev) => updateActiveAccount({ title: ev.target.value })}
        placeholder="Farmer Title"
      />

      {/* Preferred Theme */}
      {!import.meta.env.VITE_WHISKER ? (
        <>
          <SettingsLabel>Preferred Theme</SettingsLabel>

          <div className="grid grid-cols-3 gap-2">
            {["system", "light", "dark"].map((theme) => (
              <button
                onClick={() =>
                  dispatchAndConfigureSharedSettings("theme", theme)
                }
                key={theme}
                className={cn(
                  sharedSettings.theme === theme
                    ? "bg-blue-200 dark:bg-blue-800"
                    : "bg-neutral-100 dark:bg-neutral-700",
                  "p-2 rounded-lg",
                  "flex gap-1 items-center justify-center",
                  "uppercase"
                )}
              >
                {theme}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* Farmer Mode */}
      <SettingsLabel>Farmer Mode</SettingsLabel>

      <div className="grid grid-cols-2 gap-2">
        {["web", "session"].map((mode) => (
          <SettingsGridButton
            key={mode}
            onClick={() => dispatchAndConfigureSettings("farmerMode", mode)}
            disabled={mode === "session" && telegramClient.hasSession === false}
            className={cn(
              farmerMode === mode
                ? [
                    "bg-blue-200 dark:bg-blue-800",
                    "text-blue-900 dark:text-white",
                  ]
                : null
            )}
          >
            {mode === "web" ? (
              <HiOutlineGlobeAlt className="size-4" />
            ) : (
              <HiBolt className="size-4" />
            )}
            {mode}
          </SettingsGridButton>
        ))}
      </div>

      {/* Telegram */}
      <SettingsLabel>Telegram Client</SettingsLabel>

      <div className="grid grid-cols-2 gap-2">
        {["purrfect-gram", "telegram-web"].map((client) => (
          <SettingsGridButton
            key={client}
            onClick={() =>
              dispatchAndConfigureSharedSettings("telegramClient", client)
            }
            className={cn(
              sharedSettings.telegramClient === client
                ? [
                    "bg-orange-100 dark:bg-orange-500",
                    "text-orange-900 dark:text-white",
                  ]
                : null
            )}
          >
            {client === "purrfect-gram" ? "Purrfect Gram" : "Telegram Web"}
          </SettingsGridButton>
        ))}
      </div>

      {/* Preferred Telegram Web Version */}
      <SettingsLabel>Preferred Telegram Web Version</SettingsLabel>

      <div className="grid grid-cols-2 gap-2">
        {["k", "a"].map((version) => (
          <SettingsGridButton
            key={version}
            onClick={() =>
              dispatchAndConfigureSharedSettings(
                "preferredTelegramWebVersion",
                version
              )
            }
            className={cn(
              sharedSettings.preferredTelegramWebVersion === version
                ? "bg-blue-200 dark:bg-blue-800"
                : null
            )}
          >
            <img
              src={version === "k" ? TelegramWebKIcon : TelegramWebAIcon}
              className="w-6 h-6"
            />
            {`Web-${version.toUpperCase()}`}
          </SettingsGridButton>
        ))}
      </div>

      {/* Show User Info */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("displayUserInfo", ev.target.checked)
        }
        checked={settings?.displayUserInfo}
      >
        Display User Info
      </LabelToggle>

      {/* Show IP Address */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("displayIpAddress", ev.target.checked)
        }
        checked={settings?.displayIpAddress}
      >
        Display IP Address
      </LabelToggle>

      {/* (SHARED) - Show Mini-App Toolbar */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings(
            "showMiniAppToolbar",
            ev.target.checked
          )
        }
        checked={sharedSettings?.showMiniAppToolbar}
      >
        Show Mini-App Toolbar
      </LabelToggle>
    </SettingsGroup>
  );
});
