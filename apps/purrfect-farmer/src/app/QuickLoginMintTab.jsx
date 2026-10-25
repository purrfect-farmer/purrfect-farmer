import Alert from "@/components/Alert";
import Button from "@/components/Button";
import PrimaryButton from "@/components/PrimaryButton";
import Textarea from "@/components/Textarea";
import TwoFactorPrompt from "@/components/TwoFactorPrompt";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import usePrompt from "@/hooks/usePrompt";
import { HiOutlineClipboardDocument } from "react-icons/hi2";
import { mintTelegramClient } from "@/lib/mintTelegramClient";
import { useCallback } from "react";
import { useState } from "react";

/** Mint a new session for this account and show it for copying */
export default function QuickLoginMintTab({ client }) {
  const [session, setSession] = useState(null);
  const [minting, setMinting] = useState(false);
  const { prompt, answer, question } = usePrompt();

  /** Hand finalizeLoginToken the next password candidate, or null to give up */
  const getPassword = useCallback(
    (attempt) => prompt({ attempt }),
    [prompt],
  );

  /** Mint a session, keeping only its string */
  const mintSession = useCallback(async () => {
    const minted = await mintTelegramClient(client, { getPassword });

    try {
      return minted.session.save();
    } finally {
      await minted.destroy().catch(() => {});
    }
  }, [client, getPassword]);

  /** Mint and show the session */
  const handleMintClick = useCallback(async () => {
    setMinting(true);

    try {
      const mintedSession = await toast.promise(mintSession(), {
        loading: "Minting a session...",
        success: "Session minted!",
        error: (error) => error?.message || "Failed to mint a session.",
      });

      setSession(mintedSession);
    } catch (error) {
      console.error("Failed to mint a session:", error);
    } finally {
      /** Drop any prompt still waiting behind a failure */
      answer(null);
      setMinting(false);
    }
  }, [mintSession, answer, setSession, setMinting]);

  /** Copy the session */
  const copySession = useCallback(() => {
    copy(session);
    toast.success("Copied!");
  }, [session]);

  return (
    <div className="flex flex-col gap-2 p-2">
      <Alert variant="warning">
        A minted session is a full login to this account. Keep it private, and
        end it from Telegram&apos;s Active Sessions when you are done.
      </Alert>

      <PrimaryButton onClick={handleMintClick} disabled={minting}>
        {minting ? "Minting..." : "Mint a Session"}
      </PrimaryButton>

      {session ? (
        <>
          <Textarea
            readOnly
            value={session}
            spellCheck={false}
            onFocus={(event) => event.target.select()}
            className="font-mono break-all"
          />

          <Button variant="secondary" onClick={copySession}>
            <HiOutlineClipboardDocument className="size-5 shrink-0" />
            Copy Session
          </Button>
        </>
      ) : null}

      <TwoFactorPrompt
        prompt={question}
        onSubmit={answer}
        onCancel={() => answer(null)}
      />
    </div>
  );
}
