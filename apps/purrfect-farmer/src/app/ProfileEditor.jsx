import * as yup from "yup";

import { Controller, FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import Label from "@/components/Label";
import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { useMutation } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    firstName: yup.string().optional().label("First Name"),
    lastName: yup.string().optional().label("Last Name"),
    username: yup.string().optional().label("Username"),
  })
  .required();

export default function ProfileEditor() {
  const { farmerMode, telegramClient, updateTelegramUser } = useAppContext();
  const [profile, setProfile] = useState(null);
  const ref = telegramClient.ref;
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
    },
  });

  const mutation = useMutation({
    mutationKey: ["profile-editor", "update-profile"],
    mutationFn: async (data) => {
      if (!ref.current) throw new Error("Telegram client is not initialized");
      await ref.current.execute(() => ref.current.updateProfile(data));
      return data;
    },
    onSuccess: (data) => {
      setProfile(data);
      updateTelegramUser(true);
    },
  });

  const handleSubmit = async (data) => {
    await toast.promise(mutation.mutateAsync(data), {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: (err) => `Error updating profile: ${err.message}`,
    });
  };

  useEffect(() => {
    if (farmerMode !== "session") return;
    /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient.js").default} */
    const client = ref.current;

    /** Fetch Profile */
    client
      .execute(() => client.getMe())
      .then((profile) => {
        console.log("Fetched profile:", profile);
        setProfile(profile);
        form.reset({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          username: profile.username || "",
        });
      });
  }, [farmerMode, ref, setProfile]);

  if (!profile) {
    return <div className="p-2 text-center">Loading profile...</div>;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-2 p-2"
      >
        {/* First Name */}
        <Controller
          name="firstName"
          render={({ field, fieldState }) => (
            <>
              <Label>First Name</Label>
              <Input
                {...field}
                disabled={mutation.isPending}
                autoComplete="off"
                placeholder="First Name"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Last Name */}
        <Controller
          name="lastName"
          render={({ field, fieldState }) => (
            <>
              <Label>Last Name</Label>
              <Input
                {...field}
                disabled={mutation.isPending}
                autoComplete="off"
                placeholder="Last Name"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Username */}
        <Controller
          name="username"
          render={({ field, fieldState }) => (
            <>
              <Label>Username</Label>
              <Input
                {...field}
                disabled={mutation.isPending}
                autoComplete="off"
                placeholder="Username"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Update Profile Button */}
        <PrimaryButton
          type="submit"
          disabled={mutation.isPending}
          className="mt-4"
        >
          {mutation.isPending ? "Updating..." : "Update Profile"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
}
