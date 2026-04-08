import { Controller, FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import FieldStateError from "./FieldStateError";
import Input from "./Input";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import Textarea from "./Textarea";
import { cn } from "@/utils";
import { getWalletAddressFromMnemonic } from "@/lib/atf-auto";
import { mnemonicNew } from "@ton/crypto";
import toast from "react-hot-toast";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

function buildSchema({ hideTitle }) {
  const shape = {
    phrase: yup.string().required().label("Wallet Phrase"),
    version: yup.number().required().oneOf([4, 5]).label("Wallet Version"),
  };
  if (!hideTitle) shape.title = yup.string().required().label("Title");
  return yup.object(shape).required();
}

export default function ATFAutoAccountForm({
  handleFormSubmit,
  initialValues,
  submitLabel = "Save",
  submittingLabel = "Saving...",
  hideTitle = false,
}) {
  const [address, setAddress] = useState("");
  const form = useForm({
    resolver: yupResolver(buildSchema({ hideTitle })),
    defaultValues: {
      ...(hideTitle ? {} : { title: initialValues?.title || "" }),
      phrase: initialValues?.phrase || "",
      version: initialValues?.version || 5,
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  const phrase = form.watch("phrase");
  const version = form.watch("version");

  const generatePhrase = async () => {
    const mnemonic = await mnemonicNew();
    form.setValue("phrase", mnemonic.join(" "));
    toast.success("New wallet generated!");
  };

  useEffect(() => {
    if (phrase) {
      getWalletAddressFromMnemonic(phrase, version).then(setAddress);
    } else {
      setAddress("");
    }
  }, [version, phrase]);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-2"
      >
        {/* Title */}
        {!hideTitle && (
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <>
                <Label>Title</Label>
                <Input
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="off"
                  placeholder="Account Title"
                />
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />
        )}

        {/* Wallet Version */}
        <Controller
          control={form.control}
          name="version"
          render={({ field, fieldState }) => (
            <>
              <Label>Wallet Version</Label>
              <Select
                {...field}
                disabled={isSubmitting}
                onChange={(ev) => field.onChange(Number(ev.target.value))}
              >
                <Select.Item value={4}>Wallet V4R2</Select.Item>
                <Select.Item value={5}>Wallet W5</Select.Item>
              </Select>
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Phrase */}
        <Controller
          control={form.control}
          name="phrase"
          render={({ field, fieldState }) => (
            <>
              <Label>Wallet Phrase</Label>
              <Textarea
                {...field}
                disabled={isSubmitting}
                minRows={3}
                autoComplete="off"
                placeholder="Wallet Phrase"
              />
              {!field.value && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={generatePhrase}
                    className={cn(
                      " text-blue-500 dark:text-blue-400",
                      "cursor-pointer hover:underline disabled:opacity-50",
                      "flex items-center gap-1",
                    )}
                  >
                    Generate New Wallet
                  </button>
                </div>
              )}
              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Address Preview */}
        {address && (
          <p className="text-center text-blue-500 dark:text-blue-400 px-2 wrap-break-word font-bold">
            {address}
          </p>
        )}

        {/* Submit */}
        <PrimaryButton disabled={isSubmitting} className="mt-2" type="submit">
          {isSubmitting ? submittingLabel : submitLabel}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
}
