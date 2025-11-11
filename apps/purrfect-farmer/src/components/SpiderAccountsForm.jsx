import { HiOutlineArrowLeft, HiOutlineCurrencyDollar } from "react-icons/hi2";
import { useCallback } from "react";
import PrimaryButton from "./PrimaryButton";
import Input from "./Input";
import { useMutation } from "@tanstack/react-query";
import Spider from "@/lib/Spider";
import { useProgress } from "../hooks/useProgress";
import { Progress } from "./Progress";
import toast from "react-hot-toast";
import LabelToggle from "./LabelToggle";
import useAppContext from "@/hooks/useAppContext";
import cryptoRandomString from "crypto-random-string";
import { setStorageValue } from "@/lib/chrome-storage";
import { postPortMessage } from "@/lib/utils";
import useMirroredState from "@/hooks/useMirroredState";
import useMirroredCallback from "@/hooks/useMirroredCallback";

export default function SpiderAccountsForm({ country, clearSelection }) {
  const {
    messaging,
    setActiveTab,
    closeTab,
    sharedSettings,
    persistedAccounts,
    storePersistedAccounts,
  } = useAppContext();

  /** Close Telegram Web Tabs */
  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
  }, [closeTab]);

  /** Transfer Telegram Web Data */
  const transferTelegramWebData = useCallback(
    async (telegramWebLocalStorage) => {
      /** Update Telegram Web Local Storage */
      const updateTelegramWebLocalStorage = () => {
        return new Promise(async (resolve) => {
          /** Wait for Port */
          messaging.handler.once(
            `port-connected:telegram-web-k`,
            async (port) => {
              /** Get Telegram Web Local Storage */
              const localStorage = await postPortMessage(port, {
                action: "get-local-storage",
              }).then((response) => response.data);

              /** Log Current Local Storage */
              console.log("Current Telegram Web Local Storage:", localStorage);

              /* Determine New Account Number */
              let maxAccount = 0;

              /* Find Max Account Number */
              for (const key in localStorage) {
                const match = key.match(/account(\d+)/);
                if (match) {
                  const accountNumber = parseInt(match[1], 10);
                  if (accountNumber > maxAccount) {
                    maxAccount = accountNumber;
                  }
                }
              }

              /* New Account Number */
              const newAccountNumber = maxAccount + 1;

              /** Updated Local Storage */
              const updatedLocalStorage = {
                ...localStorage,
                [`account${newAccountNumber}`]:
                  telegramWebLocalStorage["account1"],
              };

              /** Log Updated Local Storage */
              console.log(
                "Updated Telegram Web Local Storage:",
                updatedLocalStorage
              );

              /** Set Telegram Web Local Storage */
              await postPortMessage(port, {
                action: "set-local-storage",
                data: updatedLocalStorage,
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

      /** Close Telegram Web Tabs */
      await closeTelegramWeb();

      /** Restore Data */
      await updateTelegramWebLocalStorage();

      /** Activate Spider Tab */
      await setActiveTab("spider");
    },
    [messaging.handler, setActiveTab, closeTelegramWeb]
  );

  /** Spider API Key */
  const spiderApiKey = sharedSettings.spiderApiKey;

  /* Number of Accounts */
  const [
    numberOfAccounts,
    setNumberOfAccounts,
    dispatchAndSetNumberOfAccounts,
  ] = useMirroredState("spider.number-of-accounts", 1);

  /* 2FA Password */
  const [password, setPassword, dispatchAndSetPassword] = useMirroredState(
    "spider.password",
    ""
  );

  /* Enable Local Telegram Session */
  const [
    enableLocalTelegramSession,
    setEnableLocalTelegramSession,
    dispatchAndSetEnableLocalTelegramSession,
  ] = useMirroredState("spider.enable-local-telegram-session", true);

  /* Progress */
  const { progress, resetProgress, incrementProgress } = useProgress();

  /** Country Code */
  const code = country.code;

  /** Calculate Total Price */
  const totalPrice = (numberOfAccounts * country.price).toFixed(2);

  /* Mutation */
  const mutation = useMutation({
    mutationKey: ["purchase-spider-accounts", spiderApiKey, country.code],
    mutationFn: async ({ count, twoFA, enableLocalTelegramSession }) => {
      resetProgress();

      const spider = new Spider(spiderApiKey);
      const results = [];

      console.log("Starting purchase of", count, "accounts");
      console.log("Using 2FA password:", twoFA);

      for (let i = 0; i < count; i++) {
        try {
          const purchase = await spider.purchaseAccount({
            countryCode: country.code,
            enableLocalTelegramSession,
            twoFA,
          });

          /* Validate Purchae */
          if (!purchase.success) {
            throw new Error(
              purchase.error || "Unknown error purchasing account"
            );
          }

          /* Log Purchase */
          console.log("Purchased account from Spider:", purchase);

          /** Destructure Purchase */
          const { account, localTelegramSession, telegramWebLocalStorage } =
            purchase;

          /** New Account */
          const newPersistedAccount = {
            id: cryptoRandomString({
              length: 10,
            }),
            title: `Spider ${account["phone"]}`,
            telegramInitData: null,
          };

          /** Store Account */
          await storePersistedAccounts([
            ...persistedAccounts,
            newPersistedAccount,
          ]);

          /* Store Local Telegram Session if Enabled */
          if (enableLocalTelegramSession) {
            await setStorageValue(
              `account-${newPersistedAccount.id}:local-telegram-session`,
              localTelegramSession
            );

            await setStorageValue(
              `account-${newPersistedAccount.id}:settings`,
              {
                farmerMode: "session",
                onboarded: true,
              }
            );
          }

          try {
            /* Transfer Telegram Web Local Storage */
            await transferTelegramWebData(telegramWebLocalStorage);
          } catch (e) {
            console.error("Error transferring Telegram Web data:", e);
          }

          /* Push Result */
          results.push(purchase);
        } catch (error) {
          console.error("Error purchasing account:", error);
          results.push({ success: false, error: error.message });
        } finally {
          incrementProgress();
        }
      }

      return results;
    },
  });

  /** Purchase Accounts */
  const [purchaseAccounts, dispatchAndPurchaseAccounts] = useMirroredCallback(
    "spider.purchase-accounts",
    async () => {
      /* Log Purchase Details */
      console.log("Purchasing", numberOfAccounts, "accounts for country", code);

      /* Log 2FA Password */
      console.log("Using 2FA password:", password);

      /* Execute Mutation */
      const results = await mutation.mutateAsync({
        count: numberOfAccounts,
        twoFA: password,
        enableLocalTelegramSession,
      });

      /* Log Results */
      console.log("Purchase results:", results);

      /* Toast Completion */
      toast.success("Account purchase process completed.");
    },
    [
      enableLocalTelegramSession,
      numberOfAccounts,
      password,
      mutation,
      country.code,
    ]
  );

  return (
    <>
      {/* Country Information */}
      <h2 className="text-lg flex justify-center items-center gap-2 text-orange-500 font-bold">
        <span>{country.emoji}</span>
        {country.name} ({country.code})
      </h2>

      {/* Country Price */}
      <div className="flex flex-col gap-1">
        <p className="text-center text-sky-500 dark:text-sky-300 font-bold">
          ${country.price} (Per Account)
        </p>

        <p className="text-center text-purple-500 dark:text-purple-300 font-bold">
          Total: ${totalPrice}
        </p>
      </div>

      {/* Return to Countries */}
      <button
        onClick={clearSelection}
        className="flex justify-center items-center gap-2 text-sm text-orange-500 hover:underline"
      >
        <HiOutlineArrowLeft className="size-4" /> Return to Countries
      </button>

      {/* Number of Accounts */}
      <div className="flex flex-col-reverse gap-1">
        <p className="text-neutral-500 dark:text-neutral-400 px-1">
          Number of accounts to purchase
        </p>
        <Input
          value={numberOfAccounts}
          onChange={(ev) => dispatchAndSetNumberOfAccounts(ev.target.value)}
          disabled={mutation.isPending}
        />
      </div>

      {/* Enable Local Telegram Session */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndSetEnableLocalTelegramSession(ev.target.checked)
        }
        checked={enableLocalTelegramSession}
        disabled={mutation.isPending}
      >
        Enable Local Telegram Session
      </LabelToggle>

      {/* 2FA */}
      <Input
        placeholder="2FA (Optional)"
        value={password}
        disabled={mutation.isPending}
        onChange={(e) => dispatchAndSetPassword(e.target.value)}
      />

      {/* 2FA Information */}
      <p className="text-center text-neutral-500 dark:text-neutral-400 px-2">
        Leave empty if you do not want to change the 2FA password of the new
        accounts.
      </p>

      {/* Purchase Button */}
      <PrimaryButton
        onClick={() => dispatchAndPurchaseAccounts()}
        disabled={mutation.isPending}
      >
        <HiOutlineCurrencyDollar className="size-5" />
        {mutation.isPending ? "Purchasing..." : "Purchase Accounts"}
      </PrimaryButton>

      {/* Progress */}
      {mutation.isPending && (
        <Progress current={progress} max={numberOfAccounts} />
      )}
    </>
  );
}
