import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import TelegramLoginCodeForm from "./TelegramLoginCodeForm";
import TelegramLoginPasswordForm from "./TelegramLoginPasswordForm";
import TelegramLoginPhoneForm from "./TelegramLoginPhoneForm";

export default function TelegramLogin({
  mode = "cloud",
  storeTelegramSession,
}) {
  const { settings } = useAppContext();
  const [stage, setStage] = useState("phone");
  const [tempSession, setTempSession] = useState(null);
  const [handlers, setHandlers] = useState({
    phone: null,
    code: null,
    password: null,
  });

  const processingRef = useRef({
    resolve: null,
    reject: null,
  });

  /** Phone Login */
  const handleCloudPhoneLogin = (data) => {
    /** Set Session */
    setTempSession(data["session"]);

    /** Set Stage */
    setStage("code");
  };

  /** Code Error */
  const handleCloudCodeError = () => {
    setStage("phone");
  };

  /** Code Confirmation */
  const handleCloudCodeConfirmation = (data) => {
    if (data["status"] === "account.password") {
      /** Set Stage */
      setStage("password");
    } else {
      /** Set Session */
      storeTelegramSession(tempSession);
    }
  };

  const handleCloudPasswordConfirmation = () => {
    /** Set Session */
    storeTelegramSession(tempSession);
  };

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

  /** Run a client in local mode */
  useEffect(() => {
    if (mode === "local") {
      const client = createTelegramClient(
        settings.telegramApiId,
        settings.telegramApiHash
      );

      (async function () {
        await client.start({
          phoneNumber: createHandler("phone"),
          phoneCode: createHandler("code"),
          password: createHandler("password"),

          onError: (error) => {
            console.error(error);
            processingRef.current?.reject?.(error);
            toast.error(error.message);
          },
        });

        /** Store Session */
        storeTelegramSession(client.session.save());

        /** Destroy */
        await client.destroy();
      })();

      return () => client.destroy();
    }
  }, [
    mode,
    createHandler,
    storeTelegramSession,
    settings.telegramApiId,
    settings.telegramApiHash,
  ]);

  /** Resolve When Stage Changes */
  useEffect(() => {
    if (mode === "local") {
      processingRef.current?.resolve?.();
    }
  }, [mode, stage]);

  return stage === "password" ? (
    <TelegramLoginPasswordForm
      session={tempSession}
      handler={handlers.password}
      onSuccess={handleCloudPasswordConfirmation}
    />
  ) : stage === "code" ? (
    <TelegramLoginCodeForm
      session={tempSession}
      handler={handlers.code}
      onSuccess={handleCloudCodeConfirmation}
      onError={handleCloudCodeError}
    />
  ) : (
    <TelegramLoginPhoneForm
      session={tempSession}
      handler={handlers.phone}
      onSuccess={handleCloudPhoneLogin}
    />
  );
}
