import * as yup from "yup";
import Alert from "@/components/Alert";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import useTelegramLoginMutation from "@/hooks/useTelegramLoginMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useCallback } from "react";

/** Schema */
const schema = yup
  .object({
    phone: yup.string().required().label("Phone"),
  })
  .required();

export default function TelegramLoginPhoneForm({
  mode,
  phone,
  session,
  handler,
  onSuccess,
}) {
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      phone: "",
    },
  });

  /** Mutation */
  const mutation = useTelegramLoginMutation(form);

  /** Submit */
  const handleFormSubmit = useCallback(
    async ({ phone }) => {
      if (mode === "local") {
        await handler(phone);
      } else {
        await mutation.mutateAsync(
          { session, phone },
          {
            onSuccess,
          }
        );
      }
    },
    [mode, session, handler, mutation.mutateAsync, onSuccess]
  );

  /** Auto-fill phone */
  useEffect(() => {
    if (phone) {
      form.setValue("phone", phone);
      form.handleSubmit(handleFormSubmit)();
    }
  }, [phone, form, handleFormSubmit]);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Alert variant={"info"}>
          Enter your Telegram Phone Number to Start
        </Alert>

        {/* Phone */}
        <Controller
          name="phone"
          render={({ field, fieldState }) => (
            <>
              <Input
                {...field}
                disabled={mutation.isPending}
                autoComplete="off"
                placeholder="Phone (e.g +234...)"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Submit Button */}
        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Logging in..." : "Login"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
}
