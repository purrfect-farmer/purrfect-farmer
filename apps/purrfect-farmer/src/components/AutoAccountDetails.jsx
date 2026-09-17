import AutoAccountSnapshotDetails from "./AutoAccountSnapshotDetails";
import AutoVerifiedBadge from "./AutoVerifiedBadge";
import AutoVersionBadge from "./AutoVersionBadge";
import { HiOutlineEye } from "react-icons/hi2";
import InfoRow, { InfoButton } from "./InfoRow";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { encryption } from "@/services/encryption";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoBalancesQuery from "@/hooks/useAutoBalancesQuery";
import { useState } from "react";

export default function AutoAccountDetails({ account }) {
  const { config, password } = useAuto();
  const { data: balances } = useAutoBalancesQuery(account.address);
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
        label="Telegram User ID"
        value={account.userId}
        canCopy
        valueClassName="text-lime-500 dark:text-lime-300"
      />

      <InfoRow
        label="Address"
        value={account.address}
        link={`https://tonviewer.com/address/${account.address}`}
        canCopy
        valueClassName="text-blue-500 dark:text-blue-300"
      />

      <InfoRow
        label="Version"
        value={<AutoVersionBadge version={account.version} />}
      />

      <InfoRow
        label="Verified (marked by you)"
        value={account.verified ? "Yes" : "No"}
        valueClassName={
          account.verified
            ? "text-lime-500 dark:text-lime-300"
            : "text-neutral-500 dark:text-neutral-400"
        }
        rightContent={<AutoVerifiedBadge verified={account.verified} />}
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
              <img src={config.tokenIcon} className="size-4 rounded-full" />
              {balances.jetton.toFixed(2)} {config.token}
            </span>
          </div>
        ) : (
          <p className="text-neutral-400">Loading...</p>
        )}
      </div>

      {/* What the drop last said about it */}
      <AutoAccountSnapshotDetails account={account} />
    </>
  );
}
