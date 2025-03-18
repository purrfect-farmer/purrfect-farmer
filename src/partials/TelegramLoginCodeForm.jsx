import * as yup from "yup";
import Alert from "@/components/Alert";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import useTelegramCodeMutation from "@/hooks/useTelegramCodeMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    code: yup.string().required().label("Code"),
  })
  .required();

export default function TelegramLoginCodeForm({
  handler,
  session,
  ...options
}) {
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      code: "",
    },
  });

  /** Mutation */
  const mutation = useTelegramCodeMutation(form);

  /** Submit */
  const handleFormSubmit = async ({ code }) => {
    if (typeof handler === "function") {
      await handler(code);
    } else {
      await mutation.mutateAsync(
        {
          code,
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
        <Alert variant={"info"}>
          A code has been sent to your number or to your Telegram, simply enter
          the code.
        </Alert>
        {/* Code */}
        <Controller
          disabled={form.formState.isSubmitting}
          name="code"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} autoComplete="off" placeholder="Code" />
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
