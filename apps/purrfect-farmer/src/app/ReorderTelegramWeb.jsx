import ReorderTelegramWebIcon from "@/assets/images/reorder-telegram-web.png?format=webp&w=256";
import Alert from "@/components/Alert";
import Container from "@/components/Container";
import PrimaryButton from "@/components/PrimaryButton";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import toast from "react-hot-toast";

export default function ReorderTelegramWeb() {
  const { accounts, messaging, closeTab, setActiveTab } = useAppContext();

  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
  }, [closeTab]);

  const [, dispatchAndReorderAccounts] = useMirroredCallback(
    "app.reorder-telegram-web",
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

          /** Open Telegram Web  */
          setActiveTab("telegram-web-k");
        });
      };

      const updateTelegramWebLocalStorage = (data) => {
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

          /** Open Telegram Web */
          setActiveTab("telegram-web-k");
        });
      };

      const transferData = async () => {
        /** Close Telegram Web Tabs */
        await closeTelegramWeb();

        /** Get Data */
        const currentLocalStorage = await getTelegramWebLocalStorage();

        console.log(
          "Current Telegram Web Local Storage Retrieved:",
          currentLocalStorage
        );

        /** Extract Telegram Accounts */
        const telegramAccounts = [];

        for (const key in currentLocalStorage) {
          const match = key.match(/account(\d+)/);
          if (match) {
            telegramAccounts.push(JSON.parse(currentLocalStorage[key]));
            delete currentLocalStorage[key];
          }
        }
        console.log("Telegram Accounts Before Reorder:", telegramAccounts);

        /** Reorder Accounts */
        const ids = accounts
          .map((acc) => acc.user?.id?.toString())
          .filter(Boolean);

        console.log("Desired Order of User IDs:", ids);

        const reorderedTelegramAccounts = telegramAccounts
          .filter((acc) => acc.userId)
          .sort(
            (a, b) =>
              ids.indexOf(a.userId.toString()) -
              ids.indexOf(b.userId.toString())
          );

        console.log(
          "Telegram Accounts After Reorder:",
          reorderedTelegramAccounts
        );

        /** Prepare Updated Local Storage */
        const updatedLocalStorage = {
          ...currentLocalStorage,
          ["number_of_accounts"]: reorderedTelegramAccounts.length,
        };

        reorderedTelegramAccounts.forEach((account, index) => {
          updatedLocalStorage[`account${index + 1}`] = JSON.stringify(account);
        });

        console.log(
          "Updated Telegram Web Local Storage to be Set:",
          updatedLocalStorage
        );

        /** Update Telegram Web Local Storage */
        await updateTelegramWebLocalStorage(updatedLocalStorage);
      };

      await transferData();
      toast.success("Accounts reordered successfully!");
    },
    [messaging.handler, accounts, setActiveTab, closeTelegramWeb]
  );

  return (
    <Container className="flex flex-col justify-center gap-4 p-4 grow">
      <img
        src={ReorderTelegramWebIcon}
        alt="Reorder Telegram Web Icon"
        className="mx-auto size-32 rounded-full"
      />

      <Alert variant={"warning"} className="text-center">
        You are about to reorder the list of accounts in Telegram Web to match
        the ones within the farmer.
      </Alert>

      <PrimaryButton onClick={() => dispatchAndReorderAccounts()}>
        Reorder Accounts
      </PrimaryButton>
    </Container>
  );
}
