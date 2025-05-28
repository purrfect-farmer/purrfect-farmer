import axios from "axios";
import useAppContext from "@/hooks/useAppContext";
import useAppQuery from "@/hooks/useAppQuery";
import { HiOutlineMapPin } from "react-icons/hi2";
import { LiaUserNinjaSolid } from "react-icons/lia";
import { cn } from "@/lib/utils";

export default function IPStatus() {
  const { settings, sharedSettings } = useAppContext();

  /** Is Proxy Allowed? */
  const isProxyAllowed =
    !import.meta.env.VITE_WHISKER || sharedSettings.allowProxies;

  /** Is Proxied? */
  const isProxied = isProxyAllowed && sharedSettings.proxyEnabled;

  /** IP Query */
  const { data: ipInfo, ...ipQuery } = useAppQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: settings.displayIpAddress,
    queryKey: [
      "app",
      "ip",
      settings.displayIpAddress,
      sharedSettings.allowProxies,
      sharedSettings.proxyEnabled,
      sharedSettings.proxyHost,
      sharedSettings.proxyPort,
      sharedSettings.proxyUsername,
      sharedSettings.proxyPassword,
    ],
    queryFn: ({ signal }) =>
      axios
        .get("https://ipwho.is", {
          signal,
        })
        .then((res) => res.data),
  });

  return settings.displayIpAddress ? (
    <p
      title={ipInfo ? `${ipInfo.city} - ${ipInfo.country}` : "IP Address"}
      className={cn(
        "text-center flex items-center justify-center gap-2",
        "text-purple-600 dark:text-purple-500"
      )}
    >
      {isProxied ? (
        <LiaUserNinjaSolid className="w-4 h-4" />
      ) : (
        <HiOutlineMapPin className="w-4 h-4" />
      )}{" "}
      {isProxied ? "Proxy" : "IP"}:{" "}
      <span
        className={cn(
          "inline-flex items-center gap-2",
          {
            pending: "text-orange-500",
            success: "text-green-600 dark:text-green-500",
            error: "text-red-500",
          }[ipQuery.status]
        )}
      >
        {ipQuery.isPending ? (
          <>Checking</>
        ) : ipQuery.isError ? (
          <>Error</>
        ) : (
          <>
            {/* IP Address */}
            {ipInfo.ip}

            {/* Flag */}
            <img className="w-5 h-4 rounded-xl" src={ipInfo.flag.img} />
          </>
        )}
      </span>
    </p>
  ) : null;
}
