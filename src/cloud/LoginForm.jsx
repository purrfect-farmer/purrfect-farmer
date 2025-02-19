import * as yup from "yup";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import WelcomeIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=224";
import toast from "react-hot-toast";
import useCloudContext from "@/hooks/useCloudContext";
import useCloudLoginMutation from "@/hooks/useCloudLoginMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import CloudServerDisplay from "./CloudServerDisplay";

/** Schema */
const schema = yup
  .object({
    email: yup.string().required().label("Email"),
    password: yup.string().required().label("Password"),
  })
  .required();

export default function LoginForm() {
  const { settings, cloudAuth } = useCloudContext();
  const address = settings.cloudServer;

  const loginMutation = useCloudLoginMutation();
  const isPending = loginMutation.isPending;

  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /** Mutate */
  const handleFormSubmit = (data) => {
    loginMutation.mutateAsync(data, {
      onError(error) {
        /** Set Errors */
        Object.entries(error.response?.data?.errors || {}).forEach(([k, v]) =>
          form.setError(k, {
            message: v[0],
          })
        );

        /** Toast Error */
        toast.error(error.response?.data.message || "An error occurred!");
      },
      onSuccess(data) {
        /** Set Token */
        cloudAuth.storeToken(data.token);

        /** Toast */
        toast.success("Successfully logged in!");
      },
    });
  };

  return (
    <div className="flex flex-col justify-center gap-2 p-4 min-h-dvh">
      {/* Icon */}
      <img src={WelcomeIcon} className="mx-auto h-28" />

      <div className="flex flex-col">
        {/* Title */}
        <h1 className="text-2xl text-center text-orange-500 font-turret-road">
          Purrfect
        </h1>

        {/* Sub Title */}
        <h2 className="text-lg text-center font-turret-road">Cloud Manager</h2>
      </div>

      <div className="flex flex-col gap-2 my-2">
        {/* Display Address */}
        <p className="p-2 text-center text-orange-800 bg-orange-100 rounded-lg">
          <span className="font-bold">Server</span>: {address}
        </p>

        {/* Display Server */}
        <CloudServerDisplay />
      </div>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Username / Email */}
          <Controller
            disabled={isPending}
            name="email"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  autoComplete="off"
                  placeholder="Username / Email"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </>
            )}
          />

          {/* Password */}
          <Controller
            disabled={isPending}
            name="password"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  type="password"
                  autoComplete="off"
                  placeholder="Password"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </>
            )}
          />

          {/* Submit Button */}
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? "Logging in..." : "Login"}
          </PrimaryButton>
        </form>
      </FormProvider>
    </div>
  );
}
