import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  generateFirstName,
  generateLastName,
  generateProfile,
  generateUsername,
} from "@purrfect/shared/utils/profile.js";

import Button from "./Button";
import FieldStateError from "./FieldStateError";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import RandomInput from "./RandomInput";
import toast from "react-hot-toast";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useProfileEditorProfile from "@/hooks/useProfileEditorProfile";
import { LuDices } from "react-icons/lu";
import { useEffect } from "react";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    firstName: yup.string().optional().label("First Name"),
    lastName: yup.string().optional().label("Last Name"),
    username: yup.string().optional().label("Username"),
  })
  .required();

/** Fields */
const FIELDS = [
  { name: "firstName", label: "First Name" },
  { name: "lastName", label: "Last Name" },
  { name: "username", label: "Username" },
];

export default function ProfileEditorProfileForm() {
  const { profile, mutation } = useProfileEditorProfile();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
    },
  });

  /** Update Profile */
  const handleSubmit = async (data) => {
    await toast.promise(mutation.mutateAsync(data), {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: (err) => `Error updating profile: ${err.message}`,
    });
  };

  /** Each mirror submits its own form values */
  const [, dispatchAndUpdateProfile] = useMirroredCallback(
    "profile-editor.update-profile",
    () => form.handleSubmit(handleSubmit)(),
    [form.handleSubmit, mutation.mutateAsync],
  );

  /** Fill a field (or all) with a random value, each mirror generates its own */
  const [, dispatchAndRandomize] = useMirroredCallback(
    "profile-editor.randomize",
    (name) => {
      const values =
        name === "all"
          ? generateProfile()
          : {
              [name]:
                name === "firstName"
                  ? generateFirstName()
                  : name === "lastName"
                    ? generateLastName()
                    : generateUsername(
                        form.getValues("firstName") || undefined,
                        form.getValues("lastName") || undefined,
                      ),
            };

      Object.entries(values).forEach(([key, value]) =>
        form.setValue(key, value, { shouldDirty: true, shouldValidate: true }),
      );
    },
    [form.setValue, form.getValues],
  );

  /** Submit without passing the event to mirrors */
  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatchAndUpdateProfile();
  };

  /** Sync form with the loaded or saved profile */
  useEffect(() => {
    if (!profile) return;

    form.reset({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      username: profile.username || "",
    });
  }, [profile, form.reset]);

  if (!profile) {
    return <div className="p-2 text-center">Loading profile...</div>;
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-2 p-2">
        {FIELDS.map(({ name, label }) => (
          <Controller
            key={name}
            name={name}
            render={({ field, fieldState }) => (
              <>
                <Label>{label}</Label>
                <RandomInput
                  {...field}
                  disabled={mutation.isPending}
                  autoComplete="off"
                  placeholder={label}
                  onRandomize={() => dispatchAndRandomize(name)}
                />

                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />
        ))}

        {/* Randomize All Button */}
        <Button
          type="button"
          variant="secondary"
          disabled={mutation.isPending}
          onClick={() => dispatchAndRandomize("all")}
          className="mt-4"
        >
          <LuDices className="size-4" /> Randomize All
        </Button>

        {/* Update Profile Button */}
        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Updating..." : "Update Profile"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
}
