import { Controller, FormProvider, useForm } from "react-hook-form";

import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoWalletTransfer from "@/lib/ATFAutoWalletTransfer";
import Alert from "./Alert";
import CenteredDialog from "./CenteredDialog";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import Label from "./Label";
import { MdOutlineDoubleArrow } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import { encryption } from "@/services/encryption";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import { useMutation } from "@tanstack/react-query";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    ["address"]: yup.string().trim().required().label("Address"),
  })
  .required();

export default function ATFAutoTransferDialog() {
  const { master, password } = useATFAuto();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  const mutation = useMutation({
    mutationKey: ["atf-auto-transfer", master.address],
    onError: (error) => {
      console.log("Error while transferring from master wallet", error);
    },
    mutationFn: async ({ address }) => {
      /** Decrypt master */
      console.log("Decrypting master wallet....");
      const masterPhrase = await encryption.decryptData({
        ...master.encryptedWalletPhrase,
        password,
        asText: true,
      });
      console.log("Successfully decrypted master wallet!");

      const masterData = {
        address: master.address,
        version: master.version,
        phrase: masterPhrase,
        tonCenterApiKey: master.tonCenterApiKey,
      };

      /** Create wallet transfer instance */
      const walletTransfer = new ATFAutoWalletTransfer(masterData, address);

      /** Execute the wallet transfer */
      await walletTransfer.transfer();
    },
  });

  /** Handle form submission */
  const handleFormSubmit = async ({ address }) => {
    await toast.promise(mutation.mutateAsync({ address }), {
      loading: (
        <div>
          Transferring funds to <ATFAutoAddress address={address} />
        </div>
      ),
      success: (
        <div>
          Successfully transferred funds to <ATFAutoAddress address={address} />
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
            Ensure the address is correct before submitting. All ATF and TON in
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
