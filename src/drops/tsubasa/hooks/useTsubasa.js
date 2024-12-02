import useValuesMemo from "@/hooks/useValuesMemo";
import { useLayoutEffect } from "react";
import { useState } from "react";

export default function useTsubasa(farmer) {
  const initData = farmer.telegramWebApp?.initData;
  const userId = farmer.telegramWebApp?.initDataUnsafe?.user?.id || "";
  const langCode =
    farmer.telegramWebApp?.initDataUnsafe?.user?.["language_code"];
  const [masterHash, setMasterHash] = useState("");

  /** Set Headers */
  useLayoutEffect(() => {
    /** Set Player Id */
    farmer.api.defaults.headers.common["X-Player-Id"] = userId;

    /** Set Master Hash */
    farmer.api.defaults.headers.common["X-Masterhash"] = masterHash;
  }, [farmer.api, userId, masterHash]);

  /** Set Master Hash */
  useLayoutEffect(() => {
    const interceptor = farmer.api.interceptors.response.use(
      (response) => {
        if (response.data["master_hash"]) {
          setMasterHash(response.data["master_hash"]);
        }
        return Promise.resolve(response);
      },
      (error) => Promise.reject(error)
    );

    return () => {
      farmer.api.interceptors.response.eject(interceptor);
    };
  }, [farmer.api, setMasterHash]);

  /** Update Auth Data */
  useLayoutEffect(() => {
    if (!farmer.auth) return;
    const interceptor = farmer.api.interceptors.response.use(
      (response) => {
        if (response.data) {
          farmer.updateAuthQueryData((previous) => {
            const result = { ...previous };
            for (const [key, value] of Object.entries(response.data)) {
              if (key in result && value) {
                result[key] = value;
              }
            }
            return result;
          });
        }
        return Promise.resolve(response);
      },
      (error) => Promise.reject(error)
    );

    return () => {
      farmer.api.interceptors.response.eject(interceptor);
    };
  }, [farmer.auth, farmer.api, farmer.updateAuthQueryData]);

  return useValuesMemo({
    ...farmer,
    masterHash,
    initData,
    userId,
    langCode,
  });
}
