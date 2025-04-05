import { memo } from "react";

export default memo(function Browser({ url }) {
  return (
    <iframe
      src={url}
      className="w-full h-full border-0 outline-0"
      referrerPolicy="no-referrer"
      allow="geolocation; microphone; accelerometer; camera; fullscreen; payment"
    />
  );
});
