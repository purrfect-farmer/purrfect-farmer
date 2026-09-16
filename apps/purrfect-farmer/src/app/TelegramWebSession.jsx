import Alert from "@/components/Alert";
import Container from "@/components/Container";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";
import PromptDialog from "@/components/PromptDialog";
import Tabs from "@/components/Tabs";
import TelegramIcon from "@/assets/images/telegram-logo.svg";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useAuthorizedTelegramClient from "@/hooks/useAuthorizedTelegramClient";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import useTelegramWebTransfer from "@/hooks/useTelegramWebTransfer";
import { Dialog } from "radix-ui";
import { cn, postPortMessage } from "@/utils";
import { createTelegramClient } from "@/lib/createTelegramClient";
import { useCallback } from "react";
import { useRef } from "react";
import { useState } from "react";
import {
  acceptLoginToken,
  finalizeLoginToken,
  requestLoginToken,
} from "@purrfect/shared/utils/loginToken.js";
import {
  buildTelegramWebAccount,
  mergeTelegramWebAccount,
} from "@/lib/telegramWebSession";

const TELEGRAM_WEB_URL = "https://web.telegram.org";
const PURRFECT_GRAM_URL = import.meta.env.VITE_APP_TELEGRAM_WEB_URL;

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

/** Ask for the 2FA password, re-asking while Telegram rejects it */
const PasswordPrompt = ({ prompt, onSubmit, onCancel }) => {
  const [password, setPassword] = useState("");

  if (!prompt) return null;

  return (
    <Dialog.Root open={true} onOpenChange={() => onCancel()}>
      <PromptDialog
        icon={TelegramIcon}
        title="Two-Factor Authentication"
        description={
          prompt.attempt > 0
            ? "That password was rejected. Try again."
            : "Enter your Telegram cloud password to finish signing in."
        }
        onCloseButtonClick={() => onCancel()}
      >
        <PasswordInput
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Cloud password"
        />

        <Dialog.Close
          onClick={() => {
            onSubmit(password);
            setPassword("");
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Submit
        </Dialog.Close>
      </PromptDialog>
    </Dialog.Root>
  );
};

export default function TelegramWebSession() {
  const tabs = useMirroredTabs("telegram-web-session", [
    "purrfect-gram",
    "telegram-web",
  ]);

  const { account, localTelegramSession } = useAppContext();
  const { getClientFromLocalSession } = useAuthorizedTelegramClient();
  const { closeTelegramWeb, openTelegramWeb, withTelegramWebPort } =
    useTelegramWebTransfer();

  const [signedInUrl, setSignedInUrl] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState(null);

  const passwordResolverRef = useRef(null);

  /** Resolve the pending prompt and close it */
  const answerPasswordPrompt = useCallback(
    (password) => {
      setPasswordPrompt(null);
      passwordResolverRef.current?.(password);
      passwordResolverRef.current = null;
    },
    [setPasswordPrompt],
  );

  /** Hand finalizeLoginToken the next password candidate, or null to give up */
  const getPassword = useCallback(
    (attempt) =>
      new Promise((resolve) => {
        passwordResolverRef.current = resolve;
        setPasswordPrompt({ attempt });
      }),
    [setPasswordPrompt],
  );

  /** Mint a brand new authorization for Telegram Web */
  const createTelegramWebSession = useCallback(async () => {
    /** The local session only authorizes, it is never handed over */
    const { client: authorizingClient, dispose } =
      await getClientFromLocalSession();

    const client = createTelegramClient();

    try {
      /** Connect Without Authenticating */
      await client.connect();

      /** Export Login Token */
      const exported = await requestLoginToken(client);

      /** Accept the Token on the Already-Authorized Client */
      await acceptLoginToken(authorizingClient, exported.token);

      /** Collect the Authorization, handling DC migration and 2FA */
      await finalizeLoginToken(client, { getPassword });

      /** Read the new session before tearing the client down */
      const user = await client.getMe();

      return buildTelegramWebAccount({
        authKey: client.session.authKey.getKey().toString("hex"),
        dcId: client.session.dcId,
        userId: user.id,
      });
    } finally {
      /** Disconnect only, the authorization now belongs to Telegram Web */
      await client.destroy().catch(() => {});
      await dispose();
    }
  }, [getClientFromLocalSession, getPassword]);

  /** Kept local, not mirrored, so accounts do not overwrite each other's slot */
  const signIn = useCallback(
    async (destination) => {
      const url = `${destination}/k`;

      setSigningIn(true);

      const run = async () => {
        /** A stale tab holds the port and the next open never connects */
        await closeTelegramWeb();

        const telegramWebAccount = await createTelegramWebSession();

        /** Read and write on the same port, so the tab opens only once */
        await withTelegramWebPort(url, async (port) => {
          const currentLocalStorage = await postPortMessage(port, {
            action: "get-local-storage",
          }).then((response) => response.data);

          const updatedLocalStorage = mergeTelegramWebAccount(
            currentLocalStorage,
            account.index + 1,
            telegramWebAccount,
          );

          return postPortMessage(port, {
            action: "set-local-storage",
            data: updatedLocalStorage,
          });
        });
      };

      try {
        await toast.promise(run(), {
          loading: "Creating a Telegram Web session...",
          success: "Telegram Web is signed in!",
          error: (error) => error?.message || "Failed to sign Telegram Web in.",
        });

        setSignedInUrl(url);
      } catch (error) {
        console.error("Failed to sign Telegram Web in:", error);
      } finally {
        /** Drop any prompt still waiting behind a failure */
        answerPasswordPrompt(null);
        setSigningIn(false);
      }
    },
    [
      account,
      closeTelegramWeb,
      createTelegramWebSession,
      withTelegramWebPort,
      answerPasswordPrompt,
      setSignedInUrl,
      setSigningIn,
    ],
  );

  if (!localTelegramSession) {
    return (
      <div
        className={cn("flex flex-col min-w-0 min-h-0 grow", "overflow-auto")}
      >
        <Container className="flex flex-col gap-4 p-4 my-auto">
          <div className="flex flex-col gap-2 justify-center items-center">
            <img src={TelegramIcon} className="size-24" />
            <h1 className="font-turret-road text-center text-2xl text-orange-500">
              Telegram Web Session
            </h1>
          </div>

          <Alert variant={"warning"} className="text-center">
            This account has no local Telegram session. Create one from the
            Local Telegram Session tool, then come back here.
          </Alert>
        </Container>
      </div>
    );
  }

  const renderTab = (value, title, origin) => (
    <TabContent value={value} title={title}>
      <Alert variant={"info"} className="text-center">
        A new Telegram session is created for {new URL(origin).host} and placed
        in account {account.index + 1}. Your local session authorizes it and
        stays untouched, so the two can be revoked separately. You may be asked
        for your 2FA password.
      </Alert>

      <PrimaryButton onClick={() => signIn(origin)} disabled={signingIn}>
        {signingIn ? "Signing In..." : "Sign In Now"}
      </PrimaryButton>

      {signedInUrl ? (
        <PrimaryButton
          variant="secondary"
          onClick={() => openTelegramWeb(signedInUrl)}
        >
          Open Telegram Web
        </PrimaryButton>
      ) : null}
    </TabContent>
  );

  return (
    <>
      <Tabs tabs={tabs} rootClassName="grow overflow-auto">
        {renderTab("purrfect-gram", "Purrfect Gram", PURRFECT_GRAM_URL)}
        {renderTab("telegram-web", "Telegram Web", TELEGRAM_WEB_URL)}
      </Tabs>

      <PasswordPrompt
        prompt={passwordPrompt}
        onSubmit={answerPasswordPrompt}
        onCancel={() => answerPasswordPrompt(null)}
      />
    </>
  );
}
