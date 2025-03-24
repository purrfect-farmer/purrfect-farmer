import * as yup from "yup";
import Alert from "@/components/Alert";
import CloudTelegramSessionIcon from "@/assets/images/icon.png?format=webp&w=192";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import TelegramUser from "@/partials/TelegramUser";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useCloudServerQuery from "@/hooks/useCloudServerQuery";
import usePaymentInitializeMutation from "@/hooks/usePaymentInitializationMutation";
import usePaymentVerificationMutation from "@/hooks/usePaymentVerificationMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { customLogger } from "@/lib/utils";
import { memo } from "react";
import { paystack } from "@/lib/paystack";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    email: yup.string().required().email().label("Email"),
  })
  .required();

export default memo(function PayForCloud() {
  const { telegramUser } = useAppContext();

  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const { status, data } = useCloudServerQuery();
  const paymentInitializationMutation = usePaymentInitializeMutation(form);
  const paymentVerificationMutation = usePaymentVerificationMutation();

  const handleFormSubmit = async ({ email }) => {
    const transaction = await paymentInitializationMutation.mutateAsync({
      email,
      auth: telegramUser?.["init_data"],
    });

    /** Log Transaction */
    customLogger("TRANSACTION INITIALIZED", transaction);

    /** Payment */
    await new Promise((resolve, reject) => {
      paystack.resumeTransaction(transaction["access_code"], {
        onSuccess: async (transaction) => {
          customLogger("TRANSACTION CONFIRMED", transaction);

          toast
            .promise(
              paymentVerificationMutation.mutateAsync({
                reference: transaction["reference"],
              }),
              {
                loading: "Verifying Payment...",
                success: "Payment Verified!",
                error: "An error occurred!",
              }
            )
            .then(() => {
              form.reset();
              resolve();
            })
            .catch(reject);
        },
        onLoad: (response) => {
          customLogger("TRANSACTION LOADED", response);
        },
        onCancel: () => {
          toast.error("Payment Cancelled!");
          reject();
        },
        onError: (error) => {
          customLogger("TRANSACTION ERROR", error);
          toast.error("Payment Error!");
          reject(error);
        },
      });
    });
  };

  return (
    <div className="flex flex-col justify-center min-w-0 min-h-0 gap-4 p-4 grow">
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={CloudTelegramSessionIcon} className="size-24" />
        <h1 className="font-turret-road text-center text-3xl text-orange-500">
          Pay For Cloud
        </h1>
      </div>

      {telegramUser ? (
        <>
          {paymentVerificationMutation.isSuccess ? (
            <>
              <Alert variant={"success"}>
                🎉 You have successfully paid for <b>1 Month</b> Cloud
                Subscription
              </Alert>
            </>
          ) : (
            <>
              <Alert variant={"warning"}>
                You are about to make a <b>1 Month Subscription</b> payment for
                Cloud Services. Subscription will be extended if you are already
                on a plan.
              </Alert>

              <FormProvider {...form}>
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className="flex flex-col gap-2"
                >
                  {/* Cloud */}
                  <Alert variant={"info"}>
                    <span className="font-bold">Cloud Server:</span>{" "}
                    <span>
                      {status === "success"
                        ? data.name
                        : status === "pending"
                        ? "Checking..."
                        : "Error!"}
                    </span>
                  </Alert>

                  {/* Telegram User */}
                  <TelegramUser user={telegramUser} className="rounded-lg" />

                  {/* Email */}
                  <Controller
                    disabled={form.formState.isSubmitting}
                    name="email"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          autoComplete="off"
                          placeholder="Email"
                        />

                        <FieldStateError fieldState={fieldState} />
                      </>
                    )}
                  />

                  {/* Submit Button */}
                  <PrimaryButton
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Requesting..." : "Pay Now"}
                  </PrimaryButton>
                </form>
              </FormProvider>
            </>
          )}
        </>
      ) : (
        <Alert variant={"warning"}>
          No user was detected, kindly open{" "}
          <b>{import.meta.env.VITE_APP_BOT_NAME}</b> before proceeding.
        </Alert>
      )}
    </div>
  );
});
