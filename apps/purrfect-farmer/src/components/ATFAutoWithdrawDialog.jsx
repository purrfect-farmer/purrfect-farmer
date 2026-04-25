import { Controller, FormProvider, useForm } from "react-hook-form";

import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoMasterWalletRotation from "@/lib/ATFAutoMasterWalletRotation";
import Alert from "./Alert";
import CenteredDialog from "./CenteredDialog";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import Label from "./Label";
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

export default function ATFAutoWithdrawDialog() {
  const { master, password } = useATFAuto();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      address: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  const mutation = useMutation({
    mutationKey: ["atf-auto-withdraw", master.address],
    onError: (error) => {
      console.log("Error while withdrawing from master wallet", error);
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

      /** Create wallet rotation instance */
      const walletRotation = new ATFAutoMasterWalletRotation(
        masterData,
        address,
      );

      /** Execute the wallet rotation */
      await walletRotation.rotate();
    },
  });

  /** Handle form submission */
  const handleFormSubmit = async ({ address }) => {
    await toast.promise(mutation.mutateAsync({ address }), {
      loading: (
        <div>
          Withdrawing funds to <ATFAutoAddress address={address} />
        </div>
      ),
      success: (
        <div>
          Successfully withdrew funds to <ATFAutoAddress address={address} />
        </div>
      ),
    });

    form.reset();
  };

  return (
    <CenteredDialog
      title={"Withdraw"}
      description={"Transfer funds from master wallet"}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
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

          {/* Warning */}
          <Alert variant={"warning"}>
            Ensure the address is correct before submitting. All ATF and TON in
            the master wallet will be transferred to the specified address
            immediately after submission and cannot be reversed.
          </Alert>

          {/* Submit */}
          <PrimaryButton disabled={isSubmitting} type="submit">
            {isSubmitting ? "Withdrawing..." : "Withdraw"}
          </PrimaryButton>
        </form>
      </FormProvider>
    </CenteredDialog>
  );
}
