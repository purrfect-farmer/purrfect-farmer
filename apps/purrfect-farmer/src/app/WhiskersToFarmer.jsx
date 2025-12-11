import Alert from "@/components/Alert";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import cryptoRandomString from "crypto-random-string";
import useAppContext from "@/hooks/useAppContext";
import { cn, postPortMessage } from "@/utils";
import storage from "@/lib/storage";
import Container from "@/components/Container";
import WhiskersIcon from "@/assets/images/whiskers.png?format=webp&w=256";

export default function WhiskersToFarmer() {
  const { messaging, setActiveTab, closeTab } = useAppContext();

  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
  }, [closeTab]);

  const restoreBackupData = (data) => {
    return new Promise(async (resolve) => {
      /** Log Data */
      console.log(data);

      const ACCOUNT_DEFAULT_KEY = "account-default:";
      const { app, backups } = data;

      let accounts = [];
      let chromeNewStorage = {};
      let telegramWebNewStorage = {};
      let i = 1;

      for (const { partition, backup } of backups) {
        /** Find account */
        const account = app.accounts.find(
          (item) => item.partition === partition
        );

        const { chromeLocalStorage, telegramWebLocalStorage } = backup.data;

        /** Generate ID */
        const id =
          i === 1
            ? "default"
            : cryptoRandomString({
                length: 10,
              });

        /** Push account */
        accounts.push({
          id,
          title: account.title,
          telegramInitData: account.telegramInitData,
        });

        for (const [k, v] of Object.entries(chromeLocalStorage)) {
          if (k.startsWith(ACCOUNT_DEFAULT_KEY)) {
            chromeNewStorage[k.replace(ACCOUNT_DEFAULT_KEY, `account-${id}:`)] =
              v;
          }
        }

        telegramWebNewStorage[`account${i}`] =
          telegramWebLocalStorage["account1"];
        i++;
      }

      /** Log new changes */
      console.log({
        accounts,
        chromeNewStorage,
        telegramWebNewStorage,
      });

      if (accounts.length > 0) {
        chromeNewStorage["shared:accounts"] = accounts;
        telegramWebNewStorage["number_of_accounts"] = accounts.length;

        /** Restore Telegram Web Data */
        const restoreTelegramWebData = (data) => {
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

        await restoreTelegramWebData(telegramWebNewStorage);
        await storage.set(chromeNewStorage);

        resolve(true);
      }
    });
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.addEventListener("load", (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const data = json;

          restoreBackupData(data).then(() => toast.success("Backup restored!"));
        } catch (err) {
          console.error(err);
          toast.error("Invalid JSON file!");
        }
      });
      reader.readAsText(file);
    },
    [restoreBackupData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <Container className="flex flex-col justify-center gap-4 p-4 grow">
      <img src={WhiskersIcon} alt="Whiskers Icon" className="mx-auto size-32" />

      <Alert variant={"warning"} className="text-center">
        You are about to restore all data of Whiskers to the Farmer. This
        includes accounts and Telegram Web data.
      </Alert>

      <div
        {...getRootProps()}
        className={cn(
          "border border-dashed border-blue-500",
          "px-4 py-10 w-full",
          "text-center rounded-xl"
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the backup file here ...</p>
        ) : (
          <p>
            Drag 'n' drop the backup file here, or click to select backup file
          </p>
        )}
      </div>
    </Container>
  );
}
