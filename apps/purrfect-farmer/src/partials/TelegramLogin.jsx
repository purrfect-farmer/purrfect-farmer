import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { CgSpinner } from "react-icons/cg";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import TelegramLoginCodeForm from "./TelegramLoginCodeForm";
import TelegramLoginPasswordForm from "./TelegramLoginPasswordForm";
import TelegramLoginPhoneForm from "./TelegramLoginPhoneForm";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { cn, postPortMessage } from "@/utils";
import { MemorySession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import { AuthKey } from "telegram/crypto/AuthKey";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { HiBolt } from "react-icons/hi2";

/** Create Telegram Client from Session Details */
const getTelegramClientFromSession = async (details) => {
  /* Create Session and Client */
  const session = new MemorySession();
  const client = new TelegramClient(
    session,
    2496,
    "8da85b0d5bfe62527e5b244c209159c3",
    {
      appVersion: "2.2 K",
      systemLangCode: "en-US",
      langCode: "en",
      deviceModel: navigator.userAgent,
      systemVersion: navigator.platform,
      useWSS: true,
    }
  );

  /* Get DC Info */
  const info = await client.getDC(details.dcId);
  console.log("DC Info:", info);

  /* Set Auth Key */
  const authKeyHex = details[`dc${info.id}_auth_key`];
  const authKey = new AuthKey();
  authKey.setKey(Buffer.from(authKeyHex, "hex"));

  /* Set Session Details */
  session.setDC(info.id, info.ipAddress, info.port);
  session.setAuthKey(authKey, info.id);

  /* Connect Client */
  await client.connect();

  /* Check Authorization */
  const isAuthorized = await client.isUserAuthorized();
  console.log("Is Client Authorized?", isAuthorized);

  if (isAuthorized) {
    return client;
  } else {
    await client.destroy();
    return null;
  }
};

/**
 * Get Auth Code from Telegram Messages
 * @param {import("telegram").TelegramClient} client
 * @returns {Promise<string>}
 */
const getAuthCode = (client) => {
  return new Promise((resolve) => {
    /* Add New Message Handler to the SAME client before connecting */
    client.addEventHandler(
      /**
       * @param {NewMessageEvent} event
       */
      (event) => {
        /* Extract Auth Code from Message */
        console.log("New message event received:", event.message);
        const message = event.message?.message || "";
        const match = message.match(/(\d{5})/);

        if (match) {
          const authCodeMessage = match[1];
          console.log("Extracted auth code:", authCodeMessage);

          resolve(authCodeMessage);
        }
      },
      new NewMessage({
        fromUsers: [777000],
      })
    );
  });
};

export default function TelegramLogin({
  mode = "cloud",
  storeTelegramSession,
}) {
  const { account, telegramClient, messaging, closeTab, setActiveTab } =
    useAppContext();
  const [stage, setStage] = useState("phone");
  const [tempSession, setTempSession] = useState(null);
  const [phone, setPhone] = useState(null);
  const [code, setCode] = useState(null);
  const [handlers, setHandlers] = useState({
    phone: null,
    code: null,
    password: null,
  });

  const [initialized, setInitialized] = useState(mode === "cloud");

  const processingRef = useRef({
    resolve: null,
    reject: null,
  });

  /** Phone Login */
  const handleCloudPhoneLogin = useCallback((data) => {
    /** Set Session */
    setTempSession(data.session);

    /** Set Stage */
    setStage("code");
  }, []);

  /** Code Error */
  const handleCloudCodeError = useCallback(() => {
    setStage("phone");
  }, []);

  /** Code Confirmation */
  const handleCloudCodeConfirmation = useCallback(
    (data) => {
      if (data.stage === "password") {
        /** Set Stage */
        setStage("password");
      } else {
        /** Set Session */
        storeTelegramSession(tempSession);
      }
    },
    [storeTelegramSession, tempSession]
  );

  /** Password Confirmation */
  const handleCloudPasswordConfirmation = useCallback(() => {
    /** Set Session */
    storeTelegramSession(tempSession);
  }, [storeTelegramSession, tempSession]);

  /** Set Processing Resolver */
  const setProcessingResolver = useCallback(() => {
    return new Promise((resolve, reject) => {
      processingRef.current = { resolve, reject };
    });
  }, []);

  /** Create Handler */
  const createHandler = useCallback(
    (stage) => () =>
      new Promise((resolve) => {
        /** Resolve Previous */
        processingRef.current?.resolve?.();

        /** Set Stage */
        setStage(stage);

        /** Store Handler */
        setHandlers((prev) => ({
          ...prev,
          [stage]: (data) => {
            resolve(data);
            return setProcessingResolver();
          },
        }));
      }),
    [setStage, setHandlers, setProcessingResolver]
  );

  /** Close Telegram Web Tabs */
  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
  }, [closeTab]);

  /** Quick Sign-In */
  const [, dispatchAndHandleQuickSignIn] = useMirroredCallback(
    "app.quick-telegram-sign-in",
    async () => {
      /** Get Telegram Web Local Storage */
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

      /** Auto-fill Code */
      const autoFillCode = async () => {
        /** Close Telegram Web Tabs */
        await closeTelegramWeb();

        /** Get Data */
        const currentLocalStorage = await getTelegramWebLocalStorage();
        console.log(
          "Current Telegram Web Local Storage Retrieved:",
          currentLocalStorage
        );

        /** Get Account Data */
        const index = account.index + 1;
        const webAccount = currentLocalStorage[`account${index}`];

        if (webAccount) {
          /* Parse Details */
          const details = JSON.parse(webAccount);
          console.log("Web Account Details:", details);

          /* Create Client from Session */
          const client = await getTelegramClientFromSession(details);
          if (client) {
            console.log("Telegram Client from Session:", client);

            await new Promise(async (resolve) => {
              /* Get User */
              const user = await client.getMe();
              console.log("Logged in User:", user);

              /* Add New Message Handler to the SAME client before connecting */
              getAuthCode(client).then((authCodeMessage) => {
                console.log("Auth Code Message Retrieved:", authCodeMessage);

                /** Set Code */
                setCode(authCodeMessage);

                /** Destroy Client */
                client.destroy();

                /** Resolve */
                resolve();
              });

              /** Set Phone */
              setPhone(user.phone);
            });
          } else {
            throw new Error("Failed to create Telegram client from session.");
          }
        }
      };

      /** Toast */
      toast.promise(autoFillCode(), {
        loading: "Attempting Quick Sign-In...",
        success: "Quick Sign-In Successful!",
        error: "Quick Sign-In Failed!",
      });
    },
    [messaging.handler, account, setActiveTab, closeTelegramWeb]
  );

  /** Run a client in local mode */
  useEffect(() => {
    if (mode === "local") {
      /** Set Promise */
      setProcessingResolver().then(() => {
        setInitialized(true);
      });

      /** Create Client */
      const client = createTelegramClient();

      /** Start Client */
      client
        .start({
          phoneNumber: createHandler("phone"),
          phoneCode: createHandler("code"),
          password: createHandler("password"),

          onError: (error) => {
            /** Log Error */
            console.error(error);

            /** Reject */
            processingRef.current?.reject?.(error);

            /** Toast */
            toast.error(error?.message || "An error occurred!");
          },
        })
        .then((session) => {
          /** Set Client */
          telegramClient.ref.current = client;

          /** Store Session */
          storeTelegramSession(session);
        });

      return () => {
        client.isUserAuthorized().then((status) => {
          if (status === false) {
            client.destroy();
          }
        });
      };
    }
  }, [
    mode,
    createHandler,
    setInitialized,
    setProcessingResolver,
    storeTelegramSession,
  ]);

  return initialized ? (
    <>
      {stage === "password" ? (
        // Password Stage
        <TelegramLoginPasswordForm
          mode={mode}
          session={tempSession}
          handler={handlers.password}
          onSuccess={handleCloudPasswordConfirmation}
        />
      ) : stage === "code" ? (
        // Code Stage
        <TelegramLoginCodeForm
          mode={mode}
          code={code}
          session={tempSession}
          handler={handlers.code}
          onSuccess={handleCloudCodeConfirmation}
          onError={handleCloudCodeError}
        />
      ) : (
        // Phone Stage
        <TelegramLoginPhoneForm
          mode={mode}
          phone={phone}
          session={tempSession}
          handler={handlers.phone}
          onSuccess={handleCloudPhoneLogin}
        />
      )}

      {/* Quick Sign-in button */}
      {stage === "phone" && (
        <button
          onClick={() => dispatchAndHandleQuickSignIn()}
          className={cn(
            "text-center text-orange-500",
            "flex items-center justify-center gap-2"
          )}
        >
          <HiBolt className="w-5 h-5" />
          Quick Sign-In
        </button>
      )}
    </>
  ) : (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  );
}
