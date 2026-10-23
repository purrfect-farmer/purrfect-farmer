import {
  PROFILE_CLEAN_TEXT_MAX,
  PROFILE_FIELDS,
} from "@purrfect/shared/utils/profile.js";
import { Controller, FormProvider, useForm } from "react-hook-form";

import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";
import useCloudManagerCleanProfilesMutation from "@/hooks/useCloudManagerCleanProfilesMutation";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

import CloudCenteredDialog from "./CloudCenteredDialog";

/** Fields the text can be removed from */
const FIELD_OPTIONS = [
  { value: PROFILE_FIELDS.NAME, label: "Name" },
  { value: PROFILE_FIELDS.BIO, label: "Bio" },
];

/** Schema */
const schema = yup
  .object({
    text: yup
      .string()
      .trim()
      .required()
      .max(PROFILE_CLEAN_TEXT_MAX)
      .label("Text"),
    fields: yup
      .array()
      .of(yup.string().oneOf(Object.values(PROFILE_FIELDS)))
      .min(1, "Choose at least one field")
      .label("Fields"),
  })
  .required();

/** Server error message */
const getErrorMessage = (error) =>
  error?.response?.data?.message || "Failed to start cleanup!";

export default function CloudProfileCleaner() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      fields: [PROFILE_FIELDS.NAME, PROFILE_FIELDS.BIO],
    },
  });

  const mutation = useCloudManagerCleanProfilesMutation();
  const isPending = mutation.isPending;

  /** Handle Form Submit */
  const handleFormSubmit = (data) =>
    toast
      .promise(mutation.mutateAsync(data), {
        loading: "Starting cleanup...",
        success: ({ total }) =>
          `Started for ${total} account(s), report will be sent to Telegram`,
        error: getErrorMessage,
      })
      .then(() => form.reset())
      .catch(() => {});

  return (
    <CloudCenteredDialog
      title={"Clean Profiles"}
      description={"Remove a text from every account's name or bio"}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Text */}
          <Controller
            disabled={isPending}
            name="text"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  autoComplete="off"
                  maxLength={PROFILE_CLEAN_TEXT_MAX}
                  placeholder="Text to remove"
                />
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Fields */}
          <Controller
            name="fields"
            render={({ field, fieldState }) => (
              <>
                {FIELD_OPTIONS.map(({ value, label }) => (
                  <LabelToggle
                    key={value}
                    disabled={isPending}
                    checked={field.value.includes(value)}
                    onChange={(ev) =>
                      field.onChange(
                        ev.target.checked
                          ? [...field.value, value]
                          : field.value.filter((item) => item !== value),
                      )
                    }
                  >
                    {label}
                  </LabelToggle>
                ))}
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Submit Button */}
          <PrimaryButton className="my-1" type="submit" disabled={isPending}>
            {isPending ? "Starting..." : "Remove Text"}
          </PrimaryButton>
        </form>
      </FormProvider>
    </CloudCenteredDialog>
  );
}
