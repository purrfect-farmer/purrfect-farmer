import { cn, extractTgWebAppData } from "@/utils";
import { useMemo, useState } from "react";

import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import ATFIcon from "@/assets/images/atf.png?format=webp&w=32";
import CenteredDialog from "./CenteredDialog";
import { HiOutlineEye } from "react-icons/hi2";
import { MdOutlineContentCopy } from "react-icons/md";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import copy from "copy-to-clipboard";
import { encryption } from "@/services/encryption";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFBalancesQuery from "@/hooks/useATFBalancesQuery";

const InfoRow = ({ label, value, canCopy, valueClassName, rightContent }) => (
  <div className="flex flex-col gap-1">
    <span className="font-bold text-neutral-500 dark:text-neutral-400">
      {label}
    </span>
    <div className="flex items-start gap-2">
      <p className={cn("wrap-break-word grow min-w-0", valueClassName)}>
        {value}
      </p>
      {canCopy && value && value !== "********" && (
        <button
          onClick={() => {
            copy(value);
            toast.success("Copied!");
          }}
          className={cn(
            "shrink-0 p-1 rounded",
            "text-neutral-400 hover:text-blue-500",
            "cursor-pointer transition-colors",
          )}
        >
          <MdOutlineContentCopy className="size-3.5" />
        </button>
      )}
      {rightContent}
    </div>
  </div>
);

function TelegramUserInfo({ url }) {
  const user = useMemo(() => {
    try {
      return extractTgWebAppData(url)?.initDataUnsafe?.user;
    } catch {
      return null;
    }
  }, [url]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900">
      {user.photo_url && (
        <img
          src={user.photo_url}
          alt="Avatar"
          className="size-10 rounded-full shrink-0"
        />
      )}
      <div className="flex flex-col min-w-0">
        <p className="font-bold truncate">
          {user.first_name} {user.last_name || ""}
        </p>
        {user.username && (
          <p className="text-neutral-500 dark:text-neutral-400 truncate">
            @{user.username}
          </p>
        )}
        <button
          onClick={() => {
            copy(user.id.toString());
            toast.success("Copied!");
          }}
          className="text-purple-500 cursor-pointer flex items-center gap-1 w-fit"
        >
          ID: {user.id}
          <MdOutlineContentCopy className="size-3" />
        </button>
      </div>
    </div>
  );
}

export default function ATFAutoAccountDetailsDialog({ account }) {
  const { password } = useATFAuto();
  const { data: balances } = useATFBalancesQuery(account.address);
  const [phrase, setPhrase] = useState(null);

  const revealPhrase = async () => {
    if (!password) {
      toast.error("Not logged in.");
      return;
    }

    const decrypted = await encryption.decryptData({
      ...account.encryptedPhrase,
      password,
      asText: true,
    });

    setPhrase(decrypted);
  };

  return (
    <CenteredDialog title={account.title} description={"Account details"}>
      {/* Telegram User Info */}
      {account.url && <TelegramUserInfo url={account.url} />}

      <InfoRow
        label="Address"
        value={account.address}
        canCopy
        valueClassName="text-blue-500 font-mono"
      />

      <div className="flex flex-col gap-1">
        <span className="font-bold text-neutral-500 dark:text-neutral-400">
          Version
        </span>
        <ATFAutoVersionBadge version={account.version} />
      </div>

      {/* Phrase */}
      <InfoRow
        label="Phrase"
        value={phrase || "********"}
        canCopy
        valueClassName="font-mono text-red-500 dark:text-red-400"
        rightContent={
          !phrase && (
            <button
              onClick={revealPhrase}
              className="shrink-0 p-1 text-neutral-400 hover:text-blue-500 cursor-pointer transition-colors"
            >
              <HiOutlineEye className="size-4" />
            </button>
          )
        }
      />

      {/* Balances */}
      <div className="flex flex-col gap-1">
        <span className="font-bold text-neutral-500 dark:text-neutral-400">
          Balances
        </span>
        {balances ? (
          <div className="flex gap-4 font-bold">
            {/* TON */}
            <span className="inline-flex items-center gap-1 text-blue-500 dark:text-blue-300">
              <img src={TonIcon} className="size-4" />
              {balances.ton.toFixed(4)} TON
            </span>

            {/* Jetton */}
            <span className="inline-flex items-center gap-1 text-orange-500 dark:text-orange-400">
              <img src={ATFIcon} className="size-4 rounded-full" />
              {balances.jetton.toFixed(2)} ATF
            </span>
          </div>
        ) : (
          <p className="text-neutral-400">Loading...</p>
        )}
      </div>
    </CenteredDialog>
  );
}
