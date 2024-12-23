import * as yup from "yup";
import Input from "@/components/Input";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import { memo } from "react";

const schema = yup
  .object({
    id: yup.string().nullable(),
    icon: yup.string().nullable(),
    telegramLink: yup
      .string()
      .trim()
      .url()
      .matches(/^http(s)*:\/\/t\.me\/.+/, {
        message: "Not a Valid Telegram Link",
      })
      .required()
      .label("Telegram Link"),
    title: yup.string().trim().label("Title"),
  })
  .required();

export default memo(function TelegramLinkForm({ link, handleFormSubmit }) {
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: link?.id || null,
      icon: link?.icon || null,
      telegramLink: link?.telegramLink || "",
      title: link?.title || "",
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        {/* Telegram Link */}
        <Controller
          name="telegramLink"
          render={({ field, fieldState }) => (
            <>
              <label className="text-neutral-400">Telegram Link</label>
              <Input
                {...field}
                autoComplete="off"
                placeholder="Telegram Link"
              />
              {fieldState.error?.message ? (
                <p className="text-red-500">{fieldState.error?.message}</p>
              ) : null}
            </>
          )}
        />

        {/* Title */}
        <Controller
          name="title"
          render={({ field, fieldState }) => (
            <>
              <label className="text-neutral-400">Title</label>
              <Input
                {...field}
                autoComplete="off"
                placeholder="Title (Optional)"
              />
              {fieldState.error?.message ? (
                <p className="text-red-500">{fieldState.error?.message}</p>
              ) : null}
            </>
          )}
        />

        {/* Save Button */}
        <button
          type="submit"
          className={cn(
            "px-4 py-2 bg-blue-500 text-white rounded-lg",
            "disabled:opacity-50"
          )}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </button>
      </form>
    </FormProvider>
  );
});
