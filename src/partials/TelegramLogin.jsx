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

export default function TelegramLogin({
  mode = "cloud",
  storeTelegramSession,
}) {
  const { telegramClient } = useAppContext();
  const [stage, setStage] = useState("phone");
  const [tempSession, setTempSession] = useState(null);
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
            console.error(error);
            processingRef.current?.reject?.(error);
            toast.error(error.message);
          },
        })
        .then(() => {
          /** Set Client */
          telegramClient.ref.current = client;

          /** Store Session */
          storeTelegramSession(client.session.save());
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
    stage === "password" ? (
      <TelegramLoginPasswordForm
        mode={mode}
        session={tempSession}
        handler={handlers.password}
        onSuccess={handleCloudPasswordConfirmation}
      />
    ) : stage === "code" ? (
      <TelegramLoginCodeForm
        mode={mode}
        session={tempSession}
        handler={handlers.code}
        onSuccess={handleCloudCodeConfirmation}
        onError={handleCloudCodeError}
      />
    ) : (
      <TelegramLoginPhoneForm
        mode={mode}
        session={tempSession}
        handler={handlers.phone}
        onSuccess={handleCloudPhoneLogin}
      />
    )
  ) : (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  );
}
