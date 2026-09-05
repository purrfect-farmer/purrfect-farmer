import {
  MdCancel,
  MdCheckCircle,
  MdHourglassEmpty,
  MdInfo,
} from "react-icons/md";
import { useMemo, useState } from "react";

import Alert from "./Alert";
import { FaDollarSign } from "react-icons/fa6";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import { Progress } from "./Progress";
import Select from "./Select";
import { cn } from "@/utils";
import useAuto from "@/hooks/useAuto";
import useAutoBoosterWithdrawMutation from "@/hooks/useAutoBoosterWithdrawMutation";

function truncateAddress(address) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const StepIcon = ({ status }) => {
  switch (status) {
    case "running":
      return (
        <MdHourglassEmpty className="size-4 shrink-0 text-orange-500 animate-spin" />
      );
    case "done":
      return <MdCheckCircle className="size-4 shrink-0 text-green-500" />;
    case "failed":
      return <MdCancel className="size-4 shrink-0 text-red-500" />;
    default:
      return <MdInfo className="size-4 shrink-0 text-neutral-400" />;
  }
};

const StepRow = ({ step }) => (
  <div
    className={cn(
      "flex items-start gap-2 p-2 rounded-xl",
      "bg-neutral-100 dark:bg-neutral-700",
      step.status === "pending" && "opacity-60",
    )}
  >
    <StepIcon status={step.status} />
    <div className="flex flex-col grow min-w-0">
      <span className="font-bold wrap-break-word">{step.label}</span>
      {step.message ? (
        <span
          className={cn(
            "wrap-break-word",
            step.status === "failed"
              ? "text-red-500 dark:text-red-400"
              : "text-neutral-500 dark:text-neutral-400",
          )}
        >
          {step.message}
        </span>
      ) : null}
    </div>
  </div>
);

export default function AutoBoosterWithdrawTab({ account }) {
  const { config, accounts } = useAuto();
  const { mutation, steps, reset } = useAutoBoosterWithdrawMutation();
  const [selectedId, setSelectedId] = useState("");

  const verifiedAccounts = useMemo(
    () => accounts.filter((item) => item.verified && item.id !== account.id),
    [accounts, account.id],
  );

  const verifiedAccount =
    verifiedAccounts.find((item) => item.id === selectedId) ||
    verifiedAccounts[0];

  const completed = steps.filter((step) => step.status === "done").length;

  const handleWithdraw = () => {
    mutation.mutate({ account, verifiedAccount });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Withdraws this account's {config.token} through a verified account.
      </Alert>

      {verifiedAccounts.length === 0 ? (
        <Alert variant="warning">
          No other account is marked as verified. Mark one in its edit dialog
          first.
        </Alert>
      ) : (
        <>
          {!mutation.isSuccess && !mutation.isError && (
            <div className="flex flex-col gap-1">
              <Label>Verified Account</Label>
              <Select
                value={verifiedAccount?.id || ""}
                disabled={mutation.isPending}
                onChange={(ev) => setSelectedId(ev.target.value)}
              >
                {verifiedAccounts.map((item) => (
                  <Select.Item key={item.id} value={item.id}>
                    {item.title} — {truncateAddress(item.address)}
                  </Select.Item>
                ))}
              </Select>
            </div>
          )}

          {/* Progress */}
          {steps.length > 0 && (
            <div className="flex flex-col gap-2">
              <Progress current={completed} max={steps.length} />
              {steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>
          )}

          {mutation.isSuccess && (
            <Alert variant="success">
              Withdrew {mutation.data.amount} {config.token} through{" "}
              {verifiedAccount?.title}.
            </Alert>
          )}

          {mutation.isError && (
            <Alert variant="danger">{mutation.error.message}</Alert>
          )}

          {mutation.isSuccess || mutation.isError ? (
            <PrimaryButton type="button" onClick={reset}>
              <HiArrowPath className="size-4" />
              Reset
            </PrimaryButton>
          ) : (
            <PrimaryButton
              type="button"
              disabled={mutation.isPending || !verifiedAccount}
              onClick={handleWithdraw}
            >
              <FaDollarSign className="size-4" />
              {mutation.isPending ? "Withdrawing..." : "Withdraw"}
            </PrimaryButton>
          )}
        </>
      )}
    </div>
  );
}
