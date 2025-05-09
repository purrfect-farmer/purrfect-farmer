import Alert from "@/components/Alert";
import AppIcon from "@/assets/images/icon.png?format=webp&w=192";
import PrimaryButton from "@/components/PrimaryButton";
import defaultSettings from "@/core/defaultSettings";
import defaultSharedSettings from "@/core/defaultSharedSettings";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { cn } from "@/lib/utils";
import { kebabCase } from "change-case";
export default function Migrate() {
  const {
    account,
    reloadApp,
    settings,
    sharedSettings,
    storeSharedSettings,
    updateActiveAccount,
  } = useAppContext();

  const [, dispatchAndMigrate] = useMirroredCallback(
    "app.migrate-to-v2",
    async () => {
      if (typeof chrome?.storage?.local === "undefined") {
        toast.error("Bridge is Missing!");
      } else {
        /** Is PascalCase */
        const isPascalCase = (key) => /^[a-zA-Z]+$/.test(key);

        /** Get Updated Key */
        const getUpdatedKey = (key) => {
          if (key.startsWith("clicker:")) {
            return `shared:${key}`;
          } else {
            return `account-${account.id}:${
              isPascalCase(key) ? kebabCase(key) : key
            }`;
          }
        };

        /** Retrieve Storage */
        const storage = await chrome.storage.local.get(null);

        /** Get Old Items */
        const items = Object.fromEntries(
          Object.entries(storage).filter(
            ([k]) => !/^shared:|account-[a-z\d]+:/.test(k)
          )
        );

        /** Keys to Remove */
        const keysToRemove = Object.keys(items);

        /** Mapped Items */
        const mapped = Object.fromEntries(
          Object.entries(items).map(([k, v]) => [getUpdatedKey(k), v])
        );

        /** New Account Data */
        const newAccountData = {
          ["title"]: items?.["settings"]?.["farmerTitle"] || account.title,
          ["telegramInitData"]:
            items?.["telegramInitData"] || account.telegramInitData,
        };

        /** Update Settings */
        if (items["settings"]) {
          const SETTINGS_KEY = Object.keys(defaultSettings);
          const SHARED_SETTINGS_KEY = Object.keys(defaultSharedSettings);

          /** Imported Settings */
          const importedSettings = Object.fromEntries(
            Object.entries(items["settings"]).filter(([k]) =>
              SETTINGS_KEY.includes(k)
            )
          );

          /** Imported Shared Settings */
          const importedSharedSettings = Object.fromEntries(
            Object.entries(items["settings"]).filter(([k]) =>
              SHARED_SETTINGS_KEY.includes(k)
            )
          );

          /** Update Settings */
          mapped[getUpdatedKey("settings")] = {
            ...settings,
            ...importedSettings,
          };

          /** Update Shared Settings */
          await storeSharedSettings({
            ...sharedSettings,
            ...importedSharedSettings,
          });
        }

        /** Delete Items */
        delete mapped[getUpdatedKey("blum.keywords")];
        delete mapped[getUpdatedKey("userAgent")];
        delete mapped[getUpdatedKey("telegramUser")];
        delete mapped[getUpdatedKey("telegramInitData")];

        await chrome.storage.local.set(mapped);
        await chrome.storage.local.remove(keysToRemove);

        await updateActiveAccount(newAccountData);
        await reloadApp(true);
      }
    },
    [
      account,
      reloadApp,
      settings,
      sharedSettings,
      storeSharedSettings,
      updateActiveAccount,
    ]
  );

  return (
    <div
      className={cn(
        "flex flex-col justify-center min-w-0 min-h-0 gap-4 p-4 grow"
      )}
    >
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={AppIcon} className="size-24" />
        <h1 className="font-turret-road text-center text-3xl text-orange-500">
          Migrate to V2
        </h1>
      </div>

      <Alert variant={"warning"}>
        You are about to migrate all previous data from{" "}
        <span className="font-bold">v1</span> to{" "}
        <span className="font-bold">v2</span>
      </Alert>

      <PrimaryButton onClick={() => dispatchAndMigrate()}>
        Migrate
      </PrimaryButton>
    </div>
  );
}
