import CaptchaSolver from "@purrfect/shared/lib/CaptchaSolver";
import { useMemo } from "react";

export default function useCaptcha(provider, apiKey) {
  return useMemo(() => {
    return new CaptchaSolver(provider, apiKey);
  }, [provider, apiKey]);
}
