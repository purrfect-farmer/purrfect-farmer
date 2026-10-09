import { Controller, FormProvider, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Address } from "@ton/core";
import Alert from "./Alert";
import AutoAddress from "./AutoAddress";
import AutoAccountCombobox from "./AutoAccountCombobox";
import Decimal from "decimal.js";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import { cn } from "@/utils";
import { isNativeAuto } from "@purrfect/shared/lib/auto/native";
import { sendFromWallet } from "@purrfect/shared/lib/auto/send";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoBalancesQuery from "@/hooks/useAutoBalancesQuery";
import useAutoMaster from "@/hooks/useAutoMaster";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** TON left behind by Max so the send can still pay its own fee */
const TON_FEE_MARGIN = new Decimal("0.02");

/** Schema */
const schema = yup
  .object({
    ["account"]: yup.string().required().label("Account"),
    ["token"]: yup.string().oneOf(["ton", "jetton"]).required().label("Token"),
    ["address"]: yup
      .string()
      .trim()
      .required()
      .test("ton-address", "Invalid TON address", (value) => {
        try {
          Address.parse(value);
          return true;
        } catch {
          return false;
        }
      })
      .label("Address"),
    ["amount"]: yup
      .number()
      .typeError("Amount must be a number")
      .positive()
      .required()
      .label("Amount"),
  })
  .required();

/** Send form, picking the sender unless an account is given */
export default function AutoSendForm({ account }) {
  const { config, master, accounts } = useAuto();
  const { buildMasterData, decryptPhrase } = useAutoMaster();
  const queryClient = useQueryClient();
  const native = isNativeAuto(config);

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      account: account ? String(account.id) : "master",
      token: "ton",
      address: "",
      amount: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  const accountId = form.watch("account");
  const token = form.watch("token");
  const isJetton = token === "jetton";
  const tokenLabel = isJetton ? config.token : "TON";

  const sender =
    account ||
    (accountId === "master"
      ? master
      : accounts.find((item) => String(item.id) === accountId));

  const { data: balances } = useAutoBalancesQuery(sender?.address);
  const balance = balances ? (isJetton ? balances.jetton : balances.ton) : null;

  /** Fill the amount with what the wallet can send */
  const fillMax = () => {
    if (!balance) return;

    const max = isJetton ? balance : balance.minus(TON_FEE_MARGIN);

    form.setValue("amount", max.greaterThan(0) ? max.toFixed() : "0", {
      shouldValidate: true,
    });
  };

  /** Decrypt the chosen wallet into the shape the TON helpers expect */
  const buildWalletData = async () => {
    if (accountId === "master") {
      return buildMasterData();
    }

    return {
      address: sender.address,
      version: sender.version,
      phrase: await decryptPhrase(sender.encryptedPhrase),
      tonCenterApiKey: master.tonCenterApiKey,
    };
  };

  const mutation = useMutation({
    mutationKey: [config.id, "send"],
    onError: (error) => {
      console.log("Error while sending tokens", error);
    },
    mutationFn: async ({ address, amount }) => {
      const wallet = await buildWalletData();

      await sendFromWallet(wallet, {
        to: address,
        jettonAddress: isJetton ? config.jettonAddress : null,
        amount,
      });

      await queryClient.invalidateQueries({
        queryKey: [config.id, "balances", wallet.address],
      });
    },
  });

  /** Handle form submission */
  const handleFormSubmit = async ({ address, amount }) => {
    await toast.promise(mutation.mutateAsync({ address, amount }), {
      loading: (
        <div>
          Sending {amount} {tokenLabel} to <AutoAddress address={address} />
        </div>
      ),
      success: (
        <div>
          Sent {amount} {tokenLabel} to <AutoAddress address={address} />
        </div>
      ),
      error: (error) => error?.message || "Failed to send",
    });

    form.resetField("amount");
  };

  return (
    <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Warning */}
          <Alert variant={"warning"}>
            Ensure the address and amount are correct. Sends cannot be
            reversed.
          </Alert>

          {/* Account */}
          {!account ? (
            <Controller
              control={form.control}
              name="account"
              render={({ field, fieldState }) => (
                <>
                  <Label>Account</Label>
                  <AutoAccountCombobox
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FieldStateError fieldState={fieldState} />
                </>
              )}
            />
          ) : null}

          {/* Token */}
          <Controller
            control={form.control}
            name="token"
            render={({ field, fieldState }) => (
              <>
                <Label>Token</Label>
                <Select {...field} disabled={isSubmitting}>
                  <Select.Item value="ton">TON</Select.Item>
                  {!native ? (
                    <Select.Item value="jetton">{config.token}</Select.Item>
                  ) : null}
                </Select>
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Address */}
          <Controller
            control={form.control}
            name="address"
            render={({ field, fieldState }) => (
              <>
                <Label>Address</Label>
                <Input
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="off"
                  placeholder="Address"
                />
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Amount */}
          <Controller
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <>
                <Label>Amount</Label>
                <div className="flex gap-2">
                  <Input
                    {...field}
                    disabled={isSubmitting}
                    autoComplete="off"
                    inputMode="decimal"
                    placeholder={`Amount in ${tokenLabel}`}
                    className="grow"
                  />
                  <button
                    type="button"
                    onClick={fillMax}
                    disabled={isSubmitting || !balance}
                    className={cn(
                      "px-3 rounded-lg font-bold shrink-0",
                      "bg-orange-100 text-orange-700",
                      "dark:bg-orange-200 dark:text-orange-500",
                      "disabled:opacity-50",
                    )}
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Balance: {balance ? balance.toFixed(4) : "-.--"}{" "}
                  {tokenLabel}
                </p>
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Submit */}
          <PrimaryButton disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send"}
          </PrimaryButton>
        </form>
      </FormProvider>
  );
}
