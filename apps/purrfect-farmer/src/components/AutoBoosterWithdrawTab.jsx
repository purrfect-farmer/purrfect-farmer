import {
  MdCancel,
  MdCheckCircle,
  MdHourglassEmpty,
  MdInfo,
} from "react-icons/md";
import { useMemo, useState } from "react";

import Alert from "./Alert";
import AutoHelperChooser, { groupHelpers } from "./AutoHelperChooser";
import { FaDollarSign } from "react-icons/fa6";
import { HiArrowPath } from "react-icons/hi2";
import PrimaryButton from "./PrimaryButton";
import { Progress } from "./Progress";
import { cn } from "@/utils";
import useAuto from "@/hooks/useAuto";
import useAutoBoosterWithdrawMutation from "@/hooks/useAutoBoosterWithdrawMutation";
import useAutoCloudSnapshotsQuery from "@/hooks/useAutoCloudSnapshotsQuery";

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
  const { data: snapshots } = useAutoCloudSnapshotsQuery();
  const [selectedId, setSelectedId] = useState("");

  /** An account never withdraws through itself */
  const others = useMemo(
    () => accounts.filter((item) => item.id !== account.id),
    [accounts, account.id],
  );

  const { verified, trusted } = useMemo(
    () => groupHelpers(others, snapshots),
    [others, snapshots],
  );

  const helperAccounts = useMemo(
    () => [...verified, ...trusted],
    [verified, trusted],
  );

  /** A verified account is the safer default, so it is preferred over a trusted one */
  const helperAccount =
    helperAccounts.find((item) => item.id === selectedId) || helperAccounts[0];

  const completed = steps.filter((step) => step.status === "done").length;

  const handleWithdraw = () => {
    mutation.mutate({ account, helperAccount });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Withdraws this account's {config.token} through a verified or trusted
        account.
      </Alert>

      {helperAccounts.length === 0 ? (
        <Alert variant="warning">
          No account can withdraw for this one. Mark one verified, or wait for a
          clean payout record.
        </Alert>
      ) : (
        <>
          {!mutation.isSuccess && !mutation.isError && (
            <AutoHelperChooser
              accounts={others}
              value={helperAccount}
              disabled={mutation.isPending}
              onChange={(item) => setSelectedId(item.id)}
            />
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
              {helperAccount?.title}.
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
              disabled={mutation.isPending || !helperAccount}
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
