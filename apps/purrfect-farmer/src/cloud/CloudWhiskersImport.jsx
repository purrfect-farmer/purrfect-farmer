import Alert from "@/components/Alert";
import CloudCenteredDialog from "./CloudCenteredDialog";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import PrimaryButton from "@/components/PrimaryButton";
import Textarea from "@/components/Textarea";
import toast from "react-hot-toast";
import useCloudManagerImportWhiskersMutation from "@/hooks/useCloudManagerImportWhiskersMutation";
import { Controller, useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    backup: yup
      .object()
      .nullable()
      .required("Please select a whiskers backup file!")
      .label("Backup"),
    passwords: yup.string().label("2FA Passwords"),
    subscriptionDate: yup.string().label("Subscription End Date"),
    farming: yup.boolean().required().label("Farming"),
  })
  .required();

export default function CloudWhiskersImport() {
  const importMutation = useCloudManagerImportWhiskersMutation();
  const isPending = importMutation.isPending;

  const [fileName, setFileName] = useState("");

  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      backup: null,
      passwords: "",
      subscriptionDate: "",
      farming: true,
    },
  });

  const backup = form.watch("backup");

  /** Read and parse the dropped backup file */
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        form.setValue("backup", parsed, { shouldValidate: true });
        setFileName(file.name);
      } catch {
        form.setValue("backup", null);
        setFileName("");
        toast.error("Invalid JSON file!");
      }
    });
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
    multiple: false,
  });

  /** Submit the import */
  const handleFormSubmit = (data) => {
    toast.promise(importMutation.mutateAsync(data), {
      loading: "Starting import...",
      success: (data) =>
        `Import started for ${data.total} account(s). The admin will be notified on completion.`,
      error: "Failed to start import",
    });
  };

  return (
    <CloudCenteredDialog
      title={"Import Whiskers Backup"}
      description={"Onboard accounts from a purrfect-whiskers backup"}
    >
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Alert variant={"info"}>
          A new cloud session is created for each account. Provide any 2FA
          passwords used (space/comma separated), the server tries each one.
          Runs in the background; the admin is messaged when done.
        </Alert>

        {/* Backup file */}
        <Controller
          control={form.control}
          name="backup"
          render={({ fieldState }) => (
            <>
              <div
                {...getRootProps()}
                className="border border-dashed border-blue-500 px-4 py-8 text-center rounded-xl cursor-pointer"
              >
                <input {...getInputProps()} />
                {fileName ? (
                  <p className="font-bold break-all">{fileName}</p>
                ) : isDragActive ? (
                  <p>Drop the backup file here ...</p>
                ) : (
                  <p>Drag 'n' drop the whiskers backup, or click to select</p>
                )}
              </div>
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* 2FA passwords */}
        <Controller
          control={form.control}
          disabled={isPending}
          name="passwords"
          render={({ field, fieldState }) => (
            <>
              <Textarea
                {...field}
                autoComplete="off"
                placeholder="2FA passwords (space/comma separated)"
              />
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Subscription date */}
        <Controller
          control={form.control}
          disabled={isPending}
          name="subscriptionDate"
          render={({ field, fieldState }) => (
            <>
              <Input
                {...field}
                type="date"
                autoComplete="off"
                placeholder="Subscription End Date"
              />
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Farming */}
        <Controller
          control={form.control}
          disabled={isPending}
          name="farming"
          render={({ field, fieldState }) => (
            <>
              <LabelToggle {...field} checked={field.value}>
                Enable Farming
              </LabelToggle>
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Submit */}
        <PrimaryButton
          className="my-1"
          type="submit"
          disabled={isPending || !backup}
        >
          {isPending ? "Starting..." : "Import"}
        </PrimaryButton>
      </form>
    </CloudCenteredDialog>
  );
}
