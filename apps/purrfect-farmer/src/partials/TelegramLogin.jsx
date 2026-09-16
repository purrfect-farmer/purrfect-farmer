import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import TelegramLoginCodeForm from "./TelegramLoginCodeForm";
import TelegramLoginPasswordForm from "./TelegramLoginPasswordForm";
import TelegramLoginPhoneForm from "./TelegramLoginPhoneForm";
import useAppContext from "@/hooks/useAppContext";
import useAuthorizedTelegramClient from "@/hooks/useAuthorizedTelegramClient";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useTelegramLoginTokenConfirmMutation from "@/hooks/useTelegramLoginTokenConfirmMutation";
import useTelegramLoginTokenMutation from "@/hooks/useTelegramLoginTokenMutation";
import { cn } from "@/utils";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { HiBolt } from "react-icons/hi2";
import {
  acceptLoginToken,
  finalizeLoginToken,
  requestLoginToken,
} from "@purrfect/shared/utils/loginToken.js";

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
      }),
    );
  });
};

export default function TelegramLogin({
  mode = "cloud",
  storeTelegramSession,
}) {
  const { telegramClient } = useAppContext();
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

  /** Cloud Login Token Mutations */
  const loginTokenMutation = useTelegramLoginTokenMutation();
  const loginTokenConfirmMutation = useTelegramLoginTokenConfirmMutation();

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
    [storeTelegramSession, tempSession],
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
    [setStage, setHandlers, setProcessingResolver],
  );

  /** Telegram Web is the only authorized client during sign-in, since there is no session yet */
  const { getClientFromTelegramWeb: getAuthorizedClient } =
    useAuthorizedTelegramClient();

  /**
   * Quick Sign-In
   *
   * Auto-fills the phone and the login code sent by Telegram (777000).
   */
  const [, dispatchAndHandleQuickSignIn] = useMirroredCallback(
    "app.quick-telegram-sign-in",
    async () => {
      /** Auto-fill Code */
      const autoFillCode = async () => {
        const client = await getAuthorizedClient();
        console.log("Telegram Client from Session:", client);

        try {
          /* Get User */
          const user = await client.getMe();
          console.log("Logged in User:", user);

          /* Listen for the Code BEFORE triggering the login request */
          const authCode = getAuthCode(client);

          /** Set Phone */
          setPhone(user.phone);

          /** Set Code */
          const authCodeMessage = await authCode;
          console.log("Auth Code Message Retrieved:", authCodeMessage);

          setCode(authCodeMessage);
        } finally {
          await client.destroy().catch(() => {});
        }
      };

      /** Toast */
      toast.promise(autoFillCode(), {
        loading: "Attempting Quick Sign-In...",
        success: "Quick Sign-In Successful!",
        error: "Quick Sign-In Failed!",
      });
    },
    [getAuthorizedClient],
  );

  /**
   * Quick Token Login
   *
   * Mints a login token on the new client and has the already-authorized
   * Telegram Web client accept it.
   */
  const [, dispatchAndHandleQuickTokenLogin] = useMirroredCallback(
    "app.quick-telegram-token-login",
    async () => {
      /** Sign in locally by minting a brand-new session */
      const signInLocally = async (authorizedClient) => {
        /** Create Client */
        const client = createTelegramClient();

        try {
          /** Connect Without Authenticating */
          await client.connect();

          /** Export Login Token */
          const exported = await requestLoginToken(client);

          /** Accept the Token on the Already-Authorized Client */
          await acceptLoginToken(authorizedClient, exported.token);

          /** Collect the Authorization (handling DC migration and 2FA) */
          await finalizeLoginToken(client, {
            getPassword: createHandler("password"),
          });
        } catch (error) {
          await client.destroy().catch(() => {});
          throw error;
        }

        /** Set Client */
        telegramClient.ref.current = client;

        /** Store Session */
        storeTelegramSession(client.session.save());
      };

      /** Sign in on the cloud, which holds the client being authorized */
      const signInOnCloud = async (authorizedClient) => {
        /** Request a Login Token from the Cloud */
        const { session, token } = await loginTokenMutation.mutateAsync({});

        /** Store Session */
        setTempSession(session);

        /** Accept the Token on the Already-Authorized Client */
        await acceptLoginToken(authorizedClient, Buffer.from(token, "base64"));

        /** Report the Acceptance */
        const result = await loginTokenConfirmMutation.mutateAsync({ session });

        if (result.stage === "password") {
          /** Set Stage */
          setStage("password");
        } else {
          /** Store Session */
          storeTelegramSession(session);
        }
      };

      /** Sign In */
      const signIn = async () => {
        const authorizedClient = await getAuthorizedClient();
        console.log("Telegram Client from Session:", authorizedClient);

        try {
          if (mode === "local") {
            await signInLocally(authorizedClient);
          } else {
            await signInOnCloud(authorizedClient);
          }
        } finally {
          await authorizedClient.destroy().catch(() => {});
        }
      };

      /** Toast */
      toast.promise(signIn(), {
        loading: "Attempting Quick Token Login...",
        success: "Quick Token Login Successful!",
        error: "Quick Token Login Failed!",
      });
    },
    [
      mode,
      getAuthorizedClient,
      createHandler,
      telegramClient,
      storeTelegramSession,
      loginTokenMutation.mutateAsync,
      loginTokenConfirmMutation.mutateAsync,
    ],
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

      {/* Quick Sign-in buttons */}
      {stage === "phone" && (
        <div className="grid gap-2">
          <button
            onClick={() => dispatchAndHandleQuickTokenLogin()}
            className={cn(
              "text-center text-orange-500",
              "flex items-center justify-center gap-2",
            )}
          >
            <HiBolt className="w-5 h-5 shrink-0" />
            Quick Token Login
          </button>

          <button
            onClick={() => dispatchAndHandleQuickSignIn()}
            className={cn(
              "text-center text-orange-500",
              "flex items-center justify-center gap-2",
            )}
          >
            <HiBolt className="w-5 h-5 shrink-0" />
            Quick Phone Sign-In
          </button>
        </div>
      )}
    </>
  ) : (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  );
}
