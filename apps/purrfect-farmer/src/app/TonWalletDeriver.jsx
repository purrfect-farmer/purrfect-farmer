import {
  deriveMnemonicFromTelegramId,
  getWalletAddressesFromPublicKey,
  keypairFromMnemonic,
} from "@purrfect/shared/lib/ton/wallet";
import { MdOutlineContentCopy, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import Container from "@/components/Container";
import InfoRow, { InfoButton } from "@/components/InfoRow";
import Input from "@/components/Input";
import Label from "@/components/Label";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";
import TonCoinIcon from "@/assets/images/toncoin-ton-logo.svg";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { useMutation } from "@tanstack/react-query";

const toHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export default function TonWalletDeriver() {
  const { telegramUser } = useAppContext();
  const userId = telegramUser?.user?.id;

  const [id, setId] = useState(userId ? String(userId) : "");
  const [passphrase, setPassphrase] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState(null);

  /** Fill in the ID once initData loads */
  useEffect(() => {
    if (userId) setId((prev) => prev || String(userId));
  }, [userId]);

  const mutation = useMutation({
    mutationKey: ["ton-wallet-deriver", "derive"],
    mutationFn: async ({ id, passphrase }) => {
      const words = await deriveMnemonicFromTelegramId(id, passphrase);
      const keyPair = await keypairFromMnemonic(words);
      return {
        id,
        words,
        publicKey: toHex(keyPair.publicKey),
        secretKey: toHex(keyPair.secretKey),
        wallets: getWalletAddressesFromPublicKey(keyPair.publicKey),
      };
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^\d+$/.test(id.trim())) {
      toast.error("Enter a numeric Telegram ID");
      return;
    }
    setRevealed(false);
    mutation.mutate(
      { id: id.trim(), passphrase },
      {
        onSuccess: setResult,
        onError: (error) => toast.error(error.message || "Failed to derive"),
      },
    );
  };

  return (
    <Container className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={TonCoinIcon} className="size-24" />
        <h1 className="font-turret-road text-center text-3xl text-orange-500">
          TON Wallet Deriver
        </h1>
      </div>

      <a
        href={`${import.meta.env.VITE_APP_REPOSITORY_URL}/blob/main/packages/shared/lib/ton/wallet.js`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-blue-500 hover:underline"
      >
        How is this derived? View source
      </a>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Label>Telegram ID</Label>
        <Input
          value={id}
          inputMode="numeric"
          placeholder="Telegram ID"
          onChange={(e) => setId(e.target.value)}
          disabled={mutation.isPending}
        />

        <Label>Passphrase (optional)</Label>
        <PasswordInput
          value={passphrase}
          placeholder="Passphrase"
          autoComplete="off"
          onChange={(e) => setPassphrase(e.target.value)}
          disabled={mutation.isPending}
        />

        {!passphrase && (
          <Alert variant="warning">
            Without a passphrase anyone who knows this ID can rebuild the wallet.
          </Alert>
        )}

        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Deriving..." : "Derive"}
        </PrimaryButton>
      </form>

      {result && (
        <div className="flex flex-col gap-2">
          <InfoRow label="Telegram ID" value={result.id} canCopy />

          {result.wallets.map(({ version, address }) => (
            <InfoRow
              key={version}
              label={version}
              value={address}
              canCopy
              link={`https://tonviewer.com/${address}`}
              valueClassName="font-mono text-sm"
            />
          ))}

          <InfoRow
            label="Public Key"
            value={result.publicKey}
            canCopy
            valueClassName="font-mono text-sm"
          />

          {/* Secrets */}
          <div className="flex flex-col gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700">
            <div className="flex items-center gap-2">
              <span className="grow font-bold text-neutral-500 dark:text-neutral-400">
                Mnemonic
              </span>
              <InfoButton
                onClick={() => {
                  copy(result.words.join(" "));
                  toast.success("Copied!");
                }}
              >
                <MdOutlineContentCopy className="size-4" />
              </InfoButton>
              <InfoButton onClick={() => setRevealed((prev) => !prev)}>
                {revealed ? (
                  <MdVisibility className="size-4" />
                ) : (
                  <MdVisibilityOff className="size-4" />
                )}
              </InfoButton>
            </div>

            {revealed ? (
              <div className="grid grid-cols-3 gap-1">
                {result.words.map((word, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 font-mono text-sm"
                  >
                    <span className="text-neutral-400">{index + 1}.</span>{" "}
                    {word}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-500">Hidden</p>
            )}
          </div>

          <InfoRow
            label="Secret Key"
            value={revealed ? result.secretKey : "Hidden"}
            canCopy={revealed}
            valueClassName="font-mono text-sm"
          />
        </div>
      )}
    </Container>
  );
}
