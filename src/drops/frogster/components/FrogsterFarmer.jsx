import BasicFarmerInfo from "@/components/BasicFarmerInfo";
import FarmerHeader from "@/components/FarmerHeader";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { isBefore, subHours } from "date-fns";
import { memo } from "react";

import FrogsterIcon from "../assets/images/icon.png?format=webp&w=80";
import useFrogsterBalanceQuery from "../hooks/useFrogsterBalanceQuery";
import useFrogsterClaimMutation from "../hooks/useFrogsterClaimMutation";
import useFrogsterUserQuery from "../hooks/useFrogsterUserQuery";

export default memo(function FrogsterFarmer() {
  const userQuery = useFrogsterUserQuery();
  const balanceQuery = useFrogsterBalanceQuery();
  const claimMutation = useFrogsterClaimMutation();

  /** Auto Claim */
  useFarmerAsyncTask(
    "claim",
    async function () {
      const data = balanceQuery.data;

      if (isBefore(new Date("last_claimed_at"), subHours(new Date(), 1))) {
        await claimMutation.mutateAsync();

        toast.success("Frogster Claim!");
      }
    },
    [balanceQuery.data]
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <FarmerHeader
        title={"Frogster Farmer"}
        icon={FrogsterIcon}
        referralLink={
          userQuery.data
            ? `https://t.me/FrogstersBot?startapp=${userQuery.data["ref_code"]}`
            : null
        }
      />

      <>
        <BasicFarmerInfo />
      </>
    </div>
  );
});
