import * as yup from "yup";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import WelcomeIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=224";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useCloudManagerLoginMutation from "@/hooks/useCloudManagerLoginMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import CloudServerDisplay from "./CloudServerDisplay";
import Container from "@/components/Container";

/** Schema */
const schema = yup
  .object({
    email: yup.string().required().label("Email"),
    password: yup.string().required().label("Password"),
  })
  .required();

export default function CloudLoginForm() {
  const { settings, cloudAuth } = useAppContext();
  const address = settings.cloudServer;

  const loginMutation = useCloudManagerLoginMutation();
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
    <Container className="flex flex-col justify-center gap-2 p-4 grow">
      {/* Icon */}
      <img src={WelcomeIcon} className="mx-auto h-28" />

      <div className="flex flex-col">
        {/* Sub Title */}
        <h2 className="text-3xl text-center font-turret-road text-orange-500 leading-none">
          Cloud Manager
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {/* Display Server */}
        <CloudServerDisplay />

        {/* Display Address */}
        <p className="p-2 text-center text-orange-800 bg-orange-100 rounded-lg">
          <span className="font-bold">Server</span>: {address}
        </p>
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
    </Container>
  );
}
