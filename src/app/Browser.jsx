import { memo } from "react";

export default memo(function Browser({ url }) {
  return (
    <iframe
      src={url}
      className="w-full h-full border-0 outline-0"
      referrerPolicy="no-referrer"
      allow="camera; microphone; geolocation; fullscreen; autoplay; clipboard-write; encrypted-media; accelerometer; gyroscope; magnetometer; midi; payment; usb; vr; xr-spatial-tracking; picture-in-picture; screen-wake-lock"
    />
  );
});
