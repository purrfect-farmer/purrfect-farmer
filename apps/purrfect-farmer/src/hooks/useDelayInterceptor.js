import { useLayoutEffect } from "react";

export default function useDelayInterceptor(api, delay = 0) {
  /** Interceptor */
  useLayoutEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (delay) {
          return new Promise((resolve) => {
            setTimeout(() => resolve(config), delay);
          });
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [api, delay]);
}
