import useTelegramWebAppEvents from "@/hooks/useTelegramWebAppEvents";
import { memo } from "react";
import { useRef } from "react";

export default memo(function Browser({ url }) {
  const ref = useRef(null);

  /** Register Events */
  useTelegramWebAppEvents(ref);

  return (
    <iframe
      ref={ref}
      src={url}
      className="w-full h-full border-0 outline-0"
      referrerPolicy="no-referrer"
      allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; usb; xr-spatial-tracking; screen-wake-lock; idle-detection"
    />
  );
});
