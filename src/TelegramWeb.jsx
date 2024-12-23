import { memo } from "react";

export default memo(function TelegramWeb({ version, hash = "" }) {
  return (
    <iframe
      src={`https://web.telegram.org/${version}${hash}`}
      className="w-full h-full border-0 outline-0"
    />
  );
});
