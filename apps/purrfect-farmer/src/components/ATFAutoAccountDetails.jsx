import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import ATFIcon from "@/assets/images/atf.png?format=webp&w=32";
import { HiOutlineEye } from "react-icons/hi2";
import { MdOutlineContentCopy } from "react-icons/md";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { cn } from "@/utils";
import copy from "copy-to-clipboard";
import { encryption } from "@/services/encryption";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFBalancesQuery from "@/hooks/useATFBalancesQuery";
import { useState } from "react";

const InfoButton = (props) => (
  <button
    {...props}
    className={cn(
      "shrink-0 p-2 rounded-xl",
      "text-neutral-500 dark:text-neutral-400",
      "hover:text-black dark:hover:text-white",
      "hover:bg-neutral-200 dark:hover:bg-neutral-600",
      "cursor-pointer transition-colors",
      props.className,
    )}
  />
);

const InfoRow = ({ label, value, canCopy, valueClassName, rightContent }) => (
  <div className="flex gap-2 p-2 items-center rounded-xl bg-neutral-100 dark:bg-neutral-700">
    <div className="flex flex-col gap-1 grow min-w-0">
      <span className="font-bold text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <p
        className={cn("wrap-break-word grow min-w-0 font-bold", valueClassName)}
      >
        {value}
      </p>
    </div>
    {canCopy && (
      <InfoButton
        onClick={() => {
          copy(value);
          toast.success("Copied!");
        }}
      >
        <MdOutlineContentCopy className="size-4" />
      </InfoButton>
    )}
    {rightContent}
  </div>
);

export default function ATFAutoAccountDetails({ account }) {
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
    <>
      <InfoRow
        label="Address"
        value={account.address}
        canCopy
        valueClassName="text-blue-500 dark:text-blue-300"
      />

      <InfoRow
        label="Version"
        value={<ATFAutoVersionBadge version={account.version} />}
      />

      {/* Phrase */}
      <InfoRow
        label="Phrase"
        value={phrase || "********"}
        canCopy={phrase !== null}
        valueClassName="font-mono text-red-500 dark:text-red-400"
        rightContent={
          !phrase && (
            <InfoButton onClick={revealPhrase}>
              <HiOutlineEye className="size-4" />
            </InfoButton>
          )
        }
      />

      {/* Balances */}
      <div className="flex flex-col gap-1 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700">
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
    </>
  );
}
