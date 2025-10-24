import Alert from "@/components/Alert";
import PrimaryButton from "@/components/PrimaryButton";
import { Browser } from "@/core/tabs";
import useAppContext from "@/hooks/useAppContext";
import { useCallback } from "react";
import TelegramIcon from "@/assets/images/telegram-logo.svg";
import { createElement } from "react";
import { postPortMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import useMirroredCallback from "@/hooks/useMirroredCallback";

export default function TelegramToPurrfectGram() {
  const { messaging, setActiveTab, closeTab, pushTab } = useAppContext();

  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
    closeTab("browser-telegram-web");
  }, [closeTab]);

  const [, dispatchAndTransferData] = useMirroredCallback(
    "app.telegram-to-purrfect-gram",
    async () => {
      const getTelegramWebLocalStorage = () => {
        return new Promise((resolve) => {
          messaging.handler.once(
            `port-connected:telegram-web-k`,
            async (port) => {
              /** Get Telegram Web Local Storage */
              const telegramWebLocalStorage = await postPortMessage(port, {
                action: "get-local-storage",
              }).then((response) => response.data);

              /** Close Telegram Web */
              closeTelegramWeb();

              /** Resolve */
              resolve(telegramWebLocalStorage);
            }
          );

          /** Open Telegram Web */
          pushTab(
            {
              id: "browser-telegram-web",
              title: "Telegram Web",
              icon: TelegramIcon,
              component: createElement(Browser, {
                url: "https://web.telegram.org/k",
              }),
              reloadedAt: Date.now(),
            },
            true
          );
        });
      };

      const restoreData = (data) => {
        return new Promise(async (resolve) => {
          /** Wait for Port */
          messaging.handler.once(
            `port-connected:telegram-web-k`,
            async (port) => {
              /** Set Telegram Web Local Storage */
              await postPortMessage(port, {
                action: "set-local-storage",
                data: data,
              });

              /** Close Telegram Web */
              closeTelegramWeb();

              /** Resolve */
              resolve(true);
            }
          );

          /** Open Purrfect Gram */
          setActiveTab("telegram-web-k");
        });
      };

      const transferData = async () => {
        /** Close Telegram Web Tabs */
        await closeTelegramWeb();

        /** Get Data */
        const data = await getTelegramWebLocalStorage();

        /** Restore Data */
        await restoreData(data);
      };

      await transferData();
      toast.success("Data transferred successfully!");
    },
    [messaging.handler, setActiveTab, pushTab, closeTelegramWeb]
  );

  return (
    <div className="flex flex-col gap-4 grow p-4">
      <Alert variant={"info"} className="text-center">
        You are about to migrate all data from Telegram Web into Purrfect Gram.
      </Alert>

      <PrimaryButton onClick={() => dispatchAndTransferData()}>
        Transfer Now
      </PrimaryButton>
    </div>
  );
}
