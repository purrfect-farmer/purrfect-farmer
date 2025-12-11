import CloudLoginForm from "@/cloud/CloudLoginForm";
import CloudPanel from "@/cloud/CloudPanel";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { requestIsUnauthorized } from "@/utils";
import { useEffect } from "react";

export default function CloudManager() {
  const { cloudAuth, cloudBackend } = useAppContext();
  const isLoggedIn = Boolean(cloudAuth.token);

  /** Set Interceptor */
  useEffect(() => {
    const id = cloudBackend.interceptors.response.use(
      (response) => Promise.resolve(response),
      (error) => {
        if (requestIsUnauthorized(error)) {
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

  return isLoggedIn ? <CloudPanel /> : <CloudLoginForm />;
}
