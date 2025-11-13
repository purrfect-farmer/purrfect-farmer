import toast from "react-hot-toast";
import { requestIsUnauthorized } from "@/lib/utils";
import { useLayoutEffect } from "react";

export default function useUnauthorizedInterceptor(api, reset, initResetCount) {
  /** Interceptor */
  useLayoutEffect(() => {
    if (initResetCount >= 3) {
      return;
    }

    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (requestIsUnauthorized(error)) {
          toast.dismiss();
          toast.error("Unauthenticated - Please reload the Bot or Farmer");
          reset();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [api, reset, initResetCount]);
}
