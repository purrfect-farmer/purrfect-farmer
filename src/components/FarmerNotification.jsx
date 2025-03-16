import useAppContext from "@/hooks/useAppContext";
import { memo, useCallback } from "react";

export default memo(function FarmerNotification({ t, id, title }) {
  const { dispatchAndSetActiveTab } = useAppContext();

  /** Handle Click */
  const handleClick = useCallback(() => {
    dispatchAndSetActiveTab(id);
  }, [dispatchAndSetActiveTab]);

  return (
    <span className="cursor-pointer" onClick={handleClick}>
      {title} Started
    </span>
  );
});
