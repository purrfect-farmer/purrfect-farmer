import * as yup from "yup";
import Alert from "@/components/Alert";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import useTelegramPasswordMutation from "@/hooks/useTelegramPasswordMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    password: yup.string().required().label("Password"),
  })
  .required();

export default function TelegramLoginPasswordForm({
  mode,
  handler,
  session,
  ...options
}) {
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      password: "",
    },
  });

  /** Mutation */
  const mutation = useTelegramPasswordMutation(form);

  /** Submit */
  const handleFormSubmit = async ({ password }) => {
    if (mode === "local") {
      await handler(password);
    } else {
      await mutation.mutateAsync(
        {
          password,
          session,
        },
        options
      );
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Alert variant={"info"}>Enter your Telegram 2FA Password</Alert>
        {/* Password */}
        <Controller
          name="password"
          render={({ field, fieldState }) => (
            <>
              <Input
                {...field}
                disabled={form.formState.isSubmitting}
                autoComplete="off"
                placeholder="Password"
              />
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Submit Button */}
        <PrimaryButton type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Confirming....." : "Confirm"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
}
