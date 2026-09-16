import Alert from "@/components/Alert";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import QrScanner, { decodeImageFile } from "@/components/QrScanner";
import Tabs from "@/components/Tabs";
import TelegramLogo from "@/assets/images/telegram-logo.svg";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useAuthorizedTelegramClient from "@/hooks/useAuthorizedTelegramClient";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { NewMessage } from "telegram/events";
import { acceptLoginToken } from "@purrfect/shared/utils/loginToken.js";
import { cn } from "@/utils";
import { describeLoginToken, parseLoginToken } from "@/lib/loginTokenLink";
import { formatDistanceToNow } from "date-fns";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useEffect } from "react";
import { useState } from "react";
import {
  HiOutlineClipboardDocument,
  HiOutlineDevicePhoneMobile,
} from "react-icons/hi2";

/** How many login codes to keep in the feed */
const MAX_CODES = 20;

/** Telegram Service Notifications, the sender of every login code */
const TELEGRAM_SERVICE_ID = 777000;

/** Copy a value and confirm it */
const copyValue = (value) => {
  copy(value);
  toast.success("Copied!");
};

/** Turn an accept failure into something a user can act on */
const describeAcceptError = (error) => {
  switch (error?.errorMessage) {
    case "AUTH_TOKEN_EXPIRED":
      return "That QR code expired. Refresh it on the other device and scan again.";
    case "AUTH_TOKEN_ALREADY_ACCEPTED":
      return "That QR code was already used.";
    case "AUTH_TOKEN_INVALID":
      return "That is not a valid Telegram login code.";
    default:
      return error?.message || "Failed to authorize the device.";
  }
};

/** A single copyable field of the account card */
const DetailRow = ({ label, value }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className="shrink-0 text-neutral-500 dark:text-neutral-400">
      {label}
    </span>
    <span className="grow min-w-0 truncate text-right font-bold">
      {value || "-"}
    </span>
    {value ? (
      <button
        onClick={() => copyValue(value)}
        title={`Copy ${label}`}
        className="shrink-0 text-blue-500"
      >
        <HiOutlineClipboardDocument className="size-4" />
      </button>
    ) : null}
  </div>
);

/** Who the session belongs to */
const AccountCard = ({ user, photo }) => {
  if (!user) {
    return <p className="text-center">Loading account...</p>;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-2 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <img
          src={photo || TelegramLogo}
          alt={name}
          className="size-12 rounded-full"
        />
        <div className="grow min-w-0">
          <h3 className="font-bold truncate">{name}</h3>
          {user.username ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              @{user.username}
            </p>
          ) : null}
        </div>
      </div>

      <DetailRow label="Phone" value={user.phone ? `+${user.phone}` : null} />
      <DetailRow label="Username" value={user.username} />
      <DetailRow label="ID" value={user.id?.toString()} />
    </div>
  );
};

/** Scan, upload or paste a login link, then authorize it */
const AuthorizeTab = ({ client }) => {
  const [token, setToken] = useState(null);
  const [link, setLink] = useState("");
  const [authorizing, setAuthorizing] = useState(false);

  /** Turn any payload into a pending token */
  const stageToken = useCallback(
    (value) => {
      try {
        setToken(parseLoginToken(value));
      } catch (error) {
        toast.error(error.message);
      }
    },
    [setToken],
  );

  /** Decode a dropped screenshot */
  const handleImageDrop = useCallback(
    async (droppedFiles) => {
      const imageFile = droppedFiles[0];

      if (!imageFile) return;

      const decodedText = await decodeImageFile(imageFile).catch(() => null);

      if (!decodedText) {
        toast.error("No QR code was found in that image.");
        return;
      }

      stageToken(decodedText);
    },
    [stageToken],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleImageDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
  });

  /** Authorize the Device */
  const authorizeDevice = useCallback(async () => {
    setAuthorizing(true);

    try {
      await toast.promise(acceptLoginToken(client, token), {
        loading: "Authorizing the device...",
        success: "The device is now signed in!",
        error: describeAcceptError,
      });

      setToken(null);
      setLink("");
    } catch (error) {
      console.error("Failed to accept the login token:", error);
    } finally {
      setAuthorizing(false);
    }
  }, [client, token, setToken, setLink, setAuthorizing]);

  if (token) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <Alert variant="warning">
          This grants the scanned device full access to your Telegram account.
          Only continue if the QR code is one you are looking at right now.
        </Alert>

        <p className="text-center text-neutral-500">Login token</p>
        <p className="text-center font-mono font-bold tracking-widest">
          {describeLoginToken(token)}
        </p>

        <PrimaryButton onClick={authorizeDevice} disabled={authorizing}>
          <HiOutlineDevicePhoneMobile className="size-5 shrink-0" />
          {authorizing ? "Authorizing..." : "Authorize this Device"}
        </PrimaryButton>

        <Button
          variant="secondary"
          onClick={() => setToken(null)}
          disabled={authorizing}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      <Alert variant="info">
        Open &quot;Log in by QR Code&quot; on the other device, then scan, drop
        or paste its code here.
      </Alert>

      <QrScanner onResult={stageToken} />

      <div
        {...getRootProps()}
        className="border border-dashed border-blue-500 px-4 py-6 text-center rounded-xl"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the QR screenshot here ...</p>
        ) : (
          <p>
            Drag &apos;n&apos; drop a QR screenshot here, or click to pick one
          </p>
        )}
      </div>

      <Input
        value={link}
        onChange={(event) => setLink(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        placeholder="tg://login?token=..."
      />

      <PrimaryButton onClick={() => stageToken(link)} disabled={!link.trim()}>
        Use this Link
      </PrimaryButton>
    </div>
  );
};

/** Live feed of login codes sent by Telegram */
const CodesTab = ({ client }) => {
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const serviceMessageFilter = new NewMessage({
      fromUsers: [TELEGRAM_SERVICE_ID],
    });

    const handleServiceMessage = (event) => {
      const messageText = event.message?.message || "";
      const codeMatch = messageText.match(/(\d{5})/);

      if (!codeMatch) return;

      setCodes((previousCodes) =>
        [
          {
            id: event.message.id,
            code: codeMatch[1],
            text: messageText,
            date: new Date((event.message.date || 0) * 1000),
          },
          ...previousCodes,
        ].slice(0, MAX_CODES),
      );
    };

    try {
      client.addEventHandler(handleServiceMessage, serviceMessageFilter);
    } catch (error) {
      console.error("Failed to listen for login codes:", error);
      setError(error.message || "Could not listen for login codes.");
      return;
    }

    return () =>
      client.removeEventHandler(handleServiceMessage, serviceMessageFilter);
  }, [client, setCodes, setError]);

  return (
    <div className="flex flex-col gap-2 p-2">
      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Alert variant="info">
          Codes arrive only while this tab is open. Request one on the other
          device and it will show up here.
        </Alert>
      )}

      {codes.length === 0 ? (
        <p className="text-center text-neutral-500 py-6">
          Waiting for a login code...
        </p>
      ) : (
        codes.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-2 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "grow min-w-0 truncate",
                  "font-mono font-bold text-3xl tracking-[0.3em]",
                )}
              >
                {entry.code}
              </p>
              <Button
                variant="secondary"
                onClick={() => copyValue(entry.code)}
                className="shrink-0"
              >
                <HiOutlineClipboardDocument className="size-5 shrink-0" />
                Copy
              </Button>
            </div>

            <p className="text-sm text-neutral-500">
              {formatDistanceToNow(entry.date, { addSuffix: true })}
            </p>

            <details className="text-sm text-neutral-500">
              <summary className="cursor-pointer">Message</summary>
              <p className="whitespace-pre-wrap mt-1">{entry.text}</p>
            </details>
          </div>
        ))
      )}
    </div>
  );
};

export default function QuickLogin() {
  const { farmerMode } = useAppContext();
  const { acquire } = useAuthorizedTelegramClient();
  const tabs = useMirroredTabs("quick-login", ["authorize", "codes"]);

  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);

  /** Acquire one client for the whole page, so the tabs never race for it */
  useEffect(() => {
    let cancelled = false;
    let dispose = null;

    const loadAccount = async () => {
      const acquired = await acquire();
      dispose = acquired.dispose;

      if (cancelled) return;

      setClient(acquired.client);

      const telegramUser = await acquired.client.getMe();

      if (cancelled) return;

      setUser(telegramUser);

      const media = await acquired.client
        .downloadProfilePhoto(telegramUser, { isBig: false })
        .catch(() => null);

      if (cancelled || !media?.length) return;

      setPhoto(`data:image/jpeg;base64,${media.toString("base64")}`);
    };

    loadAccount().catch((error) => {
      console.error("Failed to load the Telegram account:", error);
      setError(error.message || "Could not reach your Telegram session.");
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [acquire, farmerMode, setClient, setError, setUser, setPhoto]);

  if (error) {
    return (
      <Container className="p-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!client) {
    return (
      <Container className="p-4 text-center">
        <p>Opening your Telegram session...</p>
      </Container>
    );
  }

  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto">
      <div className="grow overflow-auto p-2 pt-0">
        <Container className="flex flex-col gap-2 p-0">
          <AccountCard user={user} photo={photo} />

          <Tabs.Content value="authorize">
            <AuthorizeTab client={client} />
          </Tabs.Content>

          <Tabs.Content value="codes">
            <CodesTab client={client} />
          </Tabs.Content>
        </Container>
      </div>
    </Tabs>
  );
}
