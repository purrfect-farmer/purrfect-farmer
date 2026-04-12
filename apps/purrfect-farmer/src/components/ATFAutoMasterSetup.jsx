import { Controller, FormProvider, useForm } from "react-hook-form";

import ATFAutoHeader from "./ATFAutoHeader";
import Alert from "./Alert";
import Container from "./Container";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import { MdOutlineAutorenew } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import Textarea from "./Textarea";
import bcrypt from "bcryptjs";
import { cn } from "@/utils";
import { encryption } from "@/services/encryption";
import { getWalletAddressFromMnemonic } from "@/lib/atf-auto";
import { mnemonicNew } from "@ton/crypto";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useAppContext from "@/hooks/useAppContext";
import { useEffect } from "react";
import { useState } from "react";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    ["phrase"]: yup.string().trim().required().label("Wallet Phrase"),
    ["version"]: yup.number().required().oneOf([4, 5]).label("Wallet Version"),
    ["password"]: yup.string().trim().required().label("Password"),
    ["tonCenterApiKey"]: yup
      .string()
      .trim()
      .required()
      .label("Toncenter API Key"),
  })
  .required();

export default function ATFAutoMasterSetup() {
  const { dispatchAndSetPassword, dispatchAndStoreMaster } = useATFAuto();
  const { openTelegramLink } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState("");
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      password: "",
      phrase: "",
      version: 5,
      tonCenterApiKey: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  const phrase = form.watch("phrase");
  const version = form.watch("version");

  const generatePhrase = async () => {
    const mnemonic = await mnemonicNew();
    form.setValue("phrase", mnemonic.join(" "));
  };

  const handleFormSubmit = async (data) => {
    const password = data.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    /* Encrypt Phrase */
    const encryptedWalletPhrase = await encryption.encryptData({
      data: data.phrase,
      password,
    });

    /** Store master */
    dispatchAndStoreMaster({
      address,
      version,
      hashedPassword,
      encryptedWalletPhrase,
      tonCenterApiKey: data.tonCenterApiKey || "",
    });

    /** Set password */
    dispatchAndSetPassword(password);

    /** Toast */
    toast.success("ATF Auto master setup completed!");
  };

  useEffect(() => {
    if (phrase) {
      getWalletAddressFromMnemonic(phrase, version).then((address) =>
        setAddress(address),
      );
    } else {
      setAddress("");
    }
  }, [version, phrase]);

  return (
    <Container className={cn("flex flex-col justify-center gap-4 p-4 grow")}>
      <ATFAutoHeader />

      {!showForm ? (
        <>
          <Alert variant={"info"}>
            ATF Auto is a tool for managing multiple ATF Farmer Wallets.
          </Alert>
          <PrimaryButton onClick={() => setShowForm(true)}>
            Get Started
          </PrimaryButton>
        </>
      ) : (
        <>
          <Alert variant={"info"}>Setup a master wallet for ATF Auto</Alert>
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="flex flex-col gap-2"
            >
              {/* Wallet Version */}
              <Controller
                control={form.control}
                name="version"
                render={({ field, fieldState }) => (
                  <>
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
                            "text-blue-500 dark:text-blue-400",
                            "cursor-pointer hover:underline disabled:opacity-50",
                            "flex items-center gap-1",
                          )}
                        >
                          <MdOutlineAutorenew className="size-3" />
                          Generate New Wallet
                        </button>
                      </div>
                    )}
                    <FieldStateError fieldState={fieldState} />
                  </>
                )}
              />

              {/* Address */}
              {address && (
                <p className="text-center text-blue-500 wrap-break-word">
                  {address}
                </p>
              )}

              {/* Toncenter API Key */}
              <Controller
                control={form.control}
                name="tonCenterApiKey"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      autoComplete="off"
                      placeholder="Toncenter API Key"
                    />
                    <button
                      type="button"
                      onClick={() => openTelegramLink("https://t.me/toncenter")}
                      className="text-xs text-blue-500 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Get API key from @toncenter
                    </button>
                    <FieldStateError fieldState={fieldState} />
                  </>
                )}
              />

              {/* Password */}
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      type="password"
                      autoComplete="off"
                      placeholder="Password"
                    />
                    <FieldStateError fieldState={fieldState} />
                  </>
                )}
              />

              {/* Submit Button */}
              <PrimaryButton
                disabled={isSubmitting}
                className="my-1"
                type="submit"
              >
                {isSubmitting ? "Setting up..." : "Complete Setup"}
              </PrimaryButton>
            </form>
          </FormProvider>
        </>
      )}
    </Container>
  );
}
