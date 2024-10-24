import { connectPortMessage } from "@/lib/utils";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

export default function useRequestData(port, url, once = false) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (port && url) {
      connectPortMessage(
        port,
        {
          action: "get-request-data",
          data: {
            url,
            once,
          },
        },
        (message) => {
          setData(message.data);
        },
        once
      );
    }
  }, [port, url, connectPortMessage, setData]);

  return useMemo(() => [data, setData], [data, setData]);
}
