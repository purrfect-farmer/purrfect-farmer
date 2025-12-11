import { cn, copyToClipboard } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Collapsible } from "radix-ui";
import { useMemo } from "react";
import {
  HiCheckCircle,
  HiMinusCircle,
  HiOutlineClipboard,
  HiOutlineMapPin,
} from "react-icons/hi2";

const ProxyDetailsItem = ({ label, value }) => (
  <div
    className={cn(
      "p-2.5 flex items-center gap-2 rounded-xl",
      "bg-neutral-200 dark:bg-neutral-600"
    )}
  >
    {/* Details */}
    <div className="flex flex-col grow min-w-0">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="font-bold">{value}</span>
    </div>

    {/* Copy button */}
    <button title={`Copy ${label}`} onClick={() => copyToClipboard(value)}>
      <HiOutlineClipboard className="size-4" />
    </button>
  </div>
);

const ProxyDetails = ({ proxy, rootClassName, ...props }) => {
  const parsed = useMemo(() => {
    if (!proxy) return null;
    const [user, server] = proxy.split("@");
    const [proxyHost, proxyPort] = server.split(":");
    const [proxyUsername, proxyPassword] = user.split(":");

    return {
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    };
  }, [proxy]);

  const query = useQuery({
    queryKey: ["proxy-details", proxy],
    enabled: Boolean(proxy),
    queryFn: ({ signal }) =>
      axios
        .get("https://ipwho.is/" + parsed.proxyHost, {
          signal,
        })
        .then((res) => res.data),
  });

  const ipInfo = query.data;

  return (
    <Collapsible.Root
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "flex flex-col gap-2",
        "p-2 rounded-xl",
        rootClassName
      )}
    >
      <Collapsible.Trigger
        className={cn(
          "p-2 flex items-center gap-2 rounded-xl",
          "bg-neutral-200 dark:bg-neutral-600",
          "border border-transparent hover:border-blue-500"
        )}
      >
        {/* Proxy Icon */}
        <HiOutlineMapPin className="size-5 shrink-0" />

        {/* Heading */}
        <h1
          title={ipInfo ? `${ipInfo.city} - ${ipInfo.country}` : "Proxy"}
          className={cn(
            "font-bold grow min-w-0",
            "text-center flex items-center justify-center gap-2"
          )}
        >
          {/* Flag */}
          {ipInfo?.flag?.img ? (
            <img className="w-5 h-4 rounded-xl" src={ipInfo?.flag?.img} />
          ) : null}{" "}
          Proxy
        </h1>

        {/* Status */}
        {proxy ? (
          <HiCheckCircle className="size-5 text-green-500 shrink-0" />
        ) : (
          <HiMinusCircle className="size-5 text-yellow-500 shrink-0" />
        )}
      </Collapsible.Trigger>

      <Collapsible.Content className="flex flex-col gap-2">
        {parsed ? (
          <>
            {ipInfo ? (
              <ProxyDetailsItem
                label="Location"
                value={`${ipInfo.city} - ${ipInfo.country}`}
              />
            ) : null}
            <ProxyDetailsItem label="Host" value={parsed.proxyHost} />
            <ProxyDetailsItem label="Port" value={parsed.proxyPort} />
            <ProxyDetailsItem label="Username" value={parsed.proxyUsername} />
            <ProxyDetailsItem label="Password" value={parsed.proxyPassword} />
          </>
        ) : (
          <p className="text-center">No proxy details available</p>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

export default ProxyDetails;
