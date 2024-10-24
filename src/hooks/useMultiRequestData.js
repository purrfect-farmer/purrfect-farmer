import { connectPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

export function useMultiRequestData(port, items, options) {
  const [result, setResult] = useState({});
  const updateResponseData = useCallback(
    (key, data) => {
      setResult((prev) => {
        return {
          ...prev,
          [key]: typeof data === "function" ? data(prev[key]) : data,
        };
      });
    },
    [setResult]
  );

  useEffect(() => {
    if (port) {
      connectPortMessage(
        port,
        {
          action: "get-request-data",
          data: {
            items,
          },
        },
        (message) => {
          const { key, response } = message.data;
          setResult((prev) => {
            return {
              ...prev,
              [key]: response,
            };
          });
        },
        false
      );
    }
  }, [port, items, connectPortMessage, setResult]);

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(items).map(([k]) => [
          k,
          {
            data: result[k],
            update: (data) => updateResponseData(k, data),
          },
        ])
      ),
    [items, result, updateResponseData]
  );
}
