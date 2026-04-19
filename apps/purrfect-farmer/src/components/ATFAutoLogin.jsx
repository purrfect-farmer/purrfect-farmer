import { Controller, FormProvider, useForm } from "react-hook-form";

import ATFAutoHeader from "./ATFAutoHeader";
import Alert from "./Alert";
import Container from "./Container";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import PrimaryButton from "./PrimaryButton";
import bcrypt from "bcryptjs";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    ["password"]: yup.string().required().label("Password"),
  })
  .required();

export default function ATFAutoLogin() {
  const { master, dispatchAndResetATFAuto, dispatchAndSetPassword } =
    useATFAuto();
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const handleFormSubmit = async (data) => {
    const match = await bcrypt.compare(data.password, master.hashedPassword);

    if (match) {
      dispatchAndSetPassword(data.password);
      toast.success("Successfully logged in!");
    } else {
      form.setError("password", { message: "Invalid password!" });
      toast.error("Invalid password!");
    }
  };

  return (
    <Container className={cn("flex flex-col justify-center gap-4 p-4 grow")}>
      <ATFAutoHeader />
      <Alert variant={"info"}>
        <span className="font-bold">ATF Auto</span> - Sign in to manage accounts
      </Alert>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
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
          <PrimaryButton disabled={isSubmitting} className="my-1" type="submit">
            {isSubmitting ? "Signing in..." : "Continue"}
          </PrimaryButton>

          {/* Divider */}
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            OR
          </p>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => dispatchAndResetATFAuto()}
            className="text-red-500 cursor-pointer"
          >
            Reset ATF Auto
          </button>
        </form>
      </FormProvider>
    </Container>
  );
}
