import { Controller, FormProvider, useForm } from "react-hook-form";

import AutoAddress from "./AutoAddress";
import AutoWalletTransfer from "@/lib/AutoWalletTransfer";
import Alert from "./Alert";
import CenteredDialog from "./CenteredDialog";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import Label from "./Label";
import { MdOutlineDoubleArrow } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoMaster from "@/hooks/useAutoMaster";
import { useMutation } from "@tanstack/react-query";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    ["address"]: yup.string().trim().required().label("Address"),
  })
  .required();

export default function AutoTransferDialog() {
  const { config, master } = useAuto();
  const { buildMasterData } = useAutoMaster();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  const mutation = useMutation({
    mutationKey: [config.id, "transfer", master.address],
    onError: (error) => {
      console.log("Error while transferring from master wallet", error);
    },
    mutationFn: async ({ address }) => {
      /** Decrypt master */
      console.log("Decrypting master wallet....");
      const masterData = await buildMasterData();
      console.log("Successfully decrypted master wallet!");

      /** Create wallet transfer instance */
      const walletTransfer = new AutoWalletTransfer(
        masterData,
        address,
        config.jettonAddress,
        { token: config.token },
      );

      /** Execute the wallet transfer */
      await walletTransfer.transfer();
    },
  });

  /** Handle form submission */
  const handleFormSubmit = async ({ address }) => {
    await toast.promise(mutation.mutateAsync({ address }), {
      loading: (
        <div>
          Transferring funds to <AutoAddress address={address} />
        </div>
      ),
      success: (
        <div>
          Successfully transferred funds to <AutoAddress address={address} />
        </div>
      ),
    });

    form.reset();
  };

  return (
    <CenteredDialog
      icon={MdOutlineDoubleArrow}
      title={"Transfer"}
      description={"Transfer funds from master wallet"}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Warning */}
          <Alert variant={"warning"}>
            Ensure the address is correct before submitting. All {config.token} and TON in
            the master wallet will be transferred to the specified address
            immediately after submission and cannot be reversed.
          </Alert>

          {/* Address input */}
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

          {/* Submit */}
          <PrimaryButton disabled={isSubmitting} type="submit">
            {isSubmitting ? "Transferring..." : "Transfer"}
          </PrimaryButton>
        </form>
      </FormProvider>
    </CenteredDialog>
  );
}
