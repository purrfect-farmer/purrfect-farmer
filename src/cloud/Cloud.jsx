import AppContext from "@/contexts/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import useCloudAuth from "@/hooks/useCloudAuth";
import useSettings from "@/hooks/useSettings";
import useTheme from "@/hooks/useTheme";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useMemo } from "react";

import CloudLoginForm from "./CloudLoginForm";
import CloudPanel from "./CloudPanel";

export default function Cloud() {
  const { settings } = useSettings();
  const cloudAuth = useCloudAuth();
  const theme = settings.theme;
  const isLoggedIn = Boolean(cloudAuth.token);

  /** Cloud Backend */
  const cloudBackend = useMemo(
    () =>
      axios.create({
        baseURL: settings.cloudServer,
        headers: {
          common: {
            Authorization: cloudAuth.token ? `Bearer ${cloudAuth.token}` : null,
          },
        },
      }),
    [settings.cloudServer, cloudAuth.token]
  );

  /** Resize window */
  useEffect(() => {
    (async function () {
      const currentWindow = await chrome?.windows?.getCurrent();

      if (
        currentWindow &&
        currentWindow.type === "popup" &&
        currentWindow.state === "maximized"
      ) {
        const width = Math.min(350, currentWindow.width);
        const left = Math.max(1, Math.floor((currentWindow.width - width) / 2));

        await chrome?.windows?.update(currentWindow.id, {
          state: "normal",
          width,
          left,
        });
      }
    })();
  }, []);

  /** Apply Theme */
  useTheme(theme);

  /** Set Interceptor */
  useEffect(() => {
    const id = cloudBackend.interceptors.response.use(
      (response) => Promise.resolve(response),
      (error) => {
        if ([401, 403, 418].includes(error?.response?.status)) {
          /** Remove Token */
          cloudAuth.removeToken();

          /** Toast */
          toast.dismiss();
          toast.error("Unauthenticated - Please login again!");
        }
        return Promise.reject(error);
      }
    );

    return () => cloudBackend.interceptors.response.eject(id);
  }, [cloudBackend, cloudAuth.removeToken]);

  return (
    <AppContext.Provider
      value={{ settings, cloudBackend, cloudAuth, isLoggedIn }}
    >
      {/* Panel or Login Form */}
      {isLoggedIn ? <CloudPanel /> : <CloudLoginForm />}

      {/* Toaster */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          loading: {
            duration: Infinity,
          },
        }}
      />
    </AppContext.Provider>
  );
}
