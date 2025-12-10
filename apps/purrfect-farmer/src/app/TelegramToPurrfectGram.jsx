import Alert from "@/components/Alert";
import PrimaryButton from "@/components/PrimaryButton";
import { Browser } from "@/core/tabs";
import useAppContext from "@/hooks/useAppContext";
import { useCallback } from "react";
import TelegramIcon from "@/assets/images/telegram-logo.svg";
import { createElement } from "react";
import { cn, postPortMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import Tabs from "@/components/Tabs";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import Container from "@/components/Container";

const TabContent = ({ title, children, ...props }) => (
  <Tabs.Content
    {...props}
    className={cn("flex flex-col min-w-0 min-h-0 grow", "overflow-auto")}
  >
    <Container className="flex flex-col gap-4 p-4 my-auto">
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={TelegramIcon} className="size-24" />
        <h1 className="font-turret-road text-center text-2xl text-orange-500">
          {title}
        </h1>
      </div>

      {children}
    </Container>
  </Tabs.Content>
);

export default function TelegramToPurrfectGram() {
  const tabs = useMirroredTabs("telegram-web-transfer", [
    "purrfect-gram",
    "telegram-web",
  ]);
  const { messaging, closeTab, pushTab } = useAppContext();

  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
    closeTab("telegram-web-browser");
  }, [closeTab]);

  const openTelegramWeb = useCallback(
    (url) => {
      pushTab(
        {
          id: "telegram-web-browser",
          title: "Telegram Web",
          icon: TelegramIcon,
          component: createElement(Browser, {
            url,
          }),
          reloadedAt: Date.now(),
        },
        true
      );
    },
    [pushTab]
  );

  const [, dispatchAndTransferData] = useMirroredCallback(
    "app.telegram-to-purrfect-gram",
    async (receiver = "telegram-web") => {
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

          /** Open Telegram Web (Sender) */
          openTelegramWeb(
            receiver === "telegram-web"
              ? "https://gram.purrfectfarmer.com/k"
              : "https://web.telegram.org/k"
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

          /** Open Telegram Web (Receiver) */
          openTelegramWeb(
            receiver === "telegram-web"
              ? "https://web.telegram.org/k"
              : "https://gram.purrfectfarmer.com/k"
          );
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
    [messaging.handler, openTelegramWeb, closeTelegramWeb]
  );

  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto">
      <TabContent value="purrfect-gram" title={"Purrfect Gram"}>
        <Alert variant={"warning"} className="text-center">
          You are about to migrate all data from Telegram Web into Purrfect
          Gram.
        </Alert>

        <PrimaryButton onClick={() => dispatchAndTransferData("purrfect-gram")}>
          Transfer Now
        </PrimaryButton>
      </TabContent>

      <TabContent value="telegram-web" title={"Telegram Web"}>
        <Alert variant={"warning"} className="text-center">
          You are about to migrate all data from Purrfect Gram into Telegram
          Web.
        </Alert>

        <PrimaryButton onClick={() => dispatchAndTransferData("telegram-web")}>
          Transfer Now
        </PrimaryButton>
      </TabContent>
    </Tabs>
  );
}
