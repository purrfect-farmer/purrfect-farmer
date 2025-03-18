import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
/**
 *
 * @param {import("react-hook-form").UseFormReturn} form
 * @param {import("@tanstack/react-query").UseMutationOptions} options
 * @returns
 */
export default function useFormMutation(form, options) {
  return useMutation({
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
    ...options,
  });
}
