import * as yup from "yup";
import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";

import CloudCenteredDialog from "./CloudCenteredDialog";
import useCloudManagerEnvMutation from "@/hooks/useCloudManagerEnvMutation";
import useCloudManagerEnvQuery from "@/hooks/useCloudManagerEnvQuery";
import CodeEditor from "@uiw/react-textarea-code-editor";

/** Schema */
const schema = yup
  .object({
    ["content"]: yup.string().required().label("Content"),
  })
  .required();

const CloudEnvForm = ({ initialData }) => {
  const queryClient = useQueryClient();
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ["content"]: initialData.content || "",
    },
  });

  const envMutation = useCloudManagerEnvMutation(form);
  const isPending = envMutation.isPending;

  /** Handle Form Submit */
  const handleFormSubmit = (data) => {
    envMutation.mutateAsync(data, {
      onSuccess() {
        /** Reset Form */
        form.reset();

        /** Toast */
        toast.success("Environment variables updated!");

        /** Reset Queries */
        queryClient.resetQueries({
          queryKey: ["app", "cloud", "manager", "env"],
        });
      },
    });
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        {/* Content */}
        <Controller
          disabled={isPending}
          name="content"
          render={({ field, fieldState }) => (
            <>
              <CodeEditor
                value={field.value}
                onChange={(evn) => field.onChange(evn.target.value)}
                language="shell"
                placeholder="Environment Variables Content"
                className="font-mono w-full"
                data-color-mode="dark"
              />
              {fieldState.error?.message ? (
                <p className="text-red-500">{fieldState.error?.message}</p>
              ) : null}
            </>
          )}
        />

        {/* Submit Button */}
        <PrimaryButton className="my-1" type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
};

export default function CloudEnvUpdate() {
  const query = useCloudManagerEnvQuery();

  return (
    <CloudCenteredDialog
      title={"Environment Variables"}
      description={"Update the cloud environment variables."}
    >
      {query.isSuccess ? (
        <CloudEnvForm initialData={query.data} />
      ) : query.isLoading ? (
        <p className="text-center text-orange-500">Loading...</p>
      ) : query.isError ? (
        <p className="text-center text-red-500">Error: {query.error.message}</p>
      ) : null}
    </CloudCenteredDialog>
  );
}
