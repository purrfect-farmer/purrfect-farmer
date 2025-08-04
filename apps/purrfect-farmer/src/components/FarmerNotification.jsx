import { memo } from "react";

export default memo(function FarmerNotification({ t, id, title, onClick }) {
  return (
    <span className="cursor-pointer" onClick={onClick}>
      {title} Started
    </span>
  );
});
