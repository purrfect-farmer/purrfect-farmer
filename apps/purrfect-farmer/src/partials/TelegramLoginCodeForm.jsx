import * as yup from "yup";
import Alert from "@/components/Alert";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import useTelegramCodeMutation from "@/hooks/useTelegramCodeMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useCallback } from "react";

/** Schema */
const schema = yup
  .object({
    code: yup.string().required().label("Code"),
  })
  .required();

export default function TelegramLoginCodeForm({
  mode,
  code,
  handler,
  session,
  onSuccess,
  onError,
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
  const handleFormSubmit = useCallback(
    async ({ code }) => {
      if (mode === "local") {
        await handler(code);
      } else {
        await mutation.mutateAsync(
          {
            code,
            session,
          },
          {
            onSuccess,
            onError,
          }
        );
      }
    },
    [mode, session, handler, mutation.mutateAsync, onSuccess, onError]
  );

  /** Auto-fill code */
  useEffect(() => {
    if (code) {
      form.setValue("code", code);
      form.handleSubmit(handleFormSubmit)();
    }
  }, [code, form, handleFormSubmit]);

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
          name="code"
          render={({ field, fieldState }) => (
            <>
              <Input
                {...field}
                disabled={mutation.isPending}
                autoComplete="off"
                placeholder="Code"
              />
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Submit Button */}
        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Confirming....." : "Confirm"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
}
