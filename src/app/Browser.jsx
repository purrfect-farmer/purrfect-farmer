import { memo } from "react";

export default memo(function Browser({ url }) {
  return (
    <iframe
      src={url}
      className="w-full h-full border-0 outline-0"
      referrerPolicy="no-referrer"
      allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; usb; vr; xr-spatial-tracking; screen-wake-lock; web-share; idle-detection"
    />
  );
});
