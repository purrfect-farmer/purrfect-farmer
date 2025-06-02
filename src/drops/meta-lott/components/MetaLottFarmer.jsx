import FarmerHeader from "@/components/FarmerHeader";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { memo } from "react";

import MetaLottBalanceDisplay from "./MetaLottBalanceDisplay";
import MetaLottIcon from "../assets/images/icon.png?format=webp&w=80";
import useMetaDoSignInMutation from "../hooks/useMetaDoSignInMutation";
import useMetaLottSignInQuery from "../hooks/useMetaLottSignInQuery";
import useMetaLottUserQuery from "../hooks/useMetaLottUserQuery";

export default memo(function MetaLottFarmer() {
  const userQuery = useMetaLottUserQuery();
  const signInQuery = useMetaLottSignInQuery();
  const doSignInMutation = useMetaDoSignInMutation();

  /** Auto Sign-In */
  useFarmerAsyncTask(
    "sign-in",
    async function () {
      const signedIn = signInQuery.data === "TRUE";

      if (!signedIn) {
        await doSignInMutation.mutateAsync();
        await userQuery.refetch();

        /** Toast */
        toast.success("Meta Lott - Signed In");
      }
    },
    [signInQuery.data]
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <FarmerHeader
        title={"Meta Lott Farmer"}
        icon={MetaLottIcon}
        referralLink={userQuery.data ? userQuery.data.inviteLinkUrl : null}
      />

      <>
        <MetaLottBalanceDisplay />
      </>
    </div>
  );
});
