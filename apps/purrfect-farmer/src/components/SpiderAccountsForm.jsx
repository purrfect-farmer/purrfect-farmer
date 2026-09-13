import {
  HiOutlineArrowLeft,
  HiOutlineCurrencyDollar,
  HiXMark,
} from "react-icons/hi2";
import { useCallback, useRef } from "react";
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
import { postPortMessage } from "@/utils";
import useMirroredState from "@/hooks/useMirroredState";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import storage from "@/lib/storage";
import Container from "./Container";
import Slider from "./Slider";

export default function SpiderAccountsForm({ country, clearSelection }) {
  /* Abort Controller for the Running Purchase */
  const abortControllerRef = useRef(null);

  const {
    messaging,
    setActiveTab,
    closeTab,
    sharedSettings,
    persistedAccounts,
    storePersistedAccounts,
    dispatchAndSetShowAccountPicker,
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
              const currentLocalStorage = await postPortMessage(port, {
                action: "get-local-storage",
              }).then((response) => response.data);

              /** Log Current Local Storage */
              console.log(
                "Current Telegram Web Local Storage:",
                currentLocalStorage
              );

              /* Determine New Account Number */
              let maxAccount = 0;

              /* Find Max Account Number */
              for (const key in currentLocalStorage) {
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
                ...currentLocalStorage,
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
              resolve(newAccountNumber);
            }
          );

          /** Open Purrfect Gram */
          setActiveTab("telegram-web-k");
        });
      };

      /** Close Telegram Web Tabs */
      await closeTelegramWeb();

      /** Restore Data */
      const newAccountNumber = await updateTelegramWebLocalStorage();

      /** Activate Spider Tab */
      await setActiveTab("spider");

      return newAccountNumber;
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

  /* Batch Size */
  const [batch, setBatch, dispatchAndSetBatch] = useMirroredState(
    "spider.batch",
    1
  );

  /* Title Prefix */
  const [titlePrefix, setTitlePrefix, dispatchAndSetTitlePrefix] =
    useMirroredState("spider.title-prefix", "");

  /* Starting Number */
  const [startNumber, setStartNumber, dispatchAndSetStartNumber] =
    useMirroredState("spider.start-number", 1);

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

  /** Maximum purchasable accounts (available stock) */
  const maxCount = country?.quantity ?? 0;

  /** Exceeds available stock */
  const exceedsStock = numberOfAccounts > maxCount;

  /** Preview the titles the current prefix would produce */
  const titlePreview = titlePrefix
    ? numberOfAccounts > 1
      ? `${titlePrefix}${startNumber} … ${titlePrefix}${
          startNumber + numberOfAccounts - 1
        }`
      : `${titlePrefix}${startNumber}`
    : "Spider <phone number>";

  /* Mutation */
  const mutation = useMutation({
    mutationKey: ["purchase-spider-accounts", spiderApiKey, country.code],
    mutationFn: async ({
      count,
      batch,
      twoFA,
      enableLocalTelegramSession,
      titlePrefix,
      startNumber,
    }) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      resetProgress();

      const spider = new Spider(spiderApiKey);
      const results = [];

      /* Accumulate locally so a batch never writes a stale accounts list */
      const accounts = [...persistedAccounts];

      console.log("Starting purchase of", count, "accounts");
      console.log("Purchasing in batch:", batch);
      console.log("Using 2FA password:", twoFA);

      for (let i = 0; i < count; i += batch) {
        if (controller.signal.aborted) break;

        /* Purchase the Chunk in Parallel (network only) */
        const purchases = await Promise.all(
          Array.from({ length: Math.min(batch, count - i) }, async (_, j) => {
            /* Fix the account's number before the chunk runs in parallel */
            const index = i + j;

            try {
              if (controller.signal.aborted) {
                return { index, aborted: true };
              }

              const purchase = await spider.purchaseAccount({
                countryCode: country.code,
                enableLocalTelegramSession,
                twoFA,
              });

              /* Validate Purchase */
              if (!purchase.success) {
                throw new Error(
                  purchase.error || "Unknown error purchasing account"
                );
              }

              return { index, purchase };
            } catch (error) {
              console.error("Error purchasing account:", error);
              return { index, error };
            }
          })
        );

        /**
         * Store the Chunk Sequentially
         *
         * `transferTelegramWebData` drives the single shared Telegram Web tab
         * and every account is appended to the same persisted accounts list,
         * so this half can never run in parallel.
         */
        for (const { index, purchase, error, aborted } of purchases) {
          if (aborted) continue;

          try {
            if (error) throw error;

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
              title: titlePrefix
                ? `${titlePrefix}${startNumber + index}`
                : `Spider ${account["phone"]}`,
              telegramInitData: null,
            };

            /** Store Account */
            accounts.push(newPersistedAccount);
            await storePersistedAccounts([...accounts]);

            /* Store Local Telegram Session if Enabled */
            if (enableLocalTelegramSession) {
              await storage.set(
                `account-${newPersistedAccount.id}:local-telegram-session`,
                localTelegramSession
              );

              await storage.set(`account-${newPersistedAccount.id}:settings`, {
                farmerMode: "session",
                onboarded: true,
              });
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
            console.error("Error storing account:", error);
            results.push({ success: false, error: error.message });
          } finally {
            incrementProgress();
          }
        }
      }

      return results;
    },
  });

  /** Purchase Accounts */
  const [purchaseAccounts, dispatchAndPurchaseAccounts] = useMirroredCallback(
    "spider.purchase-accounts",
    async () => {
      /* Prevent purchasing above available quantity */
      if (numberOfAccounts > maxCount) {
        toast.error(`Only ${maxCount} account(s) available for this country.`);
        return;
      }

      /* Log Purchase Details */
      console.log("Purchasing", numberOfAccounts, "accounts for country", code);

      /* Log 2FA Password */
      console.log("Using 2FA password:", password);

      /* Execute Mutation */
      const results = await mutation.mutateAsync({
        count: numberOfAccounts,
        batch,
        twoFA: password,
        enableLocalTelegramSession,
        titlePrefix,
        startNumber,
      });

      /* Log Results */
      console.log("Purchase results:", results);

      /* Toast Completion */
      toast.success("Account purchase process completed.");

      /** Show Account Picker */
      dispatchAndSetShowAccountPicker(true);
    },
    [
      dispatchAndSetShowAccountPicker,
      enableLocalTelegramSession,
      numberOfAccounts,
      batch,
      titlePrefix,
      startNumber,
      maxCount,
      password,
      mutation,
      country.code,
    ]
  );

  /** Cancel Purchase */
  const [cancelPurchase, dispatchAndCancelPurchase] = useMirroredCallback(
    "spider.cancel-purchase",
    () => {
      abortControllerRef.current?.abort?.();
      toast.success("Initiated cancellation...");
    },
    []
  );

  return (
    <Container className="flex flex-col gap-2 p-0 px-2">
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

        <p className="text-center text-emerald-500 dark:text-emerald-300 font-bold">
          {maxCount} available
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

      {/* Batch */}
      <div className="flex flex-col">
        <label className="text-orange-500 text-center">
          Batch: <span className="font-bold">{batch}</span>
        </label>
        <Slider
          step={1}
          min={1}
          max={3}
          value={[batch]}
          onValueChange={(value) => dispatchAndSetBatch(value[0])}
          disabled={mutation.isPending}
        />
      </div>

      {/* Title Prefix */}
      <Input
        placeholder="Title Prefix (Optional)"
        value={titlePrefix}
        disabled={mutation.isPending}
        onChange={(e) => dispatchAndSetTitlePrefix(e.target.value)}
      />

      {/* Starting Number */}
      {titlePrefix ? (
        <div className="flex flex-col-reverse gap-1">
          <p className="text-neutral-500 dark:text-neutral-400 px-1">
            Starting number
          </p>
          <Input
            value={startNumber}
            onChange={(ev) =>
              dispatchAndSetStartNumber(
                Math.max(1, parseInt(ev.target.value) || 1)
              )
            }
            disabled={mutation.isPending}
          />
        </div>
      ) : null}

      {/* Title Preview */}
      <p className="text-center text-neutral-500 dark:text-neutral-400 px-2">
        Accounts will be named{" "}
        <span className="font-bold text-orange-500">{titlePreview}</span>
      </p>

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
        disabled={mutation.isPending || exceedsStock}
      >
        <HiOutlineCurrencyDollar className="size-5" />
        {mutation.isPending ? "Purchasing..." : "Purchase Accounts"}
      </PrimaryButton>

      {/* Progress */}
      {mutation.isPending && (
        <Progress current={progress} max={numberOfAccounts} />
      )}

      {/* Cancel Button */}
      {mutation.isPending ? (
        <button
          onClick={() => dispatchAndCancelPurchase()}
          className="p-2 text-red-500 inline-flex justify-center items-center gap-2"
        >
          <HiXMark className="size-5" />
          Cancel operation
        </button>
      ) : null}
    </Container>
  );
}
