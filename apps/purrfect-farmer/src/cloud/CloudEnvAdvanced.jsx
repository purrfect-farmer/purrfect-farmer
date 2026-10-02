import { Controller, FormProvider, useForm } from "react-hook-form";

import Alert from "@/components/Alert";
import CodeEditor from "@uiw/react-textarea-code-editor";
import FieldStateError from "@/components/FieldStateError";
import PrimaryButton from "@/components/PrimaryButton";
import useCloudManagerEnvPreviewMutation from "@/hooks/useCloudManagerEnvPreviewMutation";
import useCloudManagerEnvQuery from "@/hooks/useCloudManagerEnvQuery";

const AdvancedForm = ({ initialData, onReview }) => {
  const form = useForm({
    defaultValues: {
      ["content"]: initialData.content || "",
    },
  });

  const previewMutation = useCloudManagerEnvPreviewMutation(form);
  const isPending = previewMutation.isPending;

  /** Preview then hand over to the review step */
  const handleFormSubmit = async ({ content }) => {
    const preview = await previewMutation
      .mutateAsync({ content })
      .catch(() => null);

    if (preview) onReview({ content }, preview);
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        <Alert variant="warning">
          Raw file editor for experienced users. The Settings tab is safer.
        </Alert>

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
              <FieldStateError
                fieldState={fieldState}
                className="whitespace-pre-line"
              />
            </>
          )}
        />

        {/* Submit Button */}
        <PrimaryButton
          className="my-1"
          type="submit"
          disabled={isPending || !form.formState.isDirty}
        >
          {isPending ? "Checking..." : "Review changes"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
};

export default function CloudEnvAdvanced({ onReview }) {
  const query = useCloudManagerEnvQuery();

  return query.isSuccess ? (
    <AdvancedForm
      key={query.dataUpdatedAt}
      initialData={query.data}
      onReview={onReview}
    />
  ) : query.isError ? (
    <p className="text-center text-red-500">Error: {query.error.message}</p>
  ) : (
    <p className="text-center text-orange-500">Loading...</p>
  );
}
