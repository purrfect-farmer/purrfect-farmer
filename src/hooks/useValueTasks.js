import useMirroredCallback from "@/hooks/useMirroredCallback";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useValueTasks(key) {
  const [valuePrompt, setValuePrompt] = useState(null);

  /** Prompt Value */
  const [, dispatchAndPrompt] = useMirroredCallback(
    key + ":prompt",
    (id) =>
      new Promise((resolve, reject) => {
        setValuePrompt({
          id,
          resolve,
          reject,
        });
      }),
    [setValuePrompt]
  );

  /** Handle value Prompt Submit */
  const [, dispatchAndSubmitPrompt] = useMirroredCallback(
    key + ":submit",
    (value) => {
      if (!valuePrompt) return;

      const { resolve } = valuePrompt;

      setValuePrompt(null);
      resolve(value);
    },
    [valuePrompt, setValuePrompt]
  );

  return useValuesMemo({
    valuePrompt,
    dispatchAndPrompt,
    dispatchAndSubmitPrompt,
  });
}
