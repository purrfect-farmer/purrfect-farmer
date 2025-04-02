import * as yup from "yup";
import Alert from "@/components/Alert";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import TelegramUser from "@/partials/TelegramUser";
import WelcomeIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=192";
import useAppContext from "@/hooks/useAppContext";
import useCloudServerQuery from "@/hooks/useCloudServerQuery";
import usePaymentInitializeMutation from "@/hooks/usePaymentInitializationMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { customLogger } from "@/lib/utils";
import { memo } from "react";
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

  const handleFormSubmit = async ({ email }) => {
    const transaction = await paymentInitializationMutation.mutateAsync({
      email,
      auth: telegramUser?.["init_data"],
    });

    /** Log Transaction */
    customLogger("TRANSACTION INITIALIZED", transaction);

    /** Pay */
    window.open(transaction["authorization_url"], "_blank");
  };

  return (
    <>
      <div className="flex flex-col justify-center min-w-0 min-h-0 gap-4 p-4 grow">
        <div className="flex flex-col gap-2 justify-center items-center">
          <img src={WelcomeIcon} className="h-24" />
          <h1 className="font-turret-road text-center text-3xl text-orange-500">
            Pay For Cloud
          </h1>
        </div>

        {telegramUser ? (
          <div className="flex flex-col gap-2">
            {/* Cloud */}
            <Alert
              variant={
                { pending: "warning", error: "danger", success: "success" }[
                  status
                ]
              }
            >
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

            {/* Successful Redirection */}
            {paymentInitializationMutation.isSuccess ? (
              <Alert variant={"success"}>
                You've been successfully redirected to the payment page.
              </Alert>
            ) : (
              <FormProvider {...form}>
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className="flex flex-col gap-2"
                >
                  {/* Warning */}
                  <Alert variant={"warning"}>
                    You are about to make a <b>1 Month Subscription</b> payment
                    for Cloud Services. Subscription will be extended if you are
                    already on a plan.
                  </Alert>

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
            )}
          </div>
        ) : (
          <Alert variant={"warning"}>
            No user was detected, kindly re-open{" "}
            <b>{import.meta.env.VITE_APP_BOT_NAME}</b> before proceeding.
          </Alert>
        )}
      </div>
    </>
  );
});
