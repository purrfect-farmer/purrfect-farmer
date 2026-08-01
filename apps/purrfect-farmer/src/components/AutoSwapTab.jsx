import { Controller, useForm } from "react-hook-form";
import {
  JETTON_TO_TON,
  REFERRAL_FEE_BPS,
  TON_TO_JETTON,
} from "@purrfect/shared/lib/auto/swap.js";

import Alert from "./Alert";
import AutoStickyContainer from "./AutoStickyContainer";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import { LuArrowDownUp } from "react-icons/lu";
import { SWAP_TON_RESERVE } from "@purrfect/shared/lib/auto/BaseSwapper.js";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoBalancesQuery from "@/hooks/useAutoBalancesQuery";
import useAutoSwapAssetQuery from "@/hooks/useAutoSwapAssetQuery";
import useAutoSwapMutation from "@/hooks/useAutoSwapMutation";
import useAutoSwapQuoteQuery from "@/hooks/useAutoSwapQuoteQuery";
import { useDebounce } from "react-use";
import { useState } from "react";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    amount: yup
      .number()
      .typeError("Enter a valid amount")
      .required()
      .moreThan(0)
      .label("Amount"),
    slippage: yup.string().required().label("Slippage"),
  })
  .required();

const SLIPPAGE_OPTIONS = [
  { value: "0.005", label: "0.5%" },
  { value: "0.01", label: "1%" },
  { value: "0.03", label: "3%" },
];

/** Above this the pool is thin enough that the user should think twice */
const HIGH_PRICE_IMPACT = 0.05;

/** One side of the pair */
function SwapAsset({ icon, symbol, balance, decimals = 4 }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 grow min-w-0",
        "p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      <img src={icon} className="size-6 rounded-full shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="font-bold truncate">{symbol}</span>
        <span className="text-neutral-500 dark:text-neutral-400">
          {balance ? balance.toFixed(decimals) : "-.--"}
        </span>
      </div>
    </div>
  );
}

/** A single label/value row in the quote summary */
function QuoteRow({ label, children, className }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className={cn("font-bold text-right break-all", className)}>
        {children}
      </span>
    </div>
  );
}

export default function AutoSwapTab() {
  const { config, master } = useAuto();
  const [direction, setDirection] = useState(JETTON_TO_TON);
  const [debouncedAmount, setDebouncedAmount] = useState("");

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: "",
      slippage: "0.01",
    },
  });

  const amount = form.watch("amount");
  const slippage = form.watch("slippage");
  const isSubmitting = form.formState.isSubmitting;

  /* Quoting hits STON.fi on every keystroke otherwise */
  useDebounce(() => setDebouncedAmount(amount), 300, [amount]);

  const asset = useAutoSwapAssetQuery();
  const { data: balances } = useAutoBalancesQuery(master?.address);
  const quote = useAutoSwapQuoteQuery({
    direction,
    amount: debouncedAmount,
    slippage,
  });
  const mutation = useAutoSwapMutation();

  const isJettonToTon = direction === JETTON_TO_TON;

  const jettonAsset = {
    icon: config.tokenIcon,
    symbol: config.token,
    balance: balances?.jetton,
    decimals: 2,
  };

  const tonAsset = {
    icon: TonIcon,
    symbol: "TON",
    balance: balances?.ton,
    decimals: 4,
  };

  const [from, to] = isJettonToTon
    ? [jettonAsset, tonAsset]
    : [tonAsset, jettonAsset];

  /** Flip the pair and re-quote */
  const flipDirection = () => {
    setDirection(isJettonToTon ? TON_TO_JETTON : JETTON_TO_TON);
    form.setValue("amount", "");
    setDebouncedAmount("");
  };

  /** Fill in the largest amount this side can actually swap */
  const useMaxAmount = () => {
    if (!balances) return;

    /* Swapping TON has to leave enough behind to pay for the swap itself */
    const max = isJettonToTon
      ? balances.jetton
      : balances.ton.minus(SWAP_TON_RESERVE);

    if (max.lte(0)) {
      toast.error(
        `Not enough TON - keep at least ${SWAP_TON_RESERVE.toFixed()} TON for gas`,
      );
      return;
    }

    form.setValue("amount", max.toFixed(), { shouldValidate: true });
  };

  const handleSwap = async (data) => {
    await mutation.mutateAsync({
      direction,
      amount: data.amount,
      slippage: data.slippage,
    });

    form.reset({ amount: "", slippage: data.slippage });
    setDebouncedAmount("");
  };

  /** STON.fi cannot trade this drop at all */
  if (asset.error?.unavailable) {
    return (
      <div className="flex flex-col gap-3 p-2">
        <Alert variant="warning">
          {config.token} is not listed on STON.fi, so it cannot be swapped here.
          Use <span className="font-bold">Transfer</span> to move funds out of
          the master wallet and swap them elsewhere.
        </Alert>
      </div>
    );
  }

  const priceImpact = quote.data?.priceImpact;
  const isHighImpact = priceImpact?.gt(HIGH_PRICE_IMPACT);

  return (
    <div className="flex flex-col gap-3 p-2">
      {mutation.isError && (
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant="danger">{mutation.error.message}</Alert>
            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </AutoStickyContainer>
      )}

      <form
        onSubmit={form.handleSubmit(handleSwap)}
        className="flex flex-col gap-2"
      >
        <Alert variant="info">
          Swap directly from the master wallet on STON.fi. The transaction is
          signed locally and cannot be reversed.
        </Alert>

        {/* Pair */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <SwapAsset {...from} />
          </div>

          <button
            type="button"
            title="Flip direction"
            onClick={flipDirection}
            disabled={isSubmitting}
            className={cn(
              "self-center p-2 rounded-full",
              "bg-neutral-200 dark:bg-neutral-600",
              "hover:bg-neutral-300 dark:hover:bg-neutral-500",
              "cursor-pointer transition-colors disabled:opacity-50",
            )}
          >
            <LuArrowDownUp className="size-4" />
          </button>

          <div className="flex items-center gap-2">
            <SwapAsset {...to} />
          </div>
        </div>

        {/* Amount */}
        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>Amount in {from.symbol}</Label>
              <div className="flex gap-2">
                <Input
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="off"
                  inputMode="decimal"
                  placeholder={`Amount in ${from.symbol}`}
                />
                <button
                  type="button"
                  onClick={useMaxAmount}
                  disabled={isSubmitting}
                  className={cn(
                    "px-3 rounded-lg shrink-0 font-bold",
                    "bg-neutral-200 dark:bg-neutral-600",
                    "cursor-pointer disabled:opacity-50",
                  )}
                >
                  Max
                </button>
              </div>
              <FieldStateError fieldState={fieldState} />
            </div>
          )}
        />

        {/* Slippage */}
        <Controller
          control={form.control}
          name="slippage"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>Slippage tolerance</Label>
              <Select {...field} disabled={isSubmitting}>
                {SLIPPAGE_OPTIONS.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select>
              <FieldStateError fieldState={fieldState} />
            </div>
          )}
        />

        {/* Quote */}
        {quote.isError && !quote.error?.unavailable && (
          <Alert variant="danger">
            Could not fetch a quote. {quote.error.message}
          </Alert>
        )}

        {quote.error?.unavailable && (
          <Alert variant="warning">
            STON.fi has no liquidity pool for {config.token} / TON.
          </Alert>
        )}

        {quote.data && (
          <div
            className={cn(
              "flex flex-col gap-1 p-2 rounded-lg",
              "bg-neutral-100 dark:bg-neutral-700",
            )}
          >
            <QuoteRow label="Rate">
              1 {from.symbol} = {quote.data.rate.toSignificantDigits(6).toFixed()}{" "}
              {to.symbol}
            </QuoteRow>
            <QuoteRow label="Expected">
              {quote.data.expected.toFixed(to.decimals)} {to.symbol}
            </QuoteRow>
            <QuoteRow label="Minimum received">
              {quote.data.minReceived.toFixed(to.decimals)} {to.symbol}
            </QuoteRow>
            <QuoteRow
              label="Price impact"
              className={cn(isHighImpact && "text-orange-500")}
            >
              {priceImpact.mul(100).toFixed(2)}%
            </QuoteRow>
            <QuoteRow label="Referral fee">
              {REFERRAL_FEE_BPS / 100}%
            </QuoteRow>
          </div>
        )}

        {isHighImpact && (
          <Alert variant="warning">
            This swap moves the price by{" "}
            <strong>{priceImpact.mul(100).toFixed(2)}%</strong>. The pool is thin
            for this size - consider swapping a smaller amount.
          </Alert>
        )}

        <p className="text-center text-neutral-500 dark:text-neutral-400">
          Swaps are routed through STON.fi. A {REFERRAL_FEE_BPS / 100}% referral
          fee supports {import.meta.env.VITE_APP_NAME}.
        </p>

        <PrimaryButton
          type="submit"
          disabled={isSubmitting || mutation.isPending || quote.isError}
        >
          <LuArrowDownUp className="size-4" />
          {mutation.isPending ? "Swapping..." : "Swap"}
        </PrimaryButton>
      </form>
    </div>
  );
}
