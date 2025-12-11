import CaptchaSolver from "@purrfect/shared/lib/CaptchaSolver";
import { useMemo } from "react";

export default function useCaptcha(enabled, provider, apiKey) {
  return useMemo(() => {
    return enabled ? new CaptchaSolver(provider, apiKey) : null;
  }, [enabled, provider, apiKey]);
}
