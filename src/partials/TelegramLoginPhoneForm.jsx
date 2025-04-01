import * as yup from "yup";
import Alert from "@/components/Alert";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import useTelegramLoginMutation from "@/hooks/useTelegramLoginMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    phone: yup.string().required().label("Phone"),
  })
  .required();

export default function TelegramLoginPhoneForm({
  mode,
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
  const handleFormSubmit = async ({ phone }) => {
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
  };

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
          disabled={form.formState.isSubmitting}
          name="phone"
          render={({ field, fieldState }) => (
            <>
              <Input
                {...field}
                autoComplete="off"
                placeholder="Phone (e.g +234...)"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Submit Button */}
        <PrimaryButton type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Logging in..." : "Login"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
}
