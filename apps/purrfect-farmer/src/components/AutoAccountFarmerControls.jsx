import { HiOutlinePower } from "react-icons/hi2";
import { LuPause, LuSnowflake } from "react-icons/lu";

import { FARMER_STATUS_TEXT_COLORS } from "@/constants/farmerStatus";
import LabelToggle from "./LabelToggle";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useAutoCloudFarmerMutation from "@/hooks/useAutoCloudFarmerMutation";
import useAutoCloudSnapshotsQuery from "@/hooks/useAutoCloudSnapshotsQuery";

/** The same icon button the Cloud panel uses, so the actions read the same everywhere */
const FarmerActionButton = ({ status, ...props }) => (
  <button
    {...props}
    type="button"
    className={cn(
      FARMER_STATUS_TEXT_COLORS[status],
      "bg-neutral-200 dark:bg-neutral-600",
      "hover:bg-neutral-300 dark:hover:bg-neutral-500",
      "flex items-center justify-center gap-1",
      "grow p-2 rounded-lg cursor-pointer",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "transition-colors",
    )}
  />
);

/** Start, pause or freeze the drop's farmer for this account, and gate scheduled farming */
export default function AutoAccountFarmerControls({ account, row }) {
  const snapshotsQuery = useAutoCloudSnapshotsQuery();
  const activateMutation = useAutoCloudFarmerMutation("activate");
  const deactivateMutation = useAutoCloudFarmerMutation("deactivate");
  const freezeMutation = useAutoCloudFarmerMutation("freeze");
  const farmingMutation = useAutoCloudFarmerMutation("farming");

  const id = String(account.userId);
  const pending =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    freezeMutation.isPending ||
    farmingMutation.isPending;

  const dispatch = (mutation, messages, data) => {
    toast
      .promise(mutation.mutateAsync({ account: id, ...data }), messages)
      .finally(snapshotsQuery.refetch);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* Activate */}
        <FarmerActionButton
          status="active"
          title="Activate Farmer"
          disabled={pending || row.status === "active"}
          onClick={() =>
            dispatch(activateMutation, {
              loading: "Activating...",
              success: "Successfully activated",
              error: "Error...",
            })
          }
        >
          <HiOutlinePower className="size-4" />
          Activate
        </FarmerActionButton>

        {/* Deactivate */}
        <FarmerActionButton
          status="inactive"
          title="Deactivate Farmer"
          disabled={pending || row.status === "inactive"}
          onClick={() =>
            dispatch(deactivateMutation, {
              loading: "Deactivating...",
              success: "Successfully deactivated",
              error: "Error...",
            })
          }
        >
          <LuPause className="size-4" />
          Deactivate
        </FarmerActionButton>

        {/* Freeze */}
        <FarmerActionButton
          status="frozen"
          title="Freeze Farmer"
          disabled={pending || row.status === "frozen"}
          onClick={() =>
            dispatch(freezeMutation, {
              loading: "Freezing...",
              success: "Successfully frozen",
              error: "Error...",
            })
          }
        >
          <LuSnowflake className="size-4" />
          Freeze
        </FarmerActionButton>
      </div>

      {/* Scheduled farming */}
      <LabelToggle
        disabled={pending}
        checked={Boolean(row.farming)}
        onChange={(ev) =>
          dispatch(
            farmingMutation,
            {
              loading: "Updating...",
              success: "Scheduled farming updated",
              error: "Error...",
            },
            { farming: ev.target.checked },
          )
        }
      >
        <span className="font-bold text-neutral-500 dark:text-neutral-400">
          Scheduled farming
        </span>
      </LabelToggle>
    </div>
  );
}
